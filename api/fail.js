/** SpaceNet fail dump — last N boot diagnoses. No secrets. */
const MAX = 20;
const mem = globalThis.__snFailMem || (globalThis.__snFailMem = []);

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Cache-Control", "no-store");
}

function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method === "GET") {
    res.status(200).json({ ok: true, n: mem.length, last: mem[0] || null, items: mem.slice(0, 8) });
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  const b = readBody(req);
  const row = {
    t: Date.now(),
    build: String(b.build || "").slice(0, 64),
    reason: String(b.reason || "").slice(0, 80),
    href: String(b.href || "").slice(0, 200),
    ua: String(b.ua || "").slice(0, 180),
    heal: b.heal && typeof b.heal === "object" ? {
      sw: b.heal.sw,
      cache: b.heal.cache,
      hijack: b.heal.hijack,
      js: String(b.heal.js || "").slice(0, 120),
      ai: !!b.heal.ai,
      webgl: !!b.heal.webgl,
      log: Array.isArray(b.heal.log) ? b.heal.log.slice(-16).map(function (x) { return String(x).slice(0, 40); }) : []
    } : {}
  };
  mem.unshift(row);
  if (mem.length > MAX) mem.length = MAX;
  res.status(200).json({ ok: true, stored: row.t });
};
