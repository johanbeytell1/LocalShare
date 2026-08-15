document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════
  // DOM Elements
  // ═══════════════════════════════════════════
  const $ = (id) => document.getElementById(id);

  const toastContainer = $("toast-container");
  const statusEl = $("status");
  const peerList = $("peer-list");
  const nearbyList = $("nearby-list");
  const fileInput = $("file-input");
  const fileListUi = $("file-list");
  const selectedCount = $("selected-count");
  const selectedFilesSection = $("selected-files-section");
  const sendButton = $("send-button");
  const sendProgressList = $("send-progress-list");
  const receivedFiles = $("received-files");
  const transfersSection = $("transfers-section");
  const outgoingCard = $("outgoing-card");
  const receivedCard = $("received-card");
  const peerIdInput = $("peer-id-input");
  const connectButton = $("connect-button");
  const qrCodeCanvas = $("peer-id-qr-code");
  const qrCodeContainer = $("qr-code-container");
  const handshakeModal = $("handshake-modal");
  const handshakeMessage = $("handshake-message");
  const handshakeAccept = $("handshake-accept");
  const handshakeReject = $("handshake-reject");
  const chatMessages = $("chat-messages");
  const chatInput = $("chat-input");
  const chatSend = $("chat-send");
  const chatPresence = $("chat-presence");
  const connectionCount = $("connection-count");
  const networkDot = $("network-dot");
  const networkLabel = $("network-label");
  const deviceStatusDot = $("device-status-dot");
  const dropZone = $("drop-zone");
  const clearFilesBtn = $("clear-files-btn");
  const rescanBtn = $("rescan-btn");

  // ═══════════════════════════════════════════
  // Random Primary Color
  // ═══════════════════════════════════════════
  const LS_PRIMARY_COLOR = (() => {
    const h = Math.floor(Math.random() * 360);
    const s = 88 + Math.random() * 12;
    const l = 56 + Math.random() * 10;

    const hslToHex = (h, s, l) => {
      s /= 100;
      l /= 100;

      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);

      const f = (n) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

      const toHex = (x) =>
        Math.round(255 * x)
          .toString(16)
          .padStart(2, "0");

      return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
    };

    return hslToHex(h, s, l);
  })();

  try {
    document.documentElement.style.setProperty(
      "--color-primary",
      LS_PRIMARY_COLOR,
    );

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = LS_PRIMARY_COLOR;
  } catch (err) {
    console.warn("Could not apply random primary color:", err);
  }

  // ═══════════════════════════════════════════
  // Custom Icon Engine
  // ═══════════════════════════════════════════
  const LS_ICON_MAP = {
    "bi-lightning-charge-fill": "bolt",
    "bi-github": "github",
    "bi-cpu": "cpu",
    "bi-radar": "radar",
    "bi-link-45deg": "link",
    "bi-plug": "plug",
    "bi-arrow-clockwise": "refresh",
    "bi-cloud-arrow-up": "cloud-up",
    "bi-send-fill": "send",
    "bi-send": "send",
    "bi-box-arrow-up": "upload",
    "bi-box-arrow-in-down": "download-box",
    "bi-people": "users",
    "bi-person-plus": "users",
    "bi-chat-dots": "chat",
    "bi-clipboard": "copy",
    "bi-copy": "copy",
    "bi-laptop": "laptop",
    "bi-x-lg": "close",
    "bi-x": "close",
    "bi-trash": "trash",
    "bi-download": "download",
    "bi-hourglass-split": "hourglass",
    "bi-check-circle": "check",
    "bi-check2": "check",
    "bi-info-circle": "info",
    "bi-exclamation-triangle": "warning",
    "bi-exclamation-circle": "error",
    "bi-file-earmark": "file",
    "bi-file-earmark-text": "file-text",
    "bi-file-earmark-pdf": "file-pdf",
    "bi-file-earmark-word": "file-doc",
    "bi-file-earmark-excel": "file-sheet",
    "bi-file-earmark-spreadsheet": "file-sheet",
    "bi-file-earmark-ppt": "file-slides",
    "bi-file-earmark-image": "file-image",
    "bi-file-earmark-music": "file-audio",
    "bi-file-earmark-play": "file-video",
    "bi-file-earmark-zip": "file-archive",
    "bi-file-earmark-code": "file-code",
    "bi-android": "file-app",
    "bi-windows": "file-app",
    "bi-apple": "file-app",
  };

  function upgradeIconElement(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute("data-ls-icon-upgraded")) return;

    const customIcon = el.getAttribute("data-ls-icon");
    const bootstrapClass = Array.from(el.classList || []).find(
      (cls) => LS_ICON_MAP[cls],
    );

    const iconName =
      customIcon || (bootstrapClass ? LS_ICON_MAP[bootstrapClass] : null);

    if (!iconName) return;
    if (!document.getElementById(`lsi-${iconName}`)) return;

    const cleanClass = (typeof el.className === "string" ? el.className : "")
      .replace(/\bbi\b|\bbi-[\w-]+/g, "")
      .trim();

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `ls-icon ${cleanClass}`.trim());
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("data-ls-icon-upgraded", "true");

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#lsi-${iconName}`);
    use.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      `#lsi-${iconName}`,
    );

    svg.appendChild(use);

    for (const attr of el.attributes) {
      if (attr.name === "class" || attr.name === "data-ls-icon") continue;
      svg.setAttribute(attr.name, attr.value);
    }

    el.replaceWith(svg);
  }

  function upgradeIcons(root = document) {
    root.querySelectorAll("i.bi, [data-ls-icon]").forEach(upgradeIconElement);
  }

  const iconObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;

        if (node.matches && node.matches("i.bi, [data-ls-icon]")) {
          upgradeIconElement(node);
        }

        if (node.querySelectorAll) {
          upgradeIcons(node);
        }
      });
    }
  });

  if (document.body) {
    iconObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    upgradeIcons();
  }

  // ═══════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════
  const adjectives = [
    "Sparkly",
    "Fluffy",
    "Happy",
    "Brave",
    "Clever",
    "Witty",
    "Sunny",
    "Cozy",
    "Gentle",
    "Lucky",
    "Swift",
    "Cosmic",
    "Neon",
    "Turbo",
    "Pixel",
    "Cyber",
    "Crystal",
    "Golden",
    "Silver",
    "Velvet",
    "Mighty",
    "Tiny",
    "Frosty",
    "Blazing",
    "Quantum",
    "Stellar",
    "Lunar",
    "Solar",
    "Misty",
    "Thunder",
    "Shadow",
    "Bright",
    "Coral",
    "Amber",
    "Indigo",
    "Violet",
    "Scarlet",
    "Azure",
    "Emerald",
    "Ruby",
    "Phantom",
    "Mystic",
    "Atomic",
    "Electric",
    "Radiant",
    "Zen",
    "Epic",
    "Nova",
  ];

  const nouns = [
    "Panda",
    "Unicorn",
    "Kitten",
    "Puppy",
    "Fox",
    "Badger",
    "Sparrow",
    "Dolphin",
    "Otter",
    "Rabbit",
    "Phoenix",
    "Dragon",
    "Falcon",
    "Tiger",
    "Wolf",
    "Eagle",
    "Koala",
    "Lynx",
    "Penguin",
    "Hedgehog",
    "Chameleon",
    "Flamingo",
    "Orca",
    "Cheetah",
    "Raven",
    "Stallion",
    "Jaguar",
    "Narwhal",
    "Platypus",
    "Axolotl",
    "Mantis",
    "Gecko",
    "Toucan",
    "Bison",
    "Mongoose",
    "Puffin",
    "Salamander",
    "Wombat",
    "Ferret",
    "Lemur",
    "Crane",
    "Viper",
    "Falcon",
    "Bobcat",
    "Macaw",
    "Seal",
    "Ibex",
    "Zephyr",
  ];

  const nameEmojis = [
    "🚀",
    "⚡",
    "🌟",
    "🔥",
    "💎",
    "🎯",
    "🌊",
    "🦊",
    "🐺",
    "🦅",
    "🌙",
    "☀️",
    "🎨",
    "🎵",
    "🍀",
    "🌈",
  ];

  function generateCuteName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const emoji = nameEmojis[Math.floor(Math.random() * nameEmojis.length)];

    return `${emoji} ${adj} ${noun} ${num}`;
  }

  let localPeerName = generateCuteName();
  let peer = null;

  const connections = {};
  let selectedFiles = [];

  const incomingTransfers = {};

  let nearbyRoomId = "local";
  let nearbyScanTimer = null;

  const appConfig = window.LOCALSHARE_CONFIG || {};
  const REGISTRY_HEARTBEAT_MS = 4000;

  let roomHostPeer = null;
  let isRoomHost = false;
  let registryConn = null;

  const roomPeers = {};
  const roomPeerConns = {};

  let isTransitioningDiscovery = false;

  // Transfer settings
  const ENABLE_FILE_CHECKSUM = true;
  const FILE_CHUNK_SIZE = 256 * 1024; // 256KB
  const MAX_BUFFERED_AMOUNT = 1024 * 1024; // 1MB

  // ═══════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message, type = "info", duration = 3500) {
    const safeMessage = escapeHtml(message);

    if (!toastContainer) {
      console.log(`[LocalShare:${type}]`, message);
      return;
    }

    const icons = {
      info: "bi-info-circle",
      success: "bi-check-circle",
      error: "bi-exclamation-triangle",
      warning: "bi-exclamation-circle",
    };

    const colors = {
      info: "border-primary/30 text-primary",
      success: "border-accent/30 text-accent",
      error: "border-red-400/30 text-red-400",
      warning: "border-secondary/30 text-secondary",
    };

    const toast = document.createElement("div");
    toast.className = `toast-item ${colors[type] || colors.info}`;
    toast.innerHTML = `
            <i class="bi ${icons[type] || icons.info}"></i>
            <span>${safeMessage}</span>
        `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const dm = 1;
    const sizes = ["B", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function formatSpeed(bytesPerSec) {
    if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return "";

    if (bytesPerSec < 1024) {
      return `${Math.round(bytesPerSec)} B/s`;
    }

    if (bytesPerSec < 1024 * 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }

    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
  }

  function getFileIcon(fileName) {
    const ext = String(fileName || "")
      .split(".")
      .pop()
      .toLowerCase();

    const map = {
      pdf: "bi-file-earmark-pdf",
      doc: "bi-file-earmark-word",
      docx: "bi-file-earmark-word",
      xls: "bi-file-earmark-excel",
      xlsx: "bi-file-earmark-excel",
      csv: "bi-file-earmark-spreadsheet",
      ppt: "bi-file-earmark-ppt",
      pptx: "bi-file-earmark-ppt",
      jpg: "bi-file-earmark-image",
      jpeg: "bi-file-earmark-image",
      png: "bi-file-earmark-image",
      gif: "bi-file-earmark-image",
      svg: "bi-file-earmark-image",
      webp: "bi-file-earmark-image",
      mp3: "bi-file-earmark-music",
      wav: "bi-file-earmark-music",
      flac: "bi-file-earmark-music",
      aac: "bi-file-earmark-music",
      ogg: "bi-file-earmark-music",
      mp4: "bi-file-earmark-play",
      mkv: "bi-file-earmark-play",
      avi: "bi-file-earmark-play",
      mov: "bi-file-earmark-play",
      webm: "bi-file-earmark-play",
      zip: "bi-file-earmark-zip",
      rar: "bi-file-earmark-zip",
      "7z": "bi-file-earmark-zip",
      tar: "bi-file-earmark-zip",
      gz: "bi-file-earmark-zip",
      js: "bi-file-earmark-code",
      ts: "bi-file-earmark-code",
      py: "bi-file-earmark-code",
      html: "bi-file-earmark-code",
      css: "bi-file-earmark-code",
      json: "bi-file-earmark-code",
      apk: "bi-android",
      exe: "bi-windows",
      dmg: "bi-apple",
      txt: "bi-file-earmark-text",
      md: "bi-file-earmark-text",
    };

    return map[ext] || "bi-file-earmark";
  }

  function updateTransferVisibility() {
    if (
      !sendProgressList ||
      !receivedFiles ||
      !outgoingCard ||
      !receivedCard ||
      !transfersSection
    ) {
      return;
    }

    const hasOutgoing = sendProgressList.children.length > 0;
    const hasReceived = receivedFiles.children.length > 0;

    outgoingCard.classList.toggle("hidden", !hasOutgoing);
    receivedCard.classList.toggle("hidden", !hasReceived);
    transfersSection.classList.toggle("hidden", !hasOutgoing && !hasReceived);
  }

  // ═══════════════════════════════════════════
  // Robust Transfer Helpers
  // ═══════════════════════════════════════════
  async function lsReadBlobAsArrayBuffer(blob) {
    if (typeof blob.arrayBuffer === "function") {
      return blob.arrayBuffer();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(reader.error || new Error("File read failed"));

      reader.readAsArrayBuffer(blob);
    });
  }

  function lsToUint8Array(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);

    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }

    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }

    return new Uint8Array(0);
  }

  function lsFnv1aUpdate(hash, u8) {
    hash = hash >>> 0;

    for (let i = 0; i < u8.length; i++) {
      hash ^= u8[i];
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }

    return hash >>> 0;
  }

  async function lsComputeFileChecksum(file) {
    let hash = 0x811c9dc5;
    let offset = 0;

    const step = 1024 * 1024;

    while (offset < file.size) {
      const end = Math.min(offset + step, file.size);
      const buffer = await lsReadBlobAsArrayBuffer(file.slice(offset, end));

      hash = lsFnv1aUpdate(hash, new Uint8Array(buffer));

      offset = end;
    }

    return hash >>> 0;
  }

  function lsGenerateTransferId() {
    try {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);

      const id = arr[0] >>> 0;
      if (id !== 0) return id;
    } catch (_err) {
      // Ignore and fallback
    }

    return (Math.floor(Math.random() * 0xffffffff) + 1) >>> 0;
  }

  function lsMakeRawChunkFrame(transferId, chunkIndex, payload) {
    const frame = new Uint8Array(8 + payload.byteLength);
    const view = new DataView(frame.buffer);

    view.setUint32(0, transferId >>> 0, true);
    view.setUint32(4, chunkIndex >>> 0, true);

    frame.set(payload, 8);

    return frame;
  }

  function lsUint8ArrayToBase64(u8) {
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < u8.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunkSize));
    }

    return btoa(binary);
  }

  function lsBase64ToUint8Array(base64) {
    const binary = atob(base64);
    const u8 = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      u8[i] = binary.charCodeAt(i);
    }

    return u8;
  }

  function getLegacyTransferKey(peerId, fileName) {
    return `${peerId}:${fileName}`;
  }

  function handleRawTransferChunk(data, _peerId) {
    const u8 = lsToUint8Array(data);

    if (u8.byteLength < 8) return;

    const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

    const transferId = view.getUint32(0, true);
    const chunkIndex = view.getUint32(4, true);

    const transfer = incomingTransfers[transferId];
    if (!transfer) return;

    const payload = u8.slice(8);

    lsApplyChunkToTransfer(transfer, chunkIndex, payload);
  }

  function handleObjectTransferChunk(data, peerId) {
    let transfer = null;

    if (
      data.transferId !== undefined &&
      data.transferId !== null &&
      incomingTransfers[data.transferId]
    ) {
      transfer = incomingTransfers[data.transferId];
    }

    if (!transfer && data.fileName) {
      transfer = incomingTransfers[getLegacyTransferKey(peerId, data.fileName)];
    }

    if (!transfer) return;

    let payload = null;

    try {
      if (typeof data.data === "string") {
        payload = lsBase64ToUint8Array(data.data);
      } else if (Array.isArray(data.data)) {
        payload = new Uint8Array(data.data);
      } else if (data.payload !== undefined) {
        payload = lsToUint8Array(data.payload).slice();
      } else if (data.chunk !== undefined) {
        payload = lsToUint8Array(data.chunk).slice();
      } else {
        return;
      }
    } catch (err) {
      console.warn("Could not parse file chunk:", err);
      return;
    }

    let chunkIndex = data.chunkIndex;

    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
      chunkIndex = transfer.receivedChunks;
    }

    lsApplyChunkToTransfer(transfer, chunkIndex, payload);
  }

  function lsApplyChunkToTransfer(transfer, chunkIndex, payload) {
    if (!transfer || transfer.finalized || transfer.failed) return;
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) return;

    if (transfer.totalChunks > 0) {
      if (chunkIndex >= transfer.totalChunks) return;
      if (transfer.chunks[chunkIndex]) return;

      transfer.chunks[chunkIndex] = payload;
      transfer.receivedChunks += 1;
    } else {
      transfer.chunks.push(payload);
      transfer.receivedChunks += 1;
    }

    transfer.receivedBytes += payload.byteLength;

    const pct = transfer.totalSize
      ? (transfer.receivedBytes / transfer.totalSize) * 100
      : 0;

    const elapsed = (Date.now() - transfer.startTime) / 1000;
    const speed = transfer.receivedBytes / Math.max(elapsed, 0.001);

    const bar = document.getElementById(`${transfer.domId}-bar`);
    const meta = document.getElementById(`${transfer.domId}-meta`);
    const speedEl = document.getElementById(`${transfer.domId}-speed`);

    if (bar) bar.style.width = `${pct}%`;

    if (meta) {
      meta.textContent = `${Math.round(pct)}% • ${formatBytes(
        transfer.receivedBytes,
      )} / ${formatBytes(transfer.totalSize)}`;
    }

    if (speedEl) {
      speedEl.textContent = formatSpeed(speed);
    }

    const completeByChunks =
      transfer.totalChunks > 0 &&
      transfer.receivedChunks >= transfer.totalChunks;

    const completeByBytes =
      transfer.totalSize > 0 && transfer.receivedBytes >= transfer.totalSize;

    if (completeByChunks || completeByBytes) {
      lsFinalizeIncomingTransfer(transfer);
    }
  }

  function lsFailIncomingTransfer(transfer, message) {
    if (!transfer || transfer.failed || transfer.finalized) return;

    transfer.failed = true;

    showToast(message, "error");

    if (transfer.element) {
      transfer.element.remove();
    }

    delete incomingTransfers[transfer.transferId];

    updateTransferVisibility();
  }

  function lsFinalizeIncomingTransfer(transfer) {
    if (!transfer || transfer.finalized || transfer.failed) return;

    transfer.finalized = true;

    let blob;

    if (transfer.totalSize === 0) {
      blob = new Blob([], {
        type: transfer.mimeType || "application/octet-stream",
      });
    } else {
      if (
        transfer.totalSize > 0 &&
        transfer.receivedBytes !== transfer.totalSize
      ) {
        return lsFailIncomingTransfer(
          transfer,
          `Transfer failed: "${transfer.fileName}" size mismatch.`,
        );
      }

      const finalBytes = new Uint8Array(transfer.totalSize);
      let offset = 0;

      for (let i = 0; i < transfer.chunks.length; i++) {
        const chunk = transfer.chunks[i];

        if (!chunk) {
          return lsFailIncomingTransfer(
            transfer,
            `Transfer failed: "${transfer.fileName}" is missing chunk ${i}.`,
          );
        }

        if (offset + chunk.byteLength > finalBytes.length) {
          return lsFailIncomingTransfer(
            transfer,
            `Transfer failed: "${transfer.fileName}" exceeded expected size.`,
          );
        }

        finalBytes.set(chunk, offset);
        offset += chunk.byteLength;
      }

      if (offset !== transfer.totalSize) {
        return lsFailIncomingTransfer(
          transfer,
          `Transfer failed: "${transfer.fileName}" incomplete assembly.`,
        );
      }

      if (transfer.checksum !== undefined && transfer.checksum !== null) {
        const receivedNumeric = lsFnv1aUpdate(0x811c9dc5, finalBytes) >>> 0;
        const receivedHex = receivedNumeric
          .toString(16)
          .padStart(8, "0")
          .toLowerCase();

        const expected = transfer.checksum;

        const checksumOk =
          typeof expected === "number"
            ? expected === receivedNumeric
            : String(expected).toLowerCase() === receivedHex;

        if (!checksumOk) {
          return lsFailIncomingTransfer(
            transfer,
            `Transfer failed: "${transfer.fileName}" checksum mismatch.`,
          );
        }
      }

      blob = new Blob([finalBytes.buffer], {
        type: transfer.mimeType || "application/octet-stream",
      });
    }

    const url = URL.createObjectURL(blob);

    const safeFileName = escapeHtml(transfer.fileName);
    const safePeerName = escapeHtml(
      connections[transfer.peerId]?.name || "Peer",
    );

    if (transfer.element) {
      transfer.element.innerHTML = `
                <div class="flex items-center justify-between gap-3 p-1">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                            <i class="bi ${getFileIcon(transfer.fileName)} text-accent text-sm"></i>
                        </div>

                        <div class="min-w-0">
                            <p class="text-xs font-semibold text-white truncate">${safeFileName}</p>
                            <p class="text-[9px] text-text/40">
                                ${formatBytes(transfer.totalSize)} • From ${safePeerName} • ✓ Verified
                            </p>
                        </div>
                    </div>

                    <a href="${url}" download="${escapeHtml(transfer.fileName)}" class="icon-btn-primary" title="Download">
                        <i class="bi bi-download"></i>
                    </a>
                </div>
            `;

      const link = transfer.element.querySelector("a");

      if (link) {
        link.addEventListener("click", () => {
          setTimeout(() => {
            try {
              URL.revokeObjectURL(url);
            } catch (_err) {}
          }, 30000);
        });
      }
    }

    delete incomingTransfers[transfer.transferId];

    updateTransferVisibility();

    showToast(
      `Received "${transfer.fileName}" (${formatBytes(transfer.totalSize)})`,
      "success",
    );
  }

  function handleFileMetadata(data, peerId) {
    const fileName = data.fileName || "file";

    let transferId = data.transferId;
    let storageKey;

    if (transferId === undefined || transferId === null) {
      storageKey = getLegacyTransferKey(peerId, fileName);
      transferId = storageKey;
    } else {
      storageKey = transferId;
    }

    if (incomingTransfers[storageKey]) return;

    const totalChunks = Number(data.totalChunks || 0);
    const totalSize = Number(data.totalSize || 0);

    const domId = `transfer-${String(transferId).replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    )}`;

    const peerName = connections[peerId]?.name || "Peer";

    const safeFileName = escapeHtml(fileName);
    const safePeerName = escapeHtml(peerName);

    const li = document.createElement("li");
    li.id = domId;
    li.className = "transfer-card";

    li.innerHTML = `
            <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2 min-w-0">
                    <i class="bi ${getFileIcon(fileName)} text-accent text-sm"></i>
                    <span class="text-[11px] font-medium text-text/80 truncate max-w-[140px]">
                        ${safeFileName}
                    </span>
                </div>

                <span class="text-[10px] text-accent/70 font-medium">
                    ← ${safePeerName}
                </span>
            </div>

            <div class="progress-track">
                <div id="${domId}-bar" class="progress-fill bg-accent"></div>
            </div>

            <div class="flex justify-between mt-1">
                <span id="${domId}-meta" class="text-[9px] text-text/40">
                    Waiting for data...
                </span>
                <span id="${domId}-speed" class="text-[9px] text-text/30"></span>
            </div>
        `;

    if (receivedFiles) {
      receivedFiles.appendChild(li);
    }

    updateTransferVisibility();

    incomingTransfers[storageKey] = {
      transferId: storageKey,
      domId,
      peerId,
      fileName,
      totalSize,
      totalChunks,
      mimeType: data.mimeType || "application/octet-stream",
      checksum: typeof data.checksum !== "undefined" ? data.checksum : null,
      chunks: totalChunks > 0 ? new Array(totalChunks) : [],
      receivedChunks: 0,
      receivedBytes: 0,
      element: li,
      startTime: Date.now(),
      finalized: false,
      failed: false,
    };

    if (totalSize === 0 && totalChunks === 0) {
      lsFinalizeIncomingTransfer(incomingTransfers[storageKey]);
    }
  }

  function handleTransferCompleteMessage(data, peerId) {
    let transfer = null;

    if (
      data.transferId !== undefined &&
      data.transferId !== null &&
      incomingTransfers[data.transferId]
    ) {
      transfer = incomingTransfers[data.transferId];
    }

    if (!transfer && data.fileName) {
      transfer = incomingTransfers[getLegacyTransferKey(peerId, data.fileName)];
    }

    if (transfer) {
      lsFinalizeIncomingTransfer(transfer);
    }
  }

  // ═══════════════════════════════════════════
  // Nearby Discovery
  // ═══════════════════════════════════════════
  async function resolveNearbyRoomId() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("https://api.ipify.org?format=json", {
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json();

      const base = btoa(data.ip)
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      return `ip-${base.slice(0, 12)}`;
    } catch (err) {
      console.warn("ipify failed, using local room", err);

      const fallback = (window.location.host || "local")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      return `local-${fallback.slice(0, 12) || "default"}`;
    }
  }

  function updateChatPresence() {
    const count = Object.keys(connections).length;

    if (connectionCount) {
      connectionCount.textContent = String(count);
    }

    if (!chatPresence) return;

    if (count > 0) {
      chatPresence.textContent = `${count} Online`;
      chatPresence.className =
        "text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full";
    } else {
      chatPresence.textContent = "Offline";
      chatPresence.className =
        "text-[10px] bg-white/5 text-text/40 px-2 py-0.5 rounded-full";
    }
  }

  function appendChatMessage(sender, text, isLocal = false) {
    if (!text || !chatMessages) return;

    if (
      chatMessages.children.length === 1 &&
      chatMessages.children[0].textContent.includes(
        "Chat messages will appear here",
      )
    ) {
      chatMessages.innerHTML = "";
    }

    const li = document.createElement("li");

    li.className = `p-2.5 rounded-xl border ${
      isLocal ? "border-primary/20 bg-primary/5" : "border-white/6 bg-white/3"
    }`;

    li.innerHTML = `
            <p class="text-[10px] ${
              isLocal ? "text-primary" : "text-text/50"
            } font-semibold mb-0.5">
                ${escapeHtml(sender)}
            </p>
            <p class="text-xs text-text/90 break-words leading-relaxed">
                ${escapeHtml(text)}
            </p>
        `;

    chatMessages.appendChild(li);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function initDiscovery() {
    nearbyRoomId = await resolveNearbyRoomId();

    console.log("Nearby Room ID:", nearbyRoomId);

    if (networkLabel) {
      networkLabel.textContent = `Room #${nearbyRoomId.slice(0, 16)}`;
    }

    initPeer();
  }

  function getPeerOptions() {
    const peerOptions = {
      debug: 1,
    };

    if (appConfig.peer) {
      Object.assign(peerOptions, appConfig.peer);
    }

    return peerOptions;
  }

  function generatePeerId() {
    try {
      if (window.crypto && crypto.randomUUID) {
        return `ls-${nearbyRoomId}-${crypto.randomUUID()}`;
      }
    } catch (_err) {}

    const rnd = Math.random().toString(36).substring(2, 16);

    return `ls-${nearbyRoomId}-${rnd}-${Date.now().toString(36)}`;
  }

  function initPeer() {
    const attemptId = generatePeerId();

    if (peer) {
      try {
        peer.destroy();
      } catch (_err) {}

      peer = null;
    }

    try {
      peer = new Peer(attemptId, getPeerOptions());
    } catch (err) {
      console.error("Failed to initialize PeerJS:", err);
      showToast("PeerJS failed to load. Check your connection.", "error");
      return;
    }

    peer.on("open", (id) => {
      console.log("Peer Open:", id);

      if (deviceStatusDot) {
        deviceStatusDot.className = "status-dot online";
      }

      if (networkDot) {
        networkDot.className = "w-2 h-2 rounded-full bg-accent";
      }

      if (statusEl) {
        statusEl.innerHTML = `
                    <div class="space-y-2">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <i class="bi bi-laptop text-primary"></i>
                            </div>

                            <div class="min-w-0">
                                <p class="text-sm font-bold text-white truncate">
                                    ${escapeHtml(localPeerName)}
                                </p>
                                <p class="text-[10px] font-mono text-text/40 truncate">
                                    ${escapeHtml(id)}
                                </p>
                            </div>

                            <button id="copy-id" class="icon-btn ml-auto" title="Copy ID">
                                <i class="bi bi-clipboard"></i>
                            </button>
                        </div>

                        <div id="discovery-status" class="text-[11px] text-text/40 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            Discovering nearby devices...
                        </div>
                    </div>
                `;

        const copyBtn = $("copy-id");

        if (copyBtn) {
          copyBtn.onclick = () => {
            navigator.clipboard
              .writeText(id)
              .then(() => showToast("Peer ID copied!", "success"))
              .catch(() => showToast("Could not copy Peer ID", "error"));
          };
        }
      }

      displayQrCode(id);
      startNearbyScan();
      bootstrapRoomRegistry();
    });

    peer.on("connection", (conn) => {
      handleIncomingConnection(conn);
    });

    peer.on("error", (err) => {
      if (
        err &&
        err.message &&
        err.message.includes("ls-roomhost-") &&
        err.message.includes("taken")
      ) {
        return;
      }

      console.error("PeerJS Error:", err);

      if (err && err.type === "unavailable-id") {
        showToast("Peer ID collision — regenerating...", "warning");

        setTimeout(
          () => {
            initPeer();
          },
          300 + Math.random() * 400,
        );

        return;
      }

      showToast(`Error: ${err && err.type ? err.type : err}`, "error");
    });

    peer.on("disconnected", () => {
      if (deviceStatusDot) {
        deviceStatusDot.className = "status-dot offline";
      }

      if (networkDot) {
        networkDot.className = "w-2 h-2 rounded-full bg-red-400";
      }

      showToast(
        "Disconnected from signaling server. Reconnecting...",
        "warning",
      );

      setTimeout(() => {
        try {
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        } catch (_err) {}
      }, 2000);
    });
  }

  function displayQrCode(id) {
    if (!qrCodeCanvas || !qrCodeContainer) return;

    qrCodeContainer.hidden = false;
    qrCodeContainer.classList.remove("hidden");

    if (typeof QRCode === "undefined") {
      qrCodeContainer.innerHTML = `
                <p class="text-[10px] text-text/40">
                    QR library unavailable. Peer ID: ${escapeHtml(id)}
                </p>
            `;

      return;
    }

    try {
      QRCode.toCanvas(qrCodeCanvas, id, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: LS_PRIMARY_COLOR,
          light: "#000000",
        },
      });
    } catch (err) {
      console.warn("QR render failed:", err);
    }
  }

  function updateDiscoveryStatus(text) {
    const el = $("discovery-status");

    if (el) {
      el.innerHTML = `
                <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
                ${escapeHtml(text || "")}
            `;
    }
  }

  // ═══════════════════════════════════════════
  // Connection & Handshake
  // ═══════════════════════════════════════════
  function handleIncomingConnection(conn) {
    const remoteName = conn.metadata?.name || "Unknown Device";

    if (
      !handshakeModal ||
      !handshakeMessage ||
      !handshakeAccept ||
      !handshakeReject
    ) {
      setupConnection(conn, remoteName);
      return;
    }

    handshakeMessage.innerHTML = `
            <strong class="text-white">${escapeHtml(remoteName)}</strong>
            wants to connect with you.
        `;

    handshakeModal.classList.remove("hidden");
    handshakeModal.classList.add("flex");

    const cleanup = () => {
      handshakeModal.classList.add("hidden");
      handshakeModal.classList.remove("flex");

      handshakeAccept.onclick = null;
      handshakeReject.onclick = null;
    };

    handshakeAccept.onclick = () => {
      cleanup();

      const respond = () => {
        try {
          conn.send({
            type: "handshake-response",
            accepted: true,
            name: localPeerName,
          });
        } catch (_err) {}
      };

      if (conn.open) {
        respond();
      } else {
        conn.on("open", respond);
      }

      setupConnection(conn, remoteName);

      showToast(`Connected to ${remoteName}`, "success");
    };

    handshakeReject.onclick = () => {
      cleanup();

      const respond = () => {
        try {
          conn.send({
            type: "handshake-response",
            accepted: false,
          });
        } catch (_err) {}

        setTimeout(() => {
          try {
            conn.close();
          } catch (_err) {}
        }, 300);
      };

      if (conn.open) {
        respond();
      } else {
        conn.on("open", respond);
      }
    };
  }

  function setupConnection(conn, name) {
    const pid = conn.peer;

    connections[pid] = {
      conn,
      name,
      status: "active",
    };

    let didDisconnect = false;

    const removeConnection = (reason) => {
      if (didDisconnect) return;

      didDisconnect = true;

      delete connections[pid];

      if (reason) {
        showToast(reason, "info");
      }

      updatePeerListUi();
      updateChatPresence();

      if (isRoomHost) {
        publishRoster();
      }
    };

    const onConnected = () => {
      updatePeerListUi();
      updateChatPresence();

      try {
        conn.send({
          type: "peer-name",
          name: localPeerName,
        });
      } catch (_err) {}

      if (isRoomHost) {
        publishRoster();
      }
    };

    conn.on("open", onConnected);

    if (conn.open) {
      onConnected();
    }

    conn.on("data", (data) => {
      if (data instanceof Blob) {
        data
          .arrayBuffer()
          .then((buffer) => handleRawTransferChunk(buffer, pid))
          .catch(() => {});

        return;
      }

      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        handleRawTransferChunk(data, pid);
        return;
      }

      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "file-metadata":
          handleFileMetadata(data, pid);
          break;

        case "file-chunk":
          handleObjectTransferChunk(data, pid);
          break;

        case "transfer-complete":
          handleTransferCompleteMessage(data, pid);
          break;

        case "chat-message":
          appendChatMessage(
            data.from || connections[pid]?.name || "Peer",
            data.message || "",
          );
          break;

        case "disconnect-notice":
          removeConnection(`${name} disconnected`);

          try {
            conn.close();
          } catch (_err) {}

          break;

        case "peer-name":
          if (connections[pid]) {
            connections[pid].name = data.name;
            updatePeerListUi();
            updateChatPresence();
          }
          break;

        default:
          break;
      }
    });

    conn.on("close", () => {
      removeConnection(`${name} disconnected`);
    });

    conn.on("error", (err) => {
      console.error("Connection error:", err);
      removeConnection(`Connection error with ${name}`);
    });
  }

  function requestConnection(remoteId) {
    if (!remoteId) {
      showToast("Enter a Peer ID first", "warning");
      return;
    }

    if (!peer || peer.destroyed) {
      showToast("Peer engine is not ready yet", "warning");
      return;
    }

    if (remoteId === peer.id) {
      showToast("Cannot connect to yourself", "warning");
      return;
    }

    showToast(`Requesting connection to ${remoteId.slice(0, 20)}...`, "info");

    const conn = peer.connect(remoteId, {
      metadata: {
        name: localPeerName,
        type: "handshake",
      },
      reliable: true,
    });

    conn.on("data", (data) => {
      if (data && data.type === "handshake-response") {
        if (data.accepted) {
          showToast(`Connection accepted by ${data.name}`, "success");
          setupConnection(conn, data.name);
        } else {
          showToast("Connection rejected by peer", "warning");

          try {
            conn.close();
          } catch (_err) {}
        }
      }
    });

    conn.on("error", () => {
      showToast("Failed to connect", "error");
    });
  }

  if (connectButton) {
    connectButton.addEventListener("click", () => {
      requestConnection(peerIdInput ? peerIdInput.value.trim() : "");
    });
  }

  if (peerIdInput) {
    peerIdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        requestConnection(peerIdInput.value.trim());
      }
    });
  }

  // ═══════════════════════════════════════════
  // Chat
  // ═══════════════════════════════════════════
  function sendChatMessage() {
    if (!chatInput) return;

    const text = chatInput.value.trim();

    if (!text) return;

    const peers = Object.values(connections);

    if (!peers.length) {
      showToast("Connect to a peer first", "warning");
      return;
    }

    peers.forEach(({ conn }) => {
      if (conn.open) {
        try {
          conn.send({
            type: "chat-message",
            from: localPeerName,
            message: text,
          });
        } catch (_err) {}
      }
    });

    appendChatMessage(localPeerName, text, true);

    chatInput.value = "";
  }

  if (chatSend) {
    chatSend.addEventListener("click", sendChatMessage);
  }

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendChatMessage();
      }
    });
  }

  // ═══════════════════════════════════════════
  // UI Updates
  // ═══════════════════════════════════════════
  function updatePeerListUi() {
    if (!peerList) return;

    peerList.innerHTML = "";

    const entries = Object.entries(connections);

    if (entries.length === 0) {
      peerList.innerHTML = `
                <li class="text-xs text-text/40 italic text-center py-4">
                    No active connections
                </li>
            `;

      if (peer) scanNearbyPeers();

      return;
    }

    entries.forEach(([id, data]) => {
      const li = document.createElement("li");
      li.className = "connection-card";

      li.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <i class="bi bi-laptop text-sm text-primary"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-xs font-semibold text-white truncate">
                            ${escapeHtml(data.name)}
                        </p>
                        <p class="text-[9px] font-mono text-text/30 truncate">
                            ${escapeHtml(id.slice(0, 24))}...
                        </p>
                    </div>
                </div>

                <button class="icon-btn text-text/30 hover:text-red-400 disconnect-btn" title="Disconnect">
                    <i class="bi bi-x-lg text-xs"></i>
                </button>
            `;

      const disconnectBtn = li.querySelector(".disconnect-btn");

      if (disconnectBtn) {
        disconnectBtn.addEventListener("click", () => {
          window.disconnectPeer(id);
        });
      }

      peerList.appendChild(li);
    });

    if (peer) scanNearbyPeers();
  }

  window.disconnectPeer = (id) => {
    if (!connections[id]) return;

    const target = connections[id].conn;

    try {
      if (target.open) {
        target.send({
          type: "disconnect-notice",
        });
      }
    } catch (_err) {}

    try {
      target.close();
    } catch (_err) {}

    delete connections[id];

    updatePeerListUi();
    updateChatPresence();

    if (isRoomHost) {
      publishRoster();
    }

    showToast("Peer disconnected", "info");
  };

  function renderNearbyPeers(peers) {
    if (!nearbyList) return;

    if (!peers.length) {
      nearbyList.innerHTML = `
                <li class="p-3 rounded-xl bg-white/3 border border-white/6 flex items-center justify-between">
                    <span class="text-[11px] text-text/50">
                        Network:
                        <strong class="text-text/70">#${escapeHtml(
                          nearbyRoomId.slice(0, 14),
                        )}</strong>
                    </span>

                    <span class="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                        Active
                    </span>
                </li>

                <li class="text-[11px] text-text/30 italic py-5 text-center">
                    No nearby devices found yet
                </li>
            `;

      return;
    }

    nearbyList.innerHTML = `
            <li class="p-3 rounded-xl bg-white/3 border border-white/6 flex items-center justify-between">
                <span class="text-[11px] text-text/50">
                    Network:
                    <strong class="text-text/70">#${escapeHtml(
                      nearbyRoomId.slice(0, 14),
                    )}</strong>
                </span>

                <span class="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    ${peers.length} Found
                </span>
            </li>
        `;

    peers.forEach(({ peerId, name }) => {
      const isConnected = Boolean(connections[peerId]);

      const li = document.createElement("li");
      li.className = "connection-card";

      li.innerHTML = `
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold text-white truncate">
                        ${escapeHtml(name)}
                    </p>
                    <p class="text-[9px] font-mono text-text/30 truncate">
                        ${escapeHtml(peerId.slice(0, 28))}...
                    </p>
                </div>

                <button class="btn-connect-sm ${
                  isConnected ? "opacity-40 pointer-events-none" : ""
                }" ${isConnected ? "disabled" : ""}>
                    ${
                      isConnected
                        ? '<i class="bi bi-check2"></i>'
                        : '<i class="bi bi-plug"></i>'
                    }
                    ${isConnected ? "Linked" : "Connect"}
                </button>
            `;

      const button = li.querySelector("button");

      if (!isConnected && button) {
        button.addEventListener("click", () => {
          requestConnection(peerId);
        });
      }

      nearbyList.appendChild(li);
    });
  }

  // ═══════════════════════════════════════════
  // Room Registry
  // ═══════════════════════════════════════════
  function getRoomHostId() {
    return `ls-roomhost-${nearbyRoomId}`;
  }

  function upsertRoomPeer(peerId, name) {
    roomPeers[peerId] = {
      peerId,
      name: name || "Nearby Device",
      ts: Date.now(),
    };
  }

  function removeRoomPeer(peerId) {
    delete roomPeers[peerId];
    delete roomPeerConns[peerId];
  }

  function getSanitizedRoster() {
    return Object.values(roomPeers).map(({ peerId, name, ts }) => ({
      peerId,
      name,
      ts,
    }));
  }

  function publishRoster() {
    const now = Date.now();

    Object.values(roomPeers).forEach((entry) => {
      if (
        entry.peerId !== peer?.id &&
        now - (entry.ts || 0) > REGISTRY_HEARTBEAT_MS * 4
      ) {
        removeRoomPeer(entry.peerId);
      }
    });

    const roster = getSanitizedRoster();

    renderNearbyPeers(roster.filter((p) => p.peerId !== peer?.id));

    if (!isRoomHost) return;

    Object.entries(roomPeerConns).forEach(([peerId, targetConn]) => {
      if (targetConn && targetConn.open) {
        try {
          targetConn.send({
            type: "registry-roster",
            peers: roster,
          });
        } catch (_err) {}
      } else {
        delete roomPeerConns[peerId];
      }
    });
  }

  function startRegistryHeartbeat() {
    if (nearbyScanTimer) {
      clearInterval(nearbyScanTimer);
    }

    nearbyScanTimer = setInterval(() => {
      if (isRoomHost) {
        publishRoster();
        return;
      }

      if (registryConn && registryConn.open && peer && peer.id) {
        try {
          registryConn.send({
            type: "registry-register",
            peerId: peer.id,
            name: localPeerName,
          });
        } catch (_err) {}
      } else if (!isTransitioningDiscovery) {
        connectToRoomHost();
      }
    }, REGISTRY_HEARTBEAT_MS);
  }

  function setupRoomHostPeer() {
    if (!roomHostPeer) return;

    isRoomHost = true;

    if (peer && peer.id) {
      upsertRoomPeer(peer.id, localPeerName);
    }

    roomHostPeer.on("connection", (conn) => {
      conn.on("data", (data) => {
        if (!data || data.type !== "registry-register") return;

        const registryPeerId = data.peerId || conn.peer;

        conn._registryPeerId = registryPeerId;

        upsertRoomPeer(registryPeerId, data.name || "Nearby Device");

        roomPeerConns[registryPeerId] = conn;

        publishRoster();
      });

      conn.on("close", () => {
        removeRoomPeer(conn._registryPeerId || conn.peer);
        publishRoster();
      });
    });

    publishRoster();
  }

  function becomeRoomHost() {
    if (roomHostPeer || isRoomHost) return;

    isTransitioningDiscovery = true;

    updateDiscoveryStatus("Setting up discovery host...");

    try {
      roomHostPeer = new Peer(getRoomHostId(), getPeerOptions());
    } catch (err) {
      console.warn("Failed to create roomHostPeer:", err);
      isTransitioningDiscovery = false;
      return;
    }

    roomHostPeer.on("open", () => {
      isRoomHost = true;
      isTransitioningDiscovery = false;

      updateDiscoveryStatus("Hosting local discovery");

      if (networkDot) {
        networkDot.className = "w-2 h-2 rounded-full bg-accent";
      }

      setupRoomHostPeer();
    });

    roomHostPeer.on("error", (err) => {
      try {
        roomHostPeer.destroy();
      } catch (_err) {}

      roomHostPeer = null;
      isRoomHost = false;

      if (
        err &&
        (err.type === "unavailable-id" ||
          (err.message && /taken/i.test(err.message)))
      ) {
        setTimeout(() => {
          isTransitioningDiscovery = false;
          connectToRoomHost();
        }, 500);
      } else {
        isTransitioningDiscovery = false;
      }
    });
  }

  function connectToRoomHost() {
    if (
      !peer ||
      !peer.id ||
      isRoomHost ||
      roomHostPeer ||
      isTransitioningDiscovery
    ) {
      return;
    }

    isTransitioningDiscovery = true;

    const hostId = getRoomHostId();

    updateDiscoveryStatus("Connecting to room host...");

    const conn = peer.connect(hostId, {
      reliable: true,
    });

    registryConn = conn;

    const openTimeout = setTimeout(() => {
      if (!conn.open) {
        try {
          conn.close();
        } catch (_err) {}

        registryConn = null;
        isTransitioningDiscovery = false;

        becomeRoomHost();
      }
    }, 1500);

    conn.on("open", () => {
      clearTimeout(openTimeout);

      isTransitioningDiscovery = false;

      updateDiscoveryStatus("Connected to room host");

      if (networkDot) {
        networkDot.className = "w-2 h-2 rounded-full bg-accent";
      }

      try {
        conn.send({
          type: "registry-register",
          peerId: peer.id,
          name: localPeerName,
        });
      } catch (_err) {}
    });

    conn.on("data", (data) => {
      if (data && data.type === "registry-roster") {
        const peers = (data.peers || []).filter((p) => p.peerId !== peer.id);

        Object.keys(roomPeers).forEach((k) => delete roomPeers[k]);

        peers.forEach((p) => upsertRoomPeer(p.peerId, p.name));

        renderNearbyPeers(peers);
      }
    });

    conn.on("error", () => {
      clearTimeout(openTimeout);

      try {
        conn.close();
      } catch (_err) {}

      registryConn = null;

      setTimeout(() => {
        isTransitioningDiscovery = false;
        becomeRoomHost();
      }, 300);
    });

    conn.on("close", () => {
      if (registryConn) {
        registryConn = null;
      }

      setTimeout(() => {
        isTransitioningDiscovery = false;
        becomeRoomHost();
      }, 400);
    });
  }

  function bootstrapRoomRegistry() {
    connectToRoomHost();
  }

  function scanNearbyPeers() {
    if (!peer || !peer.id) {
      renderNearbyPeers([]);
      return;
    }

    if (isRoomHost || (registryConn && registryConn.open)) {
      renderNearbyPeers(
        Object.values(roomPeers).filter((p) => p.peerId !== peer.id),
      );

      return;
    }

    if (nearbyList) {
      nearbyList.innerHTML = `
                <li class="text-[11px] text-text/30 py-5 text-center italic">
                    Bootstrapping discovery...
                </li>
            `;
    }
  }

  function startNearbyScan() {
    scanNearbyPeers();
    startRegistryHeartbeat();
  }

  if (rescanBtn) {
    rescanBtn.addEventListener("click", () => {
      scanNearbyPeers();
      showToast("Rescanning network...", "info");
    });
  }

  // ═══════════════════════════════════════════
  // File Selection & Drag/Drop
  // ═══════════════════════════════════════════
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      selectedFiles = Array.from(e.target.files);
      renderSelectedFiles();
    });
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => {
      fileInput.click();
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");

      selectedFiles = [...selectedFiles, ...Array.from(e.dataTransfer.files)];

      renderSelectedFiles();
    });
  }

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener("click", () => {
      selectedFiles = [];

      if (fileInput) {
        fileInput.value = "";
      }

      renderSelectedFiles();
    });
  }

  function renderSelectedFiles() {
    if (!fileListUi || !selectedCount) return;

    fileListUi.innerHTML = "";

    selectedCount.textContent = String(selectedFiles.length);

    if (selectedFilesSection) {
      selectedFilesSection.classList.toggle(
        "hidden",
        selectedFiles.length === 0,
      );
    }

    if (selectedFiles.length === 0) return;

    selectedFiles.forEach((file, index) => {
      const li = document.createElement("li");

      li.className =
        "flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/6 group";

      li.innerHTML = `
                <i class="bi ${getFileIcon(file.name)} text-primary/70"></i>

                <div class="min-w-0 flex-1">
                    <p class="text-xs text-text/90 truncate">
                        ${escapeHtml(file.name)}
                    </p>
                    <p class="text-[9px] text-text/40">
                        ${formatBytes(file.size)}
                    </p>
                </div>

                <button class="icon-btn opacity-0 group-hover:opacity-100 remove-file-btn">
                    <i class="bi bi-x text-xs"></i>
                </button>
            `;

      const removeBtn = li.querySelector(".remove-file-btn");

      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          window.removeFile(index);
        });
      }

      fileListUi.appendChild(li);
    });
  }

  window.removeFile = (idx) => {
    selectedFiles.splice(idx, 1);
    renderSelectedFiles();
  };

  // ═══════════════════════════════════════════
  // File Sending
  // ═══════════════════════════════════════════
  if (sendButton) {
    sendButton.addEventListener("click", () => {
      if (!selectedFiles.length) {
        showToast("Select files first", "warning");
        return;
      }

      const peers = Object.values(connections);

      if (!peers.length) {
        showToast("Connect to a peer first", "warning");
        return;
      }

      selectedFiles.forEach((file) => {
        peers.forEach((peerData) => {
          sendFile(file, peerData);
        });
      });

      showToast(
        `Starting transfer of ${selectedFiles.length} file(s)...`,
        "info",
      );

      selectedFiles = [];

      if (fileInput) {
        fileInput.value = "";
      }

      renderSelectedFiles();
    });
  }

  async function sendFile(file, peerData) {
    const { conn, name } = peerData;

    if (!conn || !conn.open) {
      showToast("Connection is not open.", "warning");
      return;
    }

    const transferId = lsGenerateTransferId();
    const domId = `transfer-${transferId}`;

    const totalChunks =
      file.size > 0 ? Math.ceil(file.size / FILE_CHUNK_SIZE) : 0;

    const mimeType = file.type || "application/octet-stream";

    const safeFileName = escapeHtml(file.name);
    const safePeerName = escapeHtml(name);

    let li = null;
    let bar = null;
    let meta = null;
    let speedEl = null;

    if (sendProgressList) {
      li = document.createElement("li");
      li.id = domId;
      li.className = "transfer-card";

      li.innerHTML = `
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2 min-w-0">
                        <i class="bi ${getFileIcon(file.name)} text-primary text-sm"></i>
                        <span class="text-[11px] font-medium text-text/80 truncate max-w-[140px]">
                            ${safeFileName}
                        </span>
                    </div>

                    <span class="text-[10px] text-primary/70 font-medium">
                        → ${safePeerName}
                    </span>
                </div>

                <div class="progress-track">
                    <div id="${domId}-bar" class="progress-fill"></div>
                </div>

                <div class="flex justify-between mt-1">
                    <span id="${domId}-meta" class="text-[9px] text-text/40">
                        Preparing...
                    </span>
                    <span id="${domId}-speed" class="text-[9px] text-text/30"></span>
                </div>
            `;

      sendProgressList.appendChild(li);

      updateTransferVisibility();

      bar = document.getElementById(`${domId}-bar`);
      meta = document.getElementById(`${domId}-meta`);
      speedEl = document.getElementById(`${domId}-speed`);
    }

    if (meta) {
      meta.textContent = ENABLE_FILE_CHECKSUM
        ? "Preparing checksum..."
        : "Starting...";
    }

    let checksum = null;

    if (ENABLE_FILE_CHECKSUM) {
      try {
        checksum = await lsComputeFileChecksum(file);
      } catch (err) {
        console.warn("Checksum generation failed:", err);
        checksum = null;
      }
    }

    if (!conn.open) {
      if (meta) meta.textContent = "Connection closed.";
      return;
    }

    try {
      await Promise.resolve(
        conn.send({
          type: "file-metadata",
          protocol: "ls-transfer-v2",
          transferId,
          fileName: file.name,
          totalSize: file.size,
          totalChunks,
          mimeType,
          checksum,
        }),
      );
    } catch (err) {
      console.error("Failed to send file metadata:", err);

      if (meta) {
        meta.textContent = "Failed to start transfer.";
      }

      return;
    }

    if (file.size === 0) {
      if (bar) bar.style.width = "100%";

      if (meta) {
        meta.textContent = "Complete • 0 B";
      }

      if (li) {
        setTimeout(() => {
          li.style.opacity = "0.5";
        }, 1000);
      }

      return;
    }

    let offset = 0;
    let chunkIndex = 0;

    const startTime = Date.now();

    const canRaw =
      typeof conn.send === "function" &&
      conn.send.length >= 2 &&
      Boolean(conn.dataChannel);

    let useBase64Fallback = !canRaw;

    const sendNextChunk = async () => {
      while (offset < file.size) {
        if (!conn.open) {
          if (meta) meta.textContent = "Connection closed.";
          return;
        }

        const dc = conn.dataChannel;

        if (
          dc &&
          typeof dc.bufferedAmount === "number" &&
          dc.bufferedAmount > MAX_BUFFERED_AMOUNT
        ) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          continue;
        }

        const end = Math.min(offset + FILE_CHUNK_SIZE, file.size);

        let payload;

        try {
          const buffer = await lsReadBlobAsArrayBuffer(file.slice(offset, end));

          payload = new Uint8Array(buffer);
        } catch (err) {
          console.error("Failed reading file slice:", err);

          if (meta) meta.textContent = "File read failed.";

          return;
        }

        try {
          if (!useBase64Fallback) {
            const frame = lsMakeRawChunkFrame(transferId, chunkIndex, payload);

            await Promise.resolve(conn.send(frame.buffer, true));
          } else {
            const encoded = lsUint8ArrayToBase64(payload);

            await Promise.resolve(
              conn.send({
                type: "file-chunk",
                transferId,
                chunkIndex,
                data: encoded,
              }),
            );
          }
        } catch (err) {
          console.warn("Raw chunk send failed. Falling back to base64.", err);

          useBase64Fallback = true;

          try {
            const encoded = lsUint8ArrayToBase64(payload);

            await Promise.resolve(
              conn.send({
                type: "file-chunk",
                transferId,
                chunkIndex,
                data: encoded,
              }),
            );
          } catch (fallbackErr) {
            console.error("Fallback chunk send failed:", fallbackErr);

            if (meta) meta.textContent = "Send failed.";

            return;
          }
        }

        offset = end;
        chunkIndex += 1;

        const pct = (offset / file.size) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = offset / Math.max(elapsed, 0.001);

        if (bar) bar.style.width = `${pct}%`;

        if (meta) {
          meta.textContent = `${Math.round(pct)}% • ${formatBytes(
            offset,
          )} / ${formatBytes(file.size)}`;
        }

        if (speedEl) {
          speedEl.textContent = formatSpeed(speed);
        }

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      try {
        await Promise.resolve(
          conn.send({
            type: "transfer-complete",
            transferId,
            fileName: file.name,
            totalChunks: chunkIndex,
            checksum,
          }),
        );
      } catch (_err) {}

      const elapsed = (Date.now() - startTime) / 1000;
      const speed = file.size / Math.max(elapsed, 0.001);

      if (bar) bar.style.width = "100%";

      if (meta) {
        meta.textContent = `Complete • ${formatBytes(file.size)} in ${elapsed.toFixed(1)}s`;
      }

      if (speedEl) {
        speedEl.textContent = formatSpeed(speed);
      }

      if (li) {
        setTimeout(() => {
          li.style.opacity = "0.5";
        }, 2000);
      }
    };

    try {
      await sendNextChunk();
    } catch (err) {
      console.error("File send failed:", err);

      if (meta) {
        meta.textContent = "Send failed.";
      }
    }
  }

  // ═══════════════════════════════════════════
  // Kickoff
  // ═══════════════════════════════════════════
  updateChatPresence();
  initDiscovery();
});
