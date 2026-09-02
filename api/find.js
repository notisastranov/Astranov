/** Named + category hunt — OSM + Overpass. Never invent a shop. */
const UA = "AstranovSpaceNet/1 (https://astranov.eu)";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Cache-Control", "no-store");
}

function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

async function grab(url, ms) {
  var ctl = new AbortController();
  var t = setTimeout(function () { ctl.abort(); }, ms || 8000);
  try {
    var r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
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

function tokens(s) {
  return String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9\u0370-\u03ff]+/)
    .filter(function (t) { return t.length >= 3; });
}

function nameOk(name, raw, q) {
  var hay = (String(name || "") + " " + String(raw || "")).toLowerCase();
  var qq = tokens(q);
  var stop = { the:1, and:1, best:1, near:1, find:1, who:1, makes:1, for:1, want:1, greece:1, good:1, around:1, here:1 };
  var place = qq.filter(function (t) { return /rhodes|rodos|\u03c1\u03cc\u03b4|athens|\u03b1\u03b8\u03ae\u03bd/.test(t); });
  var need = qq.filter(function (t) { return !stop[t] && place.indexOf(t) < 0; });
  if (!need.length) need = qq.filter(function (t) { return !stop[t]; });
  if (!need.length) return true;
  if (place.length && !place.some(function (t) { return hay.indexOf(t) >= 0; }) && !/rhodes|rodos|\u03c1\u03cc\u03b4/.test(hay)) {
    /* city asked but not in this row — still ok if we searched that city */
  }
  return need.some(function (t) { return hay.indexOf(t) >= 0; });
}

async function nominatim(q) {
  var txt = await grab(
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&addressdetails=1&q=" + encodeURIComponent(q),
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
      .filter(function (p) { return p.name && isFinite(p.lat) && isFinite(p.lng); });
  } catch (_) {
    return [];
  }
}

async function overpassNear(lat, lng) {
  var q =
    '[out:json][timeout:12];(' +
    'nwr(around:6000,' + lat + ',' + lng + ')["name"]["amenity"~"restaurant|fast_food|cafe|pharmacy|bar"];' +
    'nwr(around:6000,' + lat + ',' + lng + ')["name"]["shop"~"supermarket|convenience|bakery"];' +
    ');out center tags 30;';
  var txt = await grab("https://overpass.kumi.systems/api/interpreter?data=" + encodeURIComponent(q), 14000);
  try {
    var j = JSON.parse(txt);
    return (j.elements || []).map(function (e) {
      var c = e.center || e;
      var t = e.tags || {};
      return {
        name: t.name,
        lat: Number(c.lat),
        lng: Number(c.lon || c.lng),
        raw: [t["addr:street"], t.amenity || t.shop, t["addr:city"] || ""].filter(Boolean).join(", "),
        phone: t.phone || t["contact:phone"] || "",
        kind: t.amenity || t.shop || "shop",
      };
    }).filter(function (p) { return p.name && isFinite(p.lat); });
  } catch (_) {
    return [];
  }
}

async function overpassPizza(bbox) {
  var q =
    '[out:json][timeout:10];nwr(' + bbox + ')["name"]["amenity"~"restaurant|fast_food|cafe"]["cuisine"~"pizza",i];out center tags 16;';
  var txt = await grab("https://overpass.kumi.systems/api/interpreter?data=" + encodeURIComponent(q), 12000);
  try {
    var j = JSON.parse(txt);
    return (j.elements || []).map(function (e) {
      var c = e.center || e;
      var t = e.tags || {};
      return {
        name: t.name,
        lat: Number(c.lat),
        lng: Number(c.lon || c.lng),
        raw: [t["addr:street"], t["addr:city"] || "Rhodes"].filter(Boolean).join(", "),
        phone: t.phone || t["contact:phone"] || "",
      };
    }).filter(function (p) { return p.name && isFinite(p.lat); });
  } catch (_) {
    return [];
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  var b = req.method === "GET" ? req.query || {} : readBody(req);
  var q = String(b.q || b.name || "").slice(0, 80).trim();
  var city = String(b.city || b.place || "").slice(0, 80).trim();
  var lat=Number(b.lat), lng=Number(b.lng);
  var wantNear=/vendor|shop|near|amenity|places/i.test(q) && isFinite(lat) && isFinite(lng);
  if (!q && !(isFinite(lat)&&isFinite(lng))) { res.status(400).json({ ok: false, error: "empty" }); return; }
  if (wantNear || (!q && isFinite(lat))) {
    var near=await overpassNear(lat, lng);
    res.status(200).json({ ok: true, places: near.slice(0, 16) });
    return;
  }
  if (!q) { res.status(400).json({ ok: false, error: "empty" }); return; }
  var wantPizza = /pizza|pizzeria|\u03c0\u03b9\u03c4\u03c3/i.test(q);
  var wantRhodes = /rhodes|rodos|\u03c1\u03cc\u03b4/i.test(q + " " + city) || !city;
  var terms = [];
  if (wantPizza && wantRhodes) {
    terms.push("pizza Rhodes Greece");
    terms.push("pizzeria Rhodes");
  }
  terms.push(q);
  if (city) terms.push(q + " " + city);
  if (!/greece|hellas|rhodes|athens/i.test(q)) terms.push(q + " Greece");
  var places = [], seen = {};
  function add(list) {
    (list || []).forEach(function (p) {
      if (!p || !isFinite(p.lat)) return;
      if (!nameOk(p.name, p.raw, q) && !(wantPizza && /pizza|pizzeria|\u03c0\u03b9\u03c4\u03c3/i.test(p.name + " " + p.raw))) return;
      var k = (+p.lat).toFixed(4) + "|" + (+p.lng).toFixed(4);
      if (seen[k]) return;
      seen[k] = 1;
      places.push(p);
    });
  }
  var i;
  for (i = 0; i < terms.length && places.length < 8; i++) add(await nominatim(terms[i]));
  if (wantPizza && wantRhodes && places.length < 3) {
    add(await overpassPizza("36.05,27.70,36.50,28.35"));
  }
  res.status(200).json({ ok: true, places: places.slice(0, 8) });
};
