// LocalShare init smoke test — regression guard for startup crashes.
//
// Runs the real index.js DOMContentLoaded handler in Node with a stubbed DOM
// and asserts the whole init path completes without throwing. This catches
// temporal-dead-zone / wiring crashes (e.g. the isRoomResolved TDZ bug that
// aborted init entirely, silently breaking the hamburger menu, theme engine
// and peer startup on every device).
//
// Run: npm test
const fs = require("node:fs");
const path = require("node:path");

const out = (...a) => process.stdout.write(a.join(" ") + "\n");
const failures = [];
process.on("uncaughtException", (e) => failures.push("uncaughtException: " + (e && e.message)));
process.on("unhandledRejection", (e) => failures.push("unhandledRejection: " + (e && e.message)));

const src = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");

function stubEl() {
  return {
    style: { setProperty: () => {} },
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    setAttribute: () => {}, getAttribute: () => null,
    addEventListener: () => {}, appendChild: () => {},
    querySelectorAll: () => [], textContent: "", innerHTML: "", value: "",
  };
}

const listeners = {};
const cssVars = {};
let fetchCalls = 0;
let peerConstructed = false;

globalThis.document = {
  addEventListener: (ev, cb) => { (listeners[ev] ||= []).push(cb); },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => stubEl(),
  documentElement: { style: { setProperty: (k, v) => { cssVars[k] = v; } } },
  head: { appendChild: () => {} },
  body: stubEl(),
};
globalThis.window = {
  location: { origin: "http://x", pathname: "/", hostname: "x", hash: "", search: "", host: "x" },
  history: { replaceState: () => {} },
  LOCALSHARE_CONFIG: {},
  crypto: undefined,
};
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
globalThis.navigator = { userAgent: "localshare-smoke-test" };
globalThis.fetch = () => { fetchCalls += 1; return Promise.reject(new Error("offline (stubbed)")); };
// Proves initPeer() ran to completion: construction is attempted (then its
// error is caught internally, exactly like a real signaling failure).
globalThis.Peer = class PeerStub {
  constructor() { peerConstructed = true; throw new Error("Peer stub: no signaling in smoke test"); }
};

try {
  eval(src); // registers the DOMContentLoaded listener
} catch (e) {
  failures.push("top-level eval threw: " + (e && e.message));
}

const cbs = listeners["DOMContentLoaded"] || [];
if (cbs.length !== 1) {
  failures.push(`expected 1 DOMContentLoaded listener, got ${cbs.length}`);
} else {
  try {
    cbs[0](); // <-- full app init runs here
  } catch (e) {
    failures.push("init handler threw: " + ((e && e.stack) || e).split("\n").slice(0, 4).join(" | "));
  }
}

setTimeout(() => {
  const checks = [
    ["init handler returned without throwing", !failures.some((f) => f.startsWith("init handler threw")), failures.join("; ")],
    ["theme engine ran (CSS var applied)", cssVars["--color-primary"] === "#00E5FF", JSON.stringify(cssVars)],
    ["room resolution ran (IP lookup attempted)", fetchCalls > 0, `fetch calls: ${fetchCalls}`],
    ["peer engine kickoff reached (Peer constructed)", peerConstructed === true, "initPeer() never ran"],
    ["no uncaught errors after async settle", failures.length === 0, failures.join("; ")],
  ];
  let failed = false;
  for (const [name, ok, detail] of checks) {
    out(`${ok ? "PASS" : "FAIL"} — ${name}`);
    if (!ok) { failed = true; out(`  detail: ${String(detail).slice(0, 400)}`); }
  }
  out(failed ? "SMOKE RESULT: FAIL" : "SMOKE RESULT: PASS");
  process.exit(failed ? 1 : 0);
}, 1500);
