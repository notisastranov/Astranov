/* SpaceNet 4178 — vendor tap shows face, menu, phone, web. */
(function () {
  if (window.__snVendorCard4178) return;
  window.__snVendorCard4178 = true;
  function css() {
    if (document.getElementById("sn-vcard-css")) return;
    var s = document.createElement("style");
    s.id = "sn-vcard-css";
    s.textContent =
      "#sn-vcard{display:none;position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 78px);z-index:95;max-width:min(440px,94vw);margin:0 auto;max-height:58vh;overflow:auto;background:rgba(4,14,28,.97);border:1px solid rgba(126,233,255,.55);border-radius:16px;color:#e8fbff;padding:0 0 10px}" +
      "#sn-vcard.on{display:block}" +
      "#sn-vcard .cover{width:100%;height:140px;object-fit:cover;background:#061018;display:block;border-radius:16px 16px 0 0}" +
      "#sn-vcard .body{padding:10px 14px 0}" +
      "#sn-vcard h3{margin:0 0 4px;font:800 16px/1.2 system-ui;color:#4df0ff}" +
      "#sn-vcard p{margin:0 0 6px;font:500 13px/1.45 system-ui;color:#c6ecf6}" +
      "#sn-vcard a{color:#7ee9ff}" +
      "#sn-vcard .row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}" +
      "#sn-vcard .row a,#sn-vcard .row button{flex:1;min-width:90px;height:36px;border-radius:10px;border:1px solid rgba(77,240,255,.55);background:rgba(4,16,28,.9);color:#4df0ff;font:800 11px/36px system-ui;text-align:center;text-decoration:none}" +
      "#sn-vcard .dish{display:flex;gap:8px;align-items:center;margin:6px 0;font:500 13px system-ui}" +
      "#sn-vcard .dish img{width:44px;height:44px;object-fit:cover;border-radius:8px;background:#0a1822}" +
      "#sn-vcard .x{position:absolute;top:8px;right:10px;width:32px;height:32px;border:0;border-radius:99px;background:rgba(0,0,0,.45);color:#fff}";
    document.head.appendChild(s);
  }
  function el() {
    css();
    var box = document.getElementById("sn-vcard");
    if (box) return box;
    box = document.createElement("div");
    box.id = "sn-vcard";
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.getAttribute("data-act") === "close") box.classList.remove("on");
    });
    return box;
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; });
  }
  function phoneOf(v) {
    var t = (v && (v.tags || v)) || {};
    return String(t.phone || t["contact:phone"] || t.mobile || t.tel || v.phone || "").trim();
  }
  function webOf(v) {
    var t = (v && (v.tags || v)) || {};
    return String(t.website || t["contact:website"] || t.url || v.web || "").trim();
  }
  function paint(v) {
    window.__snFace = v;
    var box = el();
    var phone = phoneOf(v);
    var web = webOf(v);
    var hours = v.hours || (v.tags && v.tags.opening_hours) || "";
    var cuisine = v.cuisine || (v.tags && v.tags.cuisine) || v.raw || "";
    var note = v.note || v.desc || "";
    var cover = v.cover || v.photo || v.profile || "";
    var dishes = v.dishes || v.items || [];
    var tel = phone.replace(/[^\d+]/g, "");
    var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((v.name || "") + " " + (v.lat || "") + "," + (v.lng || ""));
    box.innerHTML =
      (cover ? '<img class="cover" alt="" src="' + esc(cover) + '">' : '<div class="cover"></div>') +
      '<button type="button" class="x" data-act="close">✕</button>' +
      '<div class="body"><h3>' + esc(v.name || "Vendor") + "</h3>" +
      (cuisine ? "<p>" + esc(cuisine) + "</p>" : "") +
      (hours ? "<p>" + esc(hours) + "</p>" : "") +
      (note ? "<p>" + esc(note) + "</p>" : "") +
      '<div class="row">' +
      (tel ? '<a href="tel:' + esc(tel) + '">CALL</a>' : "") +
      (web ? '<a href="' + esc(web) + '" target="_blank" rel="noopener">WEB</a>' : "") +
      '<a href="' + maps + '" target="_blank" rel="noopener">MAP</a>' +
      "</div>" +
      (dishes.length ? dishes.slice(0, 12).map(function (d) {
        var pic = d.photo ? '<img alt="" src="' + esc(d.photo) + '">' : "";
        var pr = Number(d.price) ? " · AV€ " + Number(d.price).toFixed(2) + (d.sample ? " est." : "") : "";
        return '<div class="dish">' + pic + "<span>" + esc(d.name || d.desc) + pr + "</span></div>";
      }).join("") : "<p>Menu loading…</p>") +
      "</div>";
    box.classList.add("on");
  }
  function osm(v) {
    if (!v || !isFinite(+v.lat)) return Promise.resolve(v);
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&extratags=1&namedetails=1&zoom=18&lat=" + v.lat + "&lon=" + v.lng;
    return fetch(url, { headers: { Accept: "application/json", "Accept-Language": "en" } }).then(function (r) { return r.json(); }).then(function (j) {
      var t = (j && j.extratags) || {};
      v.tags = Object.assign({}, v.tags || {}, t);
      if (t.phone || t["contact:phone"]) v.phone = t.phone || t["contact:phone"];
      if (t.website) v.web = t.website;
      if (t.opening_hours) v.hours = t.opening_hours;
      if (t.cuisine) v.cuisine = t.cuisine;
      if (j && j.display_name && !v.raw) v.raw = j.display_name;
      return v;
    }).catch(function () { return v; });
  }
  function wikiPic(v) {
    var q = encodeURIComponent(v.name || "");
    if (!q) return Promise.resolve(v);
    var url = "https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=" + q + "&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=640&format=json&origin=*";
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var pages = j && j.query && j.query.pages;
      if (!pages) return v;
      var k = Object.keys(pages)[0];
      var th = pages[k] && pages[k].thumbnail && pages[k].thumbnail.source;
      if (th && !v.cover) v.cover = th;
      return v;
    }).catch(function () { return v; });
  }
  function grokFill(v) {
    return fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "LISTING FILL act=listing for " + (v.name || "shop") + " at " + (v.raw || "") + " lat " + v.lat + " lng " + v.lng + ". Official phone, hours, short description, cover photo URL if public, dishes with prices if published. Never invent a phone. sample=true on guessed prices.",
        message: "listing " + (v.name || ""), spacenet: true, allow_paid: true, force_paid: true,
        here: { lat: v.lat, lng: v.lng, name: v.name }
      })
    }).then(function (r) { return r.json(); }).then(function (j) {
      var text = String((j && (j.text || j.say)) || "");
      var o = j || {};
      var m = text.match(/\{[\s\S]*\}/);
      if (m) { try { o = Object.assign({}, o, JSON.parse(m[0])); } catch (e) {} }
      if (o.phone && !v.phone) v.phone = o.phone;
      if (o.hours && !v.hours) v.hours = o.hours;
      if (o.note || o.say) v.note = o.note || o.say;
      if (o.cover && !v.cover) v.cover = o.cover;
      var dishes = o.dishes || o.items || [];
      if (dishes.length) v.dishes = dishes;
      return v;
    }).catch(function () { return v; });
  }
  function openFace(v) { if (!v) return; paint(v); osm(v).then(paint); wikiPic(v).then(paint); grokFill(v).then(paint); }
  function wrap() {
    if (window.SNWork && SNWork.open && !SNWork.open.__vc4178) {
      var o = SNWork.open;
      SNWork.open = function (place, which) {
        var edit = false;
        try { edit = !!(place && SNWork.canEdit && SNWork.canEdit(place)); } catch (e) {}
        if (edit && which === "shop") return o.apply(this, arguments);
        if (place && (place.kind === "shop" || which === "home" || place.grok || which === "shop")) { openFace(place); return; }
        return o.apply(this, arguments);
      };
      SNWork.open.__vc4178 = true;
    }
  }
  document.addEventListener("click", function (e) {
    var mark = e.target && e.target.closest && e.target.closest(".leaflet-marker-icon, .sn-pillpin");
    if (!mark) return;
    setTimeout(function () { try { if (window.__snFace) openFace(window.__snFace); } catch (err) {} }, 50);
  }, true);
  wrap();
  setInterval(wrap, 1500);
})();
