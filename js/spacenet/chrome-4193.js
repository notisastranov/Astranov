/* SpaceNet 4193 — restore locked chrome. Power on. VISIBLE off money. JOBS frozen left. No new buttons. */
(function () {
  if (window.__SN_CHROME_4193) return;
  window.__SN_CHROME_4193 = true;

  var css = document.createElement("style");
  css.id = "sn-4193-css";
  css.textContent =
    "#sn-power,#sn-power.on,#sn-power.off,#sn-power.idle{" +
    "display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;" +
    "position:fixed!important;top:calc(max(8px,env(safe-area-inset-top)) + 44px)!important;" +
    "left:max(8px,env(safe-area-inset-left))!important;right:auto!important;bottom:auto!important;" +
    "z-index:55!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;" +
    "border-radius:999px!important;border-width:1.5px!important;border-style:solid!important;" +
    "align-items:center!important;justify-content:center!important;transform:none!important}" +
    "#sn-vis,#sn-vis.on{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;right:auto!important;left:-9999px!important}" +
    "#sn-tasks-btn,#sn-tasks-btn.on{" +
    "display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;" +
    "position:fixed!important;top:calc(max(8px,env(safe-area-inset-top)) + 52px)!important;" +
    "left:3.6rem!important;right:auto!important;bottom:auto!important;transform:none!important;margin:0!important;z-index:50!important}";
  (document.head || document.documentElement).appendChild(css);

  function pin(el, props) {
    if (!el || !el.style || !el.style.setProperty) return;
    Object.keys(props).forEach(function (k) {
      el.style.setProperty(k, props[k], "important");
    });
  }

  function tick() {
    var vis = document.getElementById("sn-vis");
    if (vis && vis.parentNode) vis.parentNode.removeChild(vis);

    pin(document.getElementById("sn-power"), {
      display: "flex",
      visibility: "visible",
      opacity: "1",
      position: "fixed",
      top: "calc(max(8px, env(safe-area-inset-top)) + 44px)",
      left: "max(8px, env(safe-area-inset-left))",
      right: "auto",
      bottom: "auto",
      width: "44px",
      height: "44px",
      transform: "none",
    });

    pin(document.getElementById("sn-tasks-btn"), {
      display: "inline-flex",
      visibility: "visible",
      opacity: "1",
      position: "fixed",
      top: "calc(max(8px, env(safe-area-inset-top)) + 52px)",
      left: "3.6rem",
      right: "auto",
      bottom: "auto",
      transform: "none",
    });

    var drop = document.getElementById("sn-jobs-drop");
    if (drop) {
      pin(drop, {
        top: "calc(max(8px, env(safe-area-inset-top)) + 90px)",
        left: "3.6rem",
      });
    }
  }

  tick();
  setInterval(tick, 400);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
