# LocalShare

<p align="center">
  <img src="localshare-logo.png" width="80" alt="LocalShare Logo">
</p>

<p align="center">
  <strong>Zero-config peer-to-peer file sharing & messaging — no servers, no limits.</strong>
</p>

<p align="center">
  <a href="https://local-share.netlify.app/">🚀 Live Demo</a> ·
  <a href="https://github.com/infinitode/LocalShare/issues">Report Bug</a> ·
  <a href="https://github.com/infinitode/LocalShare/issues">Request Feature</a>
</p>


## What is LocalShare?

LocalShare is a fully client-side, peer-to-peer file-sharing and messaging web application built with **vanilla HTML, Tailwind CSS v4, and JavaScript**. It leverages **WebRTC via PeerJS** to enable devices on the same network to discover each other and transfer files directly — no intermediary server, no file size limits, no data leaves your network.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Direct P2P Transfers** | Files stream device-to-device over encrypted WebRTC data channels |
| **Zero-Config Discovery** | Devices sharing a public IP auto-discover each other via room registry |
| **Corruption-Free Transfers** | FNV-1a checksum verification + ordered chunk assembly guarantees file integrity |
| **High-Speed Chunking** | 256KB chunks with WebRTC backpressure control for maximum throughput |
| **Failover Room Host** | Automatic host election with seamless failover if the host disconnects |
| **Secure Handshakes** | Explicit Accept/Reject confirmation before any connection is established |
| **Real-Time Transfer Metrics** | Live speed, percentage, and byte-count tracking with progress bars |
| **Room Chat** | Encrypted in-room messaging between all connected peers |
| **Manual Peer Connect** | Bridge any network via direct Peer ID or QR code scanning |
| **Drag & Drop** | Native drag-and-drop file selection with multi-file support |
| **Smart File Icons** | Automatic icon detection for 30+ file types (media, code, archives, apps) |

## 🆕 v2.1 — Reliability & Security Overhaul

### Automatic Discovery & Reliability
- **Multi-Source Room Resolution**: Multi-tier public IP lookup (ipify IPv4, icanhazip, api64) with timeouts, STUN candidate fallback, and local subnet normalization.
- **Direct Room Link & QR Sharing**: Open or share any custom room via URL hash (`#room=my-room`) or scan a QR code to guarantee 100% discovery across separate Wi-Fi networks, cellular, or VPNs.
- **Resilient Room Host Election**: Randomized jitter backoff eliminates collision storms during election; room host auto-reconnects on signaling drops.
- **Distributed Peer Gossip**: Connected peers exchange active rosters; discovery persists even during room host transitions.
- **Real-Time Latency Tracking**: Continuous RTT ping/pong metrics displayed on active connection cards.

### Security & Integrity
- **Cryptographic SAS Verification**: Deterministic 4-digit verification code and emoji fingerprint derived from peer IDs (`SHA-256 / FNV-1a`) to prevent man-in-the-middle attacks.
- **Transfer Consent (File Offers)**: Receivers review file offers (sender, file list, sizes) before accepting, preventing unauthorized memory flooding and spam.
- **Auto-Accept & Trusted Devices**: Configurable auto-accept toggle and remembered trusted device list for seamless home/office workflows.
- **Transfer Cancellation**: Senders and receivers can abort in-flight transfers anytime, immediately releasing memory buffers.
- **Zero-Copy Memory Assembly**: Direct `Blob` construction from binary chunk arrays avoids duplicate buffer allocations and eliminates OOM crashes on large files.
- **Path Traversal & Execution Sanitization**: File names sanitized against directory traversal (`../`) and dangerous MIME types safely handled.

### Modern SaaS UI / UX
- **Refined SaaS Design**: Polished border radius, glowing cyber accents, subtle glassmorphic panels, and backdrop blurs.
- **Custom Device Renaming**: Inline nickname editor persists to `localStorage` and syncs dynamically across linked peers.
- **Theme Accent Switcher**: 6 cyber color palettes (Electric Cyan, Emerald Green, Neon Violet, Solar Amber, Rose Pink, Cyber Blue).
- **In-App File Previewer**: Instant inline preview for received images, text/code, and audio files.
- **Web Audio Chimes**: Synthesized audio feedback for connections, completed transfers, and messages (with mute toggle).
- **Target Recipient Selection**: Choose to broadcast to all connected devices or target a specific peer.
- **Folder Support**: Select and upload whole folders via directory input.

## 🆕 v2.0 — What's New

### Transfer Engine (Complete Rewrite)
- **Eliminated file corruption**: Replaced naive `FileReader` chunking with direct `ArrayBuffer` slicing, ordered chunk indices, and FNV-1a checksum verification on receive
- **256KB chunk size** (up from 64KB) for 4× faster transfers
- **WebRTC backpressure**: Monitors `dataChannel.bufferedAmount` to prevent buffer overflow and data loss
- **MIME type preservation**: Files are reconstructed with their original MIME type for proper handling by the OS
- **Transfer-complete handshake**: Receiver verifies chunk count and checksum before assembling the final Blob
- **Removed artificial delays**: Replaced `setTimeout(10ms)` chunking with `requestAnimationFrame` for smooth, non-blocking sends

### Discovery & Networking
- **Single-target failover architecture**: Devices probe one unified room host ID; on collision, they silently fall back to client mode
- **Faster room resolution**: Ipify lookup with 4s abort timeout and graceful local fallback
- **Clean console**: Suppressed all expected PeerJS warnings during normal discovery flow
- **Reconnection handling**: Automatic signaling server reconnect with visual status indicators

### UI/UX Overhaul
- **Professional SaaS design**: Clean card-based layout with Inter font, consistent spacing, and subtle glass effects
- **Toast notification system**: Replaced basic popup with animated, typed toast messages (info/success/error/warning)
- **Drag-and-drop zone**: Visual feedback with scale animation on drag-over
- **File type icons**: 30+ file extensions mapped to Bootstrap Icons
- **Live transfer speed**: Real-time MB/s display during sends and receives
- **Status indicators**: Network dot, device status, and connection count badges
- **Responsive grid**: 12-column layout that adapts from mobile to desktop
- **Dark-mode optimized**: Pure black (#000) AMOLED background with cyan/mint accents

### Name Generator
- **48 adjectives × 48 nouns × 900 numbers × 16 emojis** = 33M+ unique combinations
- Emoji prefix for instant visual identification in peer lists

## 🚀 Getting Started

### Live App
👉 **[https://local-share.netlify.app/](https://local-share.netlify.app/)**

### Local Setup

```bash
# Clone the repository
git clone https://github.com/Infinitode/LocalShare.git

# Navigate into the project
cd LocalShare

# Compile Tailwind CSS v4 (requires Node.js)
npx @tailwindcss/cli -i input.css -o output.css --watch

# Open index.html in your browser or use a local server
npx serve .
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Room Discovery                        │
│                                                         │
│  Device A ──┐                                          │
│  Device B ──┼──► Room Host (ls-roomhost-{room-id})    │
│  Device C ──┘       │                                   │
│                     ▼                                   │
│              Registry Roster Broadcast                   │
│              (peer list sync to all clients)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   File Transfer                          │
│                                                         │
│  Sender                      Receiver                   │
│  ──────                      ────────                   │
│  1. Read file as ArrayBuffer                            │
│  2. Compute FNV-1a checksum                             │
│  3. Send metadata (name, size,                          │
│     chunks, mime, checksum)                             │
│  4. Stream 256KB chunks ──────► Collect by index        │
│     (with backpressure)         5. Verify chunk count   │
│                                 6. Verify checksum      │
│                                 7. Assemble Blob        │
│                                 8. Offer download       │
└─────────────────────────────────────────────────────────┘
```

### Room Assignment
LocalShare queries [ipify](https://www.ipify.org/) for your public IP, hashes it into a deterministic `#room-id`. All devices behind the same NAT share this room.

### Host Election
The first device binds to `ls-roomhost-{room-id}`. Subsequent devices detect the ID is taken and connect as clients. If the host drops, the next heartbeat triggers a new election.

### Transfer Integrity
Every file transfer includes:
1. **Chunk sequencing** — each chunk carries its index
2. **FNV-1a checksum** — computed over the full file before send, verified after assembly
3. **MIME type** — preserved for correct Blob construction
4. **Completion signal** — explicit `transfer-complete` message triggers final verification

## 🛠️ Tech Stack

- **HTML5** — Semantic markup
- **Tailwind CSS v4** — Utility-first styling (compiled via `@tailwindcss/cli`)
- **Vanilla JavaScript (ES2022)** — No frameworks, no build step for logic
- **PeerJS** — WebRTC abstraction for data channels
- **QRCode.js** — Instant QR code generation for peer IDs
- **Bootstrap Icons** — Icon system

## 🤝 Contributing

Contributions make the open-source community an amazing place. Any contributions are greatly appreciated.

1. **Fork** the Project
2. **Create** your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your Changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the Branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Or simply [open an issue](https://github.com/infinitode/LocalShare/issues) with bug reports or suggestions.

## 📄 License

LocalShare is released under the **MIT License (Modified)**. See [LICENSE](LICENSE) for details.

> **Modified Clause**: Derivative works must be clearly distinguished from the original and distributed under a different name.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/infinitode">Infinitode</a>
</p>