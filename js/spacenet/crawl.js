/* SpaceNet crawl 4139 — publish harvested shops; read a leaflet photo into the listing. */
(function () {
  function talk(s) {
    if (window.SN && SN.talk) SN.talk(s);
    else if (window.SN && SN.say) SN.say(s);
  }
  function here() {
    if (window.SN && SN.here && isFinite(SN.here.lat)) return SN.here;
    try {
      var h = JSON.parse(localStorage.getItem("sn:here") || "null");
      if (h && isFinite(h.lat)) return h;
    } catch (e) {}
    return null;
  }
  function take(shops) {
    if (!shops || !shops.length || !window.SNWork) return 0;
    var n = 0;
    shops.forEach(function (s) {
      if (!s || !s.name) return;
      if (SNWork.autoList) SNWork.autoList(s, false);
      if (SNWork.applyFill) SNWork.applyFill(s);
      if (SNWork.publish) SNWork.publish(s);
      n++;
    });
    if (SNWork.pull) SNWork.pull(here());
    return n;
  }
  function around(from, q) {
    from = from || here();
    if (!from || !isFinite(from.lat)) {
      talk("Tap GPS first. Then I can fill shops around you.");
      return Promise.resolve(null);
    }
    talk("Filling shops from the public map…");
    return fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: from.lat, lng: from.lng, q: q || "" }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var n = take(j && j.shops);
        talk(n ? n + " shops listed on SpaceNet." : "No public shops published there yet.");
        return j;
      })
      .catch(function () {
        talk("Crawler missed. Try again.");
        return null;
      });
  }
  function readLeaflet(data, meta) {
    meta = meta || {};
    talk("Reading the leaflet…");
    return fetch("/api/crawl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaflet: data,
        name: meta.name || "",
        place: meta.place || "",
        lat: meta.lat,
        lng: meta.lng,
        id: meta.id || "",
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) {
          talk("Could not read that leaflet.");
          return j;
        }
        var shop = j.shop || j;
        if (window.SNWork && SNWork.applyFill) SNWork.applyFill(shop);
        if (window.SNWork && SNWork.publish && shop && shop.id) SNWork.publish(shop);
        talk((shop.name || "Shop") + " menu filled from the leaflet.");
        return j;
      })
      .catch(function () {
        talk("Could not read that leaflet.");
        return null;
      });
  }
  function compress(file, max, cb) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * s));
      c.height = Math.max(1, Math.round(h * s));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(""); };
    img.src = url;
  }
  function pinMeta() {
    var at = window.SNWork && SNWork.listingAt && SNWork.listingAt();
    var ttl = document.querySelector("#sn-sheet.on .ttl");
    var sub = document.querySelector("#sn-sheet.on .sub");
    return {
      name: (at && at.name) || (ttl && ttl.textContent) || "",
      place: (at && (at.raw || at.place)) || (sub && sub.textContent) || "",
      lat: at && at.lat,
      lng: at && at.lng,
      id: at && at.id,
    };
  }
  function pickLeaflet() {
    var inp = document.getElementById("sn-leaflet-file");
    if (!inp) {
      inp = document.createElement("input");
      inp.id = "sn-leaflet-file";
      inp.type = "file";
      inp.accept = "image/*";
      inp.hidden = true;
      document.body.appendChild(inp);
      inp.addEventListener("change", function () {
        var file = inp.files && inp.files[0];
        if (!file) return;
        compress(file, 1280, function (data) {
          if (data) readLeaflet(data, pinMeta());
        });
      });
    }
    inp.value = "";
    inp.click();
  }
  function injectButtons(root) {
    if (!root || root.querySelector("[data-act=leaflet]")) return;
    var upload = root.querySelector("[data-act=shop]");
    if (upload && /VENDOR COVER/i.test(upload.textContent || "")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.setAttribute("data-act", "leaflet");
      b.innerHTML = "<b>READ LEAFLET</b><span>Photo of the printed menu. We fill name, dishes, prices.</span>";
      upload.parentNode.insertBefore(b, upload.nextSibling);
    }
    var form = root.querySelector("form[data-kind=shop]");
    if (form && !form.querySelector("[data-slot=leaflet]")) {
      var lab = document.createElement("label");
      lab.textContent = "Menu leaflet photo";
      var f = document.createElement("input");
      f.type = "file";
      f.accept = "image/*";
      f.setAttribute("data-slot", "leaflet");
      lab.appendChild(f);
      var cover = form.querySelector("[data-slot=profile]");
      var host = cover && cover.closest("label");
      if (host && host.parentNode) host.parentNode.insertBefore(lab, host.nextSibling);
      else form.insertBefore(lab, form.firstChild);
      f.addEventListener("change", function () {
        var file = f.files && f.files[0];
        if (!file) return;
        compress(file, 1280, function (data) {
          if (data) readLeaflet(data, pinMeta());
        });
      });
    }
  }
  function wrapWork() {
    if (!window.SNWork || SNWork.__crawl) return;
    SNWork.__crawl = true;
    if (SNWork.autoList) {
      var al = SNWork.autoList;
      SNWork.autoList = function (p, grokFill) {
        var row = al(p, grokFill);
        if (row && SNWork.publish) SNWork.publish(row);
        return row;
      };
    }
  }
  function bindSheet() {
    var sheet = document.getElementById("sn-sheet");
    if (!sheet || sheet.__snCrawl) return;
    sheet.__snCrawl = true;
    sheet.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act=leaflet]");
      if (!b || !sheet.contains(b)) return;
      e.preventDefault();
      e.stopPropagation();
      pickLeaflet();
    }, true);
    new MutationObserver(function () {
      if (sheet.classList.contains("on")) injectButtons(sheet);
    }).observe(sheet, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  function boot() {
    wrapWork();
    bindSheet();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(function () { wrapWork(); bindSheet(); }, 1500);
  window.SNCrawl = { around: around, take: take, readLeaflet: readLeaflet, pickLeaflet: pickLeaflet };
})();
