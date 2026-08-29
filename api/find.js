/** Named place hunt — Google first, then OSM. Never invent a shop. */
const { googleFind } = require("../lib/google");

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Cache-Control", "no-store");
}

function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

async function grab(url, ms) {
  var ctl = new AbortController();
  var t = setTimeout(function () {
    ctl.abort();
  }, ms || 8000);
  try {
    var r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json,text/html;q=0.9" },
      signal: ctl.signal,
      redirect: "follow",
    });
    return await r.text();
  } catch (_) {
    return "";
  } finally {
    clearTimeout(t);
  }
}

async function nominatim(q) {
  var txt = await grab(
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=" + encodeURIComponent(q),
    8000
  );
  try {
    var rows = JSON.parse(txt);
    return (rows || [])
      .map(function (r) {
        return {
          name: r.name || String(r.display_name || "").split(",")[0],
          lat: Number(r.lat),
          lng: Number(r.lon),
          raw: r.display_name || "",
          phone: (r.extratags && (r.extratags.phone || r.extratags["contact:phone"])) || "",
        };
      })
      .filter(function (p) {
        return p.name && isFinite(p.lat) && isFinite(p.lng);
      });
  } catch (_) {
    return [];
  }
}

function phones(s) {
  var out = [];
  String(s || "").replace(/(?:\+?30[\s.\-/]?)?(?:2\d{9}|69\d{8})/g, function (m) {
    var d = m.replace(/[^\d+]/g, "");
    if (d[0] !== "+" && d.length === 10) d = "+30" + d;
    if (out.indexOf(d) < 0) out.push(d);
    return m;
  });
  return out;
}

function strip(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function nameOk(name, q) {
  var n = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "");
  var qq = String(q || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "");
  if (!qq || qq.length < 4) return false;
  return n.indexOf(qq) >= 0 || qq.indexOf(n) >= 0;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  var b = req.method === "GET" ? req.query || {} : readBody(req);
  var q = String(b.q || b.name || "").slice(0, 80).trim();
  var city = String(b.city || b.place || "").slice(0, 80).trim();
  if (!q) {
    res.status(400).json({ ok: false, error: "empty" });
    return;
  }
  var terms = [q];
  if (city) terms.push(q + " " + city);
  terms.push(q + " Greece");
  var places = [],
    seen = {};
  function add(list) {
    (list || []).forEach(function (p) {
      if (!p || !isFinite(p.lat)) return;
      if (!nameOk(p.name, q) && !nameOk(p.raw, q) && p.src !== "google") return;
      var k = (+p.lat).toFixed(4) + "|" + (+p.lng).toFixed(4);
      if (seen[k]) return;
      seen[k] = 1;
      places.push(p);
    });
  }
  var g = await googleFind(q, city);
  add(g.places);
  if (g.raw) add(await nominatim(g.raw));
  if (g.raw) add(await nominatim(q + " " + g.raw));
  if (g.phones && g.phones[0] && places[0]) places[0].phone = places[0].phone || g.phones[0];
  var i;
  for (i = 0; i < terms.length && places.length < 4; i++) add(await nominatim(terms[i]));
  if (!places.length) {
    var html = await grab("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q + (city ? " " + city : "") + " τηλέφωνο address"), 8000);
    var text = strip(html);
    var tel = phones(text)[0] || "";
    var m = text.match(/([A-ZΑ-Ω][^\n,]{4,40}\d{0,4}[^\n,]{0,20}(?:Rhodes|Rodos|Ρόδος|Athens|Αθήνα)[^\n]{0,40})/i);
    var addr = m ? m[1].replace(/\s+/g, " ").trim().slice(0, 80) : "";
    if (addr) add(await nominatim(addr));
    if (!places.length && addr) add(await nominatim(q + " " + addr));
    if (places.length && tel) places[0].phone = places[0].phone || tel;
  }
  res.status(200).json({ ok: true, places: places.slice(0, 6) });
};
