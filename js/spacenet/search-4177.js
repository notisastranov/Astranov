/* SpaceNet 4177 — typed search is real: Photon + Nominatim + Grok. Named place does not need GPS first. */
(function () {
  if (window.__snSearch4177) return;
  window.__snSearch4177 = true;
  function line(t) { var el = document.getElementById("line"); if (el && t) el.textContent = t; }
  function talk(t) { if (window.SN && SN.talk) SN.talk(t); else line(t); }
  function km(a, b) {
    if (!a || !b || !isFinite(+a.lat) || !isFinite(+b.lat)) return 1e9;
    var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function here() {
    try { if (window.SN && SN.here) { var h = SN.here(); if (h && isFinite(+h.lat)) return h; } } catch (e) {}
    try { var p = JSON.parse(localStorage.getItem("sn:place") || "null"); if (p && isFinite(+p.lat)) return p; } catch (e) {}
    return { lat: 36.4348, lng: 28.2176, name: "Rhodes" };
  }
  function score(q, v) {
    var n = String((v && v.name) || "").toLowerCase();
    var raw = String((v && (v.raw || v.addr)) || "").toLowerCase();
    var qq = String(q || "").toLowerCase().replace(/[^\w\u00C0-\u024F\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!qq || !n) return 0;
    if (n === qq) return 100;
    if (n.indexOf(qq) >= 0 || qq.indexOf(n) >= 0) return 80;
    var toks = qq.split(" ").filter(function (t) { return t.length > 2; });
    var hit = 0;
    toks.forEach(function (t) { if (n.indexOf(t) >= 0 || raw.indexOf(t) >= 0) hit++; });
    return toks.length ? (hit / toks.length) * 60 : 0;
  }
  function photon(q) {
    var h = here();
    var url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(q) + "&limit=8";
    if (h && isFinite(+h.lat)) url += "&lat=" + h.lat + "&lon=" + h.lng;
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (j) {
      return (j.features || []).map(function (f) {
        var c = f.geometry && f.geometry.coordinates, pr = f.properties || {};
        if (!c) return null;
        return { name: pr.name || q, lat: +c[1], lng: +c[0], raw: [pr.street, pr.city || pr.locality || pr.state].filter(Boolean).join(", "), src: "photon" };
      }).filter(function (v) { return v && isFinite(v.lat); });
    }).catch(function () { return []; });
  }
  function nominatim(q) {
    var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=" + encodeURIComponent(q);
    return fetch(url, { headers: { Accept: "application/json", "Accept-Language": "en" } }).then(function (r) { return r.json(); }).then(function (rows) {
      return (rows || []).map(function (r) {
        return { name: r.name || String(r.display_name || "").split(",")[0], lat: +r.lat, lng: +r.lon, raw: r.display_name || "", src: "nominatim" };
      }).filter(function (v) { return v && isFinite(v.lat); });
    }).catch(function () { return []; });
  }
  function grokPlaces(q) {
    return fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Find this exact named place and return act=hunt with places[{name,lat,lng,raw,phone}]. Query: " + q, message: q, spacenet: true, allow_paid: true, force_paid: true, here: here() })
    }).then(function (r) { return r.json(); }).then(function (j) {
      var text = String((j && (j.text || j.say || j.response)) || "");
      var places = (j && j.places) || [];
      var m = text.match(/\{[\s\S]*\}/);
      if (m) { try { var o = JSON.parse(m[0]); if (o.places) places = o.places; if (o.say) j.say = o.say; } catch (e) {} }
      return { say: j.say || "", places: (places || []).map(function (p) {
        return { name: p.name || q, lat: +p.lat, lng: +p.lng, raw: p.raw || p.addr || "", phone: p.phone || "", src: "grok" };
      }).filter(function (v) { return isFinite(v.lat) && isFinite(v.lng); }) };
    }).catch(function () { return { say: "", places: [] }; });
  }
  function land(list, q) {
    list = (list || []).filter(function (v) { return v && isFinite(+v.lat); });
    if (!list.length) return false;
    list.sort(function (a, b) { return score(q, b) - score(q, a) || km(here(), a) - km(here(), b); });
    var best = list[0];
    try { if (window.SN && SN.showCity) SN.showCity(best); else if (window.SN && SN.showMap) SN.showMap(best, 15); } catch (e) {}
    talk((best.name || q) + (best.raw ? " · " + best.raw : ""));
    line("Found " + best.name + ".");
    return true;
  }
  function findNamed(q) {
    q = String(q || "").trim();
    if (!q) return Promise.resolve(false);
    line("Finding " + q + "…");
    return Promise.all([photon(q), nominatim(q), grokPlaces(q)]).then(function (pack) {
      var all = (pack[0] || []).concat(pack[1] || []).concat((pack[2] && pack[2].places) || []);
      if (land(all, q)) return true;
      if (pack[2] && pack[2].say) talk(pack[2].say);
      else talk("No pin yet for " + q + ". Try the street and city.");
      return false;
    });
  }
  function looksPlace(t) {
    t = String(t || "").trim();
    if (t.length < 3) return false;
    if (/^(hi|hey|hello|ok|yes|no|thanks|γεια)$/i.test(t)) return false;
    return true;
  }
  function wrap() {
    if (!window.SN || !SN.run || SN.run.__s4177) return;
    var orig = SN.run;
    SN.run = function (t) {
      var q = String(t || "").trim();
      if (looksPlace(q)) findNamed(q);
      return orig.apply(this, arguments);
    };
    SN.run.__s4177 = true;
    window.SNSearch = { find: findNamed };
  }
  wrap();
  setInterval(wrap, 1500);
})();
