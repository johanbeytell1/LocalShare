// LocalShare Direct LAN Turbo Engine (v2.2)
// Pure client-side multi-lane raw WebRTC LAN transport + optional LAN Server HTTP Pipe client.
// UMD module: works as browser global `window.LocalShareLanTurbo` and Node `require('./lan-turbo.js')`.
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(globalThis);
  } else {
    root.LocalShareLanTurbo = factory(root);
  }
})(typeof self !== "undefined" ? self : globalThis, function (globalScope) {
  "use strict";

  // ═══════════════════════════════════════════
  // Constants & Tuning Parameters
  // ═══════════════════════════════════════════
  const FRAME_MAGIC = 0x4c535432; // "LST2" — Direct LAN Turbo raw file chunk
  const BENCH_MAGIC = 0x4c534232; // "LSB2" — LAN Speed Test benchmark frame
  const FRAME_HEADER_SIZE = 12;   // 4B magic + 4B transferId/benchId + 4B chunkIndex/seq
  const FNV_OFFSET_BASIS = 0x811c9dc5;

  const DEFAULT_DESKTOP_LANES = 4;
  const DEFAULT_MOBILE_LANES = 2;
  const MAX_LANES = 6;

  // SCTP raw frame bounds: 64KB–128KB hits peak throughput across Chrome/Firefox/Safari dcSCTP/usrsctp
  const TARGET_RAW_FRAME_SIZE = 128 * 1024;
  const FALLBACK_RAW_FRAME_SIZE = 64 * 1024;
  const MIN_RAW_FRAME_SIZE = 16 * 1024;

  // Per-lane SCTP backpressure window (well below Chrome's 16MB hard limit, large enough to saturate Wi-Fi 6 / GbE)
  const LANE_HIGH_WATER_DESKTOP = 4 * 1024 * 1024;
  const LANE_LOW_WATER_DESKTOP = 1 * 1024 * 1024;
  const LANE_HIGH_WATER_MOBILE = 2 * 1024 * 1024;
  const LANE_LOW_WATER_MOBILE = 512 * 1024;

  // Read-ahead slab target size (reduces disk/IPC reads ~32-64x and overlaps disk I/O with Wi-Fi TX)
  const READ_SLAB_DESKTOP = 4 * 1024 * 1024;
  const READ_SLAB_MOBILE = 2 * 1024 * 1024;

  // Connection upgrade timeouts
  const STRICT_LAN_PROBE_TIMEOUT_MS = 2800;
  const WAN_TURBO_PROBE_TIMEOUT_MS = 6000;
  const UI_PROGRESS_INTERVAL_MS = 80;
  const YIELD_EVERY_BYTES = 2 * 1024 * 1024; // micro-yield via MessageChannel every 2MB burst

  // ═══════════════════════════════════════════
  // Checksum & Zero-Copy Binary Framing
  // ═══════════════════════════════════════════
  function fnv1aUpdate(hash, u8) {
    let h = hash >>> 0;
    for (let i = 0; i < u8.length; i++) {
      h ^= u8[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function encodeChunkFrame(transferId, chunkIndex, payloadUint8) {
    const payload =
      payloadUint8 instanceof Uint8Array
        ? payloadUint8
        : new Uint8Array(payloadUint8);
    const frame = new Uint8Array(FRAME_HEADER_SIZE + payload.byteLength);
    const view = new DataView(frame.buffer);
    view.setUint32(0, FRAME_MAGIC, true);
    view.setUint32(4, transferId >>> 0, true);
    view.setUint32(8, chunkIndex >>> 0, true);
    frame.set(payload, FRAME_HEADER_SIZE);
    return frame.buffer;
  }

  function encodeChunkFrameFromSlab(transferId, chunkIndex, slabBytes, start, end) {
    const len = end - start;
    const frame = new Uint8Array(FRAME_HEADER_SIZE + len);
    const view = new DataView(frame.buffer);
    view.setUint32(0, FRAME_MAGIC, true);
    view.setUint32(4, transferId >>> 0, true);
    view.setUint32(8, chunkIndex >>> 0, true);
    frame.set(slabBytes.subarray(start, end), FRAME_HEADER_SIZE);
    return frame.buffer;
  }

  function makeBenchFrame(benchId, payloadSize) {
    const size = Math.max(1024, payloadSize | 0);
    const frame = new Uint8Array(FRAME_HEADER_SIZE + size);
    const view = new DataView(frame.buffer);
    view.setUint32(0, BENCH_MAGIC, true);
    view.setUint32(4, benchId >>> 0, true);
    view.setUint32(8, 0, true);
    // Fill with non-zero pattern (avoids trivial zero-page/compression shortcuts)
    for (let i = FRAME_HEADER_SIZE; i < frame.length; i += 64) {
      frame[i] = (i * 31) & 0xff;
    }
    return frame;
  }

  function decodeFrameHeader(data) {
    let buffer;
    let byteOffset = 0;
    let byteLength = 0;

    if (data instanceof ArrayBuffer) {
      buffer = data;
      byteLength = data.byteLength;
    } else if (ArrayBuffer.isView(data)) {
      buffer = data.buffer;
      byteOffset = data.byteOffset;
      byteLength = data.byteLength;
    } else {
      return null;
    }

    if (byteLength < FRAME_HEADER_SIZE) return null;

    const view = new DataView(buffer, byteOffset, FRAME_HEADER_SIZE);
    const magic = view.getUint32(0, true);

    if (magic === FRAME_MAGIC) {
      const transferId = view.getUint32(4, true);
      const chunkIndex = view.getUint32(8, true);
      // Zero-copy view directly over the received ArrayBuffer!
      const payload = new Uint8Array(
        buffer,
        byteOffset + FRAME_HEADER_SIZE,
        byteLength - FRAME_HEADER_SIZE
      );
      return { kind: "chunk", transferId, chunkIndex, payload };
    }

    if (magic === BENCH_MAGIC) {
      const benchId = view.getUint32(4, true);
      const seq = view.getUint32(8, true);
      return {
        kind: "bench",
        benchId,
        seq,
        payloadBytes: byteLength - FRAME_HEADER_SIZE,
      };
    }

    return null;
  }

  // ═══════════════════════════════════════════
  // Fast Non-Clamped Event Loop Yield (~0.02ms)
  // Avoids setTimeout(0)'s 4ms HTML5 timer clamp!
  // ═══════════════════════════════════════════
  function createFastYield() {
    if (typeof globalScope.MessageChannel === "function") {
      try {
        const mc = new globalScope.MessageChannel();
        const queue = [];
        mc.port1.onmessage = () => {
          const fn = queue.shift();
          if (fn) fn();
        };
        if (typeof mc.port1.unref === "function") mc.port1.unref();
        if (typeof mc.port2.unref === "function") mc.port2.unref();

        const yieldFn = () =>
          new Promise((resolve) => {
            queue.push(resolve);
            mc.port2.postMessage(null);
          });
        yieldFn.dispose = () => {
          try {
            mc.port1.close();
            mc.port2.close();
          } catch (_e) {}
        };
        return yieldFn;
      } catch (_e) {}
    }

    const fallback = () => Promise.resolve();
    fallback.dispose = () => {};
    return fallback;
  }

  // ═══════════════════════════════════════════
  // ICE Candidate & Network Route Intelligence
  // ═══════════════════════════════════════════
  function isPrivateOrLocalAddress(rawAddr) {
    if (!rawAddr || typeof rawAddr !== "string") return false;
    let addr = rawAddr.trim().toLowerCase();
    if (!addr) return false;

    // Strip IPv6 brackets or zone index (%eth0)
    addr = addr.replace(/^\[|\]$/g, "").split("%")[0];

    // mDNS obfuscated local host candidates (e.g. a1b2c3d4.local)
    if (addr.endsWith(".local")) return true;

    // IPv4-mapped IPv6 (e.g. ::ffff:192.168.1.10)
    if (addr.startsWith("::ffff:")) {
      addr = addr.slice(7);
    }

    // IPv4 private / link-local / loopback ranges
    const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr);
    if (v4) {
      const a = Number(v4[1]);
      const b = Number(v4[2]);
      if (a === 10) return true;                         // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
      if (a === 192 && b === 168) return true;           // 192.168.0.0/16
      if (a === 169 && b === 254) return true;           // 169.254.0.0/16 link-local
      if (a === 127) return true;                        // 127.0.0.0/8 loopback
      if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT / Tailscale LAN
      return false;
    }

    // IPv6 loopback / link-local / unique local (ULA)
    if (addr === "::1") return true;
    if (addr.startsWith("fe80:")) return true;
    if (addr.startsWith("fc") || addr.startsWith("fd")) return true;

    return false;
  }

  function isHostCandidateLine(candidateStr) {
    if (!candidateStr || typeof candidateStr !== "string") return false;
    return /\btyp\s+host\b/i.test(candidateStr);
  }

  function classifyCandidatePair(localCand, remoteCand, rttMs) {
    const localType = (localCand && localCand.candidateType) || null;
    const remoteType = (remoteCand && remoteCand.candidateType) || null;
    const localAddress = (localCand && (localCand.address || localCand.ip)) || null;
    const remoteAddress = (remoteCand && (remoteCand.address || remoteCand.ip)) || null;
    const protocol = (localCand && localCand.protocol) || (remoteCand && remoteCand.protocol) || null;
    const cleanRtt =
      typeof rttMs === "number" && Number.isFinite(rttMs) && rttMs >= 0
        ? Math.round(rttMs * 10) / 10
        : null;

    if (localType === "relay" || remoteType === "relay") {
      return {
        transport: "relayed",
        isLan: false,
        localType,
        remoteType,
        localAddress,
        remoteAddress,
        protocol,
        rttMs: cleanRtt,
        label: "Relayed",
        detail: "TURN relay server path",
      };
    }

    const localIsPrivate = isPrivateOrLocalAddress(localAddress);
    const remoteIsPrivate = isPrivateOrLocalAddress(remoteAddress);

    // Pure host <-> host is guaranteed direct LAN
    if (localType === "host" && remoteType === "host") {
      return {
        transport: "lan-direct",
        isLan: true,
        localType,
        remoteType,
        localAddress,
        remoteAddress,
        protocol,
        rttMs: cleanRtt,
        label: "LAN Direct",
        detail: `Direct local ${String(protocol || "udp").toUpperCase()} host-to-host`,
      };
    }

    // host <-> prflx (or prflx <-> prflx) on private/local addresses or ultra-low LAN RTT
    const bothLocalKind =
      (localType === "host" || localType === "prflx") &&
      (remoteType === "host" || remoteType === "prflx");
    if (
      (bothLocalKind && (localIsPrivate || remoteIsPrivate || (cleanRtt !== null && cleanRtt <= 8))) ||
      (localIsPrivate && remoteIsPrivate)
    ) {
      return {
        transport: "lan-direct",
        isLan: true,
        localType,
        remoteType,
        localAddress,
        remoteAddress,
        protocol,
        rttMs: cleanRtt,
        label: "LAN Direct",
        detail: `Direct local ${String(protocol || "udp").toUpperCase()} LAN link`,
      };
    }

    if (localType === "srflx" || remoteType === "srflx" || localType || remoteType) {
      return {
        transport: "wan-p2p",
        isLan: false,
        localType,
        remoteType,
        localAddress,
        remoteAddress,
        protocol,
        rttMs: cleanRtt,
        label: "Direct P2P",
        detail: `Direct ${String(protocol || "udp").toUpperCase()} P2P (${localType || "?"}↔${remoteType || "?"})`,
      };
    }

    return {
      transport: "unknown",
      isLan: false,
      localType,
      remoteType,
      localAddress,
      remoteAddress,
      protocol,
      rttMs: cleanRtt,
      label: "P2P",
      detail: "Peer-to-peer data channel",
    };
  }

  async function inspectPeerConnectionPath(pc) {
    if (!pc || typeof pc.getStats !== "function") {
      return classifyCandidatePair(null, null, null);
    }
    try {
      const stats = await pc.getStats();
      const localCandidates = new Map();
      const remoteCandidates = new Map();
      const candidatePairs = new Map();
      let selectedPairId = null;

      stats.forEach((report) => {
        if (report.type === "local-candidate") {
          localCandidates.set(report.id, report);
        } else if (report.type === "remote-candidate") {
          remoteCandidates.set(report.id, report);
        } else if (report.type === "candidate-pair") {
          candidatePairs.set(report.id, report);
        } else if (report.type === "transport" && report.selectedCandidatePairId) {
          selectedPairId = report.selectedCandidatePairId;
        }
      });

      let activePair = selectedPairId ? candidatePairs.get(selectedPairId) : null;
      if (!activePair) {
        for (const pair of candidatePairs.values()) {
          if (pair.state === "succeeded" && (pair.nominated || pair.selected)) {
            activePair = pair;
            break;
          }
        }
      }
      if (!activePair) {
        for (const pair of candidatePairs.values()) {
          if (pair.state === "succeeded") {
            activePair = pair;
            break;
          }
        }
      }

      if (!activePair) {
        return classifyCandidatePair(null, null, null);
      }

      const localCand = localCandidates.get(activePair.localCandidateId) || null;
      const remoteCand = remoteCandidates.get(activePair.remoteCandidateId) || null;
      const rttMs =
        typeof activePair.currentRoundTripTime === "number"
          ? activePair.currentRoundTripTime * 1000
          : null;

      return classifyCandidatePair(localCand, remoteCand, rttMs);
    } catch (_e) {
      return classifyCandidatePair(null, null, null);
    }
  }

  // ═══════════════════════════════════════════
  // Formatting Helpers
  // ═══════════════════════════════════════════
  function formatThroughput(bytesPerSec) {
    if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) {
      return { mbs: "", mbps: "", combined: "" };
    }
    const mbpsVal = (bytesPerSec * 8) / 1_000_000;
    const mbps =
      mbpsVal >= 100
        ? `${Math.round(mbpsVal)} Mbps`
        : mbpsVal >= 10
          ? `${mbpsVal.toFixed(1)} Mbps`
          : mbpsVal >= 0.1
            ? `${mbpsVal.toFixed(2)} Mbps`
            : `${Math.round(bytesPerSec * 8 / 1000)} Kbps`;

    let mbs;
    if (bytesPerSec < 1024) {
      mbs = `${Math.round(bytesPerSec)} B/s`;
    } else if (bytesPerSec < 1024 * 1024) {
      mbs = `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    } else {
      mbs = `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }

    return { mbs, mbps, combined: `${mbs} (${mbps})` };
  }

  // ═══════════════════════════════════════════
  // Event-Driven DataChannel Backpressure
  // ═══════════════════════════════════════════
  function waitForLaneDrain(dc, highWaterMark) {
    if (!dc || dc.readyState !== "open" || dc.bufferedAmount < highWaterMark) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let settled = false;
      let timer = null;

      const done = () => {
        if (settled) return;
        settled = true;
        if (timer) clearInterval(timer);
        if (dc) {
          dc.removeEventListener?.("bufferedamountlow", onLow);
          dc.removeEventListener?.("close", done);
          dc.removeEventListener?.("error", done);
        }
        resolve();
      };

      const onLow = () => done();

      if (typeof dc.addEventListener === "function") {
        dc.addEventListener("bufferedamountlow", onLow);
        dc.addEventListener("close", done);
        dc.addEventListener("error", done);
      }

      // Safety fallback check so we never deadlock even on quirky browsers/mocks
      timer = setInterval(() => {
        if (!dc || dc.readyState !== "open" || dc.bufferedAmount < highWaterMark) {
          done();
        }
      }, 25);
    });
  }

  // ═══════════════════════════════════════════
  // Read-Ahead Slab File Source (Work-Stealing)
  // ═══════════════════════════════════════════
  async function readBlobBuffer(blob) {
    if (typeof blob.arrayBuffer === "function") {
      return blob.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.readAsArrayBuffer(blob);
    });
  }

  function createChunkWorkSource(file, transferId, chunkSize, targetSlabSize) {
    const totalSize = file.size || 0;
    const totalChunks = totalSize > 0 ? Math.ceil(totalSize / chunkSize) : 0;
    const chunksPerSlab = Math.max(1, Math.floor(targetSlabSize / chunkSize));
    const slabByteStep = chunksPerSlab * chunkSize;

    let nextChunkIndex = 0;
    let nextSlabOffset = 0;
    let currentSlab = null;
    let currentSlabStartByte = 0;
    let prefetchedSlabPromise = null;
    let slabLoadPromise = null;
    let runningChecksum = FNV_OFFSET_BASIS;
    const retryQueue = [];

    function schedulePrefetch(offset) {
      if (offset >= totalSize) return null;
      const end = Math.min(offset + slabByteStep, totalSize);
      return readBlobBuffer(file.slice(offset, end)).then((buf) => ({
        startByte: offset,
        bytes: new Uint8Array(buf),
      }));
    }

    async function ensureSlabForChunk(chunkIndex) {
      const byteStart = chunkIndex * chunkSize;
      if (
        currentSlab &&
        byteStart >= currentSlabStartByte &&
        byteStart < currentSlabStartByte + currentSlab.byteLength
      ) {
        return currentSlab;
      }

      // Serialize concurrent lane requests waiting on the same slab load
      if (slabLoadPromise) {
        await slabLoadPromise;
        return ensureSlabForChunk(chunkIndex);
      }

      slabLoadPromise = (async () => {
        const promiseToAwait =
          prefetchedSlabPromise || schedulePrefetch(nextSlabOffset);
        prefetchedSlabPromise = null;

        if (!promiseToAwait) {
          currentSlab = null;
          return;
        }

        const loaded = await promiseToAwait;
        currentSlabStartByte = loaded.startByte;
        currentSlab = loaded.bytes;
        nextSlabOffset = loaded.startByte + loaded.bytes.byteLength;

        // Compute streaming FNV-1a checksum in exact sequential byte order (single disk read!)
        runningChecksum = fnv1aUpdate(runningChecksum, currentSlab);

        // Immediately start prefetching the NEXT slab in background while lanes transmit this slab!
        if (nextSlabOffset < totalSize) {
          prefetchedSlabPromise = schedulePrefetch(nextSlabOffset);
        }
      })();

      try {
        await slabLoadPromise;
      } finally {
        slabLoadPromise = null;
      }

      return currentSlab;
    }

    // Serialization mutex for grabbing the next chunk index + slab slice cleanly
    let nextTail = Promise.resolve();

    function next() {
      const job = nextTail.then(async () => {
        if (retryQueue.length > 0) {
          return retryQueue.shift();
        }
        if (nextChunkIndex >= totalChunks) {
          return null;
        }
        const idx = nextChunkIndex++;
        const slab = await ensureSlabForChunk(idx);
        if (!slab) return null;

        const absStart = idx * chunkSize;
        const absEnd = Math.min(absStart + chunkSize, totalSize);
        const relStart = absStart - currentSlabStartByte;
        const relEnd = absEnd - currentSlabStartByte;

        const frameBuffer = encodeChunkFrameFromSlab(
          transferId,
          idx,
          slab,
          relStart,
          relEnd
        );
        return {
          chunkIndex: idx,
          payloadBytes: absEnd - absStart,
          frameBuffer,
        };
      });
      nextTail = job.catch(() => {});
      return job;
    }

    function requeue(chunkJob) {
      if (chunkJob) retryQueue.push(chunkJob);
    }

    function hasRemaining() {
      return retryQueue.length > 0 || nextChunkIndex < totalChunks;
    }

    function getChecksum() {
      return runningChecksum >>> 0;
    }

    return {
      totalChunks,
      next,
      requeue,
      hasRemaining,
      getChecksum,
    };
  }

  // ═══════════════════════════════════════════
  // Multi-Lane Direct LAN Peer Session
  // ═══════════════════════════════════════════
  class LanTurboPeerSession {
    constructor(options) {
      this.localPeerId = String(options.localPeerId || "");
      this.remotePeerId = String(options.remotePeerId || "");
      this.sendSignal = options.sendSignal;
      this.onChunk = options.onChunk || (() => {});
      this.onBenchBytes = options.onBenchBytes || (() => {});
      this.onStateChange = options.onStateChange || (() => {});
      this.getIceServers = options.getIceServers || (() => []);
      this.isMobile = Boolean(options.isMobile);
      this.desiredLanes = this._clampLanes(
        options.desiredLanes || (this.isMobile ? DEFAULT_MOBILE_LANES : DEFAULT_DESKTOP_LANES)
      );
      this.strictLanOnly = Boolean(options.strictLanOnly);
      this.RTCPeerConnectionImpl =
        options.RTCPeerConnectionImpl || globalScope.RTCPeerConnection || null;

      // Deterministic role tie-breaker eliminates SDP glare completely
      this.isInitiator = this.localPeerId < this.remotePeerId;

      this.sessionEpoch = 1;
      this.destroyed = false;
      this.remoteCaps = null;
      this.targetLanes = this.desiredLanes;

      // state: "idle" | "probing-lan" | "lan-direct" | "probing-wan" | "wan-p2p" | "relayed" | "lan-strict-blocked" | "unavailable"
      this.state = "idle";
      this.activeMode = null; // "lan-host-only" | "direct-p2p"
      this.routeInfo = classifyCandidatePair(null, null, null);
      this.lanes = new Map(); // laneId -> LaneRecord
      this.fallbackPeerConnection = options.fallbackPeerConnection || null;
      this.activeSpeedTest = null;
      this.lastBenchResult = null;
      this._probeFallbackStarted = false;
      this._capsSent = false;
      this._pendingBenchResolvers = new Map();
      this._incomingBenches = new Map();
    }

    _clampLanes(n) {
      const v = Number(n);
      if (!Number.isFinite(v) || v < 1) {
        return this.isMobile ? DEFAULT_MOBILE_LANES : DEFAULT_DESKTOP_LANES;
      }
      return Math.max(1, Math.min(MAX_LANES, Math.round(v)));
    }

    getHighWaterMark() {
      return this.isMobile ? LANE_HIGH_WATER_MOBILE : LANE_HIGH_WATER_DESKTOP;
    }

    getLowWaterMark() {
      return this.isMobile ? LANE_LOW_WATER_MOBILE : LANE_LOW_WATER_DESKTOP;
    }

    getSlabSize() {
      return this.isMobile ? READ_SLAB_MOBILE : READ_SLAB_DESKTOP;
    }

    getOpenLanes() {
      const open = [];
      for (const lane of this.lanes.values()) {
        if (lane.dc && lane.dc.readyState === "open") {
          open.push(lane);
        }
      }
      return open;
    }

    getOptimalChunkSize() {
      const openLanes = this.getOpenLanes();
      let maxFrame = TARGET_RAW_FRAME_SIZE;
      let sawSctpLimit = false;

      for (const lane of openLanes) {
        const sctpMax = lane.pc && lane.pc.sctp && lane.pc.sctp.maxMessageSize;
        if (typeof sctpMax === "number" && Number.isFinite(sctpMax) && sctpMax >= MIN_RAW_FRAME_SIZE) {
          sawSctpLimit = true;
          maxFrame = Math.min(maxFrame, sctpMax);
        }
      }

      if (!sawSctpLimit) {
        maxFrame = FALLBACK_RAW_FRAME_SIZE;
      }

      const clamped = Math.max(MIN_RAW_FRAME_SIZE, Math.min(TARGET_RAW_FRAME_SIZE, maxFrame));
      return clamped - FRAME_HEADER_SIZE;
    }

    getStatusSnapshot() {
      const openLanes = this.getOpenLanes();
      return {
        state: this.state,
        isLanDirect: this.state === "lan-direct" || Boolean(this.routeInfo && this.routeInfo.isLan),
        activeLanes: openLanes.length,
        targetLanes: this.targetLanes,
        strictLanOnly: this.strictLanOnly,
        routeInfo: this.routeInfo,
        remoteCaps: this.remoteCaps,
        optimalChunkSize: this.getOptimalChunkSize(),
        lastBenchResult: this.lastBenchResult,
        canTransferTurbo: openLanes.length > 0,
      };
    }

    _emitState() {
      if (this.destroyed) return;
      try {
        this.onStateChange(this.getStatusSnapshot());
      } catch (_e) {}
    }

    start(localMeta = {}) {
      if (this.destroyed) return;
      this.localMeta = localMeta;

      // Inspect existing PeerJS PeerConnection immediately for instant baseline diagnostics
      if (this.fallbackPeerConnection) {
        inspectPeerConnectionPath(this.fallbackPeerConnection).then((info) => {
          if (this.destroyed) return;
          if (this.state === "idle" || this.state === "probing-lan") {
            this.routeInfo = info;
            this._emitState();
          }
        });
      }

      // Exchange capabilities with remote peer (ensures 100% compatibility with older LocalShare versions)
      this._sendCaps();
    }

    _sendCaps() {
      if (this.destroyed) return;
      this._capsSent = true;
      try {
        this.sendSignal({
          type: "lan-turbo-caps",
          version: 2,
          maxLanes: this.desiredLanes,
          strictLanOnly: this.strictLanOnly,
          lanServerOrigin: (this.localMeta && this.localMeta.lanServerOrigin) || null,
          lanServerClientId: (this.localMeta && this.localMeta.lanServerClientId) || null,
        });
      } catch (_e) {}
    }

    updateConfig({ desiredLanes, strictLanOnly }) {
      const prevLanes = this.desiredLanes;
      const prevStrict = this.strictLanOnly;
      if (desiredLanes !== undefined) {
        this.desiredLanes = this._clampLanes(desiredLanes);
      }
      if (strictLanOnly !== undefined) {
        this.strictLanOnly = Boolean(strictLanOnly);
      }
      if (prevLanes !== this.desiredLanes || prevStrict !== this.strictLanOnly) {
        this._sendCaps();
        if (this.remoteCaps) {
          this.reprobe();
        }
      }
    }

    reprobe() {
      if (this.destroyed || !this.RTCPeerConnectionImpl) return;
      this.sessionEpoch += 1;
      this._closeAllLanes();
      this._probeFallbackStarted = false;
      this.state = "probing-lan";
      this._emitState();

      try {
        this.sendSignal({
          type: "lan-turbo-reset",
          sessionEpoch: this.sessionEpoch,
        });
      } catch (_e) {}

      if (this.isInitiator) {
        this._startStrictLanProbe();
      }
    }

    _closeAllLanes() {
      for (const lane of this.lanes.values()) {
        this._disposeLane(lane);
      }
      this.lanes.clear();
    }

    _disposeLane(lane) {
      if (!lane) return;
      if (lane.probeTimer) {
        clearTimeout(lane.probeTimer);
        lane.probeTimer = null;
      }
      if (lane.dc) {
        try {
          lane.dc.onopen = null;
          lane.dc.onclose = null;
          lane.dc.onerror = null;
          lane.dc.onmessage = null;
          lane.dc.close();
        } catch (_e) {}
      }
      if (lane.pc) {
        try {
          lane.pc.onicecandidate = null;
          lane.pc.oniceconnectionstatechange = null;
          lane.pc.onconnectionstatechange = null;
          lane.pc.ondatachannel = null;
          lane.pc.close();
        } catch (_e) {}
      }
    }

    destroy() {
      this.destroyed = true;
      this._closeAllLanes();
      for (const resolver of this._pendingBenchResolvers.values()) {
        resolver(null);
      }
      this._pendingBenchResolvers.clear();
      this._incomingBenches.clear();
    }

    // ─── Signaling Message Handler ───
    handleSignalMessage(msg) {
      if (this.destroyed || !msg || typeof msg !== "object") return false;

      switch (msg.type) {
        case "lan-turbo-caps": {
          const isFirst = !this.remoteCaps;
          this.remoteCaps = {
            version: msg.version || 2,
            maxLanes: this._clampLanes(msg.maxLanes || DEFAULT_DESKTOP_LANES),
            strictLanOnly: Boolean(msg.strictLanOnly),
            lanServerOrigin: msg.lanServerOrigin || null,
            lanServerClientId: msg.lanServerClientId || null,
          };
          this.targetLanes = Math.min(this.desiredLanes, this.remoteCaps.maxLanes, MAX_LANES);
          if (!this._capsSent) this._sendCaps();

          // Kick off LAN Direct probe once caps are exchanged!
          if (isFirst && this.RTCPeerConnectionImpl) {
            this.state = "probing-lan";
            this._emitState();
            if (this.isInitiator) {
              this._startStrictLanProbe();
            }
          } else {
            this._emitState();
          }
          return true;
        }

        case "lan-turbo-reset": {
          const incomingEpoch = Number(msg.sessionEpoch || 0);
          if (incomingEpoch >= this.sessionEpoch) {
            this.sessionEpoch = incomingEpoch;
            this._closeAllLanes();
            this._probeFallbackStarted = false;
            this.state = "probing-lan";
            this._emitState();
            if (this.isInitiator) {
              this._startStrictLanProbe();
            }
          }
          return true;
        }

        case "lan-turbo-offer": {
          this._handleOffer(msg);
          return true;
        }

        case "lan-turbo-answer": {
          this._handleAnswer(msg);
          return true;
        }

        case "lan-turbo-ice": {
          this._handleRemoteIce(msg);
          return true;
        }

        case "lan-bench-start": {
          this._handleIncomingBenchStart(msg);
          return true;
        }

        case "lan-bench-end": {
          this._handleIncomingBenchEnd(msg);
          return true;
        }

        case "lan-bench-result": {
          const resolve = this._pendingBenchResolvers.get(msg.benchId);
          if (resolve) {
            this._pendingBenchResolvers.delete(msg.benchId);
            resolve(msg);
          }
          return true;
        }

        default:
          return false;
      }
    }

    // ─── Phase 1: Host-Only LAN Direct Probe ───
    _startStrictLanProbe() {
      if (this.destroyed || !this.RTCPeerConnectionImpl) return;
      this.activeMode = "lan-host-only";
      this.state = "probing-lan";
      this._emitState();
      this._createInitiatorLane(0, "lan-host-only", STRICT_LAN_PROBE_TIMEOUT_MS);
    }

    // ─── Phase 2: Adaptive STUN Direct Raw Fallback ───
    _fallbackToDirectP2p() {
      if (this.destroyed || this._probeFallbackStarted) return;
      this._probeFallbackStarted = true;

      if (this.strictLanOnly || (this.remoteCaps && this.remoteCaps.strictLanOnly)) {
        this._closeAllLanes();
        this.state = "lan-strict-blocked";
        this._emitState();
        return;
      }

      this._closeAllLanes();
      this.activeMode = "direct-p2p";
      this.state = "probing-wan";
      this._emitState();
      this._createInitiatorLane(0, "direct-p2p", WAN_TURBO_PROBE_TIMEOUT_MS);
    }

    _buildRtcConfig(mode) {
      if (mode === "lan-host-only") {
        // STRICT HOST-ONLY: zero STUN, zero TURN, zero PeerServer — local router interfaces ONLY!
        return {
          iceServers: [],
          bundlePolicy: "max-bundle",
        };
      }
      return {
        iceServers: this.getIceServers(),
        bundlePolicy: "max-bundle",
      };
    }

    async _createInitiatorLane(laneId, mode, timeoutMs) {
      if (this.destroyed || !this.RTCPeerConnectionImpl) return;
      const epoch = this.sessionEpoch;
      const existing = this.lanes.get(laneId);
      if (existing) this._disposeLane(existing);

      let pc;
      try {
        pc = new this.RTCPeerConnectionImpl(this._buildRtcConfig(mode));
      } catch (_e) {
        if (laneId === 0 && mode === "lan-host-only") {
          this._fallbackToDirectP2p();
        }
        return;
      }

      const lane = {
        laneId,
        mode,
        epoch,
        pc,
        dc: null,
        ready: false,
        remoteDescSet: false,
        pendingIce: [],
        probeTimer: null,
      };
      this.lanes.set(laneId, lane);

      // Raw unordered reliable SCTP channel: zero head-of-line blocking, 100% lossless delivery!
      const dc = pc.createDataChannel(`ls-turbo-${laneId}`, {
        ordered: false,
      });
      this._bindDataChannel(lane, dc);
      this._bindPeerConnectionEvents(lane, timeoutMs);

      try {
        const offer = await pc.createOffer();
        if (this.destroyed || epoch !== this.sessionEpoch) return;
        await pc.setLocalDescription(offer);
        this.sendSignal({
          type: "lan-turbo-offer",
          sessionEpoch: epoch,
          laneId,
          mode,
          sdp: pc.localDescription ? pc.localDescription.toJSON ? pc.localDescription.toJSON() : { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : offer,
        });
      } catch (_e) {
        this._disposeLane(lane);
        this.lanes.delete(laneId);
        if (laneId === 0 && mode === "lan-host-only") {
          this._fallbackToDirectP2p();
        }
      }
    }

    async _handleOffer(msg) {
      if (this.destroyed || !this.RTCPeerConnectionImpl) return;
      const epoch = Number(msg.sessionEpoch || 1);
      if (epoch < this.sessionEpoch) return;
      if (epoch > this.sessionEpoch) {
        this.sessionEpoch = epoch;
        this._closeAllLanes();
      }

      const laneId = Number(msg.laneId || 0);
      const mode = msg.mode === "lan-host-only" ? "lan-host-only" : "direct-p2p";

      if (mode === "direct-p2p" && this.strictLanOnly) {
        this.state = "lan-strict-blocked";
        this._emitState();
        return;
      }

      this.activeMode = mode;
      const existing = this.lanes.get(laneId);
      if (existing) this._disposeLane(existing);

      let pc;
      try {
        pc = new this.RTCPeerConnectionImpl(this._buildRtcConfig(mode));
      } catch (_e) {
        return;
      }

      const lane = {
        laneId,
        mode,
        epoch,
        pc,
        dc: null,
        ready: false,
        remoteDescSet: false,
        pendingIce: [],
        probeTimer: null,
      };
      this.lanes.set(laneId, lane);

      pc.ondatachannel = (ev) => {
        if (this.destroyed || epoch !== this.sessionEpoch) return;
        this._bindDataChannel(lane, ev.channel);
      };

      this._bindPeerConnectionEvents(lane, mode === "lan-host-only" ? STRICT_LAN_PROBE_TIMEOUT_MS + 1000 : WAN_TURBO_PROBE_TIMEOUT_MS);

      try {
        await pc.setRemoteDescription(msg.sdp);
        lane.remoteDescSet = true;
        await this._flushPendingIce(lane);

        const answer = await pc.createAnswer();
        if (this.destroyed || epoch !== this.sessionEpoch) return;
        await pc.setLocalDescription(answer);
        this.sendSignal({
          type: "lan-turbo-answer",
          sessionEpoch: epoch,
          laneId,
          mode,
          sdp: pc.localDescription ? pc.localDescription.toJSON ? pc.localDescription.toJSON() : { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : answer,
        });
      } catch (_e) {
        this._disposeLane(lane);
        this.lanes.delete(laneId);
      }
    }

    async _handleAnswer(msg) {
      const epoch = Number(msg.sessionEpoch || 1);
      if (epoch !== this.sessionEpoch) return;
      const lane = this.lanes.get(Number(msg.laneId || 0));
      if (!lane || !lane.pc) return;
      try {
        await lane.pc.setRemoteDescription(msg.sdp);
        lane.remoteDescSet = true;
        await this._flushPendingIce(lane);
      } catch (_e) {}
    }

    async _handleRemoteIce(msg) {
      const epoch = Number(msg.sessionEpoch || 1);
      if (epoch !== this.sessionEpoch) return;
      const lane = this.lanes.get(Number(msg.laneId || 0));
      if (!lane || !lane.pc || !msg.candidate) return;

      // Enforce host-only candidate filtering on strict LAN lanes
      if (lane.mode === "lan-host-only" && msg.candidate.candidate && !isHostCandidateLine(msg.candidate.candidate)) {
        return;
      }

      if (!lane.remoteDescSet) {
        lane.pendingIce.push(msg.candidate);
        return;
      }

      try {
        await lane.pc.addIceCandidate(msg.candidate);
      } catch (_e) {}
    }

    async _flushPendingIce(lane) {
      while (lane.pendingIce.length > 0) {
        const cand = lane.pendingIce.shift();
        try {
          await lane.pc.addIceCandidate(cand);
        } catch (_e) {}
      }
    }

    _bindPeerConnectionEvents(lane, timeoutMs) {
      const { pc, laneId, mode, epoch } = lane;

      pc.onicecandidate = (ev) => {
        if (this.destroyed || epoch !== this.sessionEpoch) return;
        if (!ev || !ev.candidate || !ev.candidate.candidate) return;

        // Strict LAN mode: ONLY transmit host candidates!
        if (mode === "lan-host-only" && !isHostCandidateLine(ev.candidate.candidate)) {
          return;
        }

        try {
          this.sendSignal({
            type: "lan-turbo-ice",
            sessionEpoch: epoch,
            laneId,
            candidate:
              typeof ev.candidate.toJSON === "function"
                ? ev.candidate.toJSON()
                : {
                    candidate: ev.candidate.candidate,
                    sdpMid: ev.candidate.sdpMid,
                    sdpMLineIndex: ev.candidate.sdpMLineIndex,
                  },
          });
        } catch (_e) {}
      };

      const onFailure = () => {
        if (this.destroyed || epoch !== this.sessionEpoch) return;
        if (lane.ready) {
          this._disposeLane(lane);
          this.lanes.delete(laneId);
          this._emitState();
          return;
        }
        this._disposeLane(lane);
        this.lanes.delete(laneId);

        if (laneId === 0 && this.isInitiator) {
          if (mode === "lan-host-only") {
            this._fallbackToDirectP2p();
          } else {
            this.state = "unavailable";
            this._emitState();
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed") {
          onFailure();
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          onFailure();
        }
      };

      if (timeoutMs > 0) {
        lane.probeTimer = setTimeout(() => {
          if (!lane.ready && !this.destroyed && epoch === this.sessionEpoch) {
            onFailure();
          }
        }, timeoutMs);
      }
    }

    _bindDataChannel(lane, dc) {
      lane.dc = dc;
      try {
        dc.binaryType = "arraybuffer";
        dc.bufferedAmountLowThreshold = this.getLowWaterMark();
      } catch (_e) {}

      dc.onopen = async () => {
        if (this.destroyed || lane.epoch !== this.sessionEpoch) return;
        lane.ready = true;
        if (lane.probeTimer) {
          clearTimeout(lane.probeTimer);
          lane.probeTimer = null;
        }

        // Inspect actual ICE route on Lane 0 open
        if (lane.laneId === 0) {
          const pathInfo = await inspectPeerConnectionPath(lane.pc);
          if (this.destroyed || lane.epoch !== this.sessionEpoch) return;

          if (lane.mode === "lan-host-only") {
            // Host-only RTCPeerConnection succeeded => 100% confirmed direct LAN!
            this.routeInfo = {
              ...pathInfo,
              transport: "lan-direct",
              isLan: true,
              label: "LAN Direct",
              detail: pathInfo.detail || "Direct local LAN host-to-host",
            };
            this.state = "lan-direct";
          } else {
            this.routeInfo = pathInfo;
            this.state = pathInfo.isLan
              ? "lan-direct"
              : pathInfo.transport === "relayed"
                ? "relayed"
                : "wan-p2p";
          }

          // Spawn remaining parallel lanes on initiator now that Lane 0 is confirmed!
          if (this.isInitiator) {
            const desiredTotal =
              this.state === "lan-direct"
                ? this.targetLanes
                : this.state === "wan-p2p"
                  ? Math.min(this.targetLanes, 2)
                  : 1;

            for (let i = 1; i < desiredTotal; i++) {
              this._createInitiatorLane(i, lane.mode, WAN_TURBO_PROBE_TIMEOUT_MS);
            }
          }
        }

        this._emitState();
      };

      dc.onmessage = (ev) => {
        if (this.destroyed) return;
        const data = ev.data;
        if (typeof Blob !== "undefined" && data instanceof Blob) {
          data
            .arrayBuffer()
            .then((buf) => this._dispatchIncomingRaw(buf))
            .catch(() => {});
          return;
        }
        this._dispatchIncomingRaw(data);
      };

      dc.onclose = () => {
        if (this.destroyed || lane.epoch !== this.sessionEpoch) return;
        lane.ready = false;
        this.lanes.delete(lane.laneId);
        if (this.getOpenLanes().length === 0 && this.state !== "probing-lan" && this.state !== "probing-wan") {
          this.state = "unavailable";
        }
        this._emitState();
      };

      dc.onerror = () => {};
    }

    _dispatchIncomingRaw(rawData) {
      const parsed = decodeFrameHeader(rawData);
      if (!parsed) return;

      if (parsed.kind === "chunk") {
        this.onChunk(parsed);
        return;
      }

      if (parsed.kind === "bench") {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        let entry = this._incomingBenches.get(parsed.benchId);
        if (!entry) {
          entry = { startMs: now, lastMs: now, bytes: 0 };
          this._incomingBenches.set(parsed.benchId, entry);
        }
        entry.bytes += parsed.payloadBytes;
        entry.lastMs = now;
        this.onBenchBytes(parsed.benchId, parsed.payloadBytes);
      }
    }

    _handleIncomingBenchStart(msg) {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      this._incomingBenches.set(msg.benchId, { startMs: now, lastMs: now, bytes: 0 });
    }

    _handleIncomingBenchEnd(msg) {
      const entry = this._incomingBenches.get(msg.benchId);
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const bytes = entry ? entry.bytes : 0;
      const elapsedMs = entry ? Math.max(1, (entry.lastMs || now) - entry.startMs) : 1;
      const throughputBps = (bytes / elapsedMs) * 1000;
      this._incomingBenches.delete(msg.benchId);

      try {
        this.sendSignal({
          type: "lan-bench-result",
          benchId: msg.benchId,
          receivedBytes: bytes,
          elapsedMs: Math.round(elapsedMs),
          throughputBps,
        });
      } catch (_e) {}
    }

    // ═══════════════════════════════════════════
    // Work-Stealing Multi-Lane File Sender
    // ═══════════════════════════════════════════
    async sendFile(file, options = {}) {
      const transferId = options.transferId;
      const isCancelled = options.isCancelled || (() => false);
      const onStart = options.onStart || (() => {});
      const onProgress = options.onProgress || (() => {});
      const fallbackSend = options.fallbackSend || null;

      const openLanes = this.getOpenLanes();
      if (openLanes.length === 0) {
        throw new Error("No open LAN Turbo lanes available");
      }

      const chunkSize = this.getOptimalChunkSize();
      const source = createChunkWorkSource(
        file,
        transferId,
        chunkSize,
        this.getSlabSize()
      );
      const totalSize = file.size || 0;
      const highWater = this.getHighWaterMark();
      const fastYield = createFastYield();

      const statusSnap = this.getStatusSnapshot();
      onStart({
        chunkSize,
        totalChunks: source.totalChunks,
        activeLanes: openLanes.length,
        transportState: statusSnap.state,
        isLanDirect: statusSnap.isLanDirect,
      });

      if (totalSize === 0 || source.totalChunks === 0) {
        fastYield.dispose();
        return {
          totalChunks: 0,
          checksum: FNV_OFFSET_BASIS,
          elapsedSec: 0.001,
          avgSpeedBps: 0,
          peakSpeedBps: 0,
          lanesUsed: openLanes.length,
          transportState: statusSnap.state,
        };
      }

      const startMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      let sentBytes = 0;
      let peakSpeedBps = 0;
      let lastUiMs = startMs;
      let lastWindowMs = startMs;
      let lastWindowBytes = 0;
      let smoothedSpeedBps = 0;

      const reportProgress = (force = false) => {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (!force && now - lastUiMs < UI_PROGRESS_INTERVAL_MS) return;

        const windowDt = (now - lastWindowMs) / 1000;
        if (windowDt >= 0.25 || force) {
          const instant = (sentBytes - lastWindowBytes) / Math.max(windowDt, 0.001);
          smoothedSpeedBps =
            smoothedSpeedBps > 0 ? smoothedSpeedBps * 0.45 + instant * 0.55 : instant;
          if (smoothedSpeedBps > peakSpeedBps) peakSpeedBps = smoothedSpeedBps;
          lastWindowMs = now;
          lastWindowBytes = sentBytes;
        }

        const totalElapsed = Math.max((now - startMs) / 1000, 0.001);
        const displaySpeed = smoothedSpeedBps > 0 ? smoothedSpeedBps : sentBytes / totalElapsed;
        if (displaySpeed > peakSpeedBps) peakSpeedBps = displaySpeed;

        const remaining = Math.max(0, totalSize - sentBytes);
        const etaSec = displaySpeed > 0 ? remaining / displaySpeed : 0;

        lastUiMs = now;
        onProgress({
          sentBytes,
          totalBytes: totalSize,
          pct: Math.min(100, (sentBytes / totalSize) * 100),
          speedBps: displaySpeed,
          peakSpeedBps,
          etaSec,
          activeLanes: this.getOpenLanes().length || openLanes.length,
        });
      };

      const failedLanes = new Set();

      const pumpLane = async (lane) => {
        const dc = lane.dc;
        let bytesSinceYield = 0;

        while (!isCancelled() && !this.destroyed) {
          if (!dc || dc.readyState !== "open") break;

          if (dc.bufferedAmount >= highWater) {
            await waitForLaneDrain(dc, highWater);
            if (isCancelled() || !dc || dc.readyState !== "open") break;
          }

          const job = await source.next();
          if (!job) break;

          try {
            dc.send(job.frameBuffer);
          } catch (_err) {
            // Re-queue chunk so healthy lanes seamlessly pick it up!
            failedLanes.add(lane.laneId);
            source.requeue(job);
            break;
          }

          sentBytes += job.payloadBytes;
          bytesSinceYield += job.payloadBytes;
          reportProgress(false);

          if (bytesSinceYield >= YIELD_EVERY_BYTES) {
            bytesSinceYield = 0;
            await fastYield();
          }
        }
      };

      try {
        // Launch parallel work-stealing pumps on all open LAN Turbo lanes simultaneously!
        // Re-runs if a lane drops mid-transfer and re-queues a chunk while other lanes already finished.
        let prevSentBytes = -1;
        while (!isCancelled() && !this.destroyed && source.hasRemaining()) {
          const liveLanes = this.getOpenLanes().filter((l) => !failedLanes.has(l.laneId));
          if (liveLanes.length === 0 || prevSentBytes === sentBytes) break;
          prevSentBytes = sentBytes;
          await Promise.all(liveLanes.map((lane) => pumpLane(lane)));
        }

        // If all turbo lanes closed mid-transfer and chunks remain, drain cleanly via fallbackSend
        if (!isCancelled() && source.hasRemaining() && typeof fallbackSend === "function") {
          while (!isCancelled() && source.hasRemaining()) {
            const job = await source.next();
            if (!job) break;
            await fallbackSend(job.frameBuffer);
            sentBytes += job.payloadBytes;
            reportProgress(false);
          }
        }

        // Wait for SCTP buffers on open lanes to flush before signaling transfer-complete
        if (!isCancelled()) {
          await Promise.all(
            this.getOpenLanes().map((lane) =>
              lane.dc && lane.dc.readyState === "open"
                ? waitForLaneDrain(lane.dc, 64 * 1024)
                : Promise.resolve()
            )
          );
        }
      } finally {
        fastYield.dispose();
      }

      const endMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const elapsedSec = Math.max((endMs - startMs) / 1000, 0.001);
      const avgSpeedBps = totalSize / elapsedSec;
      if (avgSpeedBps > peakSpeedBps) peakSpeedBps = avgSpeedBps;
      reportProgress(true);

      return {
        totalChunks: source.totalChunks,
        checksum: source.getChecksum(),
        elapsedSec,
        avgSpeedBps,
        peakSpeedBps,
        lanesUsed: openLanes.length,
        transportState: statusSnap.state,
        cancelled: isCancelled(),
      };
    }

    // ═══════════════════════════════════════════
    // 1-Click LAN Link Speed Test (Zero Disk I/O)
    // ═══════════════════════════════════════════
    async runSpeedTest(options = {}) {
      const openLanes = this.getOpenLanes();
      if (openLanes.length === 0) {
        throw new Error("No active direct turbo lanes to benchmark");
      }
      if (this.activeSpeedTest) {
        throw new Error("Speed test already running");
      }

      const durationMs = options.durationMs || 2500;
      const maxBytes = options.maxBytes || 512 * 1024 * 1024;
      const onProgress = options.onProgress || (() => {});
      const benchId = ((Math.random() * 0xffffffff) >>> 0) || 1;
      const payloadSize = this.getOptimalChunkSize();
      const frame = makeBenchFrame(benchId, payloadSize);
      const frameBuffer = frame.buffer;
      const highWater = this.getHighWaterMark();
      const fastYield = createFastYield();

      this.activeSpeedTest = benchId;

      try {
        this.sendSignal({ type: "lan-bench-start", benchId, durationMs });

        const startMs = typeof performance !== "undefined" ? performance.now() : Date.now();
        let sentBytes = 0;
        let lastUiMs = startMs;
        let done = false;

        const stopAt = startMs + durationMs;

        const pumpBenchLane = async (lane) => {
          const dc = lane.dc;
          let burst = 0;
          while (!done && !this.destroyed && dc && dc.readyState === "open") {
            const now = typeof performance !== "undefined" ? performance.now() : Date.now();
            if (now >= stopAt || sentBytes >= maxBytes) {
              done = true;
              break;
            }
            if (dc.bufferedAmount >= highWater) {
              await waitForLaneDrain(dc, highWater);
              continue;
            }
            try {
              dc.send(frameBuffer);
            } catch (_e) {
              break;
            }
            sentBytes += payloadSize;
            burst += payloadSize;

            if (now - lastUiMs >= 120) {
              lastUiMs = now;
              const elapsedSec = Math.max((now - startMs) / 1000, 0.001);
              onProgress({
                sentBytes,
                elapsedSec,
                speedBps: sentBytes / elapsedSec,
                pct: Math.min(99, ((now - startMs) / durationMs) * 100),
              });
            }

            if (burst >= YIELD_EVERY_BYTES) {
              burst = 0;
              await fastYield();
            }
          }
        };

        await Promise.all(openLanes.map((lane) => pumpBenchLane(lane)));

        // Drain buffers before asking receiver for its authoritative count
        await Promise.all(
          openLanes.map((lane) =>
            lane.dc && lane.dc.readyState === "open"
              ? waitForLaneDrain(lane.dc, 64 * 1024)
              : Promise.resolve()
          )
        );

        const endMs = typeof performance !== "undefined" ? performance.now() : Date.now();
        const senderElapsedSec = Math.max((endMs - startMs) / 1000, 0.001);

        // Request receiver's measured throughput (wait up to 2s)
        const receiverResultPromise = new Promise((resolve) => {
          this._pendingBenchResolvers.set(benchId, resolve);
          setTimeout(() => {
            if (this._pendingBenchResolvers.has(benchId)) {
              this._pendingBenchResolvers.delete(benchId);
              resolve(null);
            }
          }, 2000);
        });

        this.sendSignal({ type: "lan-bench-end", benchId, sentBytes });
        const remoteRes = await receiverResultPromise;

        // Refresh path stats too
        const latestPath = openLanes[0]
          ? await inspectPeerConnectionPath(openLanes[0].pc)
          : this.routeInfo;
        if (latestPath && latestPath.rttMs !== null) {
          this.routeInfo = { ...this.routeInfo, rttMs: latestPath.rttMs };
        }

        const measuredBytes =
          remoteRes && remoteRes.receivedBytes > 0 ? remoteRes.receivedBytes : sentBytes;
        const throughputBps =
          remoteRes && remoteRes.throughputBps > 0
            ? remoteRes.throughputBps
            : sentBytes / senderElapsedSec;

        const result = {
          benchId,
          bytes: measuredBytes,
          elapsedSec:
            remoteRes && remoteRes.elapsedMs > 0
              ? remoteRes.elapsedMs / 1000
              : senderElapsedSec,
          throughputBps,
          formatted: formatThroughput(throughputBps),
          lanesUsed: openLanes.length,
          state: this.state,
          isLanDirect: this.state === "lan-direct" || Boolean(this.routeInfo.isLan),
          rttMs: this.routeInfo.rttMs,
          verifiedByReceiver: Boolean(remoteRes && remoteRes.receivedBytes > 0),
          ts: Date.now(),
        };

        this.lastBenchResult = result;
        this._emitState();
        return result;
      } finally {
        this.activeSpeedTest = null;
        fastYield.dispose();
      }
    }
  }

  // ═══════════════════════════════════════════
  // Optional Local LAN Server Client (when served via `npm start`)
  // Uses ONLY relative `/api/lan/...` endpoints (never hardcoded localhost).
  // ═══════════════════════════════════════════
  class LanServerTransport {
    constructor(options) {
      this.peerId = options.peerId;
      this.room = options.room || "lan";
      this.name = options.name || "LAN Device";
      this.platform = options.platform || "laptop";
      this.onRoster = options.onRoster || (() => {});
      this.onSignal = options.onSignal || (() => {});
      this.onStatus = options.onStatus || (() => {});
      this.eventSource = null;
      this.connected = false;
    }

    connect() {
      if (typeof globalScope.EventSource !== "function") return false;
      this.disconnect();

      const qs = new URLSearchParams({
        peerId: this.peerId,
        room: this.room,
        name: this.name,
        platform: this.platform,
      });

      const es = new globalScope.EventSource(`/api/lan/events?${qs.toString()}`);
      this.eventSource = es;

      es.addEventListener("open", () => {
        this.connected = true;
        this.onStatus(true);
      });

      es.addEventListener("roster", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (Array.isArray(data.peers)) {
            this.onRoster(data.peers);
          }
        } catch (_e) {}
      });

      es.addEventListener("signal", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          this.onSignal(data);
        } catch (_e) {}
      });

      es.onerror = () => {
        this.connected = false;
        this.onStatus(false);
      };

      return true;
    }

    disconnect() {
      if (this.eventSource) {
        try {
          this.eventSource.close();
        } catch (_e) {}
        this.eventSource = null;
      }
      this.connected = false;
    }

    async sendSignal(toPeerId, payload) {
      const res = await fetch("/api/lan/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: this.peerId,
          to: toPeerId,
          payload,
        }),
      });
      return res.ok;
    }

    async createHttpStream(meta) {
      const res = await fetch("/api/lan/stream/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: meta.fileName,
          totalSize: meta.totalSize,
          mimeType: meta.mimeType || "application/octet-stream",
        }),
      });
      if (!res.ok) {
        throw new Error(`LAN HTTP pipe create failed (${res.status})`);
      }
      return res.json(); // { streamId, token }
    }

    uploadToHttpStream(file, streamId, token, options = {}) {
      const onProgress = options.onProgress || (() => {});
      const onAbortRef = options.onAbortRef || (() => {});
      const startMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      let peakSpeedBps = 0;

      return new Promise((resolve, reject) => {
        const xhr = new globalScope.XMLHttpRequest();
        xhr.open(
          "PUT",
          `/api/lan/stream/${encodeURIComponent(streamId)}?token=${encodeURIComponent(token)}`,
          true
        );
        xhr.setRequestHeader("Content-Type", "application/octet-stream");

        onAbortRef(() => {
          try {
            xhr.abort();
          } catch (_e) {}
        });

        let lastUiMs = startMs;
        xhr.upload.onprogress = (ev) => {
          const now = typeof performance !== "undefined" ? performance.now() : Date.now();
          if (now - lastUiMs < UI_PROGRESS_INTERVAL_MS && ev.loaded < ev.total) return;
          lastUiMs = now;
          const elapsedSec = Math.max((now - startMs) / 1000, 0.001);
          const speedBps = ev.loaded / elapsedSec;
          if (speedBps > peakSpeedBps) peakSpeedBps = speedBps;
          const total = ev.total || file.size || 1;
          onProgress({
            sentBytes: ev.loaded,
            totalBytes: total,
            pct: Math.min(100, (ev.loaded / total) * 100),
            speedBps,
            peakSpeedBps,
            etaSec: speedBps > 0 ? Math.max(0, total - ev.loaded) / speedBps : 0,
          });
        };

        xhr.onload = () => {
          const endMs = typeof performance !== "undefined" ? performance.now() : Date.now();
          const elapsedSec = Math.max((endMs - startMs) / 1000, 0.001);
          if (xhr.status >= 200 && xhr.status < 300) {
            let parsed = {};
            try {
              parsed = JSON.parse(xhr.responseText || "{}");
            } catch (_e) {}
            const avgSpeedBps = (file.size || 0) / elapsedSec;
            if (avgSpeedBps > peakSpeedBps) peakSpeedBps = avgSpeedBps;
            resolve({
              elapsedSec,
              avgSpeedBps,
              peakSpeedBps,
              bytes: parsed.bytes || file.size || 0,
            });
          } else {
            reject(new Error(`LAN HTTP upload failed (${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error("LAN HTTP stream connection error"));
        xhr.onabort = () => resolve({ cancelled: true, elapsedSec: 0, avgSpeedBps: 0, peakSpeedBps: 0 });
        xhr.send(file);
      });
    }

    async downloadFromHttpStream(streamId, token, options = {}) {
      const totalSize = options.totalSize || 0;
      const mimeType = options.mimeType || "application/octet-stream";
      const onProgress = options.onProgress || (() => {});
      const controller = new AbortController();
      if (typeof options.onAbortRef === "function") {
        options.onAbortRef(() => controller.abort());
      }

      const startMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const res = await fetch(
        `/api/lan/stream/${encodeURIComponent(streamId)}?token=${encodeURIComponent(token)}`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        throw new Error(`LAN HTTP stream download failed (${res.status})`);
      }

      const chunks = [];
      let receivedBytes = 0;
      let checksum = FNV_OFFSET_BASIS;
      let lastUiMs = startMs;
      let peakSpeedBps = 0;

      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && value.byteLength > 0) {
            chunks.push(value);
            checksum = fnv1aUpdate(checksum, value);
            receivedBytes += value.byteLength;

            const now = typeof performance !== "undefined" ? performance.now() : Date.now();
            if (now - lastUiMs >= UI_PROGRESS_INTERVAL_MS) {
              lastUiMs = now;
              const elapsedSec = Math.max((now - startMs) / 1000, 0.001);
              const speedBps = receivedBytes / elapsedSec;
              if (speedBps > peakSpeedBps) peakSpeedBps = speedBps;
              onProgress({
                receivedBytes,
                totalBytes: totalSize || receivedBytes,
                pct: totalSize ? Math.min(100, (receivedBytes / totalSize) * 100) : 50,
                speedBps,
                peakSpeedBps,
                etaSec: speedBps > 0 && totalSize ? Math.max(0, totalSize - receivedBytes) / speedBps : 0,
              });
            }
          }
        }
      } else {
        const buf = await res.arrayBuffer();
        const u8 = new Uint8Array(buf);
        chunks.push(u8);
        checksum = fnv1aUpdate(checksum, u8);
        receivedBytes = u8.byteLength;
      }

      const endMs = typeof performance !== "undefined" ? performance.now() : Date.now();
      const elapsedSec = Math.max((endMs - startMs) / 1000, 0.001);
      const avgSpeedBps = receivedBytes / elapsedSec;
      if (avgSpeedBps > peakSpeedBps) peakSpeedBps = avgSpeedBps;

      return {
        blob: new Blob(chunks, { type: mimeType }),
        receivedBytes,
        checksum: checksum >>> 0,
        elapsedSec,
        avgSpeedBps,
        peakSpeedBps,
      };
    }
  }

  return {
    FRAME_MAGIC,
    BENCH_MAGIC,
    FRAME_HEADER_SIZE,
    FNV_OFFSET_BASIS,
    DEFAULT_DESKTOP_LANES,
    DEFAULT_MOBILE_LANES,
    MAX_LANES,
    fnv1aUpdate,
    encodeChunkFrame,
    encodeChunkFrameFromSlab,
    makeBenchFrame,
    decodeFrameHeader,
    createFastYield,
    isPrivateOrLocalAddress,
    isHostCandidateLine,
    classifyCandidatePair,
    inspectPeerConnectionPath,
    formatThroughput,
    waitForLaneDrain,
    createChunkWorkSource,
    LanTurboPeerSession,
    LanServerTransport,
  };
});
