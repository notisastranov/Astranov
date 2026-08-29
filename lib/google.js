/** SpaceNet Google crawler — search + maps. No API key. Never invent a shop. */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function grab(url, ms) {
  var ctl = new AbortController();
  var t = setTimeout(function () {
    ctl.abort();
  }, ms || 9000);
  try {
    var r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "el-GR,el;q=0.9,en;q=0.8",
        Cookie: "CONSENT=YES+; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjQwMzI2LjA4X3AwGgJlbiACGgYIgLDuoAY",
      },
      signal: ctl.signal,
      redirect: "follow",
    });
    var txt = await r.text();
    return { url: r.url || url, html: txt || "" };
  } catch (_) {
    return { url: url, html: "" };
  } finally {
    clearTimeout(t);
  }
}

function phones(s) {
  var out = [],
    seen = {};
  String(s || "").replace(/(?:\+?30[\s.\-/]?)?(?:2\d{9}|69\d{8}|2\d{3}[\s.\-/]?\d{6})/g, function (m) {
    var d = m.replace(/[^\d+]/g, "");
    if (d[0] !== "+" && d.length === 10) d = "+30" + d;
    if (d.indexOf("30") === 0 && d[0] !== "+") d = "+" + d;
    if (!seen[d] && d.replace(/\D/g, "").length >= 10) {
      seen[d] = 1;
      out.push(d);
    }
    return m;
  });
  return out;
}

function coordsFrom(text) {
  var out = [],
    seen = {};
  String(text || "").replace(/@(-?\d+\.\d{3,}),(-?\d+\.\d{3,})/g, function (_, a, b) {
    var lat = Number(a),
      lng = Number(b);
    if (Math.abs(lat) < 1 && Math.abs(lng) < 1) return _;
    if (Math.abs(lat) > 85) return _;
    var k = lat.toFixed(5) + "," + lng.toFixed(5);
    if (!seen[k]) {
      seen[k] = 1;
      out.push({ lat: lat, lng: lng });
    }
    return _;
  });
  String(text || "").replace(/\/maps\/place\/([^/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/g, function (_, name, a, b) {
    var lat = Number(a),
      lng = Number(b);
    var k = lat.toFixed(5) + "," + lng.toFixed(5);
    if (!seen[k]) {
      seen[k] = 1;
      out.push({ lat: lat, lng: lng, name: decodeURIComponent(String(name).replace(/\+/g, " ")).slice(0, 80) });
    }
    return _;
  });
  return out;
}

function strip(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function isConsent(html, url) {
  var s = String(html || "");
  var u = String(url || "");
  return /consent\.google|Before you continue|SG_REL|enablejs|detected unusual traffic/i.test(s) || /consent\.google/.test(u);
}

async function googleFind(q, city) {
  q = String(q || "").trim();
  city = String(city || "").trim();
  if (!q) return { places: [], phones: [], raw: "", blocked: false };
  var query = [q, city, "τηλέφωνο"].filter(Boolean).join(" ");
  var urls = [
    "https://www.google.com/maps/search/" + encodeURIComponent([q, city].filter(Boolean).join(" ")) + "?hl=el",
    "https://www.google.com/search?hl=el&gl=gr&gbv=1&q=" + encodeURIComponent(query),
    "https://www.google.com/search?tbm=lcl&hl=el&gl=gr&q=" + encodeURIComponent(query),
  ];
  var html = "",
    final = "",
    blocked = false,
    i;
  for (i = 0; i < urls.length; i++) {
    var got = await grab(urls[i], 9000);
    if (!got.html) continue;
    if (isConsent(got.html, got.url)) {
      blocked = true;
      continue;
    }
    html += "\n" + got.html;
    final += " " + (got.url || "");
    if (coordsFrom(got.html + " " + got.url).length) break;
  }
  var pts = coordsFrom(html + " " + final);
  var tels = phones(html);
  var text = strip(html);
  var addr = "";
  var m = text.match(
    /([A-Za-zΑ-ΩΆΈΉΊΌΎΏα-ωάέήίόύώϊϋΐΰ][^,]{3,48}\d{1,4}[^,]{0,24}(?:Rhodes|Rodos|Ρόδος|Athens|Αθήνα|Greece|Ελλάδα)[^,]{0,24})/i
  );
  if (m) addr = m[1].replace(/\s+/g, " ").trim().slice(0, 100);
  var places = pts.map(function (p) {
    return {
      name: p.name || q,
      lat: p.lat,
      lng: p.lng,
      raw: addr || "Google",
      phone: tels[0] || "",
      src: "google",
    };
  });
  return { places: places, phones: tels, raw: addr, blocked: blocked && !places.length, text: text.slice(0, 4000) };
}

module.exports = { googleFind, phones, grab };
