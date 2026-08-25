/* Astranov healer · Build 20260825154600-no-ghost
 * LAW: restore the latest Grid OS only. Twin-CLI HUD is a ghost. Never bring it back.
 */
(function (G) {
  "use strict";
  var BUILD = "20260825154600-no-ghost";
  var LATEST = "20260825154100-grid-restore";
  if (G.__snNoGhost) return;
  G.__snNoGhost = 1;
  G.SNLaw = {
    build: BUILD,
    latest: LATEST,
    kernel: "/js/spacenet/grid-os.js",
    ghosts: ["cli-in", "stc-cmd-in", "sn-topchrome", "Command the HUD"],
    heal: heal,
  };
  G.SN = G.SN || {};
  G.SN.defend = heal;
  G.SN.heal = heal;

  var GHOST_IDS = [
    "cli-in",
    "stc-cmd-in",
    "sn-topchrome",
    "sn-topchrome-panel",
    "cli-coach",
    "cli-drag",
    "sn-topchrome-drag",
    "sn-task-ribbon",
    "fbh-s",
    "globe",
    "boot",
    "sn-helper-canvas",
    "sn-helper-hit",
    "sn-silver-hud",
    "sn-pizza-pins",
  ];
  var GHOST_JS =
    /os-bootloader|chrome-mute|chrome-fix|chrome-rib|chrome-radar|chrome-defend|chrome-helper|chrome-place-earth|chrome-mobile-alive|guardian\.js|phone-os|simple-ux|chrome-shell|hud-law|relic-defend/i;

  function isLatest() {
    return !!(
      G.__SN_GRID_OS ||
      (document.getElementById("g") && document.getElementById("in") && !document.getElementById("cli-in"))
    );
  }
  function isGhost() {
    return !!(
      document.getElementById("cli-in") ||
      document.getElementById("stc-cmd-in") ||
      document.getElementById("sn-topchrome") ||
      /Command the HUD|hud-law/i.test(document.documentElement.innerHTML || "")
    );
  }
  function killGhosts() {
    var i, el, scripts;
    for (i = 0; i < GHOST_IDS.length; i++) {
      el = document.getElementById(GHOST_IDS[i]);
      if (el && el.parentNode && el.id !== "g") {
        try {
          el.parentNode.removeChild(el);
        } catch (e) {}
      }
    }
    try {
      scripts = document.querySelectorAll("script");
      for (i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || scripts[i].getAttribute("src") || "";
        if (GHOST_JS.test(src) && src.indexOf("chrome-mute") < 0) {
          scripts[i].type = "text/plain";
          if (scripts[i].parentNode) scripts[i].parentNode.removeChild(scripts[i]);
        }
      }
    } catch (e2) {}
  }
  function loadKernel() {
    if (G.__SN_GRID_OS || document.querySelector('script[data-sn-grid-os]')) return;
    var s = document.createElement("script");
    s.src = "/js/spacenet/grid-os.js?v=" + BUILD;
    s.setAttribute("data-sn-grid-os", "1");
    s.onerror = function () {
      var s2 = document.createElement("script");
      s2.src =
        "https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main/js/spacenet/grid-os.js?v=" +
        BUILD;
      s2.setAttribute("data-sn-grid-os", "1");
      (document.body || document.documentElement).appendChild(s2);
    };
    (document.body || document.documentElement).appendChild(s);
  }
  function writeShell() {
    if (document.getElementById("g") && document.getElementById("in")) return;
    var style = document.getElementById("sn-grid-law");
    if (!style) {
      style = document.createElement("style");
      style.id = "sn-grid-law";
      style.textContent =
        "html,body{margin:0;height:100%;background:#050608;color:#dfe6ee;overflow:hidden;font-family:ui-sans-serif,system-ui,sans-serif}#g{position:fixed;inset:0}#city{position:fixed;inset:0;z-index:12;display:none}#city.on{display:block}#top,#dock{position:fixed;left:0;right:0;display:flex;justify-content:center;pointer-events:none;z-index:20}#top{top:max(10px,env(safe-area-inset-top))}#dock{bottom:0;padding:0 10px max(10px,env(safe-area-inset-bottom))}#island,#panel{pointer-events:auto}#island{display:flex;align-items:center;gap:8px;border:1px solid #2a3340;border-radius:999px;background:rgba(8,9,12,.86);padding:6px 12px}#island b{font:600 10px/1.2 ui-sans-serif,system-ui;letter-spacing:.16em}#island .a{color:#dfe6ee}#island .s{color:#9ec8e8;letter-spacing:.18em;font-size:11px}#island .k{color:#7a8494}#bal{height:28px;padding:0 10px;border:1px solid #2a3340;border-radius:999px;color:#ffe566;display:flex;align-items:center}#heal{width:8px;height:8px;border-radius:99px;background:#8fb37a}#panel{width:min(440px,100%);border:1px solid #2a3340;border-radius:22px;background:rgba(14,16,20,.92);padding:10px}form{display:flex;align-items:center;gap:8px;min-height:44px;border:1px solid #2a3340;border-radius:14px;padding:0 8px;background:rgba(8,9,12,.7)}input#in{flex:1;min-width:0;height:36px;border:0;background:0;color:#dfe6ee;font:15px ui-sans-serif,system-ui;outline:0}.hub{position:relative;flex-shrink:0;width:36px;height:36px}.hub>button{width:36px;height:36px;border:0;border-radius:999px;background:#dfe6ee;color:#08090c;font:700 18px/1 ui-sans-serif,system-ui}#line{margin:8px 4px 0;font-size:12px;color:#9aa4b2;max-height:6.5rem;overflow:auto;white-space:pre-wrap}.gone{display:none!important}#sn-topchrome,#panel.collapsed #cli-in{display:none!important}";
      document.head.appendChild(style);
    }
    var body = document.body || document.documentElement;
    if (!document.getElementById("g")) {
      var g = document.createElement("canvas");
      g.id = "g";
      body.insertBefore(g, body.firstChild);
    }
    if (!document.getElementById("city")) {
      var city = document.createElement("div");
      city.id = "city";
      body.appendChild(city);
    }
    if (!document.getElementById("island")) {
      var top = document.createElement("div");
      top.id = "top";
      top.innerHTML =
        '<div id="island"><span id="heal" class="ok"></span><b class="a">ASTRANOV</b><b class="s">SPACENET</b><b class="k">GROK</b><span id="bal">0</span></div>';
      body.appendChild(top);
    }
    if (!document.getElementById("in")) {
      var dock = document.createElement("div");
      dock.id = "dock";
      dock.innerHTML =
        '<div id="panel"><div id="list"></div><form id="f"><div class="hub"><button type="button" id="plus">+</button></div><input id="in" autocomplete="off" enterkeyhint="send" /><div class="hub"><button type="button" id="go" aria-label="Voice">●</button></div></form><div id="line">…</div></div>';
      body.appendChild(dock);
    }
    try {
      document.title = "Astranov SpaceNet Grok";
      var meta = document.querySelector('meta[name="astranov-build"]');
      if (meta) meta.setAttribute("content", BUILD);
    } catch (e3) {}
  }
  function heal() {
    if (isGhost()) killGhosts();
    if (!isLatest()) writeShell();
    killGhosts();
    loadKernel();
    return BUILD;
  }
  G.SNLaw.heal = heal;
  heal();
  setInterval(function () {
    if (isGhost() || !isLatest()) heal();
    else killGhosts();
  }, 4000);
})(typeof window !== "undefined" ? window : globalThis);
