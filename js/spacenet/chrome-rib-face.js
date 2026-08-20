/* Astranov chrome-rib-face · Build 20260820184500
 * P0: signed-in profile face MUST stay a 28px circle on the ribbon.
 * The ASTRANOV logo-as-avatar was expanding into a huge square over buttons.
 * Also hide guest coach when signed in. No other UI redesign.
 */
(function (global) {
  'use strict';
  var BUILD = '20260820184500-rib-face-clamp';

  function injectCss() {
    var id = 'sn-chrome-rib-face-css';
    var old = document.getElementById(id);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var css = document.createElement('style');
    css.id = id;
    css.textContent = [
      /* Ribbon buttons stay fixed circles */
      '#sn-task-ribbon .sn-rib-btn {',
      '  width: 36px !important; height: 36px !important;',
      '  min-width: 36px !important; min-height: 36px !important;',
      '  max-width: 36px !important; max-height: 36px !important;',
      '  overflow: hidden !important; border-radius: 50% !important;',
      '  flex: 0 0 36px !important; padding: 0 !important;',
      '  box-sizing: border-box !important;',
      '}',
      /* User button never grows */
      '#sn-rib-user, #sn-task-ribbon #sn-rib-user, #sn-task-ribbon button[data-act="user"] {',
      '  width: 36px !important; height: 36px !important;',
      '  min-width: 36px !important; min-height: 36px !important;',
      '  max-width: 36px !important; max-height: 36px !important;',
      '  overflow: hidden !important; border-radius: 50% !important;',
      '  flex: 0 0 36px !important; position: relative !important;',
      '}',
      /* Icon slot */
      '#sn-task-ribbon .sn-rib-icon {',
      '  display: flex !important; align-items: center !important; justify-content: center !important;',
      '  width: 28px !important; height: 28px !important;',
      '  max-width: 28px !important; max-height: 28px !important;',
      '  overflow: hidden !important; border-radius: 50% !important;',
      '  flex: 0 0 28px !important; margin: 0 auto !important;',
      '}',
      /* Face image — hard clamp */
      '#sn-task-ribbon .sn-rib-face,',
      '#sn-task-ribbon .sn-rib-icon img,',
      '#sn-rib-user img,',
      '#sn-task-ribbon button[data-act="user"] img,',
      '#sn-task-ribbon img {',
      '  width: 28px !important; height: 28px !important;',
      '  max-width: 28px !important; max-height: 28px !important;',
      '  min-width: 28px !important; min-height: 28px !important;',
      '  border-radius: 50% !important; object-fit: cover !important;',
      '  display: block !important; margin: 0 auto !important; padding: 0 !important;',
      '  position: static !important; left: auto !important; top: auto !important;',
      '  transform: none !important;',
      '}',
      /* Kill any big logo overlays that sneak onto the ribbon */
      '#sn-task-ribbon .astranov-logo-overlay,',
      '#sn-task-ribbon #astranov-logo,',
      '#sn-task-ribbon #sn-big-logo,',
      '#astranov-logo, #sn-big-logo, .astranov-logo-overlay {',
      '  display: none !important; visibility: hidden !important;',
      '  width: 0 !important; height: 0 !important; pointer-events: none !important;',
      '}',
      /* Signed-in: hide coach strip completely */
      'body.sn-in #cli-coach,',
      'body.sn-in #cli-coach * {',
      '  display: none !important; height: 0 !important; max-height: 0 !important;',
      '  padding: 0 !important; margin: 0 !important; overflow: hidden !important;',
      '  visibility: hidden !important; opacity: 0 !important;',
      '}',
      /* Ribbon height stays compact */
      '#sn-task-ribbon {',
      '  min-height: 48px !important; height: 48px !important;',
      '  max-height: 48px !important; overflow: visible !important;',
      '  align-items: center !important;',
      '}',
    ].join('\n');
    document.head.appendChild(css);
  }

  function clampFaceDom() {
    try {
      var bar = document.getElementById('sn-task-ribbon');
      if (!bar) return;
      // Force every ribbon button to 36px circle
      bar.querySelectorAll('.sn-rib-btn, button[data-act]').forEach(function (btn) {
        btn.style.setProperty('width', '36px', 'important');
        btn.style.setProperty('height', '36px', 'important');
        btn.style.setProperty('min-width', '36px', 'important');
        btn.style.setProperty('min-height', '36px', 'important');
        btn.style.setProperty('max-width', '36px', 'important');
        btn.style.setProperty('max-height', '36px', 'important');
        btn.style.setProperty('overflow', 'hidden', 'important');
        btn.style.setProperty('border-radius', '50%', 'important');
        btn.style.setProperty('flex', '0 0 36px', 'important');
      });
      // Force every image inside ribbon to 28px circle
      bar.querySelectorAll('img').forEach(function (img) {
        img.classList.add('sn-rib-face');
        img.style.setProperty('width', '28px', 'important');
        img.style.setProperty('height', '28px', 'important');
        img.style.setProperty('max-width', '28px', 'important');
        img.style.setProperty('max-height', '28px', 'important');
        img.style.setProperty('min-width', '28px', 'important');
        img.style.setProperty('min-height', '28px', 'important');
        img.style.setProperty('border-radius', '50%', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.setProperty('display', 'block', 'important');
        img.style.setProperty('margin', '0 auto', 'important');
        img.style.setProperty('position', 'static', 'important');
        img.style.setProperty('transform', 'none', 'important');
      });
      // User button specifically
      var user = document.getElementById('sn-rib-user') ||
        bar.querySelector('[data-act="user"]');
      if (user) {
        user.style.setProperty('width', '36px', 'important');
        user.style.setProperty('height', '36px', 'important');
        user.style.setProperty('overflow', 'hidden', 'important');
        user.style.setProperty('border-radius', '50%', 'important');
      }
    } catch (_) {}
  }

  function hideCoachIfSignedIn() {
    try {
      var signed = !!(global.SNAuth && SNAuth.user);
      document.body.classList.toggle('sn-in', !!signed);
      document.body.classList.toggle('sn-guest', !signed);
      if (signed) {
        var coach = document.getElementById('cli-coach');
        if (coach) {
          coach.style.setProperty('display', 'none', 'important');
          coach.style.setProperty('height', '0', 'important');
          coach.style.setProperty('padding', '0', 'important');
          coach.innerHTML = '';
        }
      }
    } catch (_) {}
  }

  function boot() {
    injectCss();
    clampFaceDom();
    hideCoachIfSignedIn();
    setTimeout(function () {
      injectCss();
      clampFaceDom();
      hideCoachIfSignedIn();
    }, 400);
    setTimeout(function () {
      injectCss();
      clampFaceDom();
      hideCoachIfSignedIn();
    }, 1500);
    setTimeout(function () {
      clampFaceDom();
      hideCoachIfSignedIn();
    }, 3500);
    // Keep clamping after ribbon repaints
    try {
      setInterval(function () {
        clampFaceDom();
        hideCoachIfSignedIn();
      }, 2500);
    } catch (_) {}
  }

  // Hook paintRibbon if available so we clamp right after face is written
  function hookPaint() {
    try {
      if (global.SNField && typeof SNField.paintRibbon === 'function' && !SNField._ribFaceHooked) {
        var orig = SNField.paintRibbon.bind(SNField);
        SNField.paintRibbon = function () {
          var r = orig.apply(this, arguments);
          setTimeout(clampFaceDom, 0);
          setTimeout(clampFaceDom, 50);
          hideCoachIfSignedIn();
          return r;
        };
        SNField._ribFaceHooked = true;
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      boot();
      hookPaint();
    });
  } else {
    boot();
    hookPaint();
  }
  setTimeout(hookPaint, 2000);

  global.SNChromeRibFace = { build: BUILD, clamp: clampFaceDom };
})(typeof window !== 'undefined' ? window : globalThis);
