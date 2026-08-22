/* Astranov chrome-fix loader · 20260822153400-no-coach
 * Loads chrome-fix-body. Placeholders: owner law. Never restore coach dump.
 */
(function (global) {
  'use strict';
  var BUILD = '20260822154400-star-hud';
  var TOP_PH = 'Heads up display command line interface';
  var BOT_PH = 'command line interface';
  function enforceHud() {
    try {
      var top = document.getElementById('stc-cmd-in');
      var bot = document.getElementById('cli-in');
      if (top) {
        top.placeholder = TOP_PH;
        top.setAttribute('aria-label', TOP_PH);
      }
      if (bot) {
        bot.placeholder = BOT_PH;
        bot.setAttribute('aria-label', BOT_PH);
      }
      var coach = document.getElementById('cli-coach');
      if (coach && coach.parentNode) coach.parentNode.removeChild(coach);
      var preview = document.getElementById('cli-preview');
      if (preview) {
        preview.textContent = '';
        preview.style.display = 'none';
      }
      var log = document.getElementById('cli-log');
      if (log) {
        if (/SPACEX BOT|owner note|AI art missing|USAGE SHIP|ASTRANOV LAW|Command the HUD|type what|Talk ·|Locate ·/i.test(log.textContent || '')) {
          var bad = log.querySelectorAll('.sn-log-line, .cli-feed-item, div, span');
          for (var i = 0; i < bad.length; i++) {
            if (/SPACEX BOT|AI art missing|owner note|USAGE SHIP|ASTRANOV LAW|Command the HUD|type what|Talk ·|Locate ·/i.test(bad[i].textContent || '')) {
              try { bad[i].remove(); } catch (_) {}
            }
          }
        }
        if (!String(log.textContent || '').trim()) {
          log.innerHTML = '';
          log.style.setProperty('display', 'none', 'important');
          log.style.setProperty('height', '0', 'important');
          log.style.setProperty('min-height', '0', 'important');
          log.style.setProperty('padding', '0', 'important');
        }
      }
      var panel = document.getElementById('panel');
      if (panel && log && !String(log.textContent || '').trim()) {
        panel.style.setProperty('grid-template-rows', '10px 44px 0 auto', 'important');
      }
    } catch (_) {}
  }
  function load(src, cb) {
    if (document.querySelector('script[data-sn-chrome-fix-body]')) {
      if (cb) cb();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.setAttribute('data-sn-chrome-fix-body', '1');
    s.onload = function () { if (cb) cb(); };
    s.onerror = function () {
      enforceHud();
      if (cb) cb();
    };
    document.head.appendChild(s);
  }
  function loadFace() {
    if (document.querySelector('script[data-sn-rib-face]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-rib-face.js?v=' + BUILD;
    s.setAttribute('data-sn-rib-face', '1');
    document.head.appendChild(s);
  }
  function loadOps() {
    if (document.querySelector('script[data-sn-p0-ops]')) return;
    var s = document.createElement('script');
    s.src = '/js/spacenet/chrome-p0-ops.js?v=' + BUILD;
    s.setAttribute('data-sn-p0-ops', '1');
    document.head.appendChild(s);
  }
  function afterGood() {
    loadFace();
    loadOps();
    enforceHud();
  }
  load('/js/spacenet/chrome-fix-body.js?v=' + BUILD, afterGood);
  setTimeout(afterGood, 1200);
  setTimeout(loadOps, 2500);
  setInterval(enforceHud, 3500);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceHud);
  } else {
    enforceHud();
  }
  global.SNChromeFixLoader = { build: BUILD, enforceHud: enforceHud };
})(typeof window !== 'undefined' ? window : globalThis);
