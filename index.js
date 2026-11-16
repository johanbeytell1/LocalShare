document.addEventListener("DOMContentLoaded", () => {
  // ═══════════════════════════════════════════
  // DOM Elements Selector Helper
  // ═══════════════════════════════════════════
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Core containers & headers
  const toastContainer = $("toast-container");
  const statusEl = $("status");
  const deviceStatusDot = $("device-status-dot");
  const deviceRoleBadge = $("device-role-badge");
  // NOTE: network dot/label + room buttons exist twice (desktop nav + mobile
  // sub-bar) — always update via the .js-* class helpers below, never by ID.
  const NETWORK_DOT_BASE = "js-network-dot w-2 h-2 rounded-full flex-shrink-0";
  function setNetworkDotClass(state) {
    $$(".js-network-dot").forEach((el) => {
      el.className = `${NETWORK_DOT_BASE} ${state}`;
    });
  }
  function setNetworkLabel(text) {
    $$(".js-network-label").forEach((el) => {
      el.textContent = text;
    });
  }
  const autoAcceptToggle = $("auto-accept-toggle");
  const autoAcceptIcon = $("auto-accept-icon");
  const autoAcceptLabel = $("auto-accept-label");
  const soundToggleBtn = $("sound-toggle-btn");
  const soundIcon = $("sound-icon");
  const themeBtn = $("theme-btn");
  const themeDropdown = $("theme-dropdown");
  const mobileMenuBtn = $("mobile-menu-btn");
  const mobileMenuIcon = $("mobile-menu-icon");
  const mobileMenu = $("mobile-menu");
  const soundMenuBtn = $("sound-menu-btn");
  const soundMenuIcon = $("sound-menu-icon");
  const soundMenuState = $("sound-menu-state");
  const autoAcceptMenuBtn = $("autoaccept-menu-btn");
  const autoAcceptMenuIcon = $("autoaccept-menu-icon");
  const autoAcceptMenuState = $("autoaccept-menu-state");

  // Discovery & Identity
  const peerList = $("peer-list");
  const nearbyList = $("nearby-list");
  const discoveryBadge = $("discovery-badge");
  const rescanBtn = $("rescan-btn");
  const toggleQrBtn = $("toggle-qr-btn");
  const toggleQrLabel = $("toggle-qr-label");
  const shareDeviceLinkBtn = $("share-device-link-btn");
  const qrCodeCanvas = $("peer-id-qr-code");
  const qrCodeContainer = $("qr-code-container");

  // Manual connect & Room switch
  const tabPeerId = $("tab-peer-id");
  const tabRoomId = $("tab-room-id");
  const sectionPeerConnect = $("section-peer-connect");
  const sectionRoomConnect = $("section-room-connect");
  const peerIdInput = $("peer-id-input");
  const pastePeerIdBtn = $("paste-peer-id-btn");
  const connectButton = $("connect-button");
  const roomCustomInput = $("room-custom-input");
  const joinRoomBtn = $("join-room-btn");

  // File sharing
  const dropZone = $("drop-zone");
  const fileInput = $("file-input");
  const folderInput = $("folder-input");
  const browseFilesBtn = $("browse-files-btn");
  const browseFolderBtn = $("browse-folder-btn");
  const fileListUi = $("file-list");
  const selectedCount = $("selected-count");
  const selectedTotalSize = $("selected-total-size");
  const selectedFilesSection = $("selected-files-section");
  const clearFilesBtn = $("clear-files-btn");
  const targetPeerSelect = $("target-peer-select");
  const sendButton = $("send-button");

  // Transfers
  const transfersSection = $("transfers-section");
  const outgoingCard = $("outgoing-card");
  const outgoingCountBadge = $("outgoing-count-badge");
  const sendProgressList = $("send-progress-list");
  const receivedCard = $("received-card");
  const receivedCountBadge = $("received-count-badge");
  const receivedFiles = $("received-files");
  const clearReceivedBtn = $("clear-received-btn");

  // Chat & Connections
  const connectionCount = $("connection-count");
  const chatMessages = $("chat-messages");
  const chatInput = $("chat-input");
  const chatSend = $("chat-send");
  const chatPresence = $("chat-presence");
  const clearChatBtn = $("clear-chat-btn");

  // Modals
  const handshakeModal = $("handshake-modal");
  const handshakeMessage = $("handshake-message");
  const handshakeSecurityCode = $("handshake-security-code");
  const handshakeSecurityEmojis = $("handshake-security-emojis");
  const handshakeRememberCheckbox = $("handshake-remember-checkbox");
  const handshakeAccept = $("handshake-accept");
  const handshakeReject = $("handshake-reject");

  const fileOfferModal = $("file-offer-modal");
  const fileOfferSender = $("file-offer-sender");
  const fileOfferList = $("file-offer-list");
  const fileOfferAutoCheckbox = $("file-offer-auto-checkbox");
  const fileOfferAccept = $("file-offer-accept");
  const fileOfferReject = $("file-offer-reject");

  const roomModal = $("room-modal");
  const roomModalClose = $("room-modal-close");
  const roomQrCanvas = $("room-qr-canvas");
  const roomLinkInput = $("room-link-input");
  const copyRoomLinkBtn = $("copy-room-link-btn");
  const modalRoomInput = $("modal-room-input");
  const modalRoomSwitchBtn = $("modal-room-switch-btn");

  const filePreviewModal = $("file-preview-modal");
  const previewModalTitle = $("preview-modal-title");
  const previewModalIcon = $("preview-modal-icon");
  const previewModalBody = $("preview-modal-body");
  const previewModalDownload = $("preview-modal-download");
  const previewModalClose = $("preview-modal-close");

  // Direct LAN Turbo Modal & Indicators
  const sendTransportHint = $("send-transport-hint");
  const lanTurboModal = $("lan-turbo-modal");
  const lanTurboModalClose = $("lan-turbo-modal-close");
  const lanEngineModePill = $("lan-engine-mode-pill");
  const lanEngineDesc = $("lan-engine-desc");
  const lanRoutesCount = $("lan-routes-count");
  const lanPeerRoutesList = $("lan-peer-routes-list");
  const lanLanesHint = $("lan-lanes-hint");
  const lanHttpPipeRow = $("lan-http-pipe-row");
  const lanHttpPipeCheckbox = $("lan-http-pipe-checkbox");
  const strictLanCheckbox = $("strict-lan-checkbox");
  const lanBenchResultCard = $("lan-bench-result-card");
  const lanBenchStatus = $("lan-bench-status");
  const lanBenchMbs = $("lan-bench-mbs");
  const lanBenchMbps = $("lan-bench-mbps");
  const lanBenchMeta = $("lan-bench-meta");
  const lanBenchBar = $("lan-bench-bar");
  const lanReprobeBtn = $("lan-reprobe-btn");
  const lanSpeedtestBtn = $("lan-speedtest-btn");

  const LanTurbo = window.LocalShareLanTurbo || null;
  const lanServerConfig =
    window.LOCALSHARE_LAN_SERVER && window.LOCALSHARE_LAN_SERVER.enabled
      ? window.LOCALSHARE_LAN_SERVER
      : null;

  // ═══════════════════════════════════════════
  // Preferences & Persistent State
  // ═══════════════════════════════════════════
  const STORAGE_PREFIX = "ls_pref_";

  function getStored(key, fallback) {
    try {
      const v = localStorage.getItem(STORAGE_PREFIX + key);
      return v !== null ? v : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function setStored(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (_e) {}
  }

  const PREFS = {
    themeColor: getStored("theme_color", "#00E5FF"),
    nickname: getStored("nickname", ""),
    autoAccept: getStored("auto_accept", "false") === "true",
    sound: getStored("sound", "true") !== "false",
    turboLanes: getStored("turbo_lanes", "auto"),
    strictLanOnly: getStored("strict_lan_only", "false") === "true",
    useLanHttpPipe: getStored("use_lan_http_pipe", "true") !== "false",
    trustedPeers: (() => {
      try {
        return JSON.parse(getStored("trusted_peers", "[]"));
      } catch (_e) {
        return [];
      }
    })(),
  };

  function saveTrustedPeers() {
    setStored("trusted_peers", JSON.stringify(PREFS.trustedPeers));
  }

  // ═══════════════════════════════════════════
  // Theme Engine
  // ═══════════════════════════════════════════
  // NOTE: declared early on purpose — applyThemeColor() runs at startup and
  // repaints QR codes, so these must exist before that first call (avoids a
  // temporal-dead-zone crash that would abort the entire init handler).
  let currentPeerId = null; // set on peer open; used to repaint QR on theme change
  let isRoomResolved = false; // flips true once initDiscovery resolves the room

  function applyThemeColor(color) {
    PREFS.themeColor = color;
    setStored("theme_color", color);
    document.documentElement.style.setProperty("--color-primary", color);

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = color;

    // Repaint QR codes so they follow the theme (no-op until peer/room exist)
    refreshQrCodeColors();
  }
  applyThemeColor(PREFS.themeColor);

  if (themeBtn && themeDropdown) {
    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      themeDropdown.classList.add("hidden");
      closeMobileMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        themeDropdown.classList.add("hidden");
        closeMobileMenu();
        closeLanTurboModal();
      }
    });

    document.querySelectorAll(".theme-color-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        const color = swatch.getAttribute("data-color");
        if (color) {
          applyThemeColor(color);
          themeDropdown.classList.add("hidden");
          closeMobileMenu();
          showToast(`Theme updated`, "info");
        }
      });
    });
  }

  // ═══════════════════════════════════════════
  // Audio Feedback (Web Audio API Synthesizer)
  // ═══════════════════════════════════════════
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx && typeof AudioContext !== "undefined") {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    play(type) {
      if (!PREFS.sound) return;
      try {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === "connect") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === "complete") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === "message") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now); // A5
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === "alert") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        }
      } catch (_e) {}
    }
  }
  const sounds = new SoundEngine();

  // Sound toggle (desktop button + mobile menu row stay in sync)
  function updateSoundUi() {
    const on = PREFS.sound;
    if (soundIcon) {
      soundIcon.className = on ? "bi bi-volume-up" : "bi bi-volume-mute text-text/40";
    }
    if (soundToggleBtn) {
      soundToggleBtn.title = on ? "Sound Chimes: On" : "Sound Chimes: Muted";
    }
    if (soundMenuIcon) {
      soundMenuIcon.className = on ? "bi bi-volume-up text-primary" : "bi bi-volume-mute text-text/40";
    }
    if (soundMenuState) {
      soundMenuState.textContent = on ? "On" : "Muted";
      soundMenuState.className = on
        ? "text-[11px] font-semibold text-accent"
        : "text-[11px] font-semibold text-text/50";
    }
  }
  function toggleSound() {
    PREFS.sound = !PREFS.sound;
    setStored("sound", PREFS.sound ? "true" : "false");
    updateSoundUi();
    showToast(PREFS.sound ? "Audio chimes enabled" : "Audio muted", "info");
    if (PREFS.sound) sounds.play("message");
  }
  updateSoundUi();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", toggleSound);
  }
  if (soundMenuBtn) {
    soundMenuBtn.addEventListener("click", toggleSound);
  }

  // Auto-Accept toggle (desktop pill + mobile menu row stay in sync)
  function updateAutoAcceptUi() {
    const on = PREFS.autoAccept;
    if (autoAcceptToggle && autoAcceptIcon && autoAcceptLabel) {
      autoAcceptToggle.className = on
        ? "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all bg-accent/15 border-accent/30 text-accent"
        : "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all bg-white/5 border-white/10 text-text/60 hover:text-white";
      autoAcceptIcon.className = on ? "bi bi-shield-check" : "bi bi-shield-lock";
      autoAcceptLabel.textContent = on ? "Auto-Accept: ON" : "Auto-Accept: OFF";
      autoAcceptToggle.title = on
        ? "Auto-accepting file transfers from linked devices"
        : "Confirm every incoming file transfer (Recommended)";
    }
    if (autoAcceptMenuIcon) {
      autoAcceptMenuIcon.className = on ? "bi bi-shield-check text-accent" : "bi bi-shield-lock text-primary";
    }
    if (autoAcceptMenuState) {
      autoAcceptMenuState.textContent = on ? "On" : "Off";
      autoAcceptMenuState.className = on
        ? "text-[11px] font-semibold text-accent"
        : "text-[11px] font-semibold text-text/50";
    }
  }
  function toggleAutoAccept() {
    PREFS.autoAccept = !PREFS.autoAccept;
    setStored("auto_accept", PREFS.autoAccept ? "true" : "false");
    updateAutoAcceptUi();
    showToast(
      PREFS.autoAccept
        ? "Auto-accepting incoming transfers"
        : "Manual transfer approval enabled",
      "info"
    );
  }
  updateAutoAcceptUi();

  if (autoAcceptToggle) {
    autoAcceptToggle.addEventListener("click", toggleAutoAccept);
  }
  if (autoAcceptMenuBtn) {
    autoAcceptMenuBtn.addEventListener("click", toggleAutoAccept);
  }

  // Mobile hamburger menu (function declarations hoist — safe to call above)
  function isMobileMenuOpen() {
    return Boolean(mobileMenu && !mobileMenu.classList.contains("hidden"));
  }
  function setMobileMenuOpen(open) {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle("hidden", !open);
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      mobileMenuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenuBtn.title = open ? "Close menu" : "Open menu";
    }
    if (mobileMenuIcon) {
      mobileMenuIcon.className = open ? "bi bi-x-lg text-lg" : "bi bi-list text-lg";
    }
  }
  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMobileMenuOpen(!isMobileMenuOpen());
    });
  }
  if (mobileMenu) {
    // Taps inside the menu shouldn't bubble to the document closer
    mobileMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  // ═══════════════════════════════════════════
  // Device & Platform Detection
  // ═══════════════════════════════════════════
  function getDevicePlatform() {
    const ua = navigator.userAgent || "";
    if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
    if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return "phone";
    return "laptop";
  }

  function getPlatformIcon(platform) {
    if (platform === "phone") return "bi-phone";
    if (platform === "tablet") return "bi-tablet";
    return "bi-laptop";
  }

  const localPlatform = getDevicePlatform();

  // ═══════════════════════════════════════════
  // Name Generator & Nickname
  // ═══════════════════════════════════════════
  const adjectives = [
    "Sparkly", "Fluffy", "Happy", "Brave", "Clever", "Witty", "Sunny", "Cozy",
    "Gentle", "Lucky", "Swift", "Cosmic", "Neon", "Turbo", "Pixel", "Cyber",
    "Crystal", "Golden", "Silver", "Velvet", "Mighty", "Tiny", "Frosty", "Blazing",
    "Quantum", "Stellar", "Lunar", "Solar", "Misty", "Thunder", "Shadow", "Bright",
    "Coral", "Amber", "Indigo", "Violet", "Scarlet", "Azure", "Emerald", "Ruby"
  ];

  const nouns = [
    "Panda", "Unicorn", "Kitten", "Puppy", "Fox", "Badger", "Sparrow", "Dolphin",
    "Otter", "Rabbit", "Phoenix", "Dragon", "Falcon", "Tiger", "Wolf", "Eagle",
    "Koala", "Lynx", "Penguin", "Hedgehog", "Chameleon", "Flamingo", "Orca", "Cheetah",
    "Raven", "Stallion", "Jaguar", "Narwhal", "Platypus", "Axolotl", "Gecko", "Toucan"
  ];

  const nameEmojis = ["🚀", "⚡", "🌟", "🔥", "💎", "🎯", "🌊", "🦊", "🐺", "🦅", "🌙", "☀️", "🎨", "🎵", "🍀", "🌈"];

  function generateCuteName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const emoji = nameEmojis[Math.floor(Math.random() * nameEmojis.length)];
    return `${emoji} ${adj} ${noun} ${num}`;
  }

  let localPeerName = PREFS.nickname || generateCuteName();
  if (!PREFS.nickname) {
    setStored("nickname", localPeerName);
  }

  // ═══════════════════════════════════════════
  // Cryptographic Security Verification (SAS)
  // ═══════════════════════════════════════════
  function computeSecurityVerification(peerIdA, peerIdB) {
    const sorted = [String(peerIdA), String(peerIdB)].sort().join("::");
    let hash = 0x811c9dc5;
    for (let i = 0; i < sorted.length; i++) {
      hash ^= sorted.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    const code = String((hash % 9000) + 1000);
    const emojis = ["⚡", "💎", "🚀", "🔥", "🌟", "🛡️", "🎯", "🍀", "🌊", "🦊", "🪐", "🔑"];
    const e1 = emojis[hash % emojis.length];
    const e2 = emojis[(hash >>> 4) % emojis.length];
    const e3 = emojis[(hash >>> 8) % emojis.length];
    return { code, emojis: `${e1} ${e2} ${e3}` };
  }

  // ═══════════════════════════════════════════
  // Application State
  // ═══════════════════════════════════════════
  let peer = null;
  let localPeerIdOverride = null; // used in offline LAN server mode when PeerJS cloud is unavailable
  const connections = {}; // pid -> { conn, name, platform, security, rtt, status, pingTimer, turbo, turboStatus, lanNotified }
  let selectedFiles = [];
  const incomingTransfers = {}; // transferId -> transfer
  const outgoingTransfers = {}; // transferId -> transfer
  const earlyChunkBuffers = new Map(); // transferId -> { chunks: [], timer }
  const pendingFileOffers = {}; // offerId -> offerData
  const pendingHandshakes = []; // queue of incoming connection requests
  let isHandshakeModalActive = false;

  let nearbyRoomId = "local";
  let nearbyScanTimer = null;
  let roomHostPeer = null;
  let isRoomHost = false;
  let registryConn = null;
  const roomPeers = {}; // pid -> { peerId, name, platform, ts, lanServer? }
  const roomPeerConns = {}; // pid -> conn to client
  let isTransitioningDiscovery = false;

  // Optional Local LAN Server Bridge (only active when served via `npm start`)
  let lanServerClient = null;
  const lanDirectControlConns = new Map(); // pid -> LanControlConn (offline LAN WebRTC control channel)

  const appConfig = window.LOCALSHARE_CONFIG || {};
  const REGISTRY_HEARTBEAT_MS = 3500;
  const FILE_CHUNK_SIZE = 256 * 1024; // 256KB legacy PeerJS fallback chunks
  const MAX_BUFFERED_AMOUNT = 2 * 1024 * 1024; // 2MB fallback backpressure threshold

  function getActiveLocalPeerId() {
    return (peer && peer.id) || localPeerIdOverride || currentPeerId || null;
  }

  function getEffectiveDesiredLanes() {
    const isMobile = localPlatform !== "laptop";
    if (PREFS.turboLanes === "auto") {
      return isMobile ? (LanTurbo ? LanTurbo.DEFAULT_MOBILE_LANES : 2) : (LanTurbo ? LanTurbo.DEFAULT_DESKTOP_LANES : 4);
    }
    const parsed = Number(PREFS.turboLanes);
    if (!Number.isFinite(parsed) || parsed < 1) return isMobile ? 2 : 4;
    return Math.max(1, Math.min(6, Math.round(parsed)));
  }

  function isLanHttpPipeAvailableForPeer(pid) {
    if (!lanServerConfig || !lanServerConfig.httpPipeEnabled || !PREFS.useLanHttpPipe || !lanServerClient) {
      return false;
    }
    const entry = connections[pid];
    if (!entry) return false;
    const remoteOrigin = entry.turboStatus?.remoteCaps?.lanServerOrigin || entry.turbo?.remoteCaps?.lanServerOrigin;
    return Boolean(remoteOrigin && remoteOrigin === window.location.origin);
  }

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

  function sanitizeFileName(fileName) {
    const raw = String(fileName || "unnamed_file").replace(/^.*[\\\/]/, "");
    const clean = raw.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
    return clean.slice(0, 200) || "unnamed_file";
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
      info: "border-primary/40 text-primary",
      success: "border-accent/40 text-accent",
      error: "border-red-400/40 text-red-400",
      warning: "border-secondary/40 text-secondary",
    };

    const toast = document.createElement("div");
    toast.className = `toast-item ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i class="bi ${icons[type] || icons.info} text-base flex-shrink-0"></i>
      <span class="text-xs text-text/90 leading-tight">${safeMessage}</span>
    `;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const dm = i === 0 ? 0 : i === 1 ? 1 : 2;
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  function formatSpeed(bytesPerSec) {
    if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return "";
    if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }

  function formatSpeedWithMbps(bytesPerSec) {
    if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return "";
    if (LanTurbo && typeof LanTurbo.formatThroughput === "function") {
      return LanTurbo.formatThroughput(bytesPerSec).combined;
    }
    const mbs = formatSpeed(bytesPerSec);
    const mbps = (bytesPerSec * 8) / 1_000_000;
    const mbpsLabel = mbps >= 100 ? `${Math.round(mbps)} Mbps` : `${mbps.toFixed(1)} Mbps`;
    return `${mbs} (${mbpsLabel})`;
  }

  function formatEta(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    if (seconds < 60) return `~${Math.ceil(seconds)}s left`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `~${m}m ${s}s left`;
  }

  function getFileIcon(fileName) {
    const ext = String(fileName || "").split(".").pop().toLowerCase();
    const map = {
      pdf: "bi-file-earmark-pdf text-red-400",
      doc: "bi-file-earmark-word text-blue-400",
      docx: "bi-file-earmark-word text-blue-400",
      xls: "bi-file-earmark-excel text-emerald-400",
      xlsx: "bi-file-earmark-excel text-emerald-400",
      csv: "bi-file-earmark-spreadsheet text-emerald-400",
      ppt: "bi-file-earmark-ppt text-amber-400",
      pptx: "bi-file-earmark-ppt text-amber-400",
      jpg: "bi-file-earmark-image text-purple-400",
      jpeg: "bi-file-earmark-image text-purple-400",
      png: "bi-file-earmark-image text-purple-400",
      gif: "bi-file-earmark-image text-purple-400",
      svg: "bi-file-earmark-image text-purple-400",
      webp: "bi-file-earmark-image text-purple-400",
      mp3: "bi-file-earmark-music text-yellow-400",
      wav: "bi-file-earmark-music text-yellow-400",
      flac: "bi-file-earmark-music text-yellow-400",
      aac: "bi-file-earmark-music text-yellow-400",
      ogg: "bi-file-earmark-music text-yellow-400",
      mp4: "bi-file-earmark-play text-rose-400",
      mkv: "bi-file-earmark-play text-rose-400",
      avi: "bi-file-earmark-play text-rose-400",
      mov: "bi-file-earmark-play text-rose-400",
      webm: "bi-file-earmark-play text-rose-400",
      zip: "bi-file-earmark-zip text-orange-400",
      rar: "bi-file-earmark-zip text-orange-400",
      "7z": "bi-file-earmark-zip text-orange-400",
      tar: "bi-file-earmark-zip text-orange-400",
      gz: "bi-file-earmark-zip text-orange-400",
      js: "bi-file-earmark-code text-cyan-400",
      ts: "bi-file-earmark-code text-cyan-400",
      py: "bi-file-earmark-code text-emerald-400",
      html: "bi-file-earmark-code text-amber-400",
      css: "bi-file-earmark-code text-blue-400",
      json: "bi-file-earmark-code text-yellow-300",
      txt: "bi-file-earmark-text text-text/70",
      md: "bi-file-earmark-text text-text/70",
    };
    return map[ext] || "bi-file-earmark text-text/60";
  }

  function updateTransferVisibility() {
    if (!sendProgressList || !receivedFiles || !outgoingCard || !receivedCard || !transfersSection) {
      return;
    }
    const hasOutgoing = sendProgressList.children.length > 0;
    const hasReceived = receivedFiles.children.length > 0;

    outgoingCard.classList.toggle("hidden", !hasOutgoing);
    receivedCard.classList.toggle("hidden", !hasReceived);
    transfersSection.classList.toggle("hidden", !hasOutgoing && !hasReceived);

    if (outgoingCountBadge) {
      outgoingCountBadge.textContent = `${sendProgressList.children.length} Active`;
    }
    if (receivedCountBadge) {
      receivedCountBadge.textContent = `${receivedFiles.children.length} File${receivedFiles.children.length === 1 ? "" : "s"}`;
    }
  }

  // Clear received files list
  if (clearReceivedBtn) {
    clearReceivedBtn.addEventListener("click", () => {
      if (receivedFiles) receivedFiles.innerHTML = "";
      updateTransferVisibility();
      showToast("Received files list cleared", "info");
    });
  }

  // ═══════════════════════════════════════════
  // Checksum & Transfer Binary Framing
  // ═══════════════════════════════════════════
  async function lsReadBlobAsArrayBuffer(blob) {
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

  function lsToUint8Array(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (Array.isArray(data)) return new Uint8Array(data);
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
    const step = 1024 * 1024; // 1MB chunks for checksum
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
      if (arr[0] !== 0) return arr[0] >>> 0;
    } catch (_e) {}
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

  // ═══════════════════════════════════════════
  // Multi-Service Room ID Resolution
  // ═══════════════════════════════════════════
  async function resolveNearbyRoomId() {
    // 1. Check URL hash (#room=...) or query param (?room=...)
    try {
      const hash = window.location.hash;
      if (hash && hash.includes("room=")) {
        const match = hash.match(/room=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          return match[1].toLowerCase().slice(0, 24);
        }
      }
      const search = new URLSearchParams(window.location.search);
      if (search.has("room")) {
        const room = search.get("room").trim();
        if (room) return room.toLowerCase().slice(0, 24);
      }
    } catch (_e) {}

    // Helper fetch with timeout
    const fetchWithTimeout = async (url, timeoutMs = 2500) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });
        clearTimeout(timer);
        return res;
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    };

    // 2. Try primary public IP service: ipify.org (IPv4)
    try {
      const res = await fetchWithTimeout("https://api.ipify.org?format=json", 2500);
      const data = await res.json();
      if (data && data.ip) {
        let hash = 0x811c9dc5;
        const ipStr = String(data.ip).trim();
        for (let i = 0; i < ipStr.length; i++) {
          hash ^= ipStr.charCodeAt(i);
          hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return `room-${hash.toString(16).padStart(8, "0").slice(0, 6)}`;
      }
    } catch (_err) {
      console.warn("ipify primary check failed, testing fallback...");
    }

    // 3. Fallback: icanhazip.com
    try {
      const res = await fetchWithTimeout("https://icanhazip.com", 2500);
      const ip = (await res.text()).trim();
      if (ip && ip.length > 3) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < ip.length; i++) {
          hash ^= ip.charCodeAt(i);
          hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return `room-${hash.toString(16).padStart(8, "0").slice(0, 6)}`;
      }
    } catch (_err) {
      console.warn("icanhazip fallback failed, testing api64...");
    }

    // 4. Fallback: api64.ipify.org
    try {
      const res = await fetchWithTimeout("https://api64.ipify.org?format=json", 2500);
      const data = await res.json();
      if (data && data.ip) {
        let hash = 0x811c9dc5;
        const ipStr = String(data.ip).trim();
        for (let i = 0; i < ipStr.length; i++) {
          hash ^= ipStr.charCodeAt(i);
          hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return `room-${hash.toString(16).padStart(8, "0").slice(0, 6)}`;
      }
    } catch (_err) {
      console.warn("Public IP lookups failed, falling back to host room...");
    }

    // 5. Hostname / local network fallback
    const fallback = (window.location.hostname || "local")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    return `local-${fallback.slice(0, 8) || "net"}`;
  }

  // ═══════════════════════════════════════════
  // Peer Engine Setup
  // ═══════════════════════════════════════════
  function getPeerOptions() {
    const peerOptions = {
      debug: 1,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      },
    };
    if (appConfig.peer) {
      Object.assign(peerOptions, appConfig.peer);
    }
    return peerOptions;
  }

  function generatePeerId() {
    try {
      if (window.crypto && crypto.randomUUID) {
        return `ls-${nearbyRoomId}-${crypto.randomUUID().slice(0, 8)}`;
      }
    } catch (_e) {}
    const rnd = Math.random().toString(36).substring(2, 10);
    return `ls-${nearbyRoomId}-${rnd}`;
  }

  async function initDiscovery() {
    nearbyRoomId = await resolveNearbyRoomId();
    isRoomResolved = true;
    console.log("LocalShare Room ID:", nearbyRoomId);

    // Sync room ID to URL hash without reload
    try {
      window.history.replaceState(null, "", `#room=${nearbyRoomId}`);
    } catch (_e) {}

    updateRoomBadgeUi();
    initPeer();
  }

  function updateRoomBadgeUi() {
    setNetworkLabel(`Room: #${nearbyRoomId.toUpperCase()}`);
    if (modalRoomInput) {
      modalRoomInput.value = nearbyRoomId;
    }
    if (roomLinkInput) {
      const roomUrl = `${window.location.origin}${window.location.pathname}#room=${nearbyRoomId}`;
      roomLinkInput.value = roomUrl;
    }
    renderRoomQrCode();
  }

  function renderRoomQrCode() {
    if (!roomQrCanvas || typeof QRCode === "undefined") return;
    try {
      const roomUrl = `${window.location.origin}${window.location.pathname}#room=${nearbyRoomId}`;
      QRCode.toCanvas(roomQrCanvas, roomUrl, {
        width: 160,
        margin: 1,
        color: { dark: PREFS.themeColor, light: "#000000" },
      });
    } catch (_e) {}
  }

  // Repaints every QR code with the current theme accent. Called from
  // applyThemeColor (covers desktop + mobile swatches). Safe to call before
  // the peer engine is online — each render is individually guarded.
  // (Function declaration hoists, so the early applyThemeColor() call is safe.)
  function refreshQrCodeColors() {
    if (typeof QRCode === "undefined") return;
    try {
      if (currentPeerId && qrCodeCanvas && qrCodeCanvas.isConnected) {
        QRCode.toCanvas(qrCodeCanvas, currentPeerId, {
          width: 160,
          margin: 1,
          color: { dark: PREFS.themeColor, light: "#000000" },
        });
      }
    } catch (_e) {}
    if (isRoomResolved) renderRoomQrCode();
  }

  function initPeer() {
    const attemptId = generatePeerId();

    if (peer) {
      try {
        peer.destroy();
      } catch (_e) {}
      peer = null;
    }

    // If running on our optional local LAN server (`npm start`), bring up offline-capable LAN discovery immediately!
    if (lanServerConfig && LanTurbo) {
      localPeerIdOverride = attemptId;
      currentPeerId = attemptId;
      startLanServerBridge(attemptId);
      if (deviceStatusDot) deviceStatusDot.className = "status-dot online";
      setNetworkDotClass("bg-accent animate-pulse");
      renderMyDeviceCard(attemptId);
      displayQrCode(attemptId);
    }

    try {
      peer = new Peer(attemptId, getPeerOptions());
    } catch (err) {
      console.error("Failed to initialize PeerJS:", err);
      if (!lanServerConfig) {
        showToast("PeerJS engine failed to initialize", "error");
      }
      return;
    }

    peer.on("open", (id) => {
      console.log("Local Peer Online:", id);
      currentPeerId = id;
      localPeerIdOverride = id;

      if (deviceStatusDot) deviceStatusDot.className = "status-dot online";
      setNetworkDotClass("bg-accent animate-pulse");

      renderMyDeviceCard(id);
      displayQrCode(id);
      startNearbyScan();
      bootstrapRoomRegistry();
      if (lanServerConfig && LanTurbo) {
        startLanServerBridge(id);
      }
      sounds.play("connect");
    });

    peer.on("connection", (conn) => {
      handleIncomingConnection(conn);
    });

    peer.on("error", (err) => {
      if (err && err.message && err.message.includes("ls-roomhost-") && err.message.includes("taken")) {
        return; // Normal host contention
      }
      console.error("PeerJS Error:", err);

      if (err && err.type === "unavailable-id") {
        setTimeout(() => initPeer(), 300 + Math.random() * 400);
        return;
      }
      if (lanServerConfig && lanServerClient && lanServerClient.connected) {
        // Running offline on local LAN server — PeerJS cloud isn't required!
        if (deviceRoleBadge) {
          deviceRoleBadge.textContent = "LAN Offline Mode";
          deviceRoleBadge.className = "text-[10px] font-semibold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full";
        }
        return;
      }
      showToast(`Network notice: ${err && err.type ? err.type : err}`, "warning");
    });

    peer.on("disconnected", () => {
      if (lanServerConfig && lanServerClient && lanServerClient.connected) {
        return; // Stay online locally via LAN server
      }
      if (deviceStatusDot) deviceStatusDot.className = "status-dot offline";
      setNetworkDotClass("bg-red-400");
      showToast("Signaling disconnected. Auto-reconnecting...", "warning");

      setTimeout(() => {
        try {
          if (peer && !peer.destroyed) peer.reconnect();
        } catch (_e) {}
      }, 2000);
    });
  }

  // ═══════════════════════════════════════════
  // Optional Local LAN Server Bridge (Offline Discovery + Local Signaling)
  // Active ONLY when served via `npm start` (`server.cjs`)
  // ═══════════════════════════════════════════
  function createLanControlConn(remoteId, metadata = {}) {
    const handlers = {};
    const pc = new RTCPeerConnection({ iceServers: [], bundlePolicy: "max-bundle" });
    const connObj = {
      peer: remoteId,
      metadata,
      open: false,
      destroyed: false,
      isLanDirectControl: true,
      peerConnection: pc,
      dataChannel: null,
      _pendingIce: [],
      _remoteDescSet: false,
      on(ev, cb) {
        (handlers[ev] ||= []).push(cb);
      },
      _emit(ev, payload) {
        (handlers[ev] || []).forEach((fn) => {
          try { fn(payload); } catch (_e) {}
        });
      },
      send(data) {
        if (!connObj.dataChannel || connObj.dataChannel.readyState !== "open") return;
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          connObj.dataChannel.send(data);
        } else {
          connObj.dataChannel.send(JSON.stringify(data));
        }
      },
      close() {
        if (connObj.destroyed) return;
        connObj.destroyed = true;
        connObj.open = false;
        lanDirectControlConns.delete(remoteId);
        try { connObj.dataChannel?.close(); } catch (_e) {}
        try { pc.close(); } catch (_e) {}
        connObj._emit("close");
      },
    };

    const bindDc = (dc) => {
      connObj.dataChannel = dc;
      try { dc.binaryType = "arraybuffer"; } catch (_e) {}
      dc.onopen = () => {
        connObj.open = true;
        connObj._emit("open");
      };
      dc.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          try {
            connObj._emit("data", JSON.parse(ev.data));
          } catch (_e) {}
        } else {
          connObj._emit("data", ev.data);
        }
      };
      dc.onclose = () => connObj.close();
      dc.onerror = (err) => connObj._emit("error", err);
    };

    connObj._bindDc = bindDc;

    pc.onicecandidate = (ev) => {
      if (!ev.candidate || !ev.candidate.candidate || !lanServerClient) return;
      lanServerClient
        .sendSignal(remoteId, {
          type: "lan-ctrl-ice",
          candidate: ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate,
        })
        .catch(() => {});
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed") {
        connObj.close();
      }
    };

    lanDirectControlConns.set(remoteId, connObj);
    return connObj;
  }

  async function initiateLanServerControlConnection(remoteId) {
    if (!lanServerClient || typeof RTCPeerConnection === "undefined") return null;
    const metadata = { name: localPeerName, platform: localPlatform, type: "handshake" };
    const conn = createLanControlConn(remoteId, metadata);
    const dc = conn.peerConnection.createDataChannel("ls-ctrl", { ordered: true });
    conn._bindDc(dc);

    const offer = await conn.peerConnection.createOffer();
    await conn.peerConnection.setLocalDescription(offer);
    await lanServerClient.sendSignal(remoteId, {
      type: "lan-ctrl-offer",
      metadata,
      sdp: conn.peerConnection.localDescription.toJSON(),
    });
    return conn;
  }

  async function handleLanServerSignal(fromPeerId, payload) {
    if (!payload || !fromPeerId) return;

    if (payload.type === "lan-ctrl-offer") {
      if (typeof RTCPeerConnection === "undefined") return;
      const conn = createLanControlConn(fromPeerId, payload.metadata || {});
      conn.peerConnection.ondatachannel = (ev) => conn._bindDc(ev.channel);
      await conn.peerConnection.setRemoteDescription(payload.sdp);
      conn._remoteDescSet = true;
      while (conn._pendingIce.length) {
        try { await conn.peerConnection.addIceCandidate(conn._pendingIce.shift()); } catch (_e) {}
      }
      const answer = await conn.peerConnection.createAnswer();
      await conn.peerConnection.setLocalDescription(answer);
      await lanServerClient.sendSignal(fromPeerId, {
        type: "lan-ctrl-answer",
        sdp: conn.peerConnection.localDescription.toJSON(),
      });
      handleIncomingConnection(conn);
      return;
    }

    const existing = lanDirectControlConns.get(fromPeerId);
    if (!existing) return;

    if (payload.type === "lan-ctrl-answer") {
      await existing.peerConnection.setRemoteDescription(payload.sdp);
      existing._remoteDescSet = true;
      while (existing._pendingIce.length) {
        try { await existing.peerConnection.addIceCandidate(existing._pendingIce.shift()); } catch (_e) {}
      }
    } else if (payload.type === "lan-ctrl-ice" && payload.candidate) {
      if (!existing._remoteDescSet) {
        existing._pendingIce.push(payload.candidate);
      } else {
        try { await existing.peerConnection.addIceCandidate(payload.candidate); } catch (_e) {}
      }
    }
  }

  function startLanServerBridge(myPeerId) {
    if (!lanServerConfig || !LanTurbo || !myPeerId) return;
    if (lanServerClient) {
      lanServerClient.disconnect();
      lanServerClient = null;
    }

    lanServerClient = new LanTurbo.LanServerTransport({
      peerId: myPeerId,
      room: nearbyRoomId,
      name: localPeerName,
      platform: localPlatform,
      onStatus: (connected) => {
        if (connected && deviceRoleBadge && (!peer || peer.disconnected)) {
          deviceRoleBadge.textContent = "LAN Server";
          deviceRoleBadge.className = "text-[10px] font-semibold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full";
        }
        updateGlobalLanIndicators();
      },
      onRoster: (peers) => {
        const myId = getActiveLocalPeerId();
        const activeLanIds = new Set();
        peers.forEach((p) => {
          if (!p.peerId || p.peerId === myId) return;
          activeLanIds.add(p.peerId);
          roomPeers[p.peerId] = {
            peerId: p.peerId,
            name: p.name || "LAN Device",
            platform: p.platform || "laptop",
            ts: Date.now(),
            lanServer: true,
          };
        });
        // Prune departed LAN-only peers
        Object.entries(roomPeers).forEach(([pid, entry]) => {
          if (entry.lanServer && !activeLanIds.has(pid)) {
            delete roomPeers[pid];
          }
        });
        renderNearbyPeers(Object.values(roomPeers).filter((p) => p.peerId !== myId));
      },
      onSignal: ({ from, payload }) => {
        handleLanServerSignal(from, payload).catch((err) => {
          console.warn("LAN signal error:", err);
        });
      },
    });
    lanServerClient.connect();
  }

  // ═══════════════════════════════════════════
  // My Device UI & Renaming
  // ═══════════════════════════════════════════
  function renderMyDeviceCard(id) {
    if (!statusEl) return;
    const laneCount = getEffectiveDesiredLanes();
    const turboSummary = lanServerConfig
      ? `🚀 LAN Server Direct • Raw TCP Pipe + ${laneCount}× WebRTC`
      : `⚡ Direct LAN Turbo Ready (${laneCount}× Parallel Channels)`;

    statusEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0 text-primary shadow-sm">
            <i class="bi ${getPlatformIcon(localPlatform)} text-xl"></i>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span id="device-name-display" class="text-sm font-bold text-white truncate">${escapeHtml(localPeerName)}</span>
              <button id="edit-name-btn" class="text-text/40 hover:text-primary transition-colors text-xs" title="Rename this device">
                <i class="bi bi-pencil-square"></i>
              </button>
            </div>
            <p class="text-[11px] font-mono text-text/40 truncate select-all mt-0.5">${escapeHtml(id)}</p>
          </div>

          <button id="copy-id-btn" class="icon-btn flex-none text-text/60 hover:text-primary" title="Copy Peer ID">
            <i class="bi bi-clipboard"></i>
          </button>
        </div>

        <!-- Inline Name Editor Form (Hidden by default) -->
        <div id="name-edit-form" class="hidden flex flex-wrap gap-2 items-center pt-1">
          <input type="text" id="name-edit-input" maxlength="32" class="input-field text-xs py-1 px-2.5 flex-1 min-w-[140px]" value="${escapeHtml(localPeerName)}">
          <button id="save-name-btn" class="btn-primary-sm text-xs py-1 px-2.5">Save</button>
          <button id="cancel-name-btn" class="btn-ghost text-xs py-1 px-2">Cancel</button>
        </div>

        <div id="discovery-status" class="text-xs text-text/50 space-y-1 pt-1 border-t border-white/5">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            <span>Room: <strong class="text-text/80 font-mono">#${escapeHtml(nearbyRoomId)}</strong> • Auto-discovering devices</span>
          </div>
          <div class="text-[10px] text-accent/85 font-mono truncate">${escapeHtml(turboSummary)}</div>
        </div>
      </div>
    `;

    // Copy ID button
    const copyIdBtn = $("copy-id-btn");
    if (copyIdBtn) {
      copyIdBtn.onclick = () => {
        navigator.clipboard.writeText(id)
          .then(() => {
            copyIdBtn.innerHTML = '<i class="bi bi-check text-accent"></i>';
            showToast("Peer ID copied to clipboard!", "success");
            setTimeout(() => {
              copyIdBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
            }, 2000);
          })
          .catch(() => showToast("Could not copy Peer ID", "error"));
      };
    }

    // Rename Device
    const editBtn = $("edit-name-btn");
    const editForm = $("name-edit-form");
    const editInput = $("name-edit-input");
    const saveBtn = $("save-name-btn");
    const cancelBtn = $("cancel-name-btn");
    const nameDisplay = $("device-name-display");

    if (editBtn && editForm && editInput && saveBtn && cancelBtn) {
      editBtn.onclick = () => {
        editForm.classList.remove("hidden");
        editInput.focus();
        editInput.select();
      };

      cancelBtn.onclick = () => {
        editForm.classList.add("hidden");
        editInput.value = localPeerName;
      };

      const doSaveName = () => {
        const val = editInput.value.trim();
        if (val && val !== localPeerName) {
          localPeerName = val.slice(0, 32);
          setStored("nickname", localPeerName);
          nameDisplay.textContent = localPeerName;
          editForm.classList.add("hidden");
          showToast(`Device renamed to "${localPeerName}"`, "success");

          // Broadcast rename to all active connections
          Object.values(connections).forEach(({ conn }) => {
            if (conn.open) {
              try {
                conn.send({ type: "peer-name", name: localPeerName, platform: localPlatform });
              } catch (_e) {}
            }
          });

          // Update registry
          const activeId = getActiveLocalPeerId();
          if (isRoomHost && activeId) {
            upsertRoomPeer(activeId, localPeerName, localPlatform);
            publishRoster();
          } else if (registryConn && registryConn.open && activeId) {
            try {
              registryConn.send({
                type: "registry-register",
                peerId: activeId,
                name: localPeerName,
                platform: localPlatform,
              });
            } catch (_e) {}
          }
          if (lanServerClient && activeId) {
            startLanServerBridge(activeId);
          }
        } else {
          editForm.classList.add("hidden");
        }
      };

      saveBtn.onclick = doSaveName;
      editInput.onkeydown = (e) => {
        if (e.key === "Enter") doSaveName();
        if (e.key === "Escape") cancelBtn.onclick();
      };
    }
  }

  function displayQrCode(id) {
    if (id) currentPeerId = id;
    if (!qrCodeCanvas || !qrCodeContainer) return;
    if (typeof QRCode === "undefined") {
      qrCodeContainer.innerHTML = `<p class="text-xs text-text/40 font-mono">${escapeHtml(id)}</p>`;
      return;
    }
    try {
      QRCode.toCanvas(qrCodeCanvas, id, {
        width: 160,
        margin: 1,
        color: {
          dark: PREFS.themeColor,
          light: "#000000",
        },
      });
    } catch (err) {
      console.warn("QR render failed:", err);
    }
  }

  // Toggle QR Code Card
  if (toggleQrBtn && qrCodeContainer && toggleQrLabel) {
    toggleQrBtn.addEventListener("click", () => {
      const isHidden = qrCodeContainer.classList.contains("hidden");
      if (isHidden) {
        qrCodeContainer.classList.remove("hidden");
        toggleQrLabel.textContent = "Hide QR Code";
      } else {
        qrCodeContainer.classList.add("hidden");
        toggleQrLabel.textContent = "Show QR Code";
      }
    });
  }

  // Share device invite link
  if (shareDeviceLinkBtn) {
    shareDeviceLinkBtn.addEventListener("click", () => {
      const link = `${window.location.origin}${window.location.pathname}#room=${nearbyRoomId}`;
      navigator.clipboard.writeText(link)
        .then(() => showToast("Direct room link copied to clipboard!", "success"))
        .catch(() => showToast("Could not copy link", "error"));
    });
  }

  // ═══════════════════════════════════════════
  // Room Management & Switcher Modal
  // ═══════════════════════════════════════════
  if (roomModal) {
    // Wires both the desktop pill and the mobile sub-bar button
    $$(".js-room-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeMobileMenu();
        updateRoomBadgeUi();
        roomModal.classList.remove("hidden");
        roomModal.classList.add("flex");
      });
    });
  }

  if (roomModalClose && roomModal) {
    roomModalClose.addEventListener("click", () => {
      roomModal.classList.add("hidden");
      roomModal.classList.remove("flex");
    });
  }

  if (copyRoomLinkBtn && roomLinkInput) {
    copyRoomLinkBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(roomLinkInput.value)
        .then(() => showToast("Room invite link copied!", "success"))
        .catch(() => showToast("Could not copy link", "error"));
    });
  }

  function switchRoom(newRoomName) {
    const clean = String(newRoomName || "")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .toLowerCase()
      .slice(0, 24);

    if (!clean) {
      showToast("Please enter a valid room name", "warning");
      return;
    }
    if (clean === nearbyRoomId) {
      showToast("Already in this room", "info");
      return;
    }

    showToast(`Switching to room #${clean}...`, "info");

    // Close existing connections
    Object.keys(connections).forEach((pid) => {
      window.disconnectPeer(pid);
    });

    if (roomHostPeer) {
      try { roomHostPeer.destroy(); } catch (_e) {}
      roomHostPeer = null;
      isRoomHost = false;
    }

    if (registryConn) {
      try { registryConn.close(); } catch (_e) {}
      registryConn = null;
    }

    if (lanServerClient) {
      lanServerClient.disconnect();
      lanServerClient = null;
    }

    nearbyRoomId = clean;
    try {
      window.history.replaceState(null, "", `#room=${nearbyRoomId}`);
    } catch (_e) {}

    updateRoomBadgeUi();

    if (roomModal) {
      roomModal.classList.add("hidden");
      roomModal.classList.remove("flex");
    }

    initPeer();
  }

  if (modalRoomSwitchBtn && modalRoomInput) {
    modalRoomSwitchBtn.addEventListener("click", () => {
      switchRoom(modalRoomInput.value);
    });
    modalRoomInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") switchRoom(modalRoomInput.value);
    });
  }

  // ═══════════════════════════════════════════
  // Manual Connect Tabs & Form
  // ═══════════════════════════════════════════
  if (tabPeerId && tabRoomId && sectionPeerConnect && sectionRoomConnect) {
    tabPeerId.addEventListener("click", () => {
      tabPeerId.className = "px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 transition-all";
      tabRoomId.className = "px-2.5 py-1 rounded-lg bg-white/5 text-text/60 hover:text-white border border-white/10 transition-all";
      sectionPeerConnect.classList.remove("hidden");
      sectionRoomConnect.classList.add("hidden");
    });

    tabRoomId.addEventListener("click", () => {
      tabRoomId.className = "px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 transition-all";
      tabPeerId.className = "px-2.5 py-1 rounded-lg bg-white/5 text-text/60 hover:text-white border border-white/10 transition-all";
      sectionRoomConnect.classList.remove("hidden");
      sectionPeerConnect.classList.add("hidden");
    });
  }

  if (pastePeerIdBtn && peerIdInput) {
    pastePeerIdBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          peerIdInput.value = text.trim();
          showToast("Pasted from clipboard", "info");
        }
      } catch (_e) {
        showToast("Clipboard access denied. Please paste manually.", "warning");
      }
    });
  }

  if (connectButton && peerIdInput) {
    connectButton.addEventListener("click", () => {
      requestConnection(peerIdInput.value.trim());
    });
    peerIdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") requestConnection(peerIdInput.value.trim());
    });
  }

  if (joinRoomBtn && roomCustomInput) {
    joinRoomBtn.addEventListener("click", () => {
      switchRoom(roomCustomInput.value);
    });
    roomCustomInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") switchRoom(roomCustomInput.value);
    });
  }

  // ═══════════════════════════════════════════
  // Connection Handshake Queue & Security
  // ═══════════════════════════════════════════
  function handleIncomingConnection(conn) {
    const remoteId = conn.peer;
    const remoteName = conn.metadata?.name || "Unknown Device";
    const remotePlatform = conn.metadata?.platform || "laptop";

    // Deduplication: if already connected, ignore duplicate connection
    if (connections[remoteId] && connections[remoteId].status === "active") {
      try { conn.close(); } catch (_e) {}
      return;
    }

    // Check if this peer is remembered/trusted
    const isTrusted = PREFS.trustedPeers.includes(remoteId);
    if (isTrusted) {
      acceptIncomingConnection(conn, remoteName, remotePlatform);
      return;
    }

    // Add to handshake queue
    pendingHandshakes.push({ conn, remoteId, remoteName, remotePlatform });
    processHandshakeQueue();
  }

  function processHandshakeQueue() {
    if (isHandshakeModalActive || pendingHandshakes.length === 0) return;
    isHandshakeModalActive = true;

    const request = pendingHandshakes.shift();
    const { conn, remoteId, remoteName, remotePlatform } = request;

    if (!conn || conn.destroyed) {
      isHandshakeModalActive = false;
      processHandshakeQueue();
      return;
    }

    const { code, emojis } = computeSecurityVerification(getActiveLocalPeerId() || "", remoteId);

    if (handshakeMessage) {
      handshakeMessage.innerHTML = `
        <strong class="text-white">${escapeHtml(remoteName)}</strong>
        (${escapeHtml(remotePlatform)}) wants to link with you.
      `;
    }

    if (handshakeSecurityCode) handshakeSecurityCode.textContent = code;
    if (handshakeSecurityEmojis) handshakeSecurityEmojis.textContent = emojis;
    if (handshakeRememberCheckbox) handshakeRememberCheckbox.checked = false;

    sounds.play("alert");

    handshakeModal.classList.remove("hidden");
    handshakeModal.classList.add("flex");

    const cleanup = () => {
      handshakeModal.classList.add("hidden");
      handshakeModal.classList.remove("flex");
      isHandshakeModalActive = false;
      handshakeAccept.onclick = null;
      handshakeReject.onclick = null;
      setTimeout(() => processHandshakeQueue(), 100);
    };

    handshakeAccept.onclick = () => {
      if (handshakeRememberCheckbox && handshakeRememberCheckbox.checked) {
        if (!PREFS.trustedPeers.includes(remoteId)) {
          PREFS.trustedPeers.push(remoteId);
          saveTrustedPeers();
        }
      }
      cleanup();
      acceptIncomingConnection(conn, remoteName, remotePlatform);
    };

    handshakeReject.onclick = () => {
      cleanup();
      try {
        conn.send({ type: "handshake-response", accepted: false });
      } catch (_e) {}
      setTimeout(() => {
        try { conn.close(); } catch (_e) {}
      }, 200);
      showToast(`Declined connection from ${remoteName}`, "info");
    };
  }

  function acceptIncomingConnection(conn, remoteName, remotePlatform) {
    const respond = () => {
      try {
        conn.send({
          type: "handshake-response",
          accepted: true,
          name: localPeerName,
          platform: localPlatform,
        });
      } catch (_e) {}
    };

    if (conn.open) {
      respond();
    } else {
      conn.on("open", respond);
    }

    setupConnection(conn, remoteName, remotePlatform, true);
    showToast(`Connected to ${remoteName}`, "success");
    sounds.play("connect");
  }

  // ═══════════════════════════════════════════
  // Direct LAN Turbo Session Attachment & Route Badges
  // ═══════════════════════════════════════════
  function getPeerRouteBadgeInfo(pid) {
    const entry = connections[pid];
    if (!entry) {
      return { cls: "lan-badge-probing", text: "Idle", title: "Disconnected" };
    }
    if (isLanHttpPipeAvailableForPeer(pid)) {
      return {
        cls: "lan-badge-tcp",
        text: "🚀 LAN TCP Pipe",
        title: "Both devices on local LAN server — raw kernel TCP pipe at full Wi-Fi/Ethernet router link speed",
      };
    }

    const st = entry.turboStatus;
    if (!st || st.state === "idle") {
      return { cls: "lan-badge-probing", text: "P2P", title: "Standard WebRTC DataChannel" };
    }
    if (st.state === "probing-lan") {
      return {
        cls: "lan-badge-probing",
        text: "🔍 Probing LAN...",
        title: "Testing direct host-to-host local router path (iceServers: [])",
      };
    }
    if (st.state === "probing-wan") {
      return {
        cls: "lan-badge-probing",
        text: "🔍 Turbo P2P...",
        title: "Negotiating parallel raw direct WebRTC lanes",
      };
    }
    if (st.state === "lan-direct" || st.isLanDirect) {
      const lanes = st.activeLanes || 0;
      const laneSuffix = lanes > 0 ? ` • ${lanes}×` : "";
      const routeDetail = st.routeInfo?.detail || "Direct local router UDP/SCTP";
      return {
        cls: "lan-badge-direct",
        text: `⚡ LAN Direct${laneSuffix}`,
        title: `${routeDetail} (${lanes} parallel raw lanes, bypasses PeerServer)`,
      };
    }
    if (st.state === "wan-p2p") {
      const lanes = st.activeLanes || 0;
      return {
        cls: "lan-badge-wan",
        text: lanes > 0 ? `🌐 Direct P2P • ${lanes}×` : "🌐 Direct P2P",
        title: `${st.routeInfo?.detail || "Direct WAN WebRTC"} (${lanes} raw turbo lanes)`,
      };
    }
    if (st.state === "relayed") {
      return {
        cls: "lan-badge-relay",
        text: "☁️ Relayed",
        title: "TURN relay path (not on same LAN)",
      };
    }
    if (st.state === "lan-strict-blocked") {
      return {
        cls: "lan-badge-relay",
        text: "🛡️ LAN Blocked",
        title: "Strict LAN-Only Mode enabled and no direct LAN route was found",
      };
    }
    return {
      cls: "lan-badge-probing",
      text: "🔌 PeerJS",
      title: "Standard PeerJS compatibility channel",
    };
  }

  function updateGlobalLanIndicators() {
    const entries = Object.entries(connections);
    let lanDirectCount = 0;
    let lanTcpCount = 0;
    let maxLanes = 0;

    entries.forEach(([pid, entry]) => {
      if (isLanHttpPipeAvailableForPeer(pid)) {
        lanTcpCount += 1;
        lanDirectCount += 1;
      } else if (entry.turboStatus && entry.turboStatus.isLanDirect) {
        lanDirectCount += 1;
        maxLanes = Math.max(maxLanes, entry.turboStatus.activeLanes || 0);
      }
    });

    const labelText =
      lanTcpCount > 0
        ? "LAN TCP Pipe"
        : lanDirectCount > 0
          ? `LAN Direct${maxLanes > 0 ? ` ${maxLanes}×` : ""}`
          : lanServerConfig
            ? "LAN Server"
            : PREFS.strictLanOnly
              ? "LAN Strict"
              : "LAN Turbo";

    $$(".js-lan-turbo-label").forEach((el) => {
      el.textContent = labelText;
    });

    if (sendTransportHint) {
      if (lanTcpCount > 0) {
        sendTransportHint.textContent = "🚀 Direct LAN TCP Pipe • Router Link Speed";
        sendTransportHint.className = "hidden min-[420px]:block text-[10px] text-accent font-semibold whitespace-nowrap";
      } else if (lanDirectCount > 0) {
        sendTransportHint.textContent = `⚡ LAN Direct (${maxLanes || getEffectiveDesiredLanes()}× Raw Turbo) • Wi-Fi Link Speed`;
        sendTransportHint.className = "hidden min-[420px]:block text-[10px] text-accent font-semibold whitespace-nowrap";
      } else {
        sendTransportHint.textContent = "Encrypted Direct P2P • No Limits";
        sendTransportHint.className = "hidden min-[420px]:block text-[10px] text-text/50 font-medium whitespace-nowrap";
      }
    }

    if (lanTurboModal && !lanTurboModal.classList.contains("hidden")) {
      renderLanTurboModal();
    }
  }

  function attachLanTurboSession(pid) {
    const entry = connections[pid];
    if (!entry || entry.turbo || !LanTurbo) return;

    const myId = getActiveLocalPeerId();
    if (!myId) return;

    const session = new LanTurbo.LanTurboPeerSession({
      localPeerId: myId,
      remotePeerId: pid,
      isMobile: localPlatform !== "laptop",
      desiredLanes: getEffectiveDesiredLanes(),
      strictLanOnly: PREFS.strictLanOnly,
      fallbackPeerConnection: entry.conn?.peerConnection || null,
      getIceServers: () => getPeerOptions().config?.iceServers || [],
      sendSignal: (msg) => {
        if (entry.conn && entry.conn.open) {
          try {
            entry.conn.send(msg);
          } catch (_e) {}
        }
      },
      onChunk: (frame) => {
        handleTurboRawChunk(frame, pid);
      },
      onStateChange: (snapshot) => {
        if (!connections[pid]) return;
        connections[pid].turboStatus = snapshot;

        // Celebrate first confirmed Direct LAN lock!
        if (
          snapshot.isLanDirect &&
          snapshot.activeLanes > 0 &&
          !connections[pid].lanNotified
        ) {
          connections[pid].lanNotified = true;
          const rttStr =
            snapshot.routeInfo && snapshot.routeInfo.rttMs !== null
              ? ` • ${snapshot.routeInfo.rttMs}ms`
              : "";
          showToast(
            `⚡ Direct LAN locked with ${connections[pid].name} (${snapshot.activeLanes}× parallel lanes${rttStr})`,
            "success",
            4200
          );
        }

        // Update peer route badge in-place if present (avoids tearing down whole peer list unnecessarily)
        const badgeEl = document.getElementById(`route-badge-${pid}`);
        if (badgeEl) {
          const info = getPeerRouteBadgeInfo(pid);
          badgeEl.className = info.cls;
          badgeEl.textContent = info.text;
          badgeEl.title = info.title;
        } else {
          updatePeerListUi();
        }
        updateGlobalLanIndicators();
      },
    });

    entry.turbo = session;
    entry.turboStatus = session.getStatusSnapshot();

    session.start({
      lanServerOrigin: lanServerConfig ? window.location.origin : null,
      lanServerClientId: lanServerClient ? myId : null,
    });
  }

  function setupConnection(conn, name, platform = "laptop", handshakeAccepted = false) {
    const pid = conn.peer;

    // Deduplication check: if upgrading the same connection after handshake, never rebind listeners
    if (connections[pid] && connections[pid].conn === conn) {
      if (name) connections[pid].name = name;
      if (platform) connections[pid].platform = platform;
      if (handshakeAccepted) {
        connections[pid].handshakeAccepted = true;
        if (conn.open) attachLanTurboSession(pid);
      }
      updatePeerListUi();
      updateChatPresence();
      updateTargetPeerSelector();
      updateGlobalLanIndicators();
      return;
    }

    if (connections[pid] && connections[pid].conn !== conn) {
      try { connections[pid].turbo?.destroy(); } catch (_e) {}
      try { connections[pid].conn.close(); } catch (_e) {}
    }

    const { code, emojis } = computeSecurityVerification(getActiveLocalPeerId() || "", pid);

    connections[pid] = {
      conn,
      name,
      platform,
      security: { code, emojis },
      rtt: null,
      status: "active",
      handshakeAccepted,
      pingTimer: null,
      turbo: null,
      turboStatus: null,
      lanNotified: false,
    };

    // Ensure raw ArrayBuffer is expected on this WebRTC channel
    if (conn.dataChannel) {
      try {
        conn.dataChannel.binaryType = "arraybuffer";
      } catch (_e) {}
    }

    let didDisconnect = false;
    const removeConnection = (reason) => {
      if (didDisconnect) return;
      didDisconnect = true;

      if (connections[pid]?.pingTimer) {
        clearInterval(connections[pid].pingTimer);
      }
      if (connections[pid]?.turbo) {
        try { connections[pid].turbo.destroy(); } catch (_e) {}
      }
      delete connections[pid];

      if (reason) showToast(reason, "info");

      updatePeerListUi();
      updateChatPresence();
      updateTargetPeerSelector();
      updateGlobalLanIndicators();

      if (isRoomHost) publishRoster();
    };

    const onConnected = () => {
      if (conn.dataChannel) {
        try { conn.dataChannel.binaryType = "arraybuffer"; } catch (_e) {}
      }

      updatePeerListUi();
      updateChatPresence();
      updateTargetPeerSelector();

      // Send greeting with platform
      try {
        conn.send({
          type: "peer-name",
          name: localPeerName,
          platform: localPlatform,
        });
      } catch (_e) {}

      // Start periodic RTT ping
      startConnectionPing(pid);

      // Exchange gossip peers
      try {
        conn.send({
          type: "peer-gossip",
          peers: getSanitizedRoster(),
        });
      } catch (_e) {}

      // Start Direct LAN Turbo probe & upgrade once handshake is accepted
      if (connections[pid] && connections[pid].handshakeAccepted) {
        attachLanTurboSession(pid);
      }

      if (isRoomHost) publishRoster();
    };

    if (conn.open) {
      onConnected();
    } else {
      conn.on("open", onConnected);
    }

    conn.on("data", (data) => {
      // 1. Raw binary chunk (fallback PeerJS channel or LAN turbo frame sent over fallback)
      if (data instanceof Blob) {
        data.arrayBuffer().then((buffer) => handleRawTransferChunk(buffer, pid)).catch(() => {});
        return;
      }
      if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        handleRawTransferChunk(data, pid);
        return;
      }
      if (!data || typeof data !== "object") return;

      // 2. Direct LAN Turbo signaling & benchmark control messages
      if (
        typeof data.type === "string" &&
        (data.type.startsWith("lan-turbo-") || data.type.startsWith("lan-bench-"))
      ) {
        if (connections[pid] && !connections[pid].turbo && connections[pid].handshakeAccepted) {
          attachLanTurboSession(pid);
        }
        if (connections[pid] && connections[pid].turbo) {
          connections[pid].turbo.handleSignalMessage(data);
        }
        return;
      }

      // 3. Structured messages
      switch (data.type) {
        // Handshake response
        case "handshake-response":
          if (data.accepted) {
            showToast(`Connection accepted by ${data.name || "Peer"}`, "success");
            setupConnection(conn, data.name || "Peer", data.platform || "laptop", true);
            sounds.play("connect");
          } else {
            showToast("Connection declined by peer", "warning");
            try { conn.close(); } catch (_e) {}
          }
          break;

        // Peer Rename / Greeting
        case "peer-name":
          if (connections[pid]) {
            if (data.name) connections[pid].name = String(data.name).slice(0, 32);
            if (data.platform) connections[pid].platform = data.platform;
            updatePeerListUi();
            updateChatPresence();
            updateTargetPeerSelector();
          }
          break;

        // Latency Ping / Pong
        case "ls-ping":
          try {
            conn.send({ type: "ls-pong", ts: data.ts });
          } catch (_e) {}
          break;

        case "ls-pong":
          if (connections[pid] && data.ts) {
            const rtt = Math.max(1, Math.round((Date.now() - data.ts) / 2));
            connections[pid].rtt = rtt;
            updatePeerRttDisplay(pid, rtt);
          }
          break;

        // Mesh Gossip
        case "peer-gossip":
          if (Array.isArray(data.peers)) {
            const myId = getActiveLocalPeerId();
            data.peers.forEach((p) => {
              if (p.peerId && p.peerId !== myId && !roomPeers[p.peerId]) {
                upsertRoomPeer(p.peerId, p.name, p.platform);
              }
            });
            renderNearbyPeers(Object.values(roomPeers).filter((p) => p.peerId !== myId));
          }
          break;

        // File Transfer: Offer
        case "file-offer":
          handleIncomingFileOffer(data, pid);
          break;

        // File Transfer: Accept/Decline Offer
        case "file-offer-response":
          handleFileOfferResponse(data, pid);
          break;

        // File Transfer: Direct LAN Raw HTTP/TCP Stream Ready (when running `npm start`)
        case "lan-http-stream-ready":
          handleLanHttpStreamReady(data, pid);
          break;

        // File Transfer: Metadata (Start)
        case "file-metadata":
          handleFileMetadata(data, pid);
          break;

        // File Transfer: Cancel
        case "transfer-cancel":
          handleTransferCancelMessage(data, pid);
          break;

        // File Transfer: Completed
        case "transfer-complete":
          handleTransferCompleteMessage(data, pid);
          break;

        // File Transfer: Receiver ACK
        case "transfer-ack":
          handleTransferAckMessage(data, pid);
          break;

        // Chat
        case "chat-message":
          appendChatMessage(data.from || connections[pid]?.name || "Peer", data.message || "", false, data.ts);
          sounds.play("message");
          break;

        // Clean Disconnect
        case "disconnect-notice":
          removeConnection(`${connections[pid]?.name || name} disconnected`);
          try { conn.close(); } catch (_e) {}
          break;

        default:
          break;
      }
    });

    conn.on("close", () => {
      removeConnection(`${connections[pid]?.name || name} disconnected`);
    });

    conn.on("error", (err) => {
      console.warn("Connection error with", name, err);
      removeConnection(`Connection dropped with ${connections[pid]?.name || name}`);
    });
  }

  function startConnectionPing(pid) {
    if (!connections[pid]) return;
    if (connections[pid].pingTimer) clearInterval(connections[pid].pingTimer);

    // Initial ping
    try {
      connections[pid].conn.send({ type: "ls-ping", ts: Date.now() });
    } catch (_e) {}

    connections[pid].pingTimer = setInterval(() => {
      if (connections[pid] && connections[pid].conn.open) {
        try {
          connections[pid].conn.send({ type: "ls-ping", ts: Date.now() });
        } catch (_e) {}
      }
    }, 6000);
  }

  function updatePeerRttDisplay(pid, rtt) {
    const el = document.getElementById(`rtt-${pid}`);
    if (el) {
      const color = rtt < 15 ? "text-accent" : rtt < 60 ? "text-emerald-400" : rtt < 150 ? "text-yellow-400" : "text-red-400";
      el.className = `text-[10px] font-mono font-medium ${color} flex items-center gap-1`;
      el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-current"></span>${rtt}ms`;
    }
  }

  function requestConnection(remoteId) {
    if (!remoteId) {
      showToast("Please enter a Peer ID first", "warning");
      return;
    }
    const myId = getActiveLocalPeerId();
    if (!myId) {
      showToast("P2P engine is not ready yet", "warning");
      return;
    }
    if (remoteId === myId) {
      showToast("Cannot connect to yourself", "warning");
      return;
    }
    if (connections[remoteId]) {
      showToast("Already connected to this device", "info");
      return;
    }

    // If both peers are on the local LAN Server (`npm start`) AND either PeerJS is offline OR target is LAN-server-discovered,
    // prefer zero-internet local LAN WebRTC signaling!
    const targetEntry = roomPeers[remoteId];
    if (
      lanServerClient &&
      lanServerClient.connected &&
      ((targetEntry && targetEntry.lanServer) || !peer || peer.destroyed || peer.disconnected)
    ) {
      showToast(`Linking directly over local LAN...`, "info");
      initiateLanServerControlConnection(remoteId)
        .then((lanConn) => {
          if (lanConn) {
            setupConnection(lanConn, targetEntry?.name || "Connecting...", targetEntry?.platform || "laptop", false);
          }
        })
        .catch(() => {
          showToast("Direct LAN signaling failed", "error");
        });
      return;
    }

    if (!peer || peer.destroyed) {
      showToast("P2P engine is not ready yet", "warning");
      return;
    }

    showToast(`Requesting connection...`, "info");

    const conn = peer.connect(remoteId, {
      metadata: {
        name: localPeerName,
        platform: localPlatform,
        type: "handshake",
      },
      reliable: true,
    });

    setupConnection(conn, "Connecting...", "laptop", false);
  }

  window.disconnectPeer = (id) => {
    if (!connections[id]) return;
    const target = connections[id].conn;
    try {
      if (target.open) target.send({ type: "disconnect-notice" });
    } catch (_e) {}
    try { connections[id].turbo?.destroy(); } catch (_e) {}
    try { target.close(); } catch (_e) {}
    if (connections[id]?.pingTimer) clearInterval(connections[id].pingTimer);
    delete connections[id];

    updatePeerListUi();
    updateChatPresence();
    updateTargetPeerSelector();
    updateGlobalLanIndicators();

    if (isRoomHost) publishRoster();
    showToast("Peer disconnected", "info");
  };

  // ═══════════════════════════════════════════
  // Chat System
  // ═══════════════════════════════════════════
  function updateChatPresence() {
    const count = Object.keys(connections).length;
    if (connectionCount) connectionCount.textContent = String(count);
    if (!chatPresence) return;

    if (count > 0) {
      chatPresence.textContent = `${count} Online`;
      chatPresence.className = "text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-semibold border border-accent/25";
    } else {
      chatPresence.textContent = "Offline";
      chatPresence.className = "text-[10px] bg-white/5 text-text/40 px-2 py-0.5 rounded-full font-medium border border-white/5";
    }
  }

  function appendChatMessage(sender, text, isLocal = false, ts = null) {
    if (!text || !chatMessages) return;

    if (
      chatMessages.children.length === 1 &&
      chatMessages.children[0].textContent.includes("Chat messages between connected devices")
    ) {
      chatMessages.innerHTML = "";
    }

    const timeStr = new Date(ts || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const li = document.createElement("li");
    li.className = `p-2.5 max-w-[85%] ${isLocal ? "chat-bubble-local" : "chat-bubble-remote"}`;

    li.innerHTML = `
      <div class="flex items-center justify-between gap-3 mb-1">
        <span class="text-[10px] font-bold ${isLocal ? "text-primary" : "text-text/70"} truncate">${escapeHtml(sender)}</span>
        <span class="text-[9px] font-mono text-text/30 flex-shrink-0">${timeStr}</span>
      </div>
      <p class="text-xs text-text/90 break-words leading-relaxed select-text">${escapeHtml(text)}</p>
    `;

    chatMessages.appendChild(li);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendChatMessage(customText = null) {
    if (!chatInput) return;
    const text = (customText !== null ? customText : chatInput.value).trim();
    if (!text) return;

    const peers = Object.values(connections);
    if (!peers.length) {
      showToast("Connect to a peer to chat", "warning");
      return;
    }

    const now = Date.now();
    peers.forEach(({ conn }) => {
      if (conn.open) {
        try {
          conn.send({
            type: "chat-message",
            from: localPeerName,
            message: text,
            ts: now,
          });
        } catch (_e) {}
      }
    });

    appendChatMessage(localPeerName, text, true, now);
    if (customText === null) chatInput.value = "";
  }

  if (chatSend) chatSend.addEventListener("click", () => sendChatMessage());
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // Quick Emoji reactions
  document.querySelectorAll(".chat-quick-reaction").forEach((btn) => {
    btn.addEventListener("click", () => {
      const emoji = btn.getAttribute("data-emoji");
      if (emoji) sendChatMessage(emoji);
    });
  });

  if (clearChatBtn && chatMessages) {
    clearChatBtn.addEventListener("click", () => {
      chatMessages.innerHTML = `
        <li class="text-xs text-text/30 italic text-center py-8">Chat messages cleared</li>
      `;
      showToast("Chat cleared", "info");
    });
  }

  // ═══════════════════════════════════════════
  // UI Updates: Peer List & Nearby Devices
  // ═══════════════════════════════════════════
  function updatePeerListUi() {
    if (!peerList) return;
    peerList.innerHTML = "";

    const entries = Object.entries(connections);
    if (entries.length === 0) {
      peerList.innerHTML = `
        <li class="text-xs text-text/40 italic text-center py-6 flex flex-col items-center gap-2">
          <i class="bi bi-diagram-3 text-lg text-text/20"></i>
          <span>No active connections.<br>Connect to a nearby device to start transferring.</span>
        </li>
      `;
      scanNearbyPeers();
      return;
    }

    entries.forEach(([id, data]) => {
      const li = document.createElement("li");
      li.className = "connection-card";

      const rttColor = data.rtt && data.rtt < 15 ? "bg-accent" : "bg-emerald-400";
      const rttText = data.rtt
        ? `<span class="w-1.5 h-1.5 rounded-full ${rttColor}"></span>${data.rtt}ms`
        : `<span class="w-1.5 h-1.5 rounded-full bg-text/30"></span>--`;
      const platformIcon = getPlatformIcon(data.platform);
      const badge = getPeerRouteBadgeInfo(id);

      li.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="peer-icon">
            <i class="bi ${platformIcon} text-base"></i>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="peer-name truncate min-w-0 flex-1">${escapeHtml(data.name)}</p>
              <span class="security-badge text-[9px] px-1.5 py-0" title="Security Verification Code: verify this matches on both devices">
                🔒 ${data.security?.code || "OK"}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 mt-1 min-w-0">
              <span id="route-badge-${escapeHtml(id)}" class="${badge.cls}" title="${escapeHtml(badge.title)}">${escapeHtml(badge.text)}</span>
              <span id="rtt-${escapeHtml(id)}" class="text-[10px] font-mono text-text/40 flex items-center gap-1 flex-shrink-0">${rttText}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <button class="icon-btn text-text/50 hover:text-accent peer-speedtest-btn" title="Run LAN link speed test with this device">
            <i class="bi bi-speedometer2 text-xs"></i>
          </button>
          <button class="icon-btn text-text/50 hover:text-primary quick-send-peer-btn" title="Send files to this device">
            <i class="bi bi-cloud-arrow-up text-xs"></i>
          </button>
          <button class="icon-btn text-text/50 hover:text-red-400 disconnect-btn" title="Disconnect device">
            <i class="bi bi-x-lg text-xs"></i>
          </button>
        </div>
      `;

      li.querySelector(".disconnect-btn")?.addEventListener("click", () => {
        window.disconnectPeer(id);
      });

      li.querySelector(".peer-speedtest-btn")?.addEventListener("click", () => {
        openLanTurboModal();
        runLanSpeedTestForPeer(id);
      });

      li.querySelector(".quick-send-peer-btn")?.addEventListener("click", () => {
        if (targetPeerSelect) targetPeerSelect.value = id;
        if (fileInput) fileInput.click();
      });

      peerList.appendChild(li);
    });

    scanNearbyPeers();
  }

  // ═══════════════════════════════════════════
  // Direct LAN Turbo Modal, Settings & 1-Click Speed Test
  // ═══════════════════════════════════════════
  function updateLaneButtonsUi() {
    $$(".lan-lanes-btn").forEach((btn) => {
      const val = btn.getAttribute("data-lanes");
      const active = val === String(PREFS.turboLanes);
      btn.className = active
        ? "lan-lanes-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all bg-primary/20 text-primary border-primary/50"
        : "lan-lanes-btn px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all bg-white/5 text-text/65 hover:text-white border-white/10";
    });
    if (lanLanesHint) {
      lanLanesHint.textContent =
        PREFS.turboLanes === "auto"
          ? `Auto (${getEffectiveDesiredLanes()}× active)`
          : `${getEffectiveDesiredLanes()}× parallel lanes`;
    }
  }

  function renderLanTurboModal() {
    updateLaneButtonsUi();

    if (strictLanCheckbox) strictLanCheckbox.checked = PREFS.strictLanOnly;
    if (lanHttpPipeRow) {
      lanHttpPipeRow.classList.toggle("hidden", !(lanServerConfig && lanServerConfig.httpPipeEnabled));
    }
    if (lanHttpPipeCheckbox) lanHttpPipeCheckbox.checked = PREFS.useLanHttpPipe;

    if (lanEngineModePill && lanEngineDesc) {
      if (lanServerConfig) {
        const ips = Array.isArray(lanServerConfig.lanIps) && lanServerConfig.lanIps.length
          ? lanServerConfig.lanIps.map((ip) => `http://${ip}:${lanServerConfig.port}`).join(", ")
          : window.location.origin;
        lanEngineModePill.className = "lan-badge-tcp";
        lanEngineModePill.textContent = "🚀 LAN Server Active";
        lanEngineDesc.textContent = `Offline LAN discovery + Direct Raw TCP/HTTP Pipe + Multi-Lane WebRTC Turbo enabled. Open ${ips} on other Wi-Fi devices.`;
      } else {
        lanEngineModePill.className = "lan-badge-direct";
        lanEngineModePill.textContent = "⚡ Browser LAN Turbo";
        lanEngineDesc.textContent =
          "Peers on the same Wi-Fi/LAN automatically upgrade to parallel raw UDP/SCTP host-to-host channels directly across your local router — zero PeerServer data relay and zero BinaryPack overhead.";
      }
    }

    const entries = Object.entries(connections);
    if (lanRoutesCount) {
      lanRoutesCount.textContent = `${entries.length} peer${entries.length === 1 ? "" : "s"}`;
    }

    if (lanPeerRoutesList) {
      if (entries.length === 0) {
        lanPeerRoutesList.innerHTML = `
          <li class="p-3 rounded-xl bg-white/3 border border-white/6 text-xs text-text/45 text-center italic">
            Connect to a nearby device to inspect its live LAN/WAN path and parallel lanes.
          </li>
        `;
      } else {
        lanPeerRoutesList.innerHTML = "";
        entries.forEach(([pid, data]) => {
          const badge = getPeerRouteBadgeInfo(pid);
          const st = data.turboStatus;
          const rttVal = st?.routeInfo?.rttMs ?? data.rtt;
          const routeDetail = isLanHttpPipeAvailableForPeer(pid)
            ? "Local Server Kernel TCP Stream Pipe (zero DTLS overhead)"
            : st?.routeInfo?.detail || "Negotiating direct LAN channels...";
          const lastBench = st?.lastBenchResult?.formatted?.combined
            ? ` • Peak ${st.lastBenchResult.formatted.combined}`
            : "";

          const li = document.createElement("li");
          li.className = "p-2.5 rounded-xl bg-white/4 border border-white/8 flex items-center justify-between gap-2";
          li.innerHTML = `
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-white truncate">${escapeHtml(data.name)}</span>
                <span class="${badge.cls}">${escapeHtml(badge.text)}</span>
              </div>
              <p class="text-[10px] font-mono text-text/50 truncate mt-0.5">
                ${escapeHtml(routeDetail)}${rttVal ? ` • ${rttVal}ms` : ""}${escapeHtml(lastBench)}
              </p>
            </div>
            <button type="button" class="btn-connect-sm text-[10px] py-1 px-2 run-peer-bench-btn">
              <i class="bi bi-speedometer2"></i> Test
            </button>
          `;
          li.querySelector(".run-peer-bench-btn")?.addEventListener("click", () => {
            runLanSpeedTestForPeer(pid);
          });
          lanPeerRoutesList.appendChild(li);
        });
      }
    }
  }

  function openLanTurboModal() {
    if (!lanTurboModal) return;
    closeMobileMenu();
    renderLanTurboModal();
    lanTurboModal.classList.remove("hidden");
    lanTurboModal.classList.add("flex");
  }

  function closeLanTurboModal() {
    if (!lanTurboModal) return;
    lanTurboModal.classList.add("hidden");
    lanTurboModal.classList.remove("flex");
  }

  async function runLanSpeedTestForPeer(targetPid = null) {
    const pid =
      targetPid ||
      Object.keys(connections).find((id) => connections[id]?.turbo?.getOpenLanes?.().length > 0) ||
      Object.keys(connections)[0];

    if (!pid || !connections[pid]) {
      showToast("Connect to a device first to run a LAN speed test", "warning");
      return;
    }

    const entry = connections[pid];
    if (!entry.turbo || entry.turbo.getOpenLanes().length === 0) {
      showToast("Direct LAN Turbo lanes are not open yet — try Re-probe LAN", "warning");
      return;
    }

    if (lanBenchResultCard) lanBenchResultCard.classList.remove("hidden");
    if (lanBenchStatus) lanBenchStatus.textContent = `Testing ${entry.name}...`;
    if (lanBenchMbs) lanBenchMbs.textContent = "...";
    if (lanBenchMbps) lanBenchMbps.textContent = "";
    if (lanBenchMeta) lanBenchMeta.textContent = `${entry.turbo.getOpenLanes().length}× lanes`;
    if (lanBenchBar) lanBenchBar.style.width = "5%";
    if (lanSpeedtestBtn) lanSpeedtestBtn.disabled = true;

    try {
      const res = await entry.turbo.runSpeedTest({
        durationMs: 2500,
        onProgress: ({ speedBps, pct }) => {
          const fmt = LanTurbo ? LanTurbo.formatThroughput(speedBps) : { mbs: formatSpeed(speedBps), mbps: "" };
          if (lanBenchMbs) lanBenchMbs.textContent = fmt.mbs;
          if (lanBenchMbps) lanBenchMbps.textContent = fmt.mbps;
          if (lanBenchBar) lanBenchBar.style.width = `${Math.round(pct)}%`;
        },
      });

      if (lanBenchBar) lanBenchBar.style.width = "100%";
      if (lanBenchMbs) lanBenchMbs.textContent = res.formatted.mbs;
      if (lanBenchMbps) lanBenchMbps.textContent = res.formatted.mbps;
      const routeTag = res.isLanDirect ? "⚡ LAN Direct" : "🌐 Direct P2P";
      const rttTag = res.rttMs !== null ? ` • ${res.rttMs}ms` : "";
      if (lanBenchStatus) {
        lanBenchStatus.textContent = res.verifiedByReceiver ? "Verified RX throughput" : "TX throughput";
      }
      if (lanBenchMeta) {
        lanBenchMeta.textContent = `${routeTag} • ${res.lanesUsed}× lanes${rttTag}`;
      }

      showToast(
        `${routeTag} Speed Test: ${res.formatted.combined} (${res.lanesUsed}× lanes${rttTag})`,
        "success",
        5000
      );
      renderLanTurboModal();
    } catch (err) {
      if (lanBenchStatus) lanBenchStatus.textContent = err.message || "Benchmark failed";
      showToast(err.message || "LAN speed test failed", "warning");
    } finally {
      if (lanSpeedtestBtn) lanSpeedtestBtn.disabled = false;
    }
  }

  // Wire LAN Turbo Modal Buttons & Controls
  $$(".js-lan-turbo-btn").forEach((btn) => {
    btn.addEventListener("click", openLanTurboModal);
  });
  if (lanTurboModalClose) {
    lanTurboModalClose.addEventListener("click", closeLanTurboModal);
  }
  $$(".lan-lanes-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-lanes") || "auto";
      PREFS.turboLanes = val;
      setStored("turbo_lanes", val);
      updateLaneButtonsUi();
      const desired = getEffectiveDesiredLanes();
      Object.values(connections).forEach((entry) => {
        if (entry.turbo) entry.turbo.updateConfig({ desiredLanes: desired });
      });
      if (getActiveLocalPeerId()) renderMyDeviceCard(getActiveLocalPeerId());
      showToast(`Parallel LAN lanes set to ${val === "auto" ? `Auto (${desired}×)` : `${desired}×`}`, "info");
    });
  });

  if (strictLanCheckbox) {
    strictLanCheckbox.addEventListener("change", () => {
      PREFS.strictLanOnly = Boolean(strictLanCheckbox.checked);
      setStored("strict_lan_only", PREFS.strictLanOnly ? "true" : "false");
      Object.values(connections).forEach((entry) => {
        if (entry.turbo) entry.turbo.updateConfig({ strictLanOnly: PREFS.strictLanOnly });
      });
      updateGlobalLanIndicators();
      showToast(
        PREFS.strictLanOnly
          ? "Strict LAN-Only Mode ON (WAN fallback blocked)"
          : "Strict LAN-Only Mode OFF (auto LAN priority + WAN fallback)",
        "info"
      );
    });
  }

  if (lanHttpPipeCheckbox) {
    lanHttpPipeCheckbox.addEventListener("change", () => {
      PREFS.useLanHttpPipe = Boolean(lanHttpPipeCheckbox.checked);
      setStored("use_lan_http_pipe", PREFS.useLanHttpPipe ? "true" : "false");
      updatePeerListUi();
      updateGlobalLanIndicators();
      showToast(
        PREFS.useLanHttpPipe
          ? "Direct LAN Raw TCP/HTTP Pipe enabled"
          : "Using Direct LAN WebRTC Multi-Lane Turbo",
        "info"
      );
    });
  }

  if (lanReprobeBtn) {
    lanReprobeBtn.addEventListener("click", () => {
      const entries = Object.values(connections);
      if (!entries.length) {
        showToast("No connected peers to re-probe", "info");
        return;
      }
      entries.forEach((entry) => {
        entry.lanNotified = false;
        if (entry.turbo) entry.turbo.reprobe();
      });
      showToast("Re-probing direct local LAN routes...", "info");
      renderLanTurboModal();
    });
  }

  if (lanSpeedtestBtn) {
    lanSpeedtestBtn.addEventListener("click", () => {
      runLanSpeedTestForPeer(null);
    });
  }

  function updateTargetPeerSelector() {
    if (!targetPeerSelect) return;
    const currentVal = targetPeerSelect.value;
    targetPeerSelect.innerHTML = `<option value="all">⚡ All Connected Devices (${Object.keys(connections).length})</option>`;

    Object.entries(connections).forEach(([id, data]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = `🎯 ${data.name} (${data.platform || "device"})`;
      targetPeerSelect.appendChild(opt);
    });

    if (connections[currentVal]) {
      targetPeerSelect.value = currentVal;
    } else {
      targetPeerSelect.value = "all";
    }
  }

  function renderNearbyPeers(peers) {
    if (!nearbyList) return;

    if (!peers.length) {
      nearbyList.innerHTML = `
        <li class="p-5 text-center text-xs text-text/40 italic flex flex-col items-center justify-center gap-2.5 rounded-xl bg-white/2 border border-white/5">
          <div class="radar-container">
            <div class="radar-wave"></div>
            <div class="radar-wave"></div>
            <i class="bi bi-radar text-primary text-sm relative z-10"></i>
          </div>
          <span>No other devices found in Room #${escapeHtml(nearbyRoomId)}.<br>Open this link on another device or Wi-Fi to auto-discover!</span>
        </li>
      `;
      if (discoveryBadge) discoveryBadge.textContent = "Scanning";
      return;
    }

    if (discoveryBadge) discoveryBadge.textContent = `${peers.length} Found`;

    nearbyList.innerHTML = "";
    peers.forEach(({ peerId, name, platform }) => {
      const isConnected = Boolean(connections[peerId]);
      const li = document.createElement("li");
      li.className = "connection-card";

      const platformIcon = getPlatformIcon(platform);

      li.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text/70 flex-shrink-0">
            <i class="bi ${platformIcon} text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-white truncate">${escapeHtml(name)}</p>
            <p class="text-[10px] font-mono text-text/40 truncate">${escapeHtml(peerId.slice(0, 24))}...</p>
          </div>
        </div>

        <button class="btn-connect-sm flex-shrink-0 ${isConnected ? "opacity-50 pointer-events-none" : ""}" ${isConnected ? "disabled" : ""}>
          ${isConnected ? '<i class="bi bi-check2 text-accent"></i> Linked' : '<i class="bi bi-plug"></i> Connect'}
        </button>
      `;

      if (!isConnected) {
        li.querySelector("button")?.addEventListener("click", () => {
          requestConnection(peerId);
        });
      }

      nearbyList.appendChild(li);
    });
  }

  // ═══════════════════════════════════════════
  // Room Registry & Discovery Architecture
  // ═══════════════════════════════════════════
  function getRoomHostId() {
    return `ls-roomhost-${nearbyRoomId}`;
  }

  function upsertRoomPeer(peerId, name, platform) {
    roomPeers[peerId] = {
      peerId,
      name: name || "Nearby Device",
      platform: platform || "laptop",
      ts: Date.now(),
    };
  }

  function removeRoomPeer(peerId) {
    delete roomPeers[peerId];
    delete roomPeerConns[peerId];
  }

  function getSanitizedRoster() {
    return Object.values(roomPeers).map(({ peerId, name, platform, ts }) => ({
      peerId,
      name,
      platform,
      ts,
    }));
  }

  function publishRoster() {
    const now = Date.now();
    Object.values(roomPeers).forEach((entry) => {
      if (entry.peerId !== peer?.id && now - (entry.ts || 0) > REGISTRY_HEARTBEAT_MS * 4) {
        removeRoomPeer(entry.peerId);
      }
    });

    const roster = getSanitizedRoster();
    renderNearbyPeers(roster.filter((p) => p.peerId !== peer?.id));

    if (!isRoomHost) return;

    Object.entries(roomPeerConns).forEach(([peerId, targetConn]) => {
      if (targetConn && targetConn.open) {
        try {
          targetConn.send({ type: "registry-roster", peers: roster });
        } catch (_e) {}
      } else {
        delete roomPeerConns[peerId];
      }
    });
  }

  function startRegistryHeartbeat() {
    if (nearbyScanTimer) clearInterval(nearbyScanTimer);

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
            platform: localPlatform,
          });
        } catch (_e) {}
      } else if (!isTransitioningDiscovery) {
        connectToRoomHost();
      }
    }, REGISTRY_HEARTBEAT_MS);
  }

  function setupRoomHostPeer() {
    if (!roomHostPeer) return;
    isRoomHost = true;
    if (deviceRoleBadge) {
      deviceRoleBadge.textContent = "Room Host";
      deviceRoleBadge.className = "text-[10px] font-semibold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full";
    }

    if (peer && peer.id) {
      upsertRoomPeer(peer.id, localPeerName, localPlatform);
    }

    roomHostPeer.on("connection", (conn) => {
      conn.on("data", (data) => {
        if (!data || data.type !== "registry-register") return;
        const regPid = data.peerId || conn.peer;
        conn._registryPeerId = regPid;
        upsertRoomPeer(regPid, data.name || "Nearby Device", data.platform || "laptop");
        roomPeerConns[regPid] = conn;
        publishRoster();
      });

      conn.on("close", () => {
        removeRoomPeer(conn._registryPeerId || conn.peer);
        publishRoster();
      });
    });

    // Auto-reconnect room host peer on signaling drops
    roomHostPeer.on("disconnected", () => {
      setTimeout(() => {
        try {
          if (roomHostPeer && !roomHostPeer.destroyed) roomHostPeer.reconnect();
        } catch (_e) {}
      }, 2000);
    });

    publishRoster();
  }

  function becomeRoomHost() {
    if (roomHostPeer || isRoomHost) return;
    isTransitioningDiscovery = true;

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
      setupRoomHostPeer();
    });

    roomHostPeer.on("error", (err) => {
      try { roomHostPeer.destroy(); } catch (_e) {}
      roomHostPeer = null;
      isRoomHost = false;

      // Another device became host: wait with jitter then connect as client
      if (err && (err.type === "unavailable-id" || (err.message && /taken/i.test(err.message)))) {
        const jitter = 300 + Math.floor(Math.random() * 500);
        setTimeout(() => {
          isTransitioningDiscovery = false;
          connectToRoomHost();
        }, jitter);
      } else {
        isTransitioningDiscovery = false;
      }
    });
  }

  function connectToRoomHost() {
    if (!peer || !peer.id || isRoomHost || roomHostPeer || isTransitioningDiscovery) return;
    isTransitioningDiscovery = true;

    const hostId = getRoomHostId();
    const conn = peer.connect(hostId, { reliable: true });
    registryConn = conn;

    // Generous 3.5s timeout for ICE negotiation
    const openTimeout = setTimeout(() => {
      if (!conn.open) {
        try { conn.close(); } catch (_e) {}
        registryConn = null;
        isTransitioningDiscovery = false;
        // Jitter delay before election to avoid collision storms
        const jitter = 200 + Math.floor(Math.random() * 600);
        setTimeout(() => becomeRoomHost(), jitter);
      }
    }, 3500);

    conn.on("open", () => {
      clearTimeout(openTimeout);
      isTransitioningDiscovery = false;
      if (deviceRoleBadge) {
        deviceRoleBadge.textContent = "Room Client";
        deviceRoleBadge.className = "text-[10px] font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-text/60";
      }

      try {
        conn.send({
          type: "registry-register",
          peerId: peer.id,
          name: localPeerName,
          platform: localPlatform,
        });
      } catch (_e) {}
    });

    conn.on("data", (data) => {
      if (data && data.type === "registry-roster") {
        const peers = (data.peers || []).filter((p) => p.peerId !== peer.id);
        Object.keys(roomPeers).forEach((k) => delete roomPeers[k]);
        peers.forEach((p) => upsertRoomPeer(p.peerId, p.name, p.platform));
        renderNearbyPeers(peers);
      }
    });

    conn.on("error", () => {
      clearTimeout(openTimeout);
      try { conn.close(); } catch (_e) {}
      registryConn = null;
      const jitter = 250 + Math.floor(Math.random() * 500);
      setTimeout(() => {
        isTransitioningDiscovery = false;
        becomeRoomHost();
      }, jitter);
    });

    conn.on("close", () => {
      if (registryConn) registryConn = null;
      const jitter = 300 + Math.floor(Math.random() * 600);
      setTimeout(() => {
        isTransitioningDiscovery = false;
        becomeRoomHost();
      }, jitter);
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
      renderNearbyPeers(Object.values(roomPeers).filter((p) => p.peerId !== peer.id));
    }
  }

  function startNearbyScan() {
    scanNearbyPeers();
    startRegistryHeartbeat();
  }

  if (rescanBtn) {
    rescanBtn.addEventListener("click", () => {
      rescanBtn.classList.add("animate-spin");
      setTimeout(() => rescanBtn.classList.remove("animate-spin"), 800);
      scanNearbyPeers();
      showToast("Rescanning room for nearby devices...", "info");
    });
  }

  // ═══════════════════════════════════════════
  // File Selection & Drag/Drop
  // ═══════════════════════════════════════════
  function addSelectedFiles(newFiles) {
    if (!newFiles || !newFiles.length) return;
    const existing = new Set(selectedFiles.map((f) => `${f.name}-${f.size}`));
    for (const file of newFiles) {
      if (!existing.has(`${file.name}-${file.size}`)) {
        selectedFiles.push(file);
      }
    }
    renderSelectedFiles();
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      addSelectedFiles(Array.from(e.target.files));
      e.target.value = "";
    });
  }

  if (folderInput) {
    folderInput.addEventListener("change", (e) => {
      addSelectedFiles(Array.from(e.target.files));
      e.target.value = "";
    });
  }

  if (browseFilesBtn && fileInput) {
    browseFilesBtn.addEventListener("click", () => fileInput.click());
  }

  if (browseFolderBtn && folderInput) {
    browseFolderBtn.addEventListener("click", () => folderInput.click());
  }

  if (dropZone) {
    dropZone.addEventListener("click", () => {
      if (fileInput) fileInput.click();
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
      if (e.dataTransfer && e.dataTransfer.files) {
        addSelectedFiles(Array.from(e.dataTransfer.files));
      }
    });
  }

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener("click", () => {
      selectedFiles = [];
      renderSelectedFiles();
    });
  }

  function renderSelectedFiles() {
    if (!fileListUi || !selectedCount || !selectedFilesSection) return;
    fileListUi.innerHTML = "";

    const count = selectedFiles.length;
    selectedCount.textContent = String(count);

    const totalBytes = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    if (selectedTotalSize) selectedTotalSize.textContent = formatBytes(totalBytes);

    selectedFilesSection.classList.toggle("hidden", count === 0);
    if (count === 0) return;

    selectedFiles.forEach((file, index) => {
      const li = document.createElement("li");
      li.className = "flex items-center gap-3 p-2 rounded-xl bg-white/4 border border-white/8 group hover:border-white/15 transition-all";

      const isImage = file.type && file.type.startsWith("image/");
      let thumbnailHtml = "";

      if (isImage) {
        const thumbUrl = URL.createObjectURL(file);
        thumbnailHtml = `
          <img src="${thumbUrl}" alt="thumb" class="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0">
        `;
        // Revoke after element is loaded
        setTimeout(() => URL.revokeObjectURL(thumbUrl), 10000);
      } else {
        thumbnailHtml = `
          <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <i class="bi ${getFileIcon(file.name)} text-base"></i>
          </div>
        `;
      }

      li.innerHTML = `
        ${thumbnailHtml}
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-white truncate">${escapeHtml(file.name)}</p>
          <p class="text-[10px] text-text/40 font-mono">${formatBytes(file.size)}</p>
        </div>
        <button class="icon-btn text-text/40 hover:text-red-400 remove-file-btn" title="Remove file">
          <i class="bi bi-x text-sm"></i>
        </button>
      `;

      li.querySelector(".remove-file-btn")?.addEventListener("click", () => {
        selectedFiles.splice(index, 1);
        renderSelectedFiles();
      });

      fileListUi.appendChild(li);
    });
  }

  // ═══════════════════════════════════════════
  // File Sending: Offer & Transfer Pipeline
  // ═══════════════════════════════════════════
  if (sendButton) {
    sendButton.addEventListener("click", () => {
      if (!selectedFiles.length) {
        showToast("Select at least one file to send", "warning");
        return;
      }

      const allPeers = Object.values(connections).filter((p) => p.conn && p.conn.open);
      if (!allPeers.length) {
        showToast("Connect to a peer before sending files", "warning");
        return;
      }

      const targetVal = targetPeerSelect ? targetPeerSelect.value : "all";
      let recipients = allPeers;

      if (targetVal !== "all") {
        recipients = allPeers.filter((p) => p.conn.peer === targetVal);
      }

      if (!recipients.length) {
        showToast("Selected recipient is not available", "warning");
        return;
      }

      const filesToSend = [...selectedFiles];
      selectedFiles = [];
      renderSelectedFiles();

      recipients.forEach((peerData) => {
        sendFilesOffer(filesToSend, peerData);
      });

      showToast(`Offering ${filesToSend.length} file(s) to ${recipients.length} peer(s)...`, "info");
    });
  }

  // Send Offer Handshake
  function sendFilesOffer(files, peerData) {
    const { conn, name } = peerData;
    const offerId = lsGenerateTransferId();

    const fileMetaList = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
    }));

    pendingFileOffers[offerId] = {
      offerId,
      files,
      peerData,
      status: "pending",
    };

    try {
      conn.send({
        type: "file-offer",
        offerId,
        from: localPeerName,
        files: fileMetaList,
      });
    } catch (err) {
      console.error("Failed to send file offer:", err);
      showToast(`Could not send file offer to ${name}`, "error");
      delete pendingFileOffers[offerId];
    }
  }

  // Handle Response to our Offer
  function handleFileOfferResponse(data, peerId) {
    const offer = pendingFileOffers[data.offerId];
    if (!offer) return;

    if (data.accepted) {
      showToast(`${offer.peerData.name} accepted file transfer! Streaming...`, "success");
      offer.files.forEach((file) => {
        streamFile(file, offer.peerData);
      });
    } else {
      showToast(`${offer.peerData.name} declined the file transfer`, "warning");
    }
    delete pendingFileOffers[data.offerId];
  }

  // Handle Incoming File Offer
  function handleIncomingFileOffer(data, peerId) {
    const offerId = data.offerId;
    const files = data.files || [];
    const senderName = data.from || connections[peerId]?.name || "Peer";

    if (!files.length) return;

    // Check Auto-Accept: Global preference OR trusted peer
    const isAutoAccept = PREFS.autoAccept || PREFS.trustedPeers.includes(peerId);
    if (isAutoAccept) {
      try {
        connections[peerId]?.conn.send({
          type: "file-offer-response",
          offerId,
          accepted: true,
        });
      } catch (_e) {}
      showToast(`Auto-accepting ${files.length} file(s) from ${senderName}`, "info");
      return;
    }

    // Otherwise: Show File Offer Modal
    sounds.play("alert");
    if (fileOfferSender) {
      fileOfferSender.textContent = `from ${senderName} (${connections[peerId]?.platform || "device"})`;
    }

    if (fileOfferList) {
      fileOfferList.innerHTML = "";
      files.forEach((f) => {
        const item = document.createElement("div");
        item.className = "flex items-center gap-2.5 p-2 rounded-lg bg-white/3 border border-white/6";
        item.innerHTML = `
          <i class="bi ${getFileIcon(f.name)} text-base flex-shrink-0"></i>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-white truncate">${escapeHtml(f.name)}</p>
            <p class="text-[10px] text-text/40 font-mono">${formatBytes(f.size)}</p>
          </div>
        `;
        fileOfferList.appendChild(item);
      });
    }

    if (fileOfferAutoCheckbox) fileOfferAutoCheckbox.checked = false;

    fileOfferModal.classList.remove("hidden");
    fileOfferModal.classList.add("flex");

    const cleanup = () => {
      fileOfferModal.classList.add("hidden");
      fileOfferModal.classList.remove("flex");
      fileOfferAccept.onclick = null;
      fileOfferReject.onclick = null;
    };

    fileOfferAccept.onclick = () => {
      if (fileOfferAutoCheckbox && fileOfferAutoCheckbox.checked) {
        if (!PREFS.trustedPeers.includes(peerId)) {
          PREFS.trustedPeers.push(peerId);
          saveTrustedPeers();
        }
      }
      cleanup();

      try {
        connections[peerId]?.conn.send({
          type: "file-offer-response",
          offerId,
          accepted: true,
        });
      } catch (_e) {}
      showToast(`Receiving ${files.length} file(s) from ${senderName}...`, "info");
    };

    fileOfferReject.onclick = () => {
      cleanup();
      try {
        connections[peerId]?.conn.send({
          type: "file-offer-response",
          offerId,
          accepted: false,
        });
      } catch (_e) {}
      showToast(`Declined transfer from ${senderName}`, "info");
    };
  }

  // ═══════════════════════════════════════════
  // Core Streaming Transfer Engine (Sender — 3-Tier LAN Turbo Pipeline)
  //   Tier 0: Direct LAN Raw TCP/HTTP Pipe (when running `npm start` on LAN)
  //   Tier 1: Pure-Browser Direct LAN Multi-Lane Raw WebRTC Turbo (4× parallel raw channels)
  //   Tier 2: Optimized PeerJS Compatibility Fallback (for older LocalShare v2.1 peers)
  // ═══════════════════════════════════════════
  function getTransferBadgeHtml(transport, lanes) {
    if (transport === "lan-tcp") {
      return '<span class="lan-badge-tcp">🚀 LAN TCP</span>';
    }
    if (transport === "lan-direct") {
      return `<span class="lan-badge-direct">⚡ LAN ${lanes || 1}×</span>`;
    }
    if (transport === "wan-turbo" || transport === "wan-p2p") {
      return `<span class="lan-badge-wan">🌐 P2P ${lanes || 1}×</span>`;
    }
    return '<span class="lan-badge-probing">🔌 PeerJS</span>';
  }

  async function streamFile(file, peerData) {
    const { conn, name } = peerData;
    const peerId = conn && conn.peer;
    if (!conn || !conn.open) {
      showToast("Transfer failed: Connection closed", "warning");
      return;
    }

    const livePeer = connections[peerId] || peerData;
    const turbo = livePeer.turbo || null;
    const turboStatus = turbo ? turbo.getStatusSnapshot() : null;
    const useHttpPipe = isLanHttpPipeAvailableForPeer(peerId) && file.size > 0;
    const useWebRtcTurbo = Boolean(!useHttpPipe && turbo && turboStatus && turboStatus.canTransferTurbo);

    // Enforce Strict LAN-Only mode if user explicitly turned it ON
    if (PREFS.strictLanOnly && !useHttpPipe && !(turboStatus && turboStatus.isLanDirect)) {
      showToast(
        `Blocked transfer to ${name}: Strict LAN-Only Mode is active and no direct LAN link is locked.`,
        "warning",
        5000
      );
      return;
    }

    const transferId = lsGenerateTransferId();
    const domId = `transfer-${transferId}`;
    const mimeType = file.type || "application/octet-stream";
    const safeName = sanitizeFileName(file.name);

    const initialTransport = useHttpPipe
      ? "lan-tcp"
      : useWebRtcTurbo
        ? turboStatus.isLanDirect
          ? "lan-direct"
          : "wan-turbo"
        : "peerjs";
    const initialLanes = useWebRtcTurbo ? turboStatus.activeLanes : 1;

    outgoingTransfers[transferId] = {
      transferId,
      cancelled: false,
      abortFn: null,
    };

    let li = null, bar = null, meta = null, speedEl = null, etaEl = null, transportBadgeEl = null;

    if (sendProgressList) {
      li = document.createElement("li");
      li.id = domId;
      li.className = "transfer-card";

      li.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <i class="bi ${getFileIcon(file.name)} text-primary text-base flex-shrink-0"></i>
            <span class="text-xs font-semibold text-white truncate max-w-[120px] min-[420px]:max-w-[150px] sm:max-w-[200px]">${escapeHtml(safeName)}</span>
            <span id="${domId}-transport">${getTransferBadgeHtml(initialTransport, initialLanes)}</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-[10px] text-primary font-medium truncate max-w-[80px] min-[420px]:max-w-[110px] sm:max-w-none">→ ${escapeHtml(name)}</span>
            <button class="icon-btn text-text/40 hover:text-red-400 cancel-send-btn" title="Cancel Transfer">
              <i class="bi bi-x text-sm"></i>
            </button>
          </div>
        </div>

        <div class="progress-track">
          <div id="${domId}-bar" class="progress-fill ${initialTransport === "lan-direct" || initialTransport === "lan-tcp" ? "bg-accent" : ""}" style="width: 0%"></div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mt-2 text-[10px] text-text/50">
          <span id="${domId}-meta">Starting direct stream...</span>
          <div class="flex items-center gap-2 font-mono">
            <span id="${domId}-speed" class="text-accent font-semibold"></span>
            <span id="${domId}-eta" class="text-text/40"></span>
          </div>
        </div>
      `;

      li.querySelector(".cancel-send-btn")?.addEventListener("click", () => {
        cancelOutgoingTransfer(transferId, conn, safeName);
      });

      sendProgressList.appendChild(li);
      updateTransferVisibility();

      bar = $(`${domId}-bar`);
      meta = $(`${domId}-meta`);
      speedEl = $(`${domId}-speed`);
      etaEl = $(`${domId}-eta`);
      transportBadgeEl = $(`${domId}-transport`);
    }

    // ─── TIER 0: Direct LAN Raw TCP/HTTP Pipe (`server.cjs` via `npm start`) ───
    if (useHttpPipe) {
      try {
        if (meta) meta.textContent = "Opening direct LAN TCP pipe...";
        const { streamId, token } = await lanServerClient.createHttpStream({
          fileName: safeName,
          totalSize: file.size,
          mimeType,
        });

        if (outgoingTransfers[transferId]?.cancelled) return;

        // Notify receiver over encrypted P2P channel with single-use cryptographic stream token
        conn.send({
          type: "lan-http-stream-ready",
          transferId,
          streamId,
          token,
          fileName: safeName,
          totalSize: file.size,
          mimeType,
        });

        const res = await lanServerClient.uploadToHttpStream(file, streamId, token, {
          onAbortRef: (fn) => {
            if (outgoingTransfers[transferId]) outgoingTransfers[transferId].abortFn = fn;
          },
          onProgress: ({ sentBytes, totalBytes, pct, speedBps, etaSec }) => {
            if (bar) bar.style.width = `${pct}%`;
            if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(sentBytes)} / ${formatBytes(totalBytes)}`;
            if (speedEl) speedEl.textContent = formatSpeedWithMbps(speedBps);
            if (etaEl) etaEl.textContent = formatEta(etaSec);
          },
        });

        if (res.cancelled || outgoingTransfers[transferId]?.cancelled) {
          if (meta) meta.textContent = "Cancelled by user";
          return;
        }

        if (bar) bar.style.width = "100%";
        if (meta) {
          meta.textContent = `Done in ${res.elapsedSec.toFixed(1)}s • Avg ${formatSpeedWithMbps(res.avgSpeedBps)}`;
        }
        if (speedEl) speedEl.textContent = `Peak ${formatSpeed(res.peakSpeedBps)}`;
        if (etaEl) etaEl.textContent = "Awaiting verification";
        sounds.play("complete");
        return;
      } catch (err) {
        console.warn("LAN HTTP Pipe failed, falling back to WebRTC LAN Turbo:", err);
        // Fall through cleanly to Tier 1!
      }
    }

    // ─── TIER 1: Pure-Browser Direct LAN Multi-Lane Raw WebRTC Turbo ───
    if (turbo && turbo.getOpenLanes().length > 0) {
      try {
        const result = await turbo.sendFile(file, {
          transferId,
          isCancelled: () => Boolean(outgoingTransfers[transferId]?.cancelled || !conn.open),
          onStart: ({ chunkSize, totalChunks, activeLanes, isLanDirect }) => {
            const modeTag = isLanDirect ? "lan-direct" : "wan-turbo";
            if (transportBadgeEl) {
              transportBadgeEl.innerHTML = getTransferBadgeHtml(modeTag, activeLanes);
            }
            conn.send({
              type: "file-metadata",
              transferId,
              fileName: safeName,
              totalSize: file.size,
              totalChunks,
              chunkSize,
              mimeType,
              checksum: null,
              checksumDeferred: true,
              transport: modeTag,
              lanes: activeLanes,
            });
          },
          onProgress: ({ sentBytes, totalBytes, pct, speedBps, etaSec }) => {
            if (bar) bar.style.width = `${pct}%`;
            if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(sentBytes)} / ${formatBytes(totalBytes)}`;
            if (speedEl) speedEl.textContent = formatSpeedWithMbps(speedBps);
            if (etaEl) etaEl.textContent = formatEta(etaSec);
          },
          fallbackSend: async (frameBuffer) => {
            if (!conn.open) return;
            const dc = conn.dataChannel;
            if (dc && LanTurbo && dc.bufferedAmount >= MAX_BUFFERED_AMOUNT) {
              await LanTurbo.waitForLaneDrain(dc, MAX_BUFFERED_AMOUNT);
            }
            conn.send(frameBuffer);
          },
        });

        if (result.cancelled || outgoingTransfers[transferId]?.cancelled) {
          if (meta) meta.textContent = "Cancelled by user";
          return;
        }

        try {
          conn.send({
            type: "transfer-complete",
            transferId,
            fileName: safeName,
            totalChunks: result.totalChunks,
            checksum: result.checksum,
          });
        } catch (_e) {}

        if (bar) bar.style.width = "100%";
        if (file.size === 0) {
          if (meta) meta.textContent = "Complete • 0 B";
        } else {
          if (meta) {
            meta.textContent = `Done in ${result.elapsedSec.toFixed(1)}s • Avg ${formatSpeedWithMbps(result.avgSpeedBps)}`;
          }
          if (speedEl) speedEl.textContent = `Peak ${formatSpeed(result.peakSpeedBps)}`;
          if (etaEl) etaEl.textContent = "Awaiting verification";
        }

        sounds.play("complete");
        return;
      } catch (err) {
        console.warn("WebRTC LAN Turbo send failed, falling back to PeerJS:", err);
        if (outgoingTransfers[transferId]?.cancelled) return;
      }
    }

    // ─── TIER 2: Optimized PeerJS Compatibility Fallback (legacy v2.1 peers) ───
    if (transportBadgeEl) transportBadgeEl.innerHTML = getTransferBadgeHtml("peerjs", 1);
    const totalChunks = file.size > 0 ? Math.ceil(file.size / FILE_CHUNK_SIZE) : 0;

    if (meta) meta.textContent = "Computing checksum...";
    let checksum = null;
    try {
      checksum = await lsComputeFileChecksum(file);
    } catch (_err) {
      checksum = null;
    }

    if (outgoingTransfers[transferId]?.cancelled) return;
    if (!conn.open) {
      if (meta) meta.textContent = "Transfer cancelled (connection closed)";
      return;
    }

    try {
      conn.send({
        type: "file-metadata",
        transferId,
        fileName: safeName,
        totalSize: file.size,
        totalChunks,
        mimeType,
        checksum,
        transport: "peerjs",
      });
    } catch (err) {
      console.error("Failed to send metadata:", err);
      if (meta) meta.textContent = "Transfer initialization failed";
      return;
    }

    if (file.size === 0) {
      if (bar) bar.style.width = "100%";
      if (meta) meta.textContent = "Complete • 0 B";
      sounds.play("complete");
      return;
    }

    let offset = 0;
    let chunkIndex = 0;
    const startTime = Date.now();
    let lastUiMs = startTime;
    const fastYield = LanTurbo ? LanTurbo.createFastYield() : () => Promise.resolve();

    try {
      while (offset < file.size) {
        if (outgoingTransfers[transferId]?.cancelled) {
          if (meta) meta.textContent = "Cancelled by user";
          return;
        }
        if (!conn.open) {
          if (meta) meta.textContent = "Connection dropped";
          return;
        }

        const dc = conn.dataChannel;
        if (dc && typeof dc.bufferedAmount === "number" && dc.bufferedAmount > MAX_BUFFERED_AMOUNT) {
          if (LanTurbo) {
            await LanTurbo.waitForLaneDrain(dc, MAX_BUFFERED_AMOUNT);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 4));
          }
          continue;
        }

        const end = Math.min(offset + FILE_CHUNK_SIZE, file.size);
        let payload;
        try {
          const sliceBuffer = await lsReadBlobAsArrayBuffer(file.slice(offset, end));
          payload = new Uint8Array(sliceBuffer);
        } catch (_err) {
          if (meta) meta.textContent = "File read failed";
          return;
        }

        const frame = lsMakeRawChunkFrame(transferId, chunkIndex, payload);

        try {
          conn.send(frame.buffer);
        } catch (err) {
          console.warn("Direct binary chunk send error:", err);
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        offset = end;
        chunkIndex += 1;

        const now = Date.now();
        if (now - lastUiMs >= 80 || offset >= file.size) {
          lastUiMs = now;
          const pct = (offset / file.size) * 100;
          const elapsed = (now - startTime) / 1000;
          const speed = offset / Math.max(elapsed, 0.001);
          const remainingBytes = file.size - offset;
          const eta = speed > 0 ? remainingBytes / speed : 0;

          if (bar) bar.style.width = `${pct}%`;
          if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(offset)} / ${formatBytes(file.size)}`;
          if (speedEl) speedEl.textContent = formatSpeedWithMbps(speed);
          if (etaEl) etaEl.textContent = formatEta(eta);
        }

        if (chunkIndex % 4 === 0) {
          await fastYield();
        }
      }

      try {
        conn.send({
          type: "transfer-complete",
          transferId,
          fileName: safeName,
          totalChunks: chunkIndex,
          checksum,
        });
      } catch (_e) {}

      const totalElapsed = (Date.now() - startTime) / 1000;
      const avgSpeed = file.size / Math.max(totalElapsed, 0.001);

      if (bar) bar.style.width = "100%";
      if (meta) meta.textContent = `Done in ${totalElapsed.toFixed(1)}s • Avg ${formatSpeedWithMbps(avgSpeed)}`;
      if (etaEl) etaEl.textContent = "Awaiting verification";
      sounds.play("complete");
    } catch (err) {
      console.error("Send failed:", err);
      if (meta) meta.textContent = "Send failed";
    } finally {
      if (fastYield && typeof fastYield.dispose === "function") fastYield.dispose();
    }
  }

  function cancelOutgoingTransfer(transferId, conn, fileName) {
    if (outgoingTransfers[transferId]) {
      outgoingTransfers[transferId].cancelled = true;
      if (typeof outgoingTransfers[transferId].abortFn === "function") {
        try { outgoingTransfers[transferId].abortFn(); } catch (_e) {}
      }
    }
    try {
      if (conn && conn.open) {
        conn.send({ type: "transfer-cancel", transferId });
      }
    } catch (_e) {}

    const el = document.getElementById(`transfer-${transferId}`);
    if (el) {
      const meta = el.querySelector(`#transfer-${transferId}-meta`);
      if (meta) meta.textContent = "Transfer cancelled";
      setTimeout(() => {
        el.remove();
        updateTransferVisibility();
      }, 1200);
    }
    showToast(`Cancelled transfer of "${fileName}"`, "info");
  }

  // ═══════════════════════════════════════════
  // Core Receiving Engine (Receiver — Multi-Lane & LAN TCP Pipe)
  // ═══════════════════════════════════════════
  function createIncomingCardUi(domId, fileName, peerName, transport, lanes, onCancel) {
    if (!receivedFiles) return null;
    const li = document.createElement("li");
    li.id = domId;
    li.className = "transfer-card";

    li.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <i class="bi ${getFileIcon(fileName)} text-accent text-base flex-shrink-0"></i>
          <span class="text-xs font-semibold text-white truncate max-w-[120px] min-[420px]:max-w-[150px] sm:max-w-[200px]">${escapeHtml(fileName)}</span>
          <span>${getTransferBadgeHtml(transport, lanes)}</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[10px] text-accent font-medium truncate max-w-[80px] min-[420px]:max-w-[110px] sm:max-w-none">← ${escapeHtml(peerName)}</span>
          <button class="icon-btn text-text/40 hover:text-red-400 cancel-receive-btn" title="Cancel Receiving">
            <i class="bi bi-x text-sm"></i>
          </button>
        </div>
      </div>

      <div class="progress-track">
        <div id="${domId}-bar" class="progress-fill bg-accent" style="width: 0%"></div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mt-2 text-[10px] text-text/50">
        <span id="${domId}-meta">Receiving file...</span>
        <div class="flex items-center gap-2 font-mono">
          <span id="${domId}-speed" class="text-accent font-semibold"></span>
          <span id="${domId}-eta" class="text-text/40"></span>
        </div>
      </div>
    `;

    li.querySelector(".cancel-receive-btn")?.addEventListener("click", onCancel);
    receivedFiles.appendChild(li);
    updateTransferVisibility();
    return li;
  }

  function renderCompletedReceivedCard(element, { fileName, totalSize, peerName, verifiedChecksum, blob, url, transport, lanes, avgSpeedBps }) {
    if (!element) return;
    const safeName = escapeHtml(fileName);
    const speedPart = avgSpeedBps > 0 ? `<span>•</span><span class="font-mono text-accent">${escapeHtml(formatSpeedWithMbps(avgSpeedBps))}</span>` : "";

    element.innerHTML = `
      <div class="flex items-center justify-between gap-3 py-1">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 text-accent">
            <i class="bi ${getFileIcon(fileName)} text-lg"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-xs font-bold text-white truncate">${safeName}</p>
              ${getTransferBadgeHtml(transport, lanes)}
            </div>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-text/50">
              <span class="font-mono">${formatBytes(totalSize)}</span>
              <span>•</span>
              <span>From ${escapeHtml(peerName)}</span>
              ${speedPart}
              <span>•</span>
              <span class="text-accent flex items-center gap-0.5">
                <i class="bi bi-shield-check"></i> ${verifiedChecksum ? "Verified" : "Saved"}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="icon-btn text-text/60 hover:text-primary preview-file-btn" title="Preview file">
            <i class="bi bi-eye text-xs"></i>
          </button>
          <a href="${url}" download="${safeName}" class="btn-primary-sm text-xs py-1.5 px-3 flex items-center gap-1.5" title="Download to device">
            <i class="bi bi-download"></i><span class="hidden sm:inline">Save</span>
          </a>
        </div>
      </div>
    `;

    element.querySelector(".preview-file-btn")?.addEventListener("click", () => {
      openFilePreviewModal(fileName, blob, url);
    });
  }

  async function handleLanHttpStreamReady(data, peerId) {
    if (!lanServerClient) return;
    const transferId = data.transferId;
    if (transferId === undefined || incomingTransfers[transferId]) return;

    const fileName = sanitizeFileName(data.fileName);
    const totalSize = Number(data.totalSize || 0);
    const mimeType = data.mimeType || "application/octet-stream";
    const domId = `incoming-${transferId}`;
    const peerName = connections[peerId]?.name || "Peer";

    const transfer = {
      transferId,
      domId,
      peerId,
      fileName,
      totalSize,
      transport: "lan-tcp",
      lanes: 1,
      cancelled: false,
      finalized: false,
      abortFn: null,
      element: null,
    };

    transfer.element = createIncomingCardUi(domId, fileName, peerName, "lan-tcp", 1, () => {
      cancelIncomingTransfer(transferId, peerId, fileName);
    });
    incomingTransfers[transferId] = transfer;

    try {
      let safeMime = mimeType;
      const ext = fileName.split(".").pop().toLowerCase();
      if (["html", "htm", "svg", "xml"].includes(ext)) {
        safeMime = "application/octet-stream";
      }

      const res = await lanServerClient.downloadFromHttpStream(data.streamId, data.token, {
        totalSize,
        mimeType: safeMime,
        onAbortRef: (fn) => {
          transfer.abortFn = fn;
        },
        onProgress: ({ receivedBytes, totalBytes, pct, speedBps, etaSec }) => {
          const bar = $(`${domId}-bar`);
          const meta = $(`${domId}-meta`);
          const speedEl = $(`${domId}-speed`);
          const etaEl = $(`${domId}-eta`);
          if (bar) bar.style.width = `${pct}%`;
          if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)}`;
          if (speedEl) speedEl.textContent = formatSpeedWithMbps(speedBps);
          if (etaEl) etaEl.textContent = formatEta(etaSec);
        },
      });

      if (transfer.cancelled) return;
      transfer.finalized = true;

      const url = URL.createObjectURL(res.blob);
      renderCompletedReceivedCard(transfer.element, {
        fileName,
        totalSize: res.receivedBytes || totalSize,
        peerName,
        verifiedChecksum: true,
        blob: res.blob,
        url,
        transport: "lan-tcp",
        lanes: 1,
        avgSpeedBps: res.avgSpeedBps,
      });

      try {
        connections[peerId]?.conn.send({
          type: "transfer-ack",
          transferId,
          fileName,
        });
      } catch (_e) {}

      sounds.play("complete");
      showToast(
        `Received "${fileName}" via LAN TCP Pipe (${formatSpeedWithMbps(res.avgSpeedBps)})`,
        "success"
      );
      delete incomingTransfers[transferId];
    } catch (err) {
      if (!transfer.cancelled) {
        console.error("LAN HTTP stream receive failed:", err);
        const meta = $(`${domId}-meta`);
        if (meta) meta.textContent = "LAN HTTP stream failed";
        showToast(`Failed receiving "${fileName}" over LAN TCP pipe`, "error");
      }
      delete incomingTransfers[transferId];
    }
  }

  function handleFileMetadata(data, peerId) {
    const transferId = data.transferId;
    if (transferId === undefined || incomingTransfers[transferId]) return;

    const fileName = sanitizeFileName(data.fileName);
    const totalChunks = Number(data.totalChunks || 0);
    const totalSize = Number(data.totalSize || 0);

    // Security check: limit chunks & size against DoS (supports up to 64GB at 64KB chunks)
    if (totalChunks > 1200000 || totalSize > 64 * 1024 * 1024 * 1024) {
      showToast("Rejected file: Exceeds safe size threshold", "error");
      return;
    }

    const domId = `incoming-${transferId}`;
    const peerName = connections[peerId]?.name || "Peer";
    const transport = data.transport || "peerjs";
    const lanes = Number(data.lanes || 1);

    const li = createIncomingCardUi(domId, fileName, peerName, transport, lanes, () => {
      cancelIncomingTransfer(transferId, peerId, fileName);
    });

    const transfer = {
      transferId,
      domId,
      peerId,
      fileName,
      totalSize,
      totalChunks,
      transport,
      lanes,
      mimeType: data.mimeType || "application/octet-stream",
      checksum: data.checksum !== undefined ? data.checksum : null,
      checksumDeferred: Boolean(data.checksumDeferred),
      completeReceived: false,
      deferredTimer: null,
      chunks: totalChunks > 0 ? new Array(totalChunks) : [],
      receivedChunks: 0,
      receivedBytes: 0,
      element: li,
      startTime: Date.now(),
      lastUiMs: 0,
      finalized: false,
      failed: false,
      cancelled: false,
    };

    incomingTransfers[transferId] = transfer;

    // Drain any turbo chunks that arrived a millisecond before file-metadata on parallel lanes!
    const early = earlyChunkBuffers.get(transferId);
    if (early) {
      clearTimeout(early.timer);
      earlyChunkBuffers.delete(transferId);
      for (const item of early.chunks) {
        applyChunkToTransfer(transfer, item.chunkIndex, item.payload);
      }
    }

    if (totalSize === 0 && totalChunks === 0) {
      finalizeIncomingTransfer(transfer);
    }
  }

  function handleTurboRawChunk(frame, _peerId) {
    if (!frame || frame.kind !== "chunk") return;
    const { transferId, chunkIndex, payload } = frame;
    const transfer = incomingTransfers[transferId];

    if (!transfer) {
      // Buffer early chunks briefly in case a fast LAN lane beat control-channel file-metadata!
      let entry = earlyChunkBuffers.get(transferId);
      if (!entry) {
        entry = {
          chunks: [],
          timer: setTimeout(() => earlyChunkBuffers.delete(transferId), 30_000),
        };
        earlyChunkBuffers.set(transferId, entry);
      }
      if (entry.chunks.length < 4096) {
        entry.chunks.push({ chunkIndex, payload });
      }
      return;
    }

    if (transfer.finalized || transfer.failed || transfer.cancelled) return;
    applyChunkToTransfer(transfer, chunkIndex, payload);
  }

  function handleRawTransferChunk(data, peerId) {
    // 1. Check if this is an LST2 Direct LAN Turbo frame (e.g. sent via mid-transfer fallback!)
    if (LanTurbo) {
      const turboFrame = LanTurbo.decodeFrameHeader(data);
      if (turboFrame && turboFrame.kind === "chunk") {
        handleTurboRawChunk(turboFrame, peerId);
        return;
      }
    }

    // 2. Legacy 8-byte PeerJS header compatibility
    const u8 = lsToUint8Array(data);
    if (u8.byteLength < 8) return;

    const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const transferId = view.getUint32(0, true);
    const chunkIndex = view.getUint32(4, true);

    const transfer = incomingTransfers[transferId];
    if (!transfer || transfer.finalized || transfer.failed || transfer.cancelled) return;

    const payload = new Uint8Array(u8.buffer, u8.byteOffset + 8, u8.byteLength - 8);
    applyChunkToTransfer(transfer, chunkIndex, payload);
  }

  function applyChunkToTransfer(transfer, chunkIndex, payload) {
    if (!transfer || transfer.finalized || transfer.failed || transfer.cancelled) return;
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0) return;

    if (transfer.totalChunks > 0) {
      if (chunkIndex >= transfer.totalChunks) return;
      if (transfer.chunks[chunkIndex]) return; // Chunk already received

      transfer.chunks[chunkIndex] = payload;
      transfer.receivedChunks += 1;
    } else {
      transfer.chunks.push(payload);
      transfer.receivedChunks += 1;
    }

    transfer.receivedBytes += payload.byteLength;

    const isDone = transfer.totalChunks > 0 && transfer.receivedChunks >= transfer.totalChunks;
    const now = Date.now();

    // Throttle DOM updates to ~80ms so main thread stays buttery smooth at 100+ MB/s (1,600+ chunks/s)!
    if (isDone || now - transfer.lastUiMs >= 80) {
      transfer.lastUiMs = now;
      const pct = transfer.totalSize ? (transfer.receivedBytes / transfer.totalSize) * 100 : 0;
      const elapsed = (now - transfer.startTime) / 1000;
      const speed = transfer.receivedBytes / Math.max(elapsed, 0.001);
      const remainingBytes = Math.max(0, transfer.totalSize - transfer.receivedBytes);
      const eta = speed > 0 ? remainingBytes / speed : 0;

      const bar = $(`${transfer.domId}-bar`);
      const meta = $(`${transfer.domId}-meta`);
      const speedEl = $(`${transfer.domId}-speed`);
      const etaEl = $(`${transfer.domId}-eta`);

      if (bar) bar.style.width = `${Math.min(100, pct)}%`;
      if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(transfer.receivedBytes)} / ${formatBytes(transfer.totalSize)}`;
      if (speedEl) speedEl.textContent = formatSpeedWithMbps(speed);
      if (etaEl) etaEl.textContent = formatEta(eta);
    }

    if (isDone) {
      tryFinalizeIncomingTransfer(transfer);
    }
  }

  function tryFinalizeIncomingTransfer(transfer) {
    if (!transfer || transfer.finalized || transfer.failed || transfer.cancelled) return;
    const allChunksPresent =
      transfer.totalChunks === 0 || transfer.receivedChunks >= transfer.totalChunks;
    if (!allChunksPresent) return;

    // If checksum arrives in transfer-complete over control channel, wait briefly for it before finalizing!
    if (transfer.checksumDeferred && !transfer.completeReceived) {
      if (!transfer.deferredTimer) {
        transfer.deferredTimer = setTimeout(() => {
          transfer.deferredTimer = null;
          transfer.checksumDeferred = false;
          tryFinalizeIncomingTransfer(transfer);
        }, 4000);
      }
      return;
    }

    if (transfer.deferredTimer) {
      clearTimeout(transfer.deferredTimer);
      transfer.deferredTimer = null;
    }
    finalizeIncomingTransfer(transfer);
  }

  function finalizeIncomingTransfer(transfer) {
    if (!transfer || transfer.finalized || transfer.failed || transfer.cancelled) return;
    transfer.finalized = true;

    const elapsedSec = Math.max((Date.now() - transfer.startTime) / 1000, 0.001);
    const avgSpeedBps = transfer.totalSize / elapsedSec;

    // 1. Verify integrity & checksum
    let verifiedChecksum = false;
    if (transfer.checksum !== undefined && transfer.checksum !== null) {
      let hash = 0x811c9dc5;
      for (let i = 0; i < transfer.chunks.length; i++) {
        if (!transfer.chunks[i]) {
          showToast(`File corruption: Missing chunk ${i}`, "error");
          transfer.failed = true;
          return;
        }
        hash = lsFnv1aUpdate(hash, transfer.chunks[i]);
      }
      if (hash === (transfer.checksum >>> 0)) {
        verifiedChecksum = true;
      } else {
        showToast(`Checksum mismatch on "${transfer.fileName}". Transfer may be corrupt.`, "error");
      }
    } else {
      verifiedChecksum = true;
    }

    // 2. Zero-copy Blob Assembly from chunks array
    // Safe MIME type check: prevent inline HTML / SVG execution vulnerabilities
    let safeMime = transfer.mimeType || "application/octet-stream";
    const ext = transfer.fileName.split(".").pop().toLowerCase();
    if (["html", "htm", "svg", "xml"].includes(ext)) {
      safeMime = "application/octet-stream";
    }

    const blob = new Blob(transfer.chunks, { type: safeMime });
    transfer.chunks = null; // Release chunk array references promptly
    const url = URL.createObjectURL(blob);

    const peerName = connections[transfer.peerId]?.name || "Peer";
    renderCompletedReceivedCard(transfer.element, {
      fileName: transfer.fileName,
      totalSize: transfer.totalSize,
      peerName,
      verifiedChecksum,
      blob,
      url,
      transport: transfer.transport,
      lanes: transfer.lanes,
      avgSpeedBps: transfer.totalSize > 0 ? avgSpeedBps : 0,
    });

    // Send ACK to sender
    try {
      connections[transfer.peerId]?.conn.send({
        type: "transfer-ack",
        transferId: transfer.transferId,
        fileName: transfer.fileName,
      });
    } catch (_e) {}

    sounds.play("complete");
    const speedNote = transfer.totalSize > 0 ? ` at ${formatSpeedWithMbps(avgSpeedBps)}` : "";
    showToast(`Received "${transfer.fileName}" (${formatBytes(transfer.totalSize)}${speedNote})`, "success");
    delete incomingTransfers[transfer.transferId];
  }

  function handleTransferCancelMessage(data, _peerId) {
    const transfer = incomingTransfers[data.transferId];
    if (transfer) {
      transfer.cancelled = true;
      if (transfer.deferredTimer) clearTimeout(transfer.deferredTimer);
      if (typeof transfer.abortFn === "function") {
        try { transfer.abortFn(); } catch (_e) {}
      }
      if (transfer.element) {
        transfer.element.remove();
        updateTransferVisibility();
      }
      delete incomingTransfers[data.transferId];
      showToast(`Transfer was cancelled by sender`, "info");
    }
  }

  function handleTransferCompleteMessage(data, _peerId) {
    const transfer = incomingTransfers[data.transferId];
    if (!transfer || transfer.finalized || transfer.cancelled) return;
    transfer.completeReceived = true;
    if (data.checksum !== undefined && data.checksum !== null) {
      transfer.checksum = data.checksum;
    }
    tryFinalizeIncomingTransfer(transfer);
  }

  function handleTransferAckMessage(data, _peerId) {
    const el = document.getElementById(`transfer-${data.transferId}`);
    if (el) {
      const etaEl = el.querySelector(`#transfer-${data.transferId}-eta`);
      if (etaEl) {
        etaEl.className = "text-accent font-semibold flex items-center gap-1";
        etaEl.innerHTML = '<i class="bi bi-check2-circle"></i> Verified by peer';
      }
    }
  }

  function cancelIncomingTransfer(transferId, peerId, fileName) {
    const transfer = incomingTransfers[transferId];
    if (transfer) {
      transfer.cancelled = true;
      if (transfer.deferredTimer) clearTimeout(transfer.deferredTimer);
      if (typeof transfer.abortFn === "function") {
        try { transfer.abortFn(); } catch (_e) {}
      }
      try {
        connections[peerId]?.conn.send({ type: "transfer-cancel", transferId });
      } catch (_e) {}

      if (transfer.element) {
        transfer.element.remove();
        updateTransferVisibility();
      }
      delete incomingTransfers[transferId];
      showToast(`Cancelled receiving "${fileName}"`, "info");
    }
  }

  // ═══════════════════════════════════════════
  // File Preview Modal
  // ═══════════════════════════════════════════
  function openFilePreviewModal(fileName, blob, url) {
    if (!filePreviewModal || !previewModalBody || !previewModalTitle) return;

    previewModalTitle.textContent = fileName;
    if (previewModalDownload) {
      previewModalDownload.href = url;
      previewModalDownload.download = fileName;
    }

    previewModalBody.innerHTML = '<div class="text-xs text-text/40 py-8">Loading preview...</div>';
    filePreviewModal.classList.remove("hidden");
    filePreviewModal.classList.add("flex");

    const ext = fileName.split(".").pop().toLowerCase();

    // Image preview
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
      previewModalBody.innerHTML = `
        <img src="${url}" alt="${escapeHtml(fileName)}" class="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl mx-auto">
      `;
      return;
    }

    // Audio preview
    if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) {
      previewModalBody.innerHTML = `
        <div class="py-12 flex flex-col items-center gap-4 w-full">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl">
            <i class="bi bi-music-note-beamed"></i>
          </div>
          <audio controls src="${url}" class="w-full max-w-md"></audio>
        </div>
      `;
      return;
    }

    // Text / Code preview
    if (["txt", "md", "json", "js", "ts", "css", "py", "sh", "csv", "html", "xml"].includes(ext)) {
      blob.text().then((text) => {
        const previewText = text.slice(0, 10000);
        previewModalBody.innerHTML = `
          <pre class="w-full max-h-[60vh] overflow-auto p-4 rounded-xl bg-black/60 border border-white/10 text-left font-mono text-xs text-text/90 select-text leading-relaxed whitespace-pre-wrap">${escapeHtml(previewText)}</pre>
        `;
      }).catch(() => {
        previewModalBody.innerHTML = `<p class="text-xs text-text/50 py-8">Could not read text preview.</p>`;
      });
      return;
    }

    // Fallback for binaries / archives / etc
    previewModalBody.innerHTML = `
      <div class="py-12 flex flex-col items-center gap-3">
        <i class="bi ${getFileIcon(fileName)} text-5xl text-primary"></i>
        <p class="text-sm font-semibold text-white">${escapeHtml(fileName)}</p>
        <p class="text-xs text-text/50">Preview not supported for this file type. Click Download to save.</p>
      </div>
    `;
  }

  if (previewModalClose && filePreviewModal) {
    previewModalClose.addEventListener("click", () => {
      filePreviewModal.classList.add("hidden");
      filePreviewModal.classList.remove("flex");
    });
  }

  // ═══════════════════════════════════════════
  // Kickoff App Discovery
  // ═══════════════════════════════════════════
  updateChatPresence();
  updateGlobalLanIndicators();
  initDiscovery();
});
