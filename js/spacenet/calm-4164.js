/* SpaceNet 4164 — no photo flood, no auto-talk, GPS stays, team dest. */
(function () {
  if (window.__SN_CALM_4164) return;
  window.__SN_CALM_4164 = true;
  window.__snEarArmed = window.__snEarArmed || false;

  function css() {
    var s = document.getElementById("sn-calm-css");
    if (s) s.remove();
    s = document.createElement("style");
    s.id = "sn-calm-css";
    s.textContent =
      "#sn-sheet.on,#sn-menu.on,#sn-tasks.on,#sn-cart.on,#sn-cash.on,#sn-layers.on,#sn-place.on,#sn-pick.on{display:block}" +
      "#sn-video.on{display:flex}" +
      "#sn-sheet{position:fixed;inset:0;z-index:80;pointer-events:none}" +
      "#sn-sheet.on{pointer-events:none}" +
      "#sn-sheet .bg{pointer-events:none!important;background:transparent!important}" +
      "#sn-sheet .card{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 78px);width:auto;max-width:min(420px,94vw);max-height:42vh;overflow:auto;-webkit-overflow-scrolling:touch;margin:0 auto;padding:12px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.5);border-radius:16px;pointer-events:auto;box-sizing:border-box}" +
      "#sn-menu{position:fixed;inset:0;z-index:80;pointer-events:none}" +
      "#sn-menu .bg{pointer-events:none!important;background:transparent!important}" +
      "#sn-menu .card{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 78px);max-width:min(360px,92vw);max-height:40vh;overflow:auto;margin:0 auto;padding:10px;background:rgba(4,14,28,.96);border:1px solid rgba(126,233,255,.5);border-radius:16px;pointer-events:auto;box-sizing:border-box}" +
      "#gps{z-index:120!important;display:flex!important;flex-direction:column;align-items:center;visibility:visible!important;opacity:1!important;pointer-events:auto!important}" +
      "#gps.ghost{opacity:1!important;visibility:visible!important;pointer-events:auto!important}" +
      "body.sn-video-on #gps{opacity:0!important;pointer-events:none!important}" +
      ".sn-pillpin,.leaflet-marker-icon.sn-pillpin,.leaflet-div-icon.sn-pillpin{width:44px!important;height:44px!important;overflow:hidden!important;border-radius:999px!important;background:#041018;border:1.5px solid rgba(77,240,255,.9)}" +
      ".sn-pillpin img,.sn-pillpin .face,.leaflet-marker-icon img,.leaflet-div-icon img,img.face{width:44px!important;height:44px!important;max-width:44px!important;max-height:44px!important;object-fit:cover!important;display:block!important}" +
      "img.cover,#sn-sheet img.cover,#sn-sheet .cover{display:block!important;width:100%!important;max-width:100%!important;max-height:88px!important;height:88px!important;object-fit:cover!important;border-radius:10px}" +
      "#sn-sheet .dish img,#sn-live img,#sn-menu img,#sn-sheet .pic img,#sn-sheet img.shot,#sn-sheet img.thumb,#sn-sheet img.avatar{width:48px!important;height:48px!important;max-width:48px!important;max-height:48px!important;object-fit:cover!important;border-radius:8px}" +
      "#sn-sheet .sn-menu-grid{max-height:28vh;overflow:auto}" +
      "#sn-dest,select#sn-dest,select[name=dest]{display:block;width:100%;height:44px;margin:8px 0;padding:0 10px;border-radius:12px;border:1px solid rgba(126,233,255,.55);background:rgba(4,16,28,.96);color:#e8fbff;font:700 14px system-ui}" +
      "label.sn-dest-lab{display:block;margin:8px 0 0;font:800 10px/1 system-ui;letter-spacing:.14em;color:#7ee9ff}" +
      ".leaflet-popup-content img{max-width:96px!important;max-height:72px!important;object-fit:cover!important}";
    document.head.appendChild(s);
  }

  function hush() {
    try { if (window.SNVoice && SNVoice.stop) SNVoice.stop(); } catch (e) {}
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    try {
      var a = document.querySelectorAll("audio");
      for (var i = 0; i < a.length; i++) { a[i].pause(); a[i].removeAttribute("src"); }
    } catch (e) {}
  }

  function wrapSpeak() {
    if (!window.speechSynthesis || speechSynthesis.speak.__calm) return;
    var orig = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function (u) {
      if (!window.__snEarArmed) { hush(); return; }
      return orig(u);
    };
    speechSynthesis.speak.__calm = true;
  }

  function wrapTalk() {
    if (!window.SN || !SN.talk || SN.talk.__calm) return false;
    var orig = SN.talk.bind(SN);
    SN.talk = function (t) {
      t = String(t || "").trim();
      if (!t) return;
      if (window.__snEarArmed) {
        orig(t);
        return;
      }
      if (typeof SN.say === "function") SN.say(t);
      else {
        var el = document.getElementById("line");
        if (el) el.textContent = t;
      }
      hush();
    };
    SN.talk.__calm = true;
    return true;
  }

  function wrapPack() {
    if (!window.SN || !SN.pack || SN.pack.__calm) return false;
    var orig = SN.pack.bind(SN);
    SN.pack = function () {
      orig();
      var g = document.getElementById("gps");
      var video = document.getElementById("sn-video");
      var on = !!(video && video.classList.contains("on"));
      document.body.classList.toggle("sn-video-on", on);
      if (g && !on) {
        g.classList.remove("ghost");
        g.style.display = "flex";
        g.style.visibility = "visible";
        g.style.opacity = "1";
        g.style.pointerEvents = "auto";
        g.style.zIndex = "120";
      }
    };
    SN.pack.__calm = true;
    return true;
  }

  function wrapWork() {
    if (!window.SNWork || !SNWork.open || SNWork.open.__calm) return false;
    var orig = SNWork.open.bind(SNWork);
    SNWork.open = function (place, which) {
      hush();
      var r = orig(place, which);
      setTimeout(function () { injectDest(); capImgs(); }, 0);
      return r;
    };
    SNWork.open.__calm = true;
    return true;
  }

  function teams() {
    try { return JSON.parse(localStorage.getItem("sn:teams") || "[]") || []; } catch (e) { return []; }
  }
  function destNow() {
    try { return localStorage.getItem("sn:dest") || "social"; } catch (e) { return "social"; }
  }
  function saveDest(v) {
    try { localStorage.setItem("sn:dest", v); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      if (c === "&") return "&" + "amp;";
      if (c === "<") return "&" + "lt;";
      if (c === ">") return "&" + "gt;";
      if (c === '"') return "&" + "quot;";
      return "&#39;";
    });
  }
  function destHtml() {
    var list = teams();
    var cur = destNow();
    var opts = '<option value="social"' + (cur === "social" ? " selected" : "") + ">Social (everyone)</option>";
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (!t || !t.id) continue;
      opts += '<option value="' + esc(t.id) + '"' + (cur === t.id ? " selected" : "") + ">Team: " + esc(t.name || t.id) + "</option>";
    }
    opts += '<option value="new">+ Create team\u2026</option>';
    return '<label class="sn-dest-lab">POST TO<select id="sn-dest" name="dest">' + opts + "</select></label>";
  }
  function bindDest(sel) {
    if (!sel || sel.__calm) return;
    sel.__calm = true;
    sel.addEventListener("change", function () {
      if (sel.value === "new") {
        var name = window.prompt("Team name");
        if (!name || !String(name).trim()) { sel.value = destNow(); return; }
        var team = { id: "t" + Date.now().toString(36), name: String(name).trim(), created: Date.now() };
        var list = teams();
        list.push(team);
        try { localStorage.setItem("sn:teams", JSON.stringify(list.slice(0, 40))); } catch (e) {}
        saveDest(team.id);
        var parent = sel.parentNode;
        if (parent) {
          var wrap = document.createElement("div");
          wrap.innerHTML = destHtml();
          parent.replaceWith(wrap.firstChild);
          var next = document.getElementById("sn-dest");
          if (next) { next.value = team.id; bindDest(next); }
        }
        return;
      }
      saveDest(sel.value);
    });
  }
  function injectDest() {
    var card = document.querySelector("#sn-sheet.on .card") || document.querySelector("#sn-sheet .card");
    if (!card) return;
    if (card.querySelector("#sn-dest")) {
      bindDest(card.querySelector("#sn-dest"));
      return;
    }
    var form = card.querySelector("form[data-kind=post],form[data-kind=report],form");
    var host = form || card;
    var hd = card.querySelector(".hd");
    var wrap = document.createElement("div");
    wrap.innerHTML = destHtml();
    var node = wrap.firstChild;
    if (form) {
      var first = form.querySelector("textarea,input,button.go,button[type=submit]");
      if (first) form.insertBefore(node, first);
      else form.appendChild(node);
    } else if (hd && hd.nextSibling) {
      card.insertBefore(node, hd.nextSibling);
    } else {
      host.insertBefore(node, host.firstChild);
    }
    bindDest(card.querySelector("#sn-dest"));
  }

  function capImgs() {
    var pins = document.querySelectorAll(".sn-pillpin img,.leaflet-marker-icon img,.leaflet-div-icon img");
    for (var i = 0; i < pins.length; i++) {
      pins[i].style.maxWidth = "44px";
      pins[i].style.maxHeight = "44px";
      pins[i].style.width = "44px";
      pins[i].style.height = "44px";
      pins[i].style.objectFit = "cover";
    }
    var covers = document.querySelectorAll("img.cover,#sn-sheet img.cover");
    for (i = 0; i < covers.length; i++) {
      covers[i].style.maxHeight = "88px";
      covers[i].style.height = "88px";
      covers[i].style.width = "100%";
      covers[i].style.objectFit = "cover";
    }
  }

  function armMic() {
    var go = document.getElementById("go");
    if (!go || go.__calm) return;
    go.__calm = true;
    go.addEventListener("click", function () { window.__snEarArmed = true; }, true);
  }

  function boot() {
    css();
    wrapSpeak();
    wrapTalk();
    wrapPack();
    wrapWork();
    armMic();
    injectDest();
    capImgs();
    var g = document.getElementById("gps");
    if (g) {
      g.classList.remove("ghost");
      g.style.zIndex = "120";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { boot(); hush(); });
  else { boot(); hush(); }
  setInterval(boot, 1500);

  var sheet = document.getElementById("sn-sheet");
  if (sheet && !sheet.__calmObs) {
    sheet.__calmObs = true;
    new MutationObserver(function () { injectDest(); capImgs(); }).observe(sheet, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  var city = document.getElementById("city");
  if (city && !city.__calmObs) {
    city.__calmObs = true;
    new MutationObserver(function () { capImgs(); }).observe(city, { childList: true, subtree: true });
  }
})();
