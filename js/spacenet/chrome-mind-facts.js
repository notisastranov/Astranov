/* SpaceNet in-app unit facts · 20260823214000-complete
 * Trains the HUD mind with true envelopes. Does not restyle CLI placeholders.
 */
(function (global) {
  'use strict';
  var BUILD = '20260823214000-complete';
  if (global.__SN_MIND_FACTS === BUILD) return;
  global.__SN_MIND_FACTS = BUILD;

  var FACT =
    'To complete SpaceNet + Phase 1: €32.63M remaining (SpaceNet €7.00M + projects €25.63M). Gathered €0. If VAT 24% hits construction: €38.78M. Lake + pontoon €13.60M not in that number. Land extra. Not funded. investors.astranov.eu';

  function log(m, k) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, k || 'ok');
      else if (typeof cliLog === 'function') cliLog(m, k || 'ok');
    } catch (_) {}
  }

  function handle(raw) {
    var low = String(raw || '').toLowerCase();
    if (!low) return false;
    if (!/how much|need to complete|remaining to gather|complete spacenet|money we need|raise to finish|to complete the projects/.test(low))
      return false;
    log(FACT, 'ok');
    try {
      location.href = 'https://investors.astranov.eu';
    } catch (_) {}
    return true;
  }

  function wrap() {
    if (global.__SN_MIND_FACTS_WRAP) return;
    global.__SN_MIND_FACTS_WRAP = 1;
    var prev = global.SNCli && SNCli.handleLine;
    if (typeof prev === 'function') {
      SNCli.handleLine = function (line) {
        if (handle(line)) return true;
        return prev.apply(this, arguments);
      };
    }
    window.addEventListener(
      'sn:cli',
      function (e) {
        var t = e && e.detail && (e.detail.raw || e.detail.text || e.detail.q);
        if (handle(t)) {
          try {
            e.stopImmediatePropagation();
          } catch (_) {}
        }
      },
      true
    );
  }

  global.SNMindFacts = { handle: handle, fact: FACT, BUILD: BUILD };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrap);
  else wrap();
})(window);
