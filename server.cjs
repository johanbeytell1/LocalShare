#!/usr/bin/env node
// LocalShare Optional Zero-Dependency Local LAN Turbo Server (v2.2)
// Run: `npm start` (or `node server.cjs`)
//
// Gives two devices on the same Wi-Fi/Ethernet LAN:
//   1. 100% Offline LAN auto-discovery & local WebRTC signaling (no PeerJS cloud server needed!)
//   2. Zero-RAM-buffering Direct LAN TCP/HTTP Pipe (`/api/lan/stream/:id`) at full router link speed!
//
// Note: LocalShare remains 100% client-side on static hosts (Netlify, GitHub Pages, etc.)
// using its built-in Pure-Browser Direct LAN WebRTC Turbo Engine. This server is purely optional.

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");

const ROOT_DIR = __dirname;

const ALLOWED_STATIC_FILES = new Map([
  ["/", { file: "index.html", type: "text/html; charset=utf-8" }],
  ["/index.html", { file: "index.html", type: "text/html; charset=utf-8" }],
  ["/lan-turbo.js", { file: "lan-turbo.js", type: "application/javascript; charset=utf-8" }],
  ["/index.js", { file: "index.js", type: "application/javascript; charset=utf-8" }],
  ["/index.css", { file: "index.css", type: "text/css; charset=utf-8" }],
  ["/localshare-logo.png", { file: "localshare-logo.png", type: "image/png" }],
  ["/localshare.png", { file: "localshare.png", type: "image/png" }],
]);

function getLocalLanIps() {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    if (!Array.isArray(list)) continue;
    for (const addr of list) {
      if (addr && addr.family === "IPv4" && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  // Prefer standard RFC1918 router LAN subnets (192.168.x, 10.x, 172.16-31.x) ahead of link-local 169.254.x
  const score = (ip) => {
    if (ip.startsWith("192.168.")) return 0;
    if (ip.startsWith("10.")) return 1;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
    if (ip.startsWith("169.254.")) return 4;
    return 3;
  };
  return ips.sort((a, b) => score(a) - score(b));
}

function timingSafeHexEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function sanitizeHeaderFilename(name) {
  const clean = String(name || "download")
    .replace(/^.*[\\/]/, "")
    .replace(/[\r\n"\\<>:|?*\x00-\x1f]/g, "_")
    .trim();
  return clean.slice(0, 180) || "download";
}

function readJsonBody(req, limitBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function createLanServer(options = {}) {
  const host = options.host || process.env.HOST || "0.0.0.0";
  const port = options.port !== undefined ? Number(options.port) : Number(process.env.PORT || 3000);
  const rootDir = options.rootDir || ROOT_DIR;

  // Connected SSE LAN peers: peerId -> { peerId, room, name, platform, res, ts }
  const lanPeers = new Map();

  // Direct zero-buffering HTTP pipe slots: streamId -> StreamSlot
  const streamSlots = new Map();
  const STREAM_TTL_MS = 60_000;

  function sseWrite(res, event, dataObj) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(dataObj)}\n\n`);
    } catch (_e) {}
  }

  function broadcastRoomRoster(room) {
    const peersInRoom = [];
    for (const p of lanPeers.values()) {
      if (p.room === room) {
        peersInRoom.push({
          peerId: p.peerId,
          name: p.name,
          platform: p.platform,
          ts: p.ts,
          lanServer: true,
        });
      }
    }
    for (const p of lanPeers.values()) {
      if (p.room === room) {
        sseWrite(p.res, "roster", { room, peers: peersInRoom });
      }
    }
  }

  function cleanupStreamSlot(streamId) {
    const slot = streamSlots.get(streamId);
    if (!slot) return;
    if (slot.timer) clearTimeout(slot.timer);
    streamSlots.delete(streamId);
  }

  function startPiping(slot) {
    if (!slot.putReq || !slot.getRes || slot.piping) return;
    slot.piping = true;
    if (slot.timer) {
      clearTimeout(slot.timer);
      slot.timer = null;
    }

    const { putReq, putRes, getRes, fileName, totalSize, mimeType, forceDownload } = slot;

    // Disable Nagle algorithm for minimal latency & maximum LAN throughput
    try {
      putReq.socket?.setNoDelay(true);
      getRes.socket?.setNoDelay(true);
    } catch (_e) {}

    const headers = {
      "Content-Type": mimeType || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-LocalShare-Transport": "lan-http-pipe",
    };

    const contentLength =
      Number.isFinite(Number(putReq.headers["content-length"]))
        ? Number(putReq.headers["content-length"])
        : Number.isFinite(totalSize) && totalSize >= 0
          ? totalSize
          : null;

    if (contentLength !== null) {
      headers["Content-Length"] = String(contentLength);
    }

    if (forceDownload) {
      const safeName = sanitizeHeaderFilename(fileName);
      headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
    }

    getRes.writeHead(200, headers);

    let pipedBytes = 0;
    let finished = false;

    const finalize = (err) => {
      if (finished) return;
      finished = true;
      cleanupStreamSlot(slot.streamId);

      if (err) {
        try {
          if (!putRes.headersSent) sendJson(putRes, 502, { ok: false, error: err.message || "Stream aborted" });
          else putRes.end();
        } catch (_e) {}
        try {
          if (!getRes.writableEnded) getRes.destroy();
        } catch (_e) {}
      } else {
        try {
          if (!putRes.headersSent) sendJson(putRes, 200, { ok: true, bytes: pipedBytes });
        } catch (_e) {}
      }
    };

    putReq.on("data", (chunk) => {
      pipedBytes += chunk.length;
    });

    putReq.on("aborted", () => finalize(new Error("Sender aborted upload")));
    putReq.on("error", (err) => finalize(err));
    getRes.on("close", () => {
      if (!getRes.writableFinished) {
        finalize(new Error("Receiver closed connection"));
        try { putReq.destroy(); } catch (_e) {}
      }
    });
    getRes.on("error", (err) => finalize(err));
    getRes.on("finish", () => finalize(null));

    // Direct backpressured kernel TCP stream pipe — ZERO temp files, ZERO RAM accumulation!
    putReq.pipe(getRes);
    putReq.resume();
  }

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = reqUrl.pathname;

    // ─── API: Server Info ───
    if (req.method === "GET" && pathname === "/api/lan/info") {
      const actualPort = server.address()?.port || port;
      sendJson(res, 200, {
        ok: true,
        version: "2.2.0",
        lanIps: getLocalLanIps(),
        port: actualPort,
        activePeers: lanPeers.size,
        activeStreams: streamSlots.size,
      });
      return;
    }

    // ─── API: Offline LAN Discovery & Signaling (SSE) ───
    if (req.method === "GET" && pathname === "/api/lan/events") {
      const peerId = String(reqUrl.searchParams.get("peerId") || "").trim().slice(0, 80);
      const room = String(reqUrl.searchParams.get("room") || "lan").trim().toLowerCase().slice(0, 32) || "lan";
      const name = String(reqUrl.searchParams.get("name") || "LAN Device").trim().slice(0, 48);
      const platform = String(reqUrl.searchParams.get("platform") || "laptop").trim().slice(0, 16);

      if (!peerId) {
        sendJson(res, 400, { ok: false, error: "peerId required" });
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write(": connected\n\n");

      const existing = lanPeers.get(peerId);
      if (existing && existing.res !== res) {
        try { existing.res.end(); } catch (_e) {}
      }

      const peerEntry = { peerId, room, name, platform, res, ts: Date.now() };
      lanPeers.set(peerId, peerEntry);
      broadcastRoomRoster(room);

      const keepAlive = setInterval(() => {
        try {
          res.write(": keepalive\n\n");
        } catch (_e) {}
      }, 20_000);

      req.on("close", () => {
        clearInterval(keepAlive);
        if (lanPeers.get(peerId) === peerEntry) {
          lanPeers.delete(peerId);
          broadcastRoomRoster(room);
        }
      });
      return;
    }

    // ─── API: Local LAN Signaling Relay ───
    if (req.method === "POST" && pathname === "/api/lan/signal") {
      try {
        const body = await readJsonBody(req);
        const from = String(body.from || "");
        const to = String(body.to || "");
        if (!from || !to || !body.payload) {
          sendJson(res, 400, { ok: false, error: "from, to, and payload required" });
          return;
        }
        const target = lanPeers.get(to);
        if (!target) {
          sendJson(res, 404, { ok: false, error: "Target LAN peer offline" });
          return;
        }
        sseWrite(target.res, "signal", { from, payload: body.payload });
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return;
    }

    // ─── API: Create Direct LAN TCP/HTTP Pipe Slot ───
    if (req.method === "POST" && pathname === "/api/lan/stream/create") {
      try {
        const body = await readJsonBody(req);
        const streamId = crypto.randomBytes(12).toString("hex");
        const token = crypto.randomBytes(16).toString("hex");

        const slot = {
          streamId,
          token,
          fileName: sanitizeHeaderFilename(body.fileName || "file"),
          totalSize: Number(body.totalSize || 0),
          mimeType: String(body.mimeType || "application/octet-stream").slice(0, 128),
          putReq: null,
          putRes: null,
          getRes: null,
          forceDownload: false,
          piping: false,
          timer: setTimeout(() => {
            if (slot.putRes && !slot.putRes.headersSent) {
              sendJson(slot.putRes, 408, { ok: false, error: "Receiver did not connect in time" });
            }
            if (slot.getRes && !slot.getRes.headersSent) {
              sendJson(slot.getRes, 408, { ok: false, error: "Sender did not connect in time" });
            }
            cleanupStreamSlot(streamId);
          }, STREAM_TTL_MS),
        };
        streamSlots.set(streamId, slot);
        sendJson(res, 201, { ok: true, streamId, token });
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message });
      }
      return;
    }

    // ─── API: Direct LAN TCP/HTTP Stream Transfer (PUT -> pipe -> GET) ───
    const streamMatch = /^\/api\/lan\/stream\/([a-f0-9]{16,64})$/.exec(pathname);
    if (streamMatch) {
      const streamId = streamMatch[1];
      const token = reqUrl.searchParams.get("token") || "";
      const slot = streamSlots.get(streamId);

      if (!slot || !timingSafeHexEqual(slot.token, token)) {
        sendJson(res, 403, { ok: false, error: "Invalid or expired LAN stream token" });
        return;
      }

      if (req.method === "PUT") {
        if (slot.putReq) {
          sendJson(res, 409, { ok: false, error: "Stream sender already attached" });
          return;
        }
        // Pause incoming upload immediately until receiver attaches so zero data is lost
        req.pause();
        slot.putReq = req;
        slot.putRes = res;

        req.on("close", () => {
          if (!slot.piping && streamSlots.has(streamId)) {
            if (slot.getRes && !slot.getRes.headersSent) {
              sendJson(slot.getRes, 499, { ok: false, error: "Sender closed early" });
            }
            cleanupStreamSlot(streamId);
          }
        });

        if (slot.getRes) {
          startPiping(slot);
        }
        return;
      }

      if (req.method === "GET") {
        if (slot.getRes) {
          sendJson(res, 409, { ok: false, error: "Stream receiver already attached" });
          return;
        }
        slot.getRes = res;
        slot.forceDownload = reqUrl.searchParams.get("download") === "1";

        req.on("close", () => {
          if (!slot.piping && streamSlots.has(streamId)) {
            if (slot.putRes && !slot.putRes.headersSent) {
              sendJson(slot.putRes, 499, { ok: false, error: "Receiver closed early" });
            }
            cleanupStreamSlot(streamId);
          }
        });

        if (slot.putReq) {
          startPiping(slot);
        }
        return;
      }

      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    // ─── Static Web Assets ───
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    const asset = ALLOWED_STATIC_FILES.get(pathname);
    if (!asset) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const absPath = path.join(rootDir, asset.file);
    try {
      if (asset.file === "index.html") {
        let html = fs.readFileSync(absPath, "utf8");
        const actualPort = server.address()?.port || port;
        const lanConfig = {
          enabled: true,
          version: "2.2.0",
          lanIps: getLocalLanIps(),
          port: actualPort,
          httpPipeEnabled: true,
          localSignalingEnabled: true,
        };
        const injection = `<script>window.LOCALSHARE_LAN_SERVER = ${JSON.stringify(lanConfig)};</script>\n`;
        const marker = '<script src="lan-turbo.js"></script>';
        if (html.includes(marker)) {
          html = html.replace(marker, injection + "    " + marker);
        } else {
          html = html.replace("</body>", injection + "</body>");
        }
        const buf = Buffer.from(html, "utf8");
        res.writeHead(200, {
          "Content-Type": asset.type,
          "Content-Length": buf.length,
          "Cache-Control": "no-cache",
        });
        if (req.method === "HEAD") res.end();
        else res.end(buf);
        return;
      }

      const stat = fs.statSync(absPath);
      res.writeHead(200, {
        "Content-Type": asset.type,
        "Content-Length": stat.size,
        "Cache-Control": "no-cache",
      });
      if (req.method === "HEAD") {
        res.end();
      } else {
        fs.createReadStream(absPath).pipe(res);
      }
    } catch (_err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("File not found");
    }
  });

  // Never time out long multi-GB LAN file transfers
  server.requestTimeout = 0;
  server.headersTimeout = 60_000;
  server.keepAliveTimeout = 65_000;

  return {
    server,
    listen() {
      return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.removeListener("error", reject);
          resolve(server.address());
        });
      });
    },
    close() {
      for (const p of lanPeers.values()) {
        try { p.res.end(); } catch (_e) {}
      }
      lanPeers.clear();
      for (const id of Array.from(streamSlots.keys())) {
        cleanupStreamSlot(id);
      }
      return new Promise((resolve) => server.close(() => resolve()));
    },
  };
}

if (require.main === module) {
  const instance = createLanServer();
  instance
    .listen()
    .then((addr) => {
      const actualPort = addr && typeof addr === "object" ? addr.port : 3000;
      const lanIps = getLocalLanIps();
      console.log("");
      console.log("  ⚡ LocalShare v2.2 — Direct LAN Turbo Server");
      console.log("  ─────────────────────────────────────────────");
      console.log(`  Local:  http://localhost:${actualPort}`);
      if (lanIps.length > 0) {
        for (const ip of lanIps) {
          console.log(`  LAN:    http://${ip}:${actualPort}   ← Open on Wi-Fi / LAN devices`);
        }
      } else {
        console.log(`  LAN:    http://0.0.0.0:${actualPort}`);
      }
      console.log("");
      console.log("  Modes enabled: Offline LAN Discovery + Direct LAN WebRTC Turbo + Raw LAN TCP Pipe");
      console.log("");
    })
    .catch((err) => {
      console.error("Failed to start LocalShare LAN Server:", err);
      process.exit(1);
    });
}

module.exports = { createLanServer, getLocalLanIps };
