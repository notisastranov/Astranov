/* SpaceNet 4196 — restore ⏻ inside the locked power button. No other chrome. */
(function () {
  if (window.__SN_POWER_GLYPH_4196) return;
  window.__SN_POWER_GLYPH_4196 = true;

  var GLYPH = "\u23FB";
  var css = document.createElement("style");
  css.id = "sn-4196-pwr";
  css.textContent = "#sn-power{font-size:22px!important;line-height:1!important}";
  (document.head || document.documentElement).appendChild(css);

  function tick() {
    var el = document.getElementById("sn-power");
    if (!el) return;
    if (String(el.textContent || "").indexOf(GLYPH) === -1) el.textContent = GLYPH;
  }
  tick();
  setInterval(tick, 400);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
})();
