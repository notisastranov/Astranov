/* SpaceNet 4186 — talk delivery from SHOP to STREET+NUMBER. Calm door labels. No HUD restyle. */
(function () {
  if (window.__SN_TALK_4186) return;
  window.__SN_TALK_4186 = true;

  function line(s) {
    var el = document.getElementById("line");
    if (el) el.textContent = s || "";
    try { if (window.SN && SN.talk) SN.talk(s); } catch (e) {}
  }
  function readJson(k, d) {
    try {
      var v = JSON.parse(localStorage.getItem(k) || "null");
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  }
  function km(a, b) {
    if (!a || !b) return 99;
    var R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function hereCam() {
    try {
      if (window.SN && SN.here) {
        var h = SN.here();
        if (h && isFinite(+h.lat)) return { lat: +h.lat, lng: +h.lng, name: h.name || "YOU" };
      }
    } catch (e) {}
    try {
      var p = readJson("sn:place", null);
      if (p && isFinite(+p.lat)) return { lat: +p.lat, lng: +p.lng, name: p.name || "YOU" };
    } catch (e) {}
    return { lat: 36.4341, lng: 28.2176, name: "Rhodes" };
  }
  function map() {
    try { if (window.SN && SN.map) return SN.map; } catch (e) {}
    try { if (window.SN && SN.getMap) return SN.getMap(); } catch (e) {}
    return window.__snLeaflet || null;
  }
  function shops() {
    var list = [];
    function add(arr) {
      (Array.isArray(arr) ? arr : []).forEach(function (r) {
        if (!r || !isFinite(+r.lat) || !isFinite(+r.lng)) return;
        if (r.secret || r.visible === false) return;
        if (r.kind === "driver") return;
        list.push({
          id: r.id || "",
          lat: +r.lat,
          lng: +r.lng,
          name: r.name || r.label || "Shop",
          phone: r.phone || "",
          where: r.where || r.address || r.raw || r.name || ""
        });
      });
    }
    add(readJson("sn:vendors", []));
    add(readJson("sn:shops", []));
    try { if (window.SNWork && SNWork.all) add(SNWork.all().shops); } catch (e) {}
    try { if (window.SN && SN.shops) add(SN.shops()); } catch (e) {}
    var seen = {};
    return list.filter(function (s) {
      var k = s.lat.toFixed(5) + "|" + s.lng.toFixed(5);
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });
  }
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/gi, " ")
      .trim();
  }
  function parseDelivery(q) {
    var t = String(q || "").trim();
    if (!t) return null;
    var m = t.match(/(?:deliver(?:y|ing)?|send|bring|take|παράδωσ\w*|παράδοση)\s+(?:from\s+|από\s+)?(.+?)\s+(?:to|σε|στην|στον|στη|στο)\s+(.+)/i);
    if (!m) m = t.match(/\b(?:from|από)\s+(.+?)\s+(?:to|σε|στην|στον|στη|στο)\s+(.+)/i);
    if (!m) return null;
    function strip(s) {
      return String(s || "").replace(/^(the|a|an|το|τον|την|τα)\s+/i, "").replace(/[.?!]+$/g, "").trim();
    }
    var from = strip(m[1]);
    var to = strip(m[2]);
    if (from.length < 2 || to.length < 2 || from.length > 80 || to.length > 120) return null;
    return { from: from, to: to };
  }
  function isSelf(q) {
    return /^(me|myself|here|you|my (house|home|place|pin|location)|σπίτι|εδώ|εμένα)$/i.test(String(q || "").trim());
  }
  function matchShop(q) {
    var n = norm(q);
    if (!n || n.length < 2) return null;
    var list = shops();
    var best = null;
    var score = 0;
    for (var i = 0; i < list.length; i++) {
      var sn = norm(list[i].name);
      if (!sn) continue;
      var sc = 0;
      if (sn === n) sc = 100;
      else if (sn.indexOf(n) >= 0 || n.indexOf(sn) >= 0) sc = 80;
      else {
        var ta = n.split(" ").filter(function (tok) { return tok.length >= 3; });
        var tb = sn.split(" ");
        var hits = ta.filter(function (tok) {
          return tb.some(function (x) { return x.indexOf(tok) >= 0 || tok.indexOf(x) >= 0; });
        });
        if (ta.length && hits.length === ta.length) sc = 70;
        else if (hits.length) sc = (hits.length / Math.max(ta.length, 1)) * 50;
      }
      if (sc > score) { score = sc; best = list[i]; }
    }
    return score >= 50 ? best : null;
  }
  function keepLabel(text, cls) {
    var t = String(text || "");
    var c = String(cls || "");
    if (/radar-lab/.test(c) || /sn-hop/.test(c)) return true;
    if (/^(FROM |TO )/.test(t)) return true;
    if (/\bJOBS\b/.test(t)) return true;
    return false;
  }
  function patchLeaflet() {
    if (!window.L || !L.Layer || L.Layer.prototype.__sn4186) return;
    var orig = L.Layer.prototype.bindTooltip;
    L.Layer.prototype.bindTooltip = function (content, options) {
      options = options ? Object.assign({}, options) : {};
      var text = typeof content === "string" ? content : (content && content.innerText) || "";
      if (options.permanent && !keepLabel(text, options.className)) {
        options.permanent = false;
        options.sticky = true;
      }
      return orig.call(this, content, options);
    };
    L.Layer.prototype.__sn4186 = true;
  }
  function calmTips() {
    patchLeaflet();
    var m = map();
    if (!m || !m.eachLayer) return;
    m.eachLayer(function (layer) {
      if (!layer.getTooltip || !layer.unbindTooltip) return;
      var t;
      try { t = layer.getTooltip(); } catch (e) { return; }
      if (!t) return;
      var content = "";
      try { content = String(t.getContent() || ""); } catch (e) {}
      var cls = (t.options && t.options.className) || "";
      if (keepLabel(content, cls)) return;
      if (t.options && t.options.permanent) {
        try {
          layer.unbindTooltip();
          layer.bindTooltip(content, {
            permanent: false,
            sticky: true,
            direction: "right",
            offset: [12, -10],
            className: "sn-tip",
            opacity: 0.95
          });
        } catch (err) {}
      }
    });
  }
  function css() {
    if (document.getElementById("sn-4186-css")) return;
    var s = document.createElement("style");
    s.id = "sn-4186-css";
    s.textContent =
      ".leaflet-tooltip.sn-tip{background:#071428;color:#e8fbff;border:1px solid rgba(80,220,255,.35);box-shadow:none;font:700 11px/1.2 system-ui}" +
      ".leaflet-tooltip.sn-tip:before{border-right-color:#071428}";
    document.head.appendChild(s);
  }
  function photon(q, near, then) {
    var t = String(q || "").trim();
    if (t.length < 2) { then(null); return; }
    var url = "https://photon.komoot.io/api/?q=" + encodeURIComponent(t) + "&limit=8";
    if (near && isFinite(+near.lat)) url += "&lat=" + near.lat + "&lon=" + near.lng;
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var feats = (j && j.features) || [];
        var hits = [];
        for (var i = 0; i < feats.length; i++) {
          var f = feats[i];
          var coords = f.geometry && f.geometry.coordinates;
          if (!coords || coords.length < 2) continue;
          var pr = f.properties || {};
          var street = [pr.street, pr.housenumber].filter(Boolean).join(" ");
          var name = [street || pr.name, pr.city || pr.locality].filter(Boolean).join(", ") || t;
          hits.push({ lat: +coords[1], lng: +coords[0], name: name, address: name, phone: "" });
        }
        var box = [35.85, 27.7, 36.52, 28.35];
        var local = near ? hits.filter(function (h) { return km(h, near) <= 80; }) : hits;
        if (!local.length) {
          local = hits.filter(function (h) { return h.lat >= box[0] && h.lat <= box[2] && h.lng >= box[1] && h.lng <= box[3]; });
        }
        then(local[0] || hits[0] || null);
      })
      .catch(function () { then(null); });
  }
  function chain() {
    return window.SNChain4171 || null;
  }
  function startFrom(shop, destText) {
    var ch = chain();
    if (!ch || !ch.startFromShop) {
      line("Delivery chain not live. Tap the brand, then say it again.");
      return;
    }
    ch.startFromShop(shop, "Delivery from " + (shop.name || "shop"), 0);
    if (isSelf(destText)) {
      var you = hereCam();
      if (you && ch.take) ch.take(you);
      else if (ch.confirm) ch.confirm("to", destText);
      return;
    }
    if (ch.confirm) ch.confirm("to", destText);
  }
  function runDelivery(fromName, toName) {
    line("Delivery: " + fromName + " → " + toName);
    var shop = isSelf(fromName) ? hereCam() : matchShop(fromName);
    if (shop && isFinite(+shop.lat)) {
      startFrom(shop, toName);
      return;
    }
    line("Finding " + fromName + "…");
    photon(fromName, hereCam(), function (hit) {
      if (!hit) {
        line("Shop not on this map: " + fromName + ". Tap a red door, or hunt the name.");
        return;
      }
      startFrom({ lat: hit.lat, lng: hit.lng, name: hit.name || fromName, phone: "", where: hit.name }, toName);
    });
  }
  function interceptText(t) {
    var p = parseDelivery(t);
    if (!p) return false;
    runDelivery(p.from, p.to);
    return true;
  }
  function onSubmit(e) {
    var form = e.target;
    if (!form || form.id !== "f") return;
    var inp = document.getElementById("in");
    var t = inp ? String(inp.value || "").trim() : "";
    if (!interceptText(t)) return;
    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (inp) inp.value = "";
  }
  document.addEventListener("submit", onSubmit, true);

  var nativeFetch = window.fetch;
  window.fetch = function (url, opts) {
    try {
      var u = String(url && url.url ? url.url : url || "");
      if (/\/api\/ai\b/.test(u) && opts && typeof opts.body === "string") {
        var body = JSON.parse(opts.body);
        var msg = String(body.message || body.text || body.q || body.prompt || "");
        if (interceptText(msg)) {
          return Promise.resolve(new Response(JSON.stringify({
            ok: true,
            act: "now",
            say: "Delivery on the map. Confirm the street and number.",
            places: []
          }), { status: 200, headers: { "Content-Type": "application/json" } }));
        }
      }
    } catch (err) {}
    return nativeFetch.apply(this, arguments);
  };

  function wrapAsk() {
    if (!window.SN) return;
    ["ask", "send", "mind", "grok"].forEach(function (name) {
      if (!SN[name] || SN[name].__sn4186) return;
      var orig = SN[name].bind(SN);
      SN[name] = function (msg) {
        var t = typeof msg === "string" ? msg : (msg && (msg.message || msg.text || msg.q)) || "";
        if (interceptText(t)) return Promise.resolve({ ok: true, act: "now" });
        return orig(msg);
      };
      SN[name].__sn4186 = true;
    });
  }

  css();
  patchLeaflet();
  calmTips();
  wrapAsk();
  setInterval(function () {
    css();
    patchLeaflet();
    calmTips();
    wrapAsk();
  }, 1600);

  window.SNTalk4186 = { parse: parseDelivery, run: runDelivery, match: matchShop };
})();
