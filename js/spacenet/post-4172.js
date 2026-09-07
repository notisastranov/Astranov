/* SpaceNet 4172 — restore GPS reticle + JOBS dropdown. Do not restyle other chrome. */
(function () {
  if (window.__SN_CHROME_4172) return;
  window.__SN_CHROME_4172 = true;

  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&#38;")
      .replace(/</g, "&#60;")
      .replace(/>/g, "&#62;")
      .replace(/"/g, "&#34;");
  }
  function jobs() {
    var list = [];
    try { list = JSON.parse(read("sn:tasks", "[]") || "[]"); } catch (e) { list = []; }
    if (!Array.isArray(list) || !list.length) {
      try { list = JSON.parse(read("sn:jobs", "[]") || "[]"); } catch (e) { list = []; }
    }
    return (list || []).filter(function (t) {
      return t && (t.kind === "job" || t.kind === "delivery" || t.kind === "hourly" || t.kind === "errand" || t.what || t.from || t.title);
    });
  }
  function nameOf(p) {
    if (!p) return "";
    if (typeof p === "string") return p;
    return String(p.name || p.label || p.address || "");
  }
  function money(n) { return Number(n || 0).toFixed(2); }

  function css() {
    if (document.getElementById("sn-4172-css")) return;
    var s = document.createElement("style");
    s.id = "sn-4172-css";
    s.textContent =
      "#gps{position:fixed!important;right:max(10px,env(safe-area-inset-right))!important;bottom:calc(env(safe-area-inset-bottom) + 72px)!important;left:auto!important;top:auto!important;z-index:120!important;display:flex!important;flex-direction:column;align-items:center;visibility:visible!important;opacity:1!important;pointer-events:auto!important;width:var(--u,36px);padding:0;border:0;background:transparent;color:#4df0ff}" +
      "#gps.ghost{opacity:1!important;visibility:visible!important;pointer-events:auto!important}" +
      "#gps .lbl{display:block;font:800 8px/1 system-ui;letter-spacing:.16em;text-align:center;margin:0 0 4px}" +
      "#gps .tgt{position:relative;display:flex;align-items:center;justify-content:center;width:var(--u,36px);height:var(--u,36px);margin:0 auto;border-radius:999px;border:1.5px solid rgba(77,240,255,.95);background:radial-gradient(circle at 50% 50%,rgba(77,240,255,.22),rgba(2,10,18,.8) 70%)}" +
      "#gps .tgt:before,#gps .tgt:after{content:'';position:absolute;background:#4df0ff;box-shadow:0 0 6px #4df0ff}" +
      "#gps .tgt:before{width:1.5px;top:5px;bottom:5px;left:50%;transform:translateX(-50%)}" +
      "#gps .tgt:after{height:1.5px;left:5px;right:5px;top:50%;transform:translateY(-50%)}" +
      "#gps .dot{width:6px;height:6px;border-radius:99px;background:#4df0ff;box-shadow:0 0 8px #4df0ff;position:relative;z-index:1}" +
      "#sn-power,#sn-power.on,#sn-power.off,#sn-power.idle{display:flex!important;position:fixed!important;top:calc(max(8px,env(safe-area-inset-top)) + 44px)!important;left:max(8px,env(safe-area-inset-left))!important;right:auto!important;bottom:auto!important;z-index:50!important;visibility:visible!important;opacity:1!important;width:44px;height:44px;border-radius:999px;align-items:center;justify-content:center}" +
      "#sn-tasks-btn,#sn-tasks-btn.on{display:inline-flex!important;position:fixed!important;top:calc(max(8px,env(safe-area-inset-top)) + 54px)!important;left:3.6rem!important;right:auto!important;bottom:auto!important;z-index:50!important;visibility:visible!important;opacity:1!important;align-items:center;justify-content:center;height:32px;min-width:70px;padding:0 12px;border-radius:999px;border:1px solid rgba(80,220,255,.35);background:rgba(4,16,28,.94);color:#4df0ff;font:800 11px/1 system-ui;letter-spacing:.14em;pointer-events:auto}" +
      "#sn-jobs-drop{position:fixed;top:calc(max(8px,env(safe-area-inset-top)) + 90px);left:3.6rem;z-index:180;min-width:216px;max-width:min(288px,72vw);max-height:42vh;overflow:auto;display:none;padding:6px;border-radius:14px;border:1px solid rgba(80,220,255,.35);background:rgba(4,16,28,.96);color:#e8fbff}" +
      "#sn-jobs-drop.on{display:block}" +
      "#sn-jobs-drop .row{display:block;width:100%;text-align:left;margin:0 0 4px;padding:8px;border-radius:10px;border:1px solid rgba(80,220,255,.25);background:transparent;color:#e8fbff}" +
      "#sn-jobs-drop .row b{display:block;font:800 11px system-ui}" +
      "#sn-jobs-drop .row span{display:block;margin-top:3px;font:600 10px ui-monospace;color:#7ee9ff}" +
      "#sn-jobs-drop .empty{margin:0;padding:8px;font:600 11px ui-monospace;color:#7a93a3}";
    document.head.appendChild(s);
  }

  function pinGps() {
    var g = document.getElementById("gps");
    if (!g) return;
    g.classList.remove("ghost");
    g.style.left = "auto";
    g.style.top = "auto";
    g.style.display = "flex";
    g.style.visibility = "visible";
    g.style.opacity = "1";
    g.style.pointerEvents = "auto";
    g.style.zIndex = "120";
    if (!g.querySelector(".tgt")) {
      g.innerHTML = '<span class="lbl">GPS</span><span class="tgt"><span class="dot"></span></span>';
    }
  }

  function pinPower() {
    var el = document.getElementById("sn-power");
    if (!el) return;
    el.style.display = "flex";
    el.style.visibility = "visible";
    el.style.opacity = "1";
  }

  function labelBtn() {
    var b = document.getElementById("sn-tasks-btn");
    if (!b) return;
    var n = jobs().length;
    b.textContent = n ? ("JOBS " + n + (n > 1 ? " \u25BE" : "")) : "JOBS";
    b.style.display = "inline-flex";
    b.style.visibility = "visible";
    b.style.opacity = "1";
  }

  function dropEl() {
    var el = document.getElementById("sn-jobs-drop");
    if (el) return el;
    el = document.createElement("div");
    el.id = "sn-jobs-drop";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var row = e.target && e.target.closest && e.target.closest("[data-id]");
      if (!row) return;
      openJob(row.getAttribute("data-id"));
    });
    return el;
  }

  function fillDrop() {
    var el = dropEl();
    var list = jobs();
    if (!list.length) {
      el.innerHTML = '<p class="empty">Queue empty. Post with +.</p>';
      return;
    }
    el.innerHTML = list.map(function (t) {
      var from = nameOf(t.from) || t.fromName || "Pin";
      var to = t.address || nameOf(t.to) || t.toName || t.where || t.title || "Job";
      return '<button type="button" class="row" data-id="' + esc(t.id || "") + '"><b>' + esc(from) + " \u2192 " + esc(to) + "</b><span>AV\u20ac " + money(t.pay || t.ave || t.ride) + " \u00b7 " + esc(t.status || "queued") + "</span></button>";
    }).join("");
  }

  function hideStack() {
    var stack = document.getElementById("sn-jobs-stack");
    if (stack) stack.classList.remove("on");
  }

  function toggleDrop(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    var el = dropEl();
    if (el.classList.contains("on")) {
      el.classList.remove("on");
      return;
    }
    fillDrop();
    el.classList.add("on");
    hideStack();
  }

  function openJob(id) {
    dropEl().classList.remove("on");
    if (!id || !window.SNJobsStack || !SNJobsStack.paint) return;
    SNJobsStack.paint();
    var btn = document.querySelector('#sn-jobs-stack [data-act="open"][data-id="' + String(id).replace(/"/g, "") + '"]');
    if (btn) btn.click();
  }

  function hookBtn() {
    var b = document.getElementById("sn-tasks-btn");
    if (!b) return;
    if (!b.__sn4172) {
      var n = b.cloneNode(true);
      n.id = "sn-tasks-btn";
      n.__sn4172 = true;
      n.__jobs = true;
      if (b.parentNode) b.parentNode.replaceChild(n, b);
      n.addEventListener("click", toggleDrop, true);
      b = n;
    }
    labelBtn();
  }

  function wrapPack() {
    if (!window.SN || !SN.pack || SN.pack.__sn4172) return;
    var orig = SN.pack.bind(SN);
    SN.pack = function () {
      orig();
      pinGps();
      pinPower();
      labelBtn();
    };
    SN.pack.__sn4172 = true;
  }

  function boot() {
    css();
    pinGps();
    pinPower();
    hookBtn();
    wrapPack();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1500);
  document.addEventListener("click", function (e) {
    var drop = document.getElementById("sn-jobs-drop");
    if (!drop || !drop.classList.contains("on")) return;
    var t = e.target;
    if (t && t.closest && (t.closest("#sn-jobs-drop") || t.closest("#sn-tasks-btn"))) return;
    drop.classList.remove("on");
  });
})();
