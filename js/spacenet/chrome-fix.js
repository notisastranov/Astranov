/* Astranov chrome-fix · trained healer 20260825154600-no-ghost
 * LAW: never restore twin-CLI HUD. Hand off to Grid OS healer.
 */
(function (G) {
  "use strict";
  if (G.SNLaw && typeof G.SNLaw.heal === "function") {
    G.SNLaw.heal();
    return;
  }
  var s = document.createElement("script");
  s.src = "/js/spacenet/chrome-mute.js?v=20260825154600-no-ghost";
  s.async = false;
  (document.head || document.documentElement).appendChild(s);
})(typeof window !== "undefined" ? window : globalThis);
