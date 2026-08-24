/* Astranov mute · Build 20260824150000-avc-genesis · AVC loadChain */
(function (G) {
  'use strict';
  var BUILD = '20260824150000-avc-genesis';
  if (G.__snMuteAvcGenesis20260824150000) return;
  G.__snMuteAvcGenesis20260824150000 = 1;
  function loadScript(src, attr) {
    try {
      if (document.querySelector('script[src*="' + src.split('/').pop().split('?')[0] + '"]')) return;
      var s = document.createElement('script');
      s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(BUILD);
      s.async = false;
      if (attr) s.setAttribute(attr, '1');
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }
  function loadChain() {
    loadScript('/js/spacenet/chrome-place-earth-20260824133000.js', 'data-sn-place-earth');
    loadScript('/js/spacenet/chrome-nairobi-ladder-20260824133000.js');
    loadScript('/js/spacenet/chrome-research-stay-20260824133000.js');
    loadScript('/js/spacenet/chrome-guest-pizza-land-20260824140000.js');
    loadScript('/js/spacenet/chrome-guest-laptop-hunt-20260824144000.js');
    loadScript('/js/spacenet/chrome-ai-listen-20260824140000.js');
    loadScript('/js/spacenet/chrome-hold-pay-20260824140000.js');
    loadScript('/js/spacenet/chrome-avc-ledger-20260824150000.js', 'data-sn-avc-ledger');
    loadScript('/js/spacenet/chrome-cli-answer-20260824133000.js');
    try {
      var m = document.querySelector('meta[name="astranov-build"]');
      if (m) m.setAttribute('content', BUILD);
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadChain);
  else loadChain();
  setTimeout(loadChain, 0);
  setTimeout(loadChain, 500);
  setTimeout(loadChain, 1500);
  G.SNChromeMute = { build: BUILD, loadChain: loadChain };
})(typeof window !== 'undefined' ? window : globalThis);
