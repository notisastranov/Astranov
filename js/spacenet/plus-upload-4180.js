/* SpaceNet 4180 — plus = upload for Grok. Photo, map, topo, vendor spreadsheet. */
(function () {
  if (window.__snPlusUp4180) return;
  window.__snPlusUp4180 = true;
  function line(t) { var el = document.getElementById("line"); if (el) el.textContent = t || ""; }
  function talk(t) { if (window.SN && SN.talk) SN.talk(t); else line(t); }
  function picker() {
    var inp = document.getElementById("sn-plus-file");
    if (inp) return inp;
    inp = document.createElement("input");
    inp.id = "sn-plus-file"; inp.type = "file"; inp.accept = "image/*,.csv,.tsv,.txt,.json,.pdf,.xlsx,.xls"; inp.style.display = "none";
    document.body.appendChild(inp);
    inp.addEventListener("change", function () { var f = inp.files && inp.files[0]; inp.value = ""; if (f) useFile(f); });
    return inp;
  }
  function compress(file, cb) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas"); var max = 1280;
      var r = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
      c.width = Math.max(1, Math.round((img.width || 1) * r)); c.height = Math.max(1, Math.round((img.height || 1) * r));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      var data = c.toDataURL("image/jpeg", 0.72);
      try { URL.revokeObjectURL(url); } catch (e) {}
      cb(data);
    };
    img.onerror = function () { try { URL.revokeObjectURL(url); } catch (e) {} cb(""); };
    img.src = url;
  }
  function apply(j, name) {
    var text = String((j && (j.text || j.say || j.response)) || "");
    var o = j || {}; var m = text.match(/\{[\s\S]*\}/);
    if (m) { try { o = Object.assign({}, o, JSON.parse(m[0])); } catch (e) {} }
    var say = o.say || text.replace(/\{[\s\S]*\}/, "").trim() || ("Read " + name + ".");
    talk(say); line(say);
    var places = o.places || [];
    if (isFinite(+o.lat) && isFinite(+o.lng)) places = places.concat([{ name: o.q || o.name || name, lat: +o.lat, lng: +o.lng, raw: o.raw || "" }]);
    if (places.length && window.SNSearch && SNSearch.find) SNSearch.find(places[0].name || o.q || name);
    else if (places.length && window.SN && SN.showCity) SN.showCity(places[0]);
    var dishes = o.dishes || o.items || [];
    if (dishes.length && window.SNWork && SNWork.applyFill) SNWork.applyFill({ name: o.name || name, phone: o.phone, hours: o.hours, note: o.note || say, dishes: dishes, cover: o.cover });
  }
  function send(payload) {
    line("Grok is reading the upload…");
    fetch("/api/see", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && (j.ok || j.text || j.say)) { apply(j, payload.name); return null; }
        return fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: payload.prompt || payload.message, message: payload.message, fileText: payload.fileText, spacenet: true, allow_paid: true }) }).then(function (r) { return r.json(); });
      })
      .then(function (j) { if (j) apply(j, payload.name); })
      .catch(function () { talk("Upload did not reach Grok. Try a smaller photo or a CSV menu."); });
  }
  function useFile(file) {
    var name = file.name || "upload";
    var type = String(file.type || "").toLowerCase();
    line("Opening " + name + "…");
    var prompt = "UPLOAD for SpaceNet. Filename " + name + ". Identify what it is. If a place or map or topo, return act=hunt with places[{name,lat,lng,raw}]. If a vendor menu or spreadsheet, return act=listing with dishes[{name,price,sample}]. If a photo of a shop or street, name it and pin it. Never invent a phone. JSON only with say, act, places, dishes.";
    if (type.indexOf("image/") === 0) {
      compress(file, function (data) {
        if (!data) { talk("Could not read that photo."); return; }
        send({ prompt: prompt, message: prompt, name: name, image: data, spacenet: true, allow_paid: true, force_paid: true });
      });
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var text = String(reader.result || "").slice(0, 12000);
      send({ prompt: prompt + "\n\nFILE:\n" + text, message: prompt + "\n\nFILE:\n" + text, name: name, fileText: text, spacenet: true, allow_paid: true });
    };
    reader.onerror = function () { talk("Could not read that file."); };
    reader.readAsText(file);
  }
  function openPick(e) {
    if (!e || !e.target || !e.target.closest) return;
    if (!e.target.closest("#plus")) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    picker().click();
  }
  document.addEventListener("click", openPick, true);
  document.addEventListener("pointerup", openPick, true);
})();
