document.addEventListener("DOMContentLoaded", () => {
    // ═══════════════════════════════════════════
    // DOM Elements
    // ═══════════════════════════════════════════
    const toastContainer = document.getElementById("toast-container");
    const statusEl = document.getElementById("status");
    const peerList = document.getElementById("peer-list");
    const nearbyList = document.getElementById("nearby-list");
    const fileInput = document.getElementById("file-input");
    const fileListUi = document.getElementById("file-list");
    const selectedCount = document.getElementById("selected-count");
    const selectedFilesSection = document.getElementById("selected-files-section");
    const sendButton = document.getElementById("send-button");
    const sendProgressList = document.getElementById("send-progress-list");
    const receivedFiles = document.getElementById("received-files");
    const transfersSection = document.getElementById("transfers-section");
    const outgoingCard = document.getElementById("outgoing-card");
    const receivedCard = document.getElementById("received-card");
    const peerIdInput = document.getElementById("peer-id-input");
    const connectButton = document.getElementById("connect-button");
    const qrCodeCanvas = document.getElementById("peer-id-qr-code");
    const qrCodeContainer = document.getElementById("qr-code-container");
    const handshakeModal = document.getElementById("handshake-modal");
    const handshakeMessage = document.getElementById("handshake-message");
    const handshakeAccept = document.getElementById("handshake-accept");
    const handshakeReject = document.getElementById("handshake-reject");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSend = document.getElementById("chat-send");
    const chatPresence = document.getElementById("chat-presence");
    const connectionCount = document.getElementById("connection-count");
    const networkDot = document.getElementById("network-dot");
    const networkLabel = document.getElementById("network-label");
    const deviceStatusDot = document.getElementById("device-status-dot");
    const dropZone = document.getElementById("drop-zone");
    const clearFilesBtn = document.getElementById("clear-files-btn");
    const rescanBtn = document.getElementById("rescan-btn");

    // ═══════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════
    const adjectives = [
        "Sparkly", "Fluffy", "Happy", "Brave", "Clever", "Witty", "Sunny", "Cozy",
        "Gentle", "Lucky", "Swift", "Cosmic", "Neon", "Turbo", "Pixel", "Cyber",
        "Crystal", "Golden", "Silver", "Velvet", "Mighty", "Tiny", "Frosty", "Blazing",
        "Quantum", "Stellar", "Lunar", "Solar", "Misty", "Thunder", "Shadow", "Bright",
        "Coral", "Amber", "Indigo", "Violet", "Scarlet", "Azure", "Emerald", "Ruby",
        "Phantom", "Mystic", "Atomic", "Electric", "Radiant", "Zen", "Epic", "Nova"
    ];
    const nouns = [
        "Panda", "Unicorn", "Kitten", "Puppy", "Fox", "Badger", "Sparrow", "Dolphin",
        "Otter", "Rabbit", "Phoenix", "Dragon", "Falcon", "Tiger", "Wolf", "Eagle",
        "Koala", "Lynx", "Penguin", "Hedgehog", "Chameleon", "Flamingo", "Orca", "Cheetah",
        "Raven", "Stallion", "Jaguar", "Narwhal", "Platypus", "Axolotl", "Mantis", "Gecko",
        "Toucan", "Bison", "Mongoose", "Puffin", "Salamander", "Wombat", "Ferret", "Lemur",
        "Crane", "Viper", "Falcon", "Bobcat", "Macaw", "Seal", "Ibex", "Zephyr"
    ];
    const nameEmojis = ["🚀", "⚡", "🌟", "🔥", "💎", "🎯", "🌊", "🦊", "🐺", "🦅", "🌙", "☀️", "🎨", "🎵", "🍀", "🌈"];

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
    const activeTransfers = {};
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

    // Transfer constants
    const CHUNK_SIZE = 256 * 1024; // 256KB chunks for speed
    const MAX_BUFFERED_AMOUNT = 1024 * 1024; // 1MB backpressure limit

    // ═══════════════════════════════════════════
    // Toast Notifications
    // ═══════════════════════════════════════════
    function showToast(message, type = "info", duration = 3500) {
        const toast = document.createElement("div");
        const icons = { info: "bi-info-circle", success: "bi-check-circle", error: "bi-exclamation-triangle", warning: "bi-exclamation-circle" };
        const colors = { info: "border-primary/30 text-primary", success: "border-accent/30 text-accent", error: "border-red-400/30 text-red-400", warning: "border-secondary/30 text-secondary" };
        toast.className = `toast-item ${colors[type] || colors.info}`;
        toast.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ═══════════════════════════════════════════
    // Utilities
    // ═══════════════════════════════════════════
    function formatBytes(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024, dm = 1, sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    function formatSpeed(bytesPerSec) {
        if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
        if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
        return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
    }

    function getFileIcon(fileName) {
        const ext = fileName.split(".").pop().toLowerCase();
        const map = {
            pdf: "bi-file-earmark-pdf", doc: "bi-file-earmark-word", docx: "bi-file-earmark-word",
            xls: "bi-file-earmark-excel", xlsx: "bi-file-earmark-excel", csv: "bi-file-earmark-spreadsheet",
            ppt: "bi-file-earmark-ppt", pptx: "bi-file-earmark-ppt",
            jpg: "bi-file-earmark-image", jpeg: "bi-file-earmark-image", png: "bi-file-earmark-image",
            gif: "bi-file-earmark-image", svg: "bi-file-earmark-image", webp: "bi-file-earmark-image",
            mp3: "bi-file-earmark-music", wav: "bi-file-earmark-music", flac: "bi-file-earmark-music",
            aac: "bi-file-earmark-music", ogg: "bi-file-earmark-music",
            mp4: "bi-file-earmark-play", mkv: "bi-file-earmark-play", avi: "bi-file-earmark-play",
            mov: "bi-file-earmark-play", webm: "bi-file-earmark-play",
            zip: "bi-file-earmark-zip", rar: "bi-file-earmark-zip", "7z": "bi-file-earmark-zip",
            tar: "bi-file-earmark-zip", gz: "bi-file-earmark-zip",
            js: "bi-file-earmark-code", ts: "bi-file-earmark-code", py: "bi-file-earmark-code",
            html: "bi-file-earmark-code", css: "bi-file-earmark-code", json: "bi-file-earmark-code",
            apk: "bi-android", exe: "bi-windows", dmg: "bi-apple", dmg: "bi-apple",
            txt: "bi-file-earmark-text", md: "bi-file-earmark-text",
        };
        return map[ext] || "bi-file-earmark";
    }

    function computeChecksum(data) {
        // Fast FNV-1a hash for integrity verification
        let hash = 0x811c9dc5;
        const view = new Uint8Array(data);
        for (let i = 0; i < view.length; i++) {
            hash ^= view[i];
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, "0");
    }

    function updateTransferVisibility() {
        const hasOutgoing = sendProgressList.children.length > 0;
        const hasReceived = receivedFiles.children.length > 0;
        outgoingCard.classList.toggle("hidden", !hasOutgoing);
        receivedCard.classList.toggle("hidden", !hasReceived);
        transfersSection.classList.toggle("hidden", !hasOutgoing && !hasReceived);
    }

    // ═══════════════════════════════════════════
    // Nearby Discovery
    // ═══════════════════════════════════════════
    async function resolveNearbyRoomId() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
            clearTimeout(timeout);
            const data = await res.json();
            const base = btoa(data.ip).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            return `ip-${base.slice(0, 12)}`;
        } catch (err) {
            console.warn("ipify failed, using local room", err);
            const fallback = (window.location.host || "local").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            return `local-${fallback.slice(0, 12) || "default"}`;
        }
    }

    function updateChatPresence() {
        const count = Object.keys(connections).length;
        connectionCount.textContent = count;
        if (count > 0) {
            chatPresence.textContent = `${count} Online`;
            chatPresence.className = "text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full";
        } else {
            chatPresence.textContent = "Offline";
            chatPresence.className = "text-[10px] bg-white/5 text-text/40 px-2 py-0.5 rounded-full";
        }
    }

    function appendChatMessage(sender, text, isLocal = false) {
        if (!text) return;
        if (chatMessages.children.length === 1 && chatMessages.children[0].textContent.includes("Chat messages will appear here")) {
            chatMessages.innerHTML = "";
        }
        const li = document.createElement("li");
        li.className = `p-2.5 rounded-xl border ${isLocal ? "border-primary/20 bg-primary/5" : "border-white/6 bg-white/3"}`;
        li.innerHTML = `
            <p class="text-[10px] ${isLocal ? "text-primary" : "text-text/50"} font-semibold mb-0.5">${sender}</p>
            <p class="text-xs text-text/90 break-words leading-relaxed">${text}</p>
        `;
        chatMessages.appendChild(li);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function initDiscovery() {
        nearbyRoomId = await resolveNearbyRoomId();
        console.log("Nearby Room ID:", nearbyRoomId);
        networkLabel.textContent = `Room #${nearbyRoomId.slice(0, 16)}`;
        initPeer();
    }

    function getPeerOptions() {
        const peerOptions = { debug: 1 };
        if (appConfig.peer) Object.assign(peerOptions, appConfig.peer);
        return peerOptions;
    }

    function generatePeerId() {
        try {
            if (window.crypto && crypto.randomUUID) {
                return `ls-${nearbyRoomId}-${crypto.randomUUID()}`;
            }
        } catch (_e) {}
        const rnd = Math.random().toString(36).substring(2, 16);
        return `ls-${nearbyRoomId}-${rnd}-${Date.now().toString(36)}`;
    }

    function initPeer() {
        const attemptId = generatePeerId();
        if (peer) {
            try { peer.destroy(); } catch (_e) {}
            peer = null;
        }
        peer = new Peer(attemptId, getPeerOptions());

        peer.on("open", (id) => {
            console.log("Peer Open:", id);
            deviceStatusDot.className = "status-dot online";
            statusEl.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <i class="bi bi-laptop text-primary"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-white truncate">${localPeerName}</p>
                            <p class="text-[10px] font-mono text-text/40 truncate">${id}</p>
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
            document.getElementById("copy-id").onclick = () => {
                navigator.clipboard.writeText(id).then(() => showToast("Peer ID copied!", "success"));
            };
            displayQrCode(id);
            startNearbyScan();
            bootstrapRoomRegistry();
        });

        peer.on("connection", (conn) => handleIncomingConnection(conn));

        peer.on("error", (err) => {
            if (err?.message?.includes("ls-roomhost-") && err.message.includes("taken")) return;
            console.error("PeerJS Error:", err);
            if (err?.type === "unavailable-id") {
                showToast("Peer ID collision — regenerating...", "warning");
                setTimeout(initPeer, 300 + Math.random() * 400);
                return;
            }
            showToast(`Error: ${err?.type || err}`, "error");
        });

        peer.on("disconnected", () => {
            deviceStatusDot.className = "status-dot offline";
            networkDot.className = "w-2 h-2 rounded-full bg-red-400";
            showToast("Disconnected from signaling server. Reconnecting...", "warning");
            setTimeout(() => { try { peer.reconnect(); } catch (_e) {} }, 2000);
        });
    }

    function displayQrCode(id) {
        try {
            QRCode.toCanvas(qrCodeCanvas, id, {
                width: 130, margin: 1,
                color: { dark: "#00E5FF", light: "#000000" }
            });
            qrCodeContainer.classList.remove("hidden");
        } catch (e) { console.warn("QR render failed", e); }
    }

    function updateDiscoveryStatus(text) {
        const el = document.getElementById("discovery-status");
        if (el) el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-accent"></span>${text || ""}`;
    }

    // ═══════════════════════════════════════════
    // Connection & Handshake
    // ═══════════════════════════════════════════
    function handleIncomingConnection(conn) {
        const remoteName = conn.metadata?.name || "Unknown Device";
        handshakeMessage.innerHTML = `<strong class="text-white">${remoteName}</strong> wants to connect with you.`;
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
            conn.send({ type: "handshake-response", accepted: true, name: localPeerName });
            setupConnection(conn, remoteName);
            showToast(`Connected to ${remoteName}`, "success");
        };
        handshakeReject.onclick = () => {
            cleanup();
            conn.send({ type: "handshake-response", accepted: false });
            setTimeout(() => conn.close(), 300);
        };
    }

    function setupConnection(conn, name) {
        const pid = conn.peer;
        connections[pid] = { conn, name, status: "active" };
        let didDisconnect = false;

        const removeConnection = (reason) => {
            if (didDisconnect) return;
            didDisconnect = true;
            delete connections[pid];
            if (reason) showToast(reason, "info");
            updatePeerListUi();
            updateChatPresence();
            if (isRoomHost) publishRoster();
        };

        const onConnected = () => {
            updatePeerListUi();
            updateChatPresence();
            conn.send({ type: "peer-name", name: localPeerName });
            if (isRoomHost) publishRoster();
        };

        conn.on("open", onConnected);
        if (conn.open) onConnected();

        conn.on("data", (data) => {
            if (!data || typeof data !== "object") return;
            switch (data.type) {
                case "file-metadata": handleFileMetadata(data, pid); break;
                case "file-chunk": handleFileChunk(data, pid); break;
                case "transfer-complete": handleTransferComplete(data, pid); break;
                case "chat-message": appendChatMessage(data.from || connections[pid]?.name || "Peer", data.message || ""); break;
                case "disconnect-notice": removeConnection(`${name} disconnected`); try { conn.close(); } catch (_e) {} break;
                case "peer-name":
                    if (connections[pid]) { connections[pid].name = data.name; updatePeerListUi(); }
                    break;
            }
        });

        conn.on("close", () => removeConnection(`${name} disconnected`));
        conn.on("error", (err) => { console.error("Conn error:", err); removeConnection(`Connection error with ${name}`); });
    }

    function requestConnection(remoteId) {
        if (!remoteId) return showToast("Enter a Peer ID first", "warning");
        if (peer && remoteId === peer.id) return showToast("Cannot connect to yourself", "warning");

        showToast(`Requesting connection to ${remoteId.slice(0, 20)}...`, "info");
        const conn = peer.connect(remoteId, { metadata: { name: localPeerName, type: "handshake" }, reliable: true });

        conn.on("data", (data) => {
            if (data?.type === "handshake-response") {
                if (data.accepted) {
                    showToast(`Connection accepted by ${data.name}`, "success");
                    setupConnection(conn, data.name);
                } else {
                    showToast("Connection rejected by peer", "warning");
                    conn.close();
                }
            }
        });
        conn.on("error", () => showToast("Failed to connect", "error"));
    }

    connectButton.addEventListener("click", () => requestConnection(peerIdInput.value.trim()));
    peerIdInput.addEventListener("keydown", (e) => { if (e.key === "Enter") requestConnection(peerIdInput.value.trim()); });

    // ═══════════════════════════════════════════
    // Chat
    // ═══════════════════════════════════════════
    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        const peers = Object.values(connections);
        if (!peers.length) return showToast("Connect to a peer first", "warning");
        peers.forEach(({ conn }) => { if (conn.open) conn.send({ type: "chat-message", from: localPeerName, message: text }); });
        appendChatMessage(localPeerName, text, true);
        chatInput.value = "";
    }
    chatSend.addEventListener("click", sendChatMessage);
    chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChatMessage(); });

    // ═══════════════════════════════════════════
    // UI Updates
    // ═══════════════════════════════════════════
    function updatePeerListUi() {
        peerList.innerHTML = "";
        const entries = Object.entries(connections);
        if (entries.length === 0) {
            peerList.innerHTML = `<li class="text-xs text-text/40 italic text-center py-4">No active connections</li>`;
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
                        <p class="text-xs font-semibold text-white truncate">${data.name}</p>
                        <p class="text-[9px] font-mono text-text/30 truncate">${id.slice(0, 24)}...</p>
                    </div>
                </div>
                <button class="icon-btn text-text/30 hover:text-red-400" onclick="window.disconnectPeer('${id}')" title="Disconnect">
                    <i class="bi bi-x-lg text-xs"></i>
                </button>
            `;
            peerList.appendChild(li);
        });
        if (peer) scanNearbyPeers();
    }

    window.disconnectPeer = (id) => {
        if (!connections[id]) return;
        const target = connections[id].conn;
        try { if (target.open) target.send({ type: "disconnect-notice" }); } catch (_e) {}
        try { target.close(); } catch (_e) {}
        delete connections[id];
        updatePeerListUi();
        updateChatPresence();
        if (isRoomHost) publishRoster();
        showToast("Peer disconnected", "info");
    };

    function renderNearbyPeers(peers) {
        if (!peers.length) {
            nearbyList.innerHTML = `
                <li class="p-3 rounded-xl bg-white/3 border border-white/6 flex items-center justify-between">
                    <span class="text-[11px] text-text/50">Network: <strong class="text-text/70">#${nearbyRoomId.slice(0, 14)}</strong></span>
                    <span class="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Active</span>
                </li>
                <li class="text-[11px] text-text/30 italic py-5 text-center">No nearby devices found yet</li>
            `;
            return;
        }
        nearbyList.innerHTML = `
            <li class="p-3 rounded-xl bg-white/3 border border-white/6 flex items-center justify-between">
                <span class="text-[11px] text-text/50">Network: <strong class="text-text/70">#${nearbyRoomId.slice(0, 14)}</strong></span>
                <span class="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">${peers.length} Found</span>
            </li>
        `;
        peers.forEach(({ peerId, name }) => {
            const isConnected = Boolean(connections[peerId]);
            const li = document.createElement("li");
            li.className = "connection-card";
            li.innerHTML = `
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold text-white truncate">${name}</p>
                    <p class="text-[9px] font-mono text-text/30 truncate">${peerId.slice(0, 28)}...</p>
                </div>
                <button class="btn-connect-sm ${isConnected ? "opacity-40 pointer-events-none" : ""}" ${isConnected ? "disabled" : ""}>
                    ${isConnected ? '<i class="bi bi-check2"></i>' : '<i class="bi bi-plug"></i>'}
                    ${isConnected ? "Linked" : "Connect"}
                </button>
            `;
            if (!isConnected) li.querySelector("button").addEventListener("click", () => requestConnection(peerId));
            nearbyList.appendChild(li);
        });
    }

    // ═══════════════════════════════════════════
    // Room Registry (Host/Client Discovery)
    // ═══════════════════════════════════════════
    function getRoomHostId() { return `ls-roomhost-${nearbyRoomId}`; }
    function upsertRoomPeer(peerId, name) { roomPeers[peerId] = { peerId, name: name || "Nearby Device", ts: Date.now() }; }
    function removeRoomPeer(peerId) { delete roomPeers[peerId]; delete roomPeerConns[peerId]; }
    function getSanitizedRoster() { return Object.values(roomPeers).map(({ peerId, name, ts }) => ({ peerId, name, ts })); }

    function publishRoster() {
        const now = Date.now();
        Object.values(roomPeers).forEach((entry) => {
            if (entry.peerId !== peer?.id && now - (entry.ts || 0) > REGISTRY_HEARTBEAT_MS * 4) removeRoomPeer(entry.peerId);
        });
        const roster = getSanitizedRoster();
        renderNearbyPeers(roster.filter((p) => p.peerId !== peer?.id));
        if (!isRoomHost) return;
        Object.entries(roomPeerConns).forEach(([peerId, targetConn]) => {
            if (targetConn?.open) targetConn.send({ type: "registry-roster", peers: roster });
            else delete roomPeerConns[peerId];
        });
    }

    function startRegistryHeartbeat() {
        if (nearbyScanTimer) clearInterval(nearbyScanTimer);
        nearbyScanTimer = setInterval(() => {
            if (isRoomHost) { publishRoster(); return; }
            if (registryConn?.open) registryConn.send({ type: "registry-register", peerId: peer.id, name: localPeerName });
            else if (!isTransitioningDiscovery) connectToRoomHost();
        }, REGISTRY_HEARTBEAT_MS);
    }

    function setupRoomHostPeer() {
        if (!roomHostPeer) return;
        isRoomHost = true;
        upsertRoomPeer(peer.id, localPeerName);
        roomHostPeer.on("connection", (conn) => {
            conn.on("data", (data) => {
                if (data?.type !== "registry-register") return;
                const registryPeerId = data.peerId || conn.peer;
                conn._registryPeerId = registryPeerId;
                upsertRoomPeer(registryPeerId, data.name || "Nearby Device");
                roomPeerConns[registryPeerId] = conn;
                publishRoster();
            });
            conn.on("close", () => { removeRoomPeer(conn._registryPeerId || conn.peer); publishRoster(); });
        });
        publishRoster();
    }

    function becomeRoomHost() {
        if (roomHostPeer || isRoomHost) return;
        isTransitioningDiscovery = true;
        updateDiscoveryStatus("Setting up discovery host...");
        try { roomHostPeer = new Peer(getRoomHostId(), getPeerOptions()); } catch (e) { isTransitioningDiscovery = false; return; }

        roomHostPeer.on("open", () => {
            isRoomHost = true; isTransitioningDiscovery = false;
            updateDiscoveryStatus("Hosting local discovery");
            networkDot.className = "w-2 h-2 rounded-full bg-accent";
            setupRoomHostPeer();
        });
        roomHostPeer.on("error", (err) => {
            try { roomHostPeer.destroy(); } catch (_e) {}
            roomHostPeer = null; isRoomHost = false;
            if (err?.type === "unavailable-id" || (err.message && /taken/i.test(err.message))) {
                setTimeout(() => { isTransitioningDiscovery = false; connectToRoomHost(); }, 500);
            } else { isTransitioningDiscovery = false; }
        });
    }

    function connectToRoomHost() {
        if (!peer?.id || isRoomHost || roomHostPeer || isTransitioningDiscovery) return;
        isTransitioningDiscovery = true;
        const hostId = getRoomHostId();
        updateDiscoveryStatus("Connecting to room host...");
        const conn = peer.connect(hostId, { reliable: true });
        registryConn = conn;

        const openTimeout = setTimeout(() => {
            if (!conn.open) { try { conn.close(); } catch (_e) {} registryConn = null; isTransitioningDiscovery = false; becomeRoomHost(); }
        }, 1500);

        conn.on("open", () => {
            clearTimeout(openTimeout); isTransitioningDiscovery = false;
            updateDiscoveryStatus("Connected to room host");
            networkDot.className = "w-2 h-2 rounded-full bg-accent";
            conn.send({ type: "registry-register", peerId: peer.id, name: localPeerName });
        });
        conn.on("data", (data) => {
            if (data?.type === "registry-roster") {
                const peers = (data.peers || []).filter((p) => p.peerId !== peer.id);
                Object.keys(roomPeers).forEach(k => delete roomPeers[k]);
                peers.forEach((p) => upsertRoomPeer(p.peerId, p.name));
                renderNearbyPeers(peers);
            }
        });
        conn.on("error", () => { clearTimeout(openTimeout); try { conn.close(); } catch (_e) {} registryConn = null; setTimeout(() => { isTransitioningDiscovery = false; becomeRoomHost(); }, 300); });
        conn.on("close", () => { if (registryConn) { registryConn = null; } setTimeout(() => { isTransitioningDiscovery = false; becomeRoomHost(); }, 400); });
    }

    function bootstrapRoomRegistry() { connectToRoomHost(); }

    function scanNearbyPeers() {
        if (!peer?.id) { renderNearbyPeers([]); return; }
        if (isRoomHost || registryConn?.open) { renderNearbyPeers(Object.values(roomPeers).filter((p) => p.peerId !== peer.id)); return; }
        nearbyList.innerHTML = `<li class="text-[11px] text-text/30 py-5 text-center italic">Bootstrapping discovery...</li>`;
    }

    function startNearbyScan() { scanNearbyPeers(); startRegistryHeartbeat(); }
    rescanBtn?.addEventListener("click", () => { scanNearbyPeers(); showToast("Rescanning network...", "info"); });

    // ═══════════════════════════════════════════
    // File Selection & Drag/Drop
    // ═══════════════════════════════════════════
    fileInput.addEventListener("change", (e) => { selectedFiles = Array.from(e.target.files); renderSelectedFiles(); });
    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault(); dropZone.classList.remove("drag-over");
        selectedFiles = [...selectedFiles, ...Array.from(e.dataTransfer.files)];
        renderSelectedFiles();
    });
    clearFilesBtn?.addEventListener("click", () => { selectedFiles = []; fileInput.value = ""; renderSelectedFiles(); });

    function renderSelectedFiles() {
        fileListUi.innerHTML = "";
        selectedCount.textContent = selectedFiles.length;
        selectedFilesSection.classList.toggle("hidden", selectedFiles.length === 0);
        if (selectedFiles.length === 0) return;

        selectedFiles.forEach((file, index) => {
            const li = document.createElement("li");
            li.className = "flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/6 group";
            li.innerHTML = `
                <i class="bi ${getFileIcon(file.name)} text-primary/70"></i>
                <div class="min-w-0 flex-1">
                    <p class="text-xs text-text/90 truncate">${file.name}</p>
                    <p class="text-[9px] text-text/40">${formatBytes(file.size)}</p>
                </div>
                <button class="icon-btn opacity-0 group-hover:opacity-100" onclick="window.removeFile(${index})">
                    <i class="bi bi-x text-xs"></i>
                </button>
            `;
            fileListUi.appendChild(li);
        });
    }
    window.removeFile = (idx) => { selectedFiles.splice(idx, 1); renderSelectedFiles(); };

    // ═══════════════════════════════════════════
    // FILE SENDING (Robust, Corruption-Free)
    // ═══════════════════════════════════════════
    sendButton.addEventListener("click", () => {
        if (!selectedFiles.length) return showToast("Select files first", "warning");
        const peers = Object.values(connections);
        if (!peers.length) return showToast("Connect to a peer first", "warning");
        selectedFiles.forEach(file => peers.forEach(peerData => sendFile(file, peerData)));
        showToast(`Starting transfer of ${selectedFiles.length} file(s)...`, "info");
        selectedFiles = []; fileInput.value = ""; renderSelectedFiles();
    });

    async function sendFile(file, peerData) {
        const { conn, name } = peerData;
        const transferId = `send-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Compute full-file checksum for integrity verification
        const fileBuffer = await file.arrayBuffer();
        const checksum = computeChecksum(fileBuffer);
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        // Create progress UI
        const li = document.createElement("li");
        li.id = transferId;
        li.className = "transfer-card";
        li.innerHTML = `
            <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2 min-w-0">
                    <i class="bi ${getFileIcon(file.name)} text-primary text-sm"></i>
                    <span class="text-[11px] font-medium text-text/80 truncate max-w-[140px]">${file.name}</span>
                </div>
                <span class="text-[10px] text-primary/70 font-medium">→ ${name.split(" ").slice(1).join(" ")}</span>
            </div>
            <div class="progress-track">
                <div id="${transferId}-bar" class="progress-fill"></div>
            </div>
            <div class="flex justify-between mt-1">
                <span id="${transferId}-meta" class="text-[9px] text-text/40">Preparing...</span>
                <span id="${transferId}-speed" class="text-[9px] text-text/30"></span>
            </div>
        `;
        sendProgressList.appendChild(li);
        updateTransferVisibility();

        // Send metadata with checksum and mime type
        conn.send({
            type: "file-metadata",
            fileName: file.name,
            totalSize: file.size,
            totalChunks,
            mimeType: file.type || "application/octet-stream",
            checksum
        });

        // Stream chunks with backpressure
        let offset = 0;
        let chunkIndex = 0;
        const startTime = Date.now();

        const sendNextChunk = () => {
            if (offset >= file.size) {
                // All chunks sent, notify completion
                conn.send({ type: "transfer-complete", fileName: file.name, totalChunks: chunkIndex, checksum });
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = file.size / Math.max(elapsed, 0.001);
                const meta = document.getElementById(`${transferId}-meta`);
                const speedEl = document.getElementById(`${transferId}-speed`);
                if (meta) meta.textContent = `Complete • ${formatBytes(file.size)} in ${elapsed.toFixed(1)}s`;
                if (speedEl) speedEl.textContent = formatSpeed(speed);
                const bar = document.getElementById(`${transferId}-bar`);
                if (bar) bar.style.width = "100%";
                setTimeout(() => { li.style.opacity = "0.5"; }, 2000);
                return;
            }

            // Backpressure: wait if buffer is full
            const dc = conn.dataChannel;
            if (dc && dc.bufferedAmount > MAX_BUFFERED_AMOUNT) {
                setTimeout(sendNextChunk, 5);
                return;
            }

            const end = Math.min(offset + CHUNK_SIZE, file.size);
            const chunkData = fileBuffer.slice(offset, end);
            const chunkArray = Array.from(new Uint8Array(chunkData));

            conn.send({
                type: "file-chunk",
                fileName: file.name,
                chunkIndex,
                chunk: chunkArray,
                isLast: end >= file.size
            });

            offset = end;
            chunkIndex++;

            // Update UI
            const pct = (offset / file.size) * 100;
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = offset / Math.max(elapsed, 0.001);
            const bar = document.getElementById(`${transferId}-bar`);
            const meta = document.getElementById(`${transferId}-meta`);
            const speedEl = document.getElementById(`${transferId}-speed`);
            if (bar) bar.style.width = `${pct}%`;
            if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(offset)} / ${formatBytes(file.size)}`;
            if (speedEl) speedEl.textContent = formatSpeed(speed);

            // Use requestAnimationFrame for smooth sending without blocking
            requestAnimationFrame(sendNextChunk);
        };

        sendNextChunk();
    }

    // ═══════════════════════════════════════════
    // FILE RECEIVING (With Integrity Verification)
    // ═══════════════════════════════════════════
    function handleFileMetadata(data, peerId) {
        const key = `${peerId}:${data.fileName}`;
        const transferId = `recv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const peerName = connections[peerId]?.name || "Peer";

        const li = document.createElement("li");
        li.id = transferId;
        li.className = "transfer-card";
        li.innerHTML = `
            <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2 min-w-0">
                    <i class="bi ${getFileIcon(data.fileName)} text-accent text-sm"></i>
                    <span class="text-[11px] font-medium text-text/80 truncate max-w-[140px]">${data.fileName}</span>
                </div>
                <span class="text-[10px] text-accent/70 font-medium">← ${peerName.split(" ").slice(1).join(" ")}</span>
            </div>
            <div class="progress-track">
                <div id="${transferId}-bar" class="progress-fill bg-accent"></div>
            </div>
            <div class="flex justify-between mt-1">
                <span id="${transferId}-meta" class="text-[9px] text-text/40">Waiting for data...</span>
                <span id="${transferId}-speed" class="text-[9px] text-text/30"></span>
            </div>
        `;
        receivedFiles.appendChild(li);
        updateTransferVisibility();

        incomingTransfers[key] = {
            chunks: new Array(data.totalChunks || 0),
            receivedChunks: 0,
            receivedBytes: 0,
            totalSize: data.totalSize,
            totalChunks: data.totalChunks || 0,
            mimeType: data.mimeType || "application/octet-stream",
            checksum: data.checksum,
            element: li,
            transferId,
            startTime: Date.now()
        };
    }

    function handleFileChunk(data, peerId) {
        const key = `${peerId}:${data.fileName}`;
        const transfer = incomingTransfers[key];
        if (!transfer) return;

        // Store chunk by index for ordering guarantee
        const chunkData = new Uint8Array(data.chunk);
        transfer.chunks[data.chunkIndex] = chunkData;
        transfer.receivedChunks++;
        transfer.receivedBytes += chunkData.byteLength;

        const pct = (transfer.receivedBytes / transfer.totalSize) * 100;
        const elapsed = (Date.now() - transfer.startTime) / 1000;
        const speed = transfer.receivedBytes / Math.max(elapsed, 0.001);

        const bar = document.getElementById(`${transfer.transferId}-bar`);
        const meta = document.getElementById(`${transfer.transferId}-meta`);
        const speedEl = document.getElementById(`${transfer.transferId}-speed`);
        if (bar) bar.style.width = `${pct}%`;
        if (meta) meta.textContent = `${Math.round(pct)}% • ${formatBytes(transfer.receivedBytes)} / ${formatBytes(transfer.totalSize)}`;
        if (speedEl) speedEl.textContent = formatSpeed(speed);
    }

    function handleTransferComplete(data, peerId) {
        const key = `${peerId}:${data.fileName}`;
        const transfer = incomingTransfers[key];
        if (!transfer) return;

        // Assemble file from ordered chunks
        const orderedChunks = transfer.chunks.filter(c => c !== undefined);
        if (orderedChunks.length !== transfer.totalChunks) {
            showToast(`File "${data.fileName}" is incomplete. Transfer failed.`, "error");
            transfer.element.remove();
            delete incomingTransfers[key];
            updateTransferVisibility();
            return;
        }

        const fullData = new Uint8Array(transfer.totalSize);
        let offset = 0;
        for (const chunk of orderedChunks) {
            fullData.set(chunk, offset);
            offset += chunk.byteLength;
        }

        // Verify checksum
        const receivedChecksum = computeChecksum(fullData.buffer);
        if (transfer.checksum && receivedChecksum !== transfer.checksum) {
            showToast(`File "${data.fileName}" failed integrity check. Please retry.`, "error");
            transfer.element.remove();
            delete incomingTransfers[key];
            updateTransferVisibility();
            return;
        }

        // Create blob with proper MIME type
        const blob = new Blob([fullData.buffer], { type: transfer.mimeType });
        const url = URL.createObjectURL(blob);
        const elapsed = ((Date.now() - transfer.startTime) / 1000).toFixed(1);

        transfer.element.innerHTML = `
            <div class="flex items-center justify-between gap-3 p-1">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                        <i class="bi ${getFileIcon(data.fileName)} text-accent text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-semibold text-white truncate">${data.fileName}</p>
                        <p class="text-[9px] text-text/40">${formatBytes(transfer.totalSize)} • ${elapsed}s • ✓ Verified</p>
                    </div>
                </div>
                <a href="${url}" download="${data.fileName}" class="icon-btn-primary" title="Download">
                    <i class="bi bi-download"></i>
                </a>
            </div>
        `;

        delete incomingTransfers[key];
        updateTransferVisibility();
        showToast(`Received "${data.fileName}" (${formatBytes(transfer.totalSize)})`, "success");
    }

    // ═══════════════════════════════════════════
    // Kickoff
    // ═══════════════════════════════════════════
    updateChatPresence();
    initDiscovery();
});