// Comprehensive test suite for LocalShare v2.2 Direct LAN Turbo Engine & Optional LAN Server.
// Run: node tests/lan-turbo.cjs (also included in `npm test`)

"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const LanTurbo = require("../lan-turbo.js");
const { createLanServer } = require("../server.cjs");

const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - start });
    console.log(`PASS — ${name} (${Date.now() - start}ms)`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.error(`FAIL — ${name}`);
    console.error("  ", err && err.stack ? err.stack : err);
  }
}

// Helper: Blob/File-like wrapper for Node Uint8Array buffers
function makeMockFile(bytes, name = "test.bin", type = "application/octet-stream") {
  return {
    name,
    size: bytes.byteLength,
    type,
    slice(start, end) {
      const sub = bytes.subarray(start, end);
      return {
        async arrayBuffer() {
          const copy = new Uint8Array(sub.byteLength);
          copy.set(sub);
          return copy.buffer;
        },
      };
    },
  };
}

// Helper: In-memory pair of mocked RTCPeerConnections with simulated backpressure & candidate filtering
function createMockRtcFactory(options = {}) {
  const createdConfigs = [];
  const allChannels = [];
  const failHostOnly = Boolean(options.failHostOnly);
  const simulateBackpressure = Boolean(options.simulateBackpressure);
  const sctpMaxMessageSize = options.sctpMaxMessageSize || 262144;

  // Pair connections by offer SDP tag
  const waitingOffers = new Map();

  class MockDataChannel {
    constructor(label, init = {}) {
      this.label = label;
      this.ordered = init.ordered !== false;
      this.binaryType = "arraybuffer";
      this.readyState = "connecting";
      this.bufferedAmount = 0;
      this.bufferedAmountLowThreshold = 0;
      this.peerChannel = null;
      this.sentCount = 0;
      this.sentBytes = 0;
      this.failAfterSends = Infinity;
      this._listeners = {};
      allChannels.push(this);
    }
    addEventListener(ev, cb) {
      (this._listeners[ev] ||= []).push(cb);
    }
    removeEventListener(ev, cb) {
      if (!this._listeners[ev]) return;
      this._listeners[ev] = this._listeners[ev].filter((fn) => fn !== cb);
    }
    _emit(ev, payload) {
      const prop = this["on" + ev];
      if (typeof prop === "function") prop(payload);
      (this._listeners[ev] || []).slice().forEach((fn) => fn(payload));
    }
    send(data) {
      if (this.readyState !== "open") {
        throw new Error("DataChannel not open");
      }
      if (this.sentCount >= this.failAfterSends) {
        this.readyState = "closed";
        throw new Error("Simulated lane failure");
      }
      const bytes = data.byteLength || 0;
      this.sentCount += 1;
      this.sentBytes += bytes;

      if (simulateBackpressure) {
        this.bufferedAmount += bytes;
        const drainDelay = this.bufferedAmount >= 4 * 1024 * 1024 ? 2 : 0;
        setTimeout(() => {
          const prev = this.bufferedAmount;
          this.bufferedAmount = Math.max(0, this.bufferedAmount - bytes);
          if (prev > this.bufferedAmountLowThreshold && this.bufferedAmount <= this.bufferedAmountLowThreshold) {
            this._emit("bufferedamountlow");
          }
        }, drainDelay);
      }

      // Deliver asynchronously (and slightly out-of-order across channels) to remote channel
      const target = this.peerChannel;
      if (target && target.readyState === "open") {
        const copy = data instanceof ArrayBuffer ? data.slice(0) : data;
        setImmediate(() => {
          if (target.readyState === "open") {
            target._emit("message", { data: copy });
          }
        });
      }
    }
    close() {
      if (this.readyState === "closed") return;
      this.readyState = "closed";
      this._emit("close");
    }
  }

  class MockRTCPeerConnection {
    constructor(config = {}) {
      this.config = config;
      createdConfigs.push(config);
      this.iceConnectionState = "new";
      this.connectionState = "new";
      this.localDescription = null;
      this.remoteDescription = null;
      this.sctp = { maxMessageSize: sctpMaxMessageSize };
      this._localDc = null;
      this._offerId = null;
      this._peerPc = null;
      this._closed = false;
    }
    createDataChannel(label, init) {
      const dc = new MockDataChannel(label, init);
      this._localDc = dc;
      return dc;
    }
    async createOffer() {
      const id = `offer-${Math.random().toString(36).slice(2)}`;
      this._offerId = id;
      waitingOffers.set(id, this);
      return { type: "offer", sdp: `v=0\r\n//${id}\r\n` };
    }
    async setLocalDescription(desc) {
      this.localDescription = desc;
      // Emit BOTH a host candidate and a srflx candidate to verify strict host-only filtering!
      setTimeout(() => {
        if (this._closed) return;
        this.onicecandidate?.({
          candidate: {
            candidate: "candidate:1 1 udp 2122260223 192.168.1.42 54321 typ host",
            sdpMid: "0",
            sdpMLineIndex: 0,
          },
        });
        this.onicecandidate?.({
          candidate: {
            candidate: "candidate:2 1 udp 1686052607 203.0.113.5 54321 typ srflx raddr 192.168.1.42 rport 54321",
            sdpMid: "0",
            sdpMLineIndex: 0,
          },
        });
      }, 5);
    }
    async setRemoteDescription(desc) {
      this.remoteDescription = desc;
      const match = /\/\/(offer-[a-z0-9]+)/.exec(desc.sdp || "");
      if (match && waitingOffers.has(match[1])) {
        const offerer = waitingOffers.get(match[1]);
        this._peerPc = offerer;
        offerer._peerPc = this;
      }
    }
    async createAnswer() {
      return { type: "answer", sdp: `v=0\r\n//answer-${this._peerPc?._offerId || ""}\r\n` };
    }
    async addIceCandidate(_cand) {
      const isHostOnly = Array.isArray(this.config.iceServers) && this.config.iceServers.length === 0;
      if (failHostOnly && isHostOnly) {
        setTimeout(() => {
          if (this._closed) return;
          this.iceConnectionState = "failed";
          this.connectionState = "failed";
          this.oniceconnectionstatechange?.();
          this.onconnectionstatechange?.();
        }, 15);
        return;
      }

      // Connect pair once both sides have descriptions
      const peerPc = this._peerPc;
      if (peerPc && this._localDc && !peerPc._remoteChannelDelivered && !this._closed && !peerPc._closed) {
        peerPc._remoteChannelDelivered = true;
        const remoteDc = new MockDataChannel(this._localDc.label, { ordered: this._localDc.ordered });
        this._localDc.peerChannel = remoteDc;
        remoteDc.peerChannel = this._localDc;

        setTimeout(() => {
          if (this._closed || peerPc._closed) return;
          this.iceConnectionState = "connected";
          this.connectionState = "connected";
          peerPc.iceConnectionState = "connected";
          peerPc.connectionState = "connected";

          peerPc.ondatachannel?.({ channel: remoteDc });
          this._localDc.readyState = "open";
          remoteDc.readyState = "open";
          this._localDc._emit("open");
          remoteDc._emit("open");
        }, 10);
      }
    }
    async getStats() {
      const isHostOnly = Array.isArray(this.config.iceServers) && this.config.iceServers.length === 0;
      const reports = new Map();
      reports.set("lc1", {
        id: "lc1",
        type: "local-candidate",
        candidateType: isHostOnly ? "host" : "srflx",
        address: isHostOnly ? "192.168.1.42" : "203.0.113.5",
        protocol: "udp",
      });
      reports.set("rc1", {
        id: "rc1",
        type: "remote-candidate",
        candidateType: isHostOnly ? "host" : "srflx",
        address: isHostOnly ? "192.168.1.99" : "198.51.100.8",
        protocol: "udp",
      });
      reports.set("cp1", {
        id: "cp1",
        type: "candidate-pair",
        state: "succeeded",
        nominated: true,
        localCandidateId: "lc1",
        remoteCandidateId: "rc1",
        currentRoundTripTime: isHostOnly ? 0.0014 : 0.038,
      });
      reports.set("t1", {
        id: "t1",
        type: "transport",
        selectedCandidatePairId: "cp1",
      });
      return reports;
    }
    close() {
      this._closed = true;
      this.iceConnectionState = "closed";
      this.connectionState = "closed";
    }
  }

  return { MockRTCPeerConnection, createdConfigs, allChannels };
}

function httpRequest(options, bodyBuf = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", reject);
    if (bodyBuf) req.end(bodyBuf);
    else req.end();
  });
}

async function runAll() {
  // ─── 1. Binary Framing & Zero-Copy Decoding ───
  await test("Binary LST2 framing encodes/decodes with zero-copy payload view", () => {
    const slab = new Uint8Array(2048);
    for (let i = 0; i < slab.length; i++) slab[i] = (i * 17 + 3) & 0xff;

    const frameBuf = LanTurbo.encodeChunkFrameFromSlab(0xdeadbeef, 42, slab, 500, 1500);
    assert.equal(frameBuf.byteLength, 12 + 1000);

    const decoded = LanTurbo.decodeFrameHeader(frameBuf);
    assert.ok(decoded);
    assert.equal(decoded.kind, "chunk");
    assert.equal(decoded.transferId, 0xdeadbeef);
    assert.equal(decoded.chunkIndex, 42);
    assert.equal(decoded.payload.byteLength, 1000);
    assert.equal(decoded.payload.buffer, frameBuf, "payload must be zero-copy subarray of received ArrayBuffer");
    assert.deepEqual(Array.from(decoded.payload), Array.from(slab.subarray(500, 1500)));

    // Benchmark frame
    const bench = LanTurbo.makeBenchFrame(777, 4096);
    const decodedBench = LanTurbo.decodeFrameHeader(bench.buffer);
    assert.equal(decodedBench.kind, "bench");
    assert.equal(decodedBench.benchId, 777);
    assert.equal(decodedBench.payloadBytes, 4096);

    // Invalid / short frame
    assert.equal(LanTurbo.decodeFrameHeader(new ArrayBuffer(8)), null);
    assert.equal(LanTurbo.decodeFrameHeader(new Uint8Array(32).buffer), null);
  });

  // ─── 2. Single-Pass Streaming FNV-1a Checksum ───
  await test("Read-ahead slabber computes exact single-pass streaming FNV-1a checksum across 5.5 MB", async () => {
    const raw = crypto.randomBytes(5.5 * 1024 * 1024 + 137);
    const u8 = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
    const expectedHash = LanTurbo.fnv1aUpdate(LanTurbo.FNV_OFFSET_BASIS, u8);

    const file = makeMockFile(u8);
    const chunkSize = 131060; // ~128KB - 12B
    const source = LanTurbo.createChunkWorkSource(file, 99, chunkSize, 2 * 1024 * 1024);

    const reassembled = new Uint8Array(u8.byteLength);
    let count = 0;
    while (true) {
      const job = await source.next();
      if (!job) break;
      const decoded = LanTurbo.decodeFrameHeader(job.frameBuffer);
      reassembled.set(decoded.payload, decoded.chunkIndex * chunkSize);
      count++;
    }

    assert.equal(count, source.totalChunks);
    assert.equal(source.getChecksum(), expectedHash);
    assert.equal(Buffer.compare(Buffer.from(reassembled), raw), 0);
  });

  // ─── 3. ICE Candidate & LAN Path Classifier ───
  await test("ICE candidate classifier accurately distinguishes LAN Direct vs WAN P2P vs Relayed", async () => {
    assert.equal(LanTurbo.isPrivateOrLocalAddress("192.168.1.42"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("10.0.0.15"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("172.16.4.1"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("172.31.255.254"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("169.254.12.34"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("fe80::1234:5678"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("fd12:3456::1"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("::ffff:192.168.0.5"), true);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("a1b2c3d4-e5f6.local"), true);

    assert.equal(LanTurbo.isPrivateOrLocalAddress("8.8.8.8"), false);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("172.32.0.1"), false);
    assert.equal(LanTurbo.isPrivateOrLocalAddress("203.0.113.10"), false);

    assert.equal(LanTurbo.isHostCandidateLine("candidate:1 1 udp 2122260223 192.168.1.42 54321 typ host"), true);
    assert.equal(LanTurbo.isHostCandidateLine("candidate:2 1 udp 1686052607 203.0.113.5 54321 typ srflx"), false);
    assert.equal(LanTurbo.isHostCandidateLine("candidate:3 1 udp 41885439 198.51.100.2 3478 typ relay"), false);

    const lan = LanTurbo.classifyCandidatePair(
      { candidateType: "host", address: "192.168.1.10", protocol: "udp" },
      { candidateType: "host", address: "192.168.1.20", protocol: "udp" },
      1.2
    );
    assert.equal(lan.transport, "lan-direct");
    assert.equal(lan.isLan, true);

    const lanPrflx = LanTurbo.classifyCandidatePair(
      { candidateType: "host", address: "a1b2.local", protocol: "udp" },
      { candidateType: "prflx", address: "192.168.1.20", protocol: "udp" },
      2.1
    );
    assert.equal(lanPrflx.transport, "lan-direct");
    assert.equal(lanPrflx.isLan, true);

    const wan = LanTurbo.classifyCandidatePair(
      { candidateType: "srflx", address: "203.0.113.5", protocol: "udp" },
      { candidateType: "srflx", address: "198.51.100.8", protocol: "udp" },
      42
    );
    assert.equal(wan.transport, "wan-p2p");
    assert.equal(wan.isLan, false);

    const relay = LanTurbo.classifyCandidatePair(
      { candidateType: "relay", address: "198.51.100.2", protocol: "udp" },
      { candidateType: "srflx", address: "203.0.113.5", protocol: "udp" },
      65
    );
    assert.equal(relay.transport, "relayed");
    assert.equal(relay.isLan, false);
  });

  // ─── 4. End-to-End Multi-Lane Direct LAN Session + Parallel Striping + Backpressure ───
  await test("LanTurboPeerSession negotiates 4 host-only LAN lanes, filters non-host ICE, and transfers 6.3 MB losslessly", async () => {
    const rtc = createMockRtcFactory({ simulateBackpressure: true });
    const sentSignalsFromA = [];
    const receivedChunksB = new Map();

    let sessionA;
    let sessionB;

    sessionA = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-room-aaa",
      remotePeerId: "ls-room-bbb",
      desiredLanes: 4,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      sendSignal: (msg) => {
        sentSignalsFromA.push(msg);
        setImmediate(() => sessionB.handleSignalMessage(msg));
      },
    });

    sessionB = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-room-bbb",
      remotePeerId: "ls-room-aaa",
      desiredLanes: 4,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      sendSignal: (msg) => {
        setImmediate(() => sessionA.handleSignalMessage(msg));
      },
      onChunk: (frame) => {
        receivedChunksB.set(frame.chunkIndex, frame.payload);
      },
    });

    sessionA.start();
    sessionB.start();

    // Wait for all 4 parallel host-only LAN lanes to open
    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 3000;
      const check = () => {
        if (sessionA.getOpenLanes().length === 4 && sessionB.getOpenLanes().length === 4) {
          resolve();
        } else if (Date.now() > deadline) {
          reject(new Error(`Expected 4 open lanes, got A=${sessionA.getOpenLanes().length} B=${sessionB.getOpenLanes().length}`));
        } else {
          setTimeout(check, 20);
        }
      };
      check();
    });

    assert.equal(sessionA.state, "lan-direct");
    assert.equal(sessionB.state, "lan-direct");
    assert.equal(sessionA.getStatusSnapshot().isLanDirect, true);

    // Confirm EVERY RTCPeerConnection used strict host-only iceServers: []
    assert.ok(rtc.createdConfigs.length >= 8);
    for (const cfg of rtc.createdConfigs) {
      assert.deepEqual(cfg.iceServers, []);
    }

    // Confirm NO srflx candidate was ever leaked over signaling in strict LAN mode!
    const iceMsgs = sentSignalsFromA.filter((m) => m.type === "lan-turbo-ice");
    assert.ok(iceMsgs.length > 0);
    for (const m of iceMsgs) {
      assert.ok(LanTurbo.isHostCandidateLine(m.candidate.candidate), `Non-host ICE leaked: ${m.candidate.candidate}`);
    }

    // Transfer 6.3 MB file across all 4 parallel LAN lanes!
    const payload = crypto.randomBytes(6.3 * 1024 * 1024 + 511);
    const u8 = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
    const expectedHash = LanTurbo.fnv1aUpdate(LanTurbo.FNV_OFFSET_BASIS, u8);
    const file = makeMockFile(u8, "video.mp4");

    let chunkSizeUsed = 0;
    const result = await sessionA.sendFile(file, {
      transferId: 123456,
      onStart: ({ chunkSize }) => {
        chunkSizeUsed = chunkSize;
      },
    });

    // Wait briefly for in-flight setImmediate deliveries to complete
    await new Promise((resolve) => setTimeout(resolve, 40));

    assert.equal(result.checksum, expectedHash);
    assert.equal(result.lanesUsed, 4);
    assert.equal(receivedChunksB.size, result.totalChunks);

    // Verify all 4 initiator lanes actively sent chunks (parallel load striping!)
    const activeSenderLanes = sessionA.getOpenLanes().filter((l) => l.dc.sentCount > 0);
    assert.equal(activeSenderLanes.length, 4, "All 4 parallel LAN lanes must participate in transfer");

    // Reassemble & verify bit-for-bit integrity
    const out = new Uint8Array(u8.byteLength);
    for (const [idx, buf] of receivedChunksB.entries()) {
      out.set(buf, idx * chunkSizeUsed);
    }
    assert.equal(Buffer.compare(Buffer.from(out), payload), 0);

    // Run 1-Click LAN Speed Test on the same live 4-lane session!
    const bench = await sessionA.runSpeedTest({ durationMs: 250 });
    assert.ok(bench.bytes > 0);
    assert.equal(bench.verifiedByReceiver, true);
    assert.equal(bench.lanesUsed, 4);
    assert.equal(bench.isLanDirect, true);
    assert.ok(bench.formatted.mbs.length > 0 && bench.formatted.mbps.length > 0);

    sessionA.destroy();
    sessionB.destroy();
  });

  // ─── 5. Mid-Transfer Lane Drop & Automatic Work-Stealing Failover ───
  await test("Work-stealing sender survives 2 lanes crashing mid-transfer with 100% lossless delivery", async () => {
    const rtc = createMockRtcFactory({ simulateBackpressure: false });
    const receivedChunksB = new Map();

    let sessionA;
    let sessionB;

    sessionA = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-fail-a",
      remotePeerId: "ls-fail-b",
      desiredLanes: 4,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      sendSignal: (msg) => setImmediate(() => sessionB.handleSignalMessage(msg)),
    });
    sessionB = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-fail-b",
      remotePeerId: "ls-fail-a",
      desiredLanes: 4,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      sendSignal: (msg) => setImmediate(() => sessionA.handleSignalMessage(msg)),
      onChunk: (frame) => receivedChunksB.set(frame.chunkIndex, frame.payload),
    });

    sessionA.start();
    sessionB.start();

    await new Promise((resolve) => {
      const t = setInterval(() => {
        if (sessionA.getOpenLanes().length === 4 && sessionB.getOpenLanes().length === 4) {
          clearInterval(t);
          resolve();
        }
      }, 15);
    });

    // Rig Lane 0 and Lane 1 to crash after sending 2 chunks!
    sessionA.lanes.get(0).dc.failAfterSends = 2;
    sessionA.lanes.get(1).dc.failAfterSends = 2;

    const payload = crypto.randomBytes(3 * 1024 * 1024 + 99);
    const u8 = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
    let chunkSizeUsed = 0;

    const result = await sessionA.sendFile(makeMockFile(u8), {
      transferId: 55555,
      onStart: ({ chunkSize }) => {
        chunkSizeUsed = chunkSize;
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 40));

    assert.equal(receivedChunksB.size, result.totalChunks);
    const out = new Uint8Array(u8.byteLength);
    for (const [idx, buf] of receivedChunksB.entries()) {
      out.set(buf, idx * chunkSizeUsed);
    }
    assert.equal(Buffer.compare(Buffer.from(out), payload), 0);

    sessionA.destroy();
    sessionB.destroy();
  });

  // ─── 6. Strict LAN-Only Mode Blocks WAN Fallback ───
  await test("Strict LAN-Only Mode blocks STUN/WAN fallback when host-only LAN probe fails", async () => {
    const rtc = createMockRtcFactory({ failHostOnly: true });
    let sessionA;
    let sessionB;

    sessionA = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-strict-a",
      remotePeerId: "ls-strict-b",
      desiredLanes: 4,
      strictLanOnly: true,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      getIceServers: () => [{ urls: "stun:stun.l.google.com:19302" }],
      sendSignal: (msg) => setImmediate(() => sessionB.handleSignalMessage(msg)),
    });
    sessionB = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-strict-b",
      remotePeerId: "ls-strict-a",
      desiredLanes: 4,
      strictLanOnly: true,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      getIceServers: () => [{ urls: "stun:stun.l.google.com:19302" }],
      sendSignal: (msg) => setImmediate(() => sessionA.handleSignalMessage(msg)),
    });

    sessionA.start();
    sessionB.start();

    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 2000;
      const check = () => {
        if (sessionA.state === "lan-strict-blocked") resolve();
        else if (Date.now() > deadline) reject(new Error(`Expected lan-strict-blocked, got ${sessionA.state}`));
        else setTimeout(check, 20);
      };
      check();
    });

    // Confirm STUN iceServers were NEVER used
    for (const cfg of rtc.createdConfigs) {
      assert.deepEqual(cfg.iceServers, []);
    }

    sessionA.destroy();
    sessionB.destroy();
  });

  // ─── 6b. Graceful Adaptive Direct Raw Fallback (Non-Strict Mode when on Different Networks) ───
  await test("Non-strict mode gracefully falls back to direct raw P2P turbo lanes if host-only LAN fails", async () => {
    const rtc = createMockRtcFactory({ failHostOnly: true });
    let sessionA;
    let sessionB;

    sessionA = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-wan-a",
      remotePeerId: "ls-wan-b",
      desiredLanes: 4,
      strictLanOnly: false,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      getIceServers: () => [{ urls: "stun:stun.l.google.com:19302" }],
      sendSignal: (msg) => setImmediate(() => sessionB.handleSignalMessage(msg)),
    });
    sessionB = new LanTurbo.LanTurboPeerSession({
      localPeerId: "ls-wan-b",
      remotePeerId: "ls-wan-a",
      desiredLanes: 4,
      strictLanOnly: false,
      RTCPeerConnectionImpl: rtc.MockRTCPeerConnection,
      getIceServers: () => [{ urls: "stun:stun.l.google.com:19302" }],
      sendSignal: (msg) => setImmediate(() => sessionA.handleSignalMessage(msg)),
    });

    sessionA.start();
    sessionB.start();

    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 2500;
      const check = () => {
        if (sessionA.state === "wan-p2p" && sessionA.getOpenLanes().length === 2) resolve();
        else if (Date.now() > deadline) reject(new Error(`Expected wan-p2p with 2 lanes, got state=${sessionA.state} lanes=${sessionA.getOpenLanes().length}`));
        else setTimeout(check, 20);
      };
      check();
    });

    assert.equal(sessionA.getStatusSnapshot().isLanDirect, false);
    assert.equal(sessionA.getOpenLanes().length, 2, "WAN fallback caps at 2 raw turbo lanes");

    sessionA.destroy();
    sessionB.destroy();
  });

  // ─── 7. Local LAN Server (`server.cjs`): Static Injection, Security, SSE Signaling & Raw TCP/HTTP Pipe ───
  await test("Optional Local LAN Server (`server.cjs`) handles SSE discovery, local signaling & 4MB raw TCP/HTTP pipe (both arrival orders)", async () => {
    const instance = createLanServer({ host: "127.0.0.1", port: 0 });
    const addr = await instance.listen();
    const port = addr.port;

    try {
      // 7a. Static HTML injection + security blocklist
      const htmlRes = await httpRequest({ hostname: "127.0.0.1", port, path: "/", method: "GET" });
      assert.equal(htmlRes.status, 200);
      const html = htmlRes.body.toString("utf8");
      assert.ok(html.includes("window.LOCALSHARE_LAN_SERVER"), "index.html must inject LOCALSHARE_LAN_SERVER");
      assert.ok(html.includes('<script src="lan-turbo.js"></script>'));

      const forbiddenRes = await httpRequest({ hostname: "127.0.0.1", port, path: "/server.cjs", method: "GET" });
      assert.equal(forbiddenRes.status, 404, "server.cjs must NOT be served as static asset");

      const infoRes = await httpRequest({ hostname: "127.0.0.1", port, path: "/api/lan/info", method: "GET" });
      assert.equal(infoRes.status, 200);
      const info = JSON.parse(infoRes.body.toString("utf8"));
      assert.equal(info.ok, true);
      assert.equal(info.version, "2.2.0");

      // 7b. Offline LAN SSE Discovery + Signaling Relay
      const sseEventsA = [];
      const sseEventsB = [];
      const openSse = (peerId, name, outArr) =>
        new Promise((resolve) => {
          const req = http.get(
            {
              hostname: "127.0.0.1",
              port,
              path: `/api/lan/events?peerId=${encodeURIComponent(peerId)}&room=testlan&name=${encodeURIComponent(name)}&platform=laptop`,
            },
            (res) => {
              let buf = "";
              res.on("data", (chunk) => {
                buf += chunk.toString("utf8");
                const parts = buf.split("\n\n");
                buf = parts.pop();
                for (const part of parts) {
                  const evMatch = /^event:\s*(\S+)/m.exec(part);
                  const dataMatch = /^data:\s*(.+)$/m.exec(part);
                  if (evMatch && dataMatch) {
                    outArr.push({ event: evMatch[1], data: JSON.parse(dataMatch[1]) });
                  }
                }
              });
              resolve(req);
            }
          );
        });

      const sseA = await openSse("peer-lan-1", "Laptop A", sseEventsA);
      const sseB = await openSse("peer-lan-2", "Phone B", sseEventsB);
      await new Promise((r) => setTimeout(r, 80));

      const lastRosterA = sseEventsA.filter((e) => e.event === "roster").pop();
      assert.ok(lastRosterA && lastRosterA.data.peers.length === 2, "Both peers must appear in LAN SSE roster");

      // Relay local signal A -> B
      const sigBody = Buffer.from(JSON.stringify({ from: "peer-lan-1", to: "peer-lan-2", payload: { hello: "lan" } }));
      const sigRes = await httpRequest(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/lan/signal",
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": sigBody.length },
        },
        sigBody
      );
      assert.equal(sigRes.status, 200);
      await new Promise((r) => setTimeout(r, 60));

      const sigOnB = sseEventsB.find((e) => e.event === "signal");
      assert.ok(sigOnB);
      assert.equal(sigOnB.data.from, "peer-lan-1");
      assert.equal(sigOnB.data.payload.hello, "lan");

      sseA.destroy();
      sseB.destroy();

      // 7c. Direct LAN Raw TCP/HTTP Pipe — Order 1: PUT connects first, GET connects 40ms later
      const payload1 = crypto.randomBytes(4 * 1024 * 1024 + 333);
      const createBody = Buffer.from(JSON.stringify({ fileName: "movie.mkv", totalSize: payload1.length, mimeType: "video/x-matroska" }));
      const slotRes1 = await httpRequest(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/lan/stream/create",
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": createBody.length },
        },
        createBody
      );
      assert.equal(slotRes1.status, 201);
      const slot1 = JSON.parse(slotRes1.body.toString("utf8"));

      // Reject bad token
      const badTokenRes = await httpRequest({
        hostname: "127.0.0.1",
        port,
        path: `/api/lan/stream/${slot1.streamId}?token=deadbeef`,
        method: "GET",
      });
      assert.equal(badTokenRes.status, 403);

      const putPromise1 = httpRequest(
        {
          hostname: "127.0.0.1",
          port,
          path: `/api/lan/stream/${slot1.streamId}?token=${slot1.token}`,
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream", "Content-Length": payload1.length },
        },
        payload1
      );
      await new Promise((r) => setTimeout(r, 40));
      const getPromise1 = httpRequest({
        hostname: "127.0.0.1",
        port,
        path: `/api/lan/stream/${slot1.streamId}?token=${slot1.token}`,
        method: "GET",
      });

      const [putOut1, getOut1] = await Promise.all([putPromise1, getPromise1]);
      assert.equal(putOut1.status, 200);
      assert.equal(getOut1.status, 200);
      assert.equal(Buffer.compare(getOut1.body, payload1), 0, "PUT-first HTTP pipe must transfer bit-for-bit identically");

      // 7d. Direct LAN Raw TCP/HTTP Pipe — Order 2: GET connects first, PUT connects 40ms later
      const payload2 = crypto.randomBytes(2 * 1024 * 1024 + 77);
      const slotRes2 = await httpRequest(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/lan/stream/create",
          method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": createBody.length },
        },
        createBody
      );
      const slot2 = JSON.parse(slotRes2.body.toString("utf8"));

      const getPromise2 = httpRequest({
        hostname: "127.0.0.1",
        port,
        path: `/api/lan/stream/${slot2.streamId}?token=${slot2.token}`,
        method: "GET",
      });
      await new Promise((r) => setTimeout(r, 40));
      const putPromise2 = httpRequest(
        {
          hostname: "127.0.0.1",
          port,
          path: `/api/lan/stream/${slot2.streamId}?token=${slot2.token}`,
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream", "Content-Length": payload2.length },
        },
        payload2
      );

      const [putOut2, getOut2] = await Promise.all([putPromise2, getPromise2]);
      assert.equal(putOut2.status, 200);
      assert.equal(getOut2.status, 200);
      assert.equal(Buffer.compare(getOut2.body, payload2), 0, "GET-first HTTP pipe must transfer bit-for-bit identically");
    } finally {
      await instance.close();
    }
  });

  // ─── 8. Combined `lan-turbo.js` + `index.js` Browser Init Smoke Test ───
  await test("index.js initializes cleanly with LocalShareLanTurbo loaded (static & LAN server modes)", async () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");
    const listeners = {};
    const stubEl = () => ({
      style: { setProperty: () => {} },
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => true },
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      appendChild: () => {},
      querySelectorAll: () => [],
      textContent: "",
      innerHTML: "",
      value: "",
      checked: false,
    });

    globalThis.document = {
      addEventListener: (ev, cb) => { (listeners[ev] ||= []).push(cb); },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => stubEl(),
      documentElement: { style: { setProperty: () => {} } },
      head: { appendChild: () => {} },
      body: stubEl(),
    };
    globalThis.window = {
      location: { origin: "http://192.168.1.42:3000", pathname: "/", hostname: "192.168.1.42", hash: "", search: "", host: "192.168.1.42:3000" },
      history: { replaceState: () => {} },
      LOCALSHARE_CONFIG: {},
      LOCALSHARE_LAN_SERVER: { enabled: true, version: "2.2.0", lanIps: ["192.168.1.42"], port: 3000, httpPipeEnabled: true, localSignalingEnabled: true },
      LocalShareLanTurbo: LanTurbo,
      crypto: undefined,
    };
    globalThis.localStorage = { getItem: () => null, setItem: () => {} };
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: "localshare-lan-test" },
      configurable: true,
    });
    globalThis.fetch = () => Promise.reject(new Error("offline"));
    globalThis.Peer = class PeerStub {
      constructor() {
        throw new Error("offline peer stub");
      }
    };

    eval(src);
    assert.equal((listeners["DOMContentLoaded"] || []).length, 1);
    listeners["DOMContentLoaded"][0]();
    await new Promise((r) => setTimeout(r, 150));
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\nLAN TURBO TEST SUMMARY: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

runAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
