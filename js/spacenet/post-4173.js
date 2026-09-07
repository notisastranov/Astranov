/* SpaceNet 4173 — GPS 🎯 + JOBS dropdown. Do not restyle other chrome. */
(function () {
  if (window.__SN_CHROME_4173) return;
  window.__SN_CHROME_4173 = true;

  var GPS_HTML = '<span class="lbl">GPS</span><span class="tgt" aria-hidden="true">🎯</span>';

  function read(k, d) {
    try {
      var v = localStorage.getItem(k);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  }
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
    if (document.getElementById("sn-4173-css")) return;
    var s = document.createElement("style");
    s.id = "sn-4173-css";
    s.textContent =
      "#gps{position:fixed!important;right:max(10px,env(safe-area-inset-right))!important;bottom:calc(env(safe-area-inset-bottom) + 72px)!important;left:auto!important;top:auto!important;z-index:120!important;display:flex!important;flex-direction:column;align-items:center;visibility:visible!important;opacity:1!important;pointer-events:auto!important;width:var(--u,36px);padding:0;border:0;background:transparent;color:#4df0ff}" +
      "#gps.ghost{opacity:1!important;visibility:visible!important;pointer-events:auto!important}" +
      "#gps .lbl{display:block;font:800 8px/1 system-ui;letter-spacing:.16em;text-align:center;margin:0 0 4px}" +
      "#gps .tgt{position:relative;display:flex;align-items:center;justify-content:center;width:var(--u,36px);height:var(--u,36px);margin:0 auto;border-radius:999px;border:1.5px solid rgba(77,240,255,.95);background:radial-gradient(circle at 50% 50%,rgba(77,240,255,.22),rgba(2,10,18,.8) 70%);font-size:18px;line-height:1}" +
      "#gps .tgt:before,#gps .tgt:after,#gps .dot{display:none!important;content:none!important}" +
      "#sn-power,#sn-power.on,#sn-power.off,#sn-power.idle{display:flex!important;visibility:visible!important;opacity:1!important}" +
      "#sn-tasks-btn,#sn-tasks-btn.on{display:inline-flex!important;position:fixed!important;z-index:50!important;visibility:visible!important;opacity:1!important;align-items:center;justify-content:center;height:32px;min-width:70px;padding:0 12px;border-radius:999px;border:1px solid rgba(80,220,255,.35);background:rgba(4,16,28,.94);color:#4df0ff;font:800 11px/1 system-ui;letter-spacing:.14em;pointer-events:auto}" +
      "#sn-jobs-drop{position:fixed;z-index:180;min-width:216px;max-width:min(288px,72vw);max-height:42vh;overflow:auto;display:none;padding:6px;border-radius:14px;border:1px solid rgba(80,220,255,.35);background:rgba(4,16,28,.96);color:#e8fbff}" +
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
    g.style.setProperty("display", "flex", "important");
    g.style.setProperty("visibility", "visible", "important");
    g.style.setProperty("opacity", "1", "important");
    g.style.setProperty("pointer-events", "auto", "important");
    g.style.setProperty("z-index", "120", "important");
    g.style.setProperty("right", "max(10px, env(safe-area-inset-right))", "important");
    g.style.setProperty("bottom", "calc(env(safe-area-inset-bottom) + 72px)", "important");
    g.style.setProperty("left", "auto", "important");
    g.style.setProperty("top", "auto", "important");
    if (String(g.textContent || "").indexOf("🎯") === -1) g.innerHTML = GPS_HTML;
  }

  function pinPower() {
    var el = document.getElementById("sn-power");
    if (!el) return;
    el.style.setProperty("display", "flex", "important");
    el.style.setProperty("visibility", "visible", "important");
    el.style.setProperty("opacity", "1", "important");
  }

  function labelBtn() {
    var b = document.getElementById("sn-tasks-btn");
    if (!b) return;
    var n = jobs().length;
    b.textContent = n ? ("JOBS " + n + (n > 1 ? " \u25BE" : "")) : "JOBS";
  }

  function pinJobs() {
    var b = document.getElementById("sn-tasks-btn");
    if (!b) return;
    b.classList.add("on");
    b.style.setProperty("display", "inline-flex", "important");
    b.style.setProperty("position", "fixed", "important");
    b.style.setProperty("visibility", "visible", "important");
    b.style.setProperty("opacity", "1", "important");
    b.style.setProperty("pointer-events", "auto", "important");
    b.style.setProperty("z-index", "50", "important");
    var pwr = document.getElementById("sn-power");
    var r = pwr && pwr.getBoundingClientRect();
    var y;
    var x;
    if (r && r.height > 8) {
      y = Math.round(r.top + Math.max(0, (r.height - 32) / 2));
      x = Math.round(r.right + 8);
    } else {
      var isl = document.getElementById("island");
      var ir = isl && isl.getBoundingClientRect();
      y = ir ? Math.round(ir.bottom + 8) : 58;
      x = 60;
    }
    b.style.setProperty("top", y + "px", "important");
    b.style.setProperty("left", x + "px", "important");
    b.style.setProperty("right", "auto", "important");
    b.style.setProperty("bottom", "auto", "important");
    labelBtn();
    var drop = document.getElementById("sn-jobs-drop");
    if (drop) {
      drop.style.top = y + 36 + "px";
      drop.style.left = x + "px";
    }
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
      return '<button type="button" class="row" data-id="' + esc(t.id || "") + '"><b>' + esc(from) + " → " + esc(to) + "</b><span>AV\u20ac " + money(t.pay || t.ave || t.ride) + " \u00b7 " + esc(t.status || "queued") + "</span></button>";
    }).join("");
  }

  function hideStack() {
    var stack = document.getElementById("sn-jobs-stack");
    if (stack) stack.classList.remove("on");
    var tasks = document.getElementById("sn-tasks");
    if (tasks) tasks.classList.remove("on");
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
    pinJobs();
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
    if (!b.__sn4173) {
      var n = b.cloneNode(true);
      n.id = "sn-tasks-btn";
      n.__sn4173 = true;
      n.__snThrow = true;
      n.__jobs = true;
      if (b.parentNode) b.parentNode.replaceChild(n, b);
      n.addEventListener("click", toggleDrop, true);
    }
    pinJobs();
  }

  function wrapPack() {
    if (!window.SN || !SN.pack || SN.pack.__sn4173) return;
    var orig = SN.pack.bind(SN);
    SN.pack = function () {
      orig();
      pinGps();
      pinPower();
      pinJobs();
    };
    SN.pack.__sn4173 = true;
  }

  function wrapPark() {
    if (!window.SNThrow || !SNThrow.park || SNThrow.park.__sn4173) return;
    var orig = SNThrow.park.bind(SNThrow);
    SNThrow.park = function () {
      orig();
      pinJobs();
    };
    SNThrow.park.__sn4173 = true;
  }

  function boot() {
    css();
    pinGps();
    pinPower();
    hookBtn();
    wrapPack();
    wrapPark();
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
