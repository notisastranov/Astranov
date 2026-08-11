/* Astranov — Silver helper · Rive runtime
 * Build: 20260811213000-silver-rive
 * Real Rive state-machine character · top-right · standby quiet · tap activates
 */
(function (global) {
  'use strict';
  var BUILD = '20260811213000-silver-rive';
  var MODE = 'standby';
  var riveInst = null;
  var canvas = null;
  var hit = null;
  var ready = false;
  var loading = false;
  var RIV_SRC =
    'https://public.rive.app/community/runtime-files/3364-7072-cute-robot.riv';
  var RIV_CDN = 'https://unpkg.com/@rive-app/canvas@2.21.6/rive.js';

  function log(msg, kind) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'ok');
    } catch (_) {}
  }

  function topChromeBottom() {
    try {
      var el =
        document.getElementById('sn-topchrome') ||
        document.getElementById('sn-topchrome-panel');
      if (el) return Math.max(52, Math.round(el.getBoundingClientRect().bottom + 6));
    } catch (_) {}
    return 68;
  }

  function place() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var size = Math.min(96, Math.max(64, Math.round(w * 0.1)));
    var x = w - size - 12;
    var y = topChromeBottom() + 8;
    y = Math.min(y, Math.round(h * 0.18));
    if (canvas) {
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
      canvas.style.left = x + 'px';
      canvas.style.top = y + 'px';
      canvas.width = size * (window.devicePixelRatio || 1);
      canvas.height = size * (window.devicePixelRatio || 1);
      try {
        if (riveInst && riveInst.resizeDrawingSurfaceToCanvas) {
          riveInst.resizeDrawingSurfaceToCanvas();
        }
      } catch (_) {}
    }
    if (hit) {
      hit.style.width = size + 'px';
      hit.style.height = size + 'px';
      hit.style.left = x + 'px';
      hit.style.top = y + 'px';
    }
  }

  function killLegacy() {
    try {
      ['sn-helper-fx', 'sn-silver-calm', 'sn-helper-canvas'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (id === 'sn-helper-canvas') {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else if (el.parentNode) el.parentNode.removeChild(el);
      });
    } catch (_) {}
  }

  function ensureCanvas() {
    if (canvas && document.body.contains(canvas)) return canvas;
    canvas = document.createElement('canvas');
    canvas.id = 'sn-silver-rive';
    canvas.style.cssText =
      'position:fixed;z-index:98;pointer-events:none;border:none;background:transparent;';
    document.body.appendChild(canvas);
    return canvas;
  }

  function ensureHit() {
    if (hit && document.body.contains(hit)) return hit;
    hit = document.createElement('button');
    hit.id = 'sn-helper-hit';
    hit.type = 'button';
    hit.title = 'Silver helper · Rive · tap to activate';
    hit.setAttribute('aria-label', 'Silver helper');
    hit.style.cssText =
      'position:fixed;z-index:130;border:none;padding:0;background:transparent;' +
      'cursor:pointer;border-radius:12px;outline:none;-webkit-tap-highlight-color:transparent;';
    document.body.appendChild(hit);
    hit.addEventListener('click', function (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (_) {}
      activate();
    });
    return hit;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (global.rive && global.rive.Rive) {
        resolve(global.rive);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(global.rive || global.Rive); };
      s.onerror = function () { reject(new Error('rive script fail')); };
      document.head.appendChild(s);
    });
  }

  function fireInput(name, value) {
    if (!riveInst) return;
    try {
      var inputs = riveInst.stateMachineInputs ? riveInst.stateMachineInputs() : null;
      var sms = ['State Machine 1', 'State Machine', 'StateMachine', 'SM', 'Main'];
      if (!inputs || !inputs.length) {
        for (var i = 0; i < sms.length; i++) {
          try {
            inputs = riveInst.stateMachineInputs(sms[i]);
            if (inputs && inputs.length) break;
          } catch (_) {}
        }
      }
      if (!inputs) return;
      for (var j = 0; j < inputs.length; j++) {
        var inp = inputs[j];
        if (!inp || !inp.name) continue;
        var n = String(inp.name).toLowerCase();
        if (name && n.indexOf(String(name).toLowerCase()) >= 0) {
          if (typeof inp.value === 'boolean') inp.value = !!value;
          else if (typeof inp.fire === 'function') inp.fire();
          else if (typeof value === 'number') inp.value = value;
          return true;
        }
      }
      if (value === true) {
        for (var k = 0; k < inputs.length; k++) {
          if (inputs[k] && typeof inputs[k].fire === 'function') {
            inputs[k].fire();
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  }

  function startRive() {
    if (loading || riveInst) return;
    loading = true;
    killLegacy();
    ensureCanvas();
    ensureHit();
    place();

    loadScript(RIV_CDN)
      .then(function (riveNS) {
        var RiveCtor = (riveNS && riveNS.Rive) || (global.rive && global.rive.Rive) || global.Rive;
        if (!RiveCtor) throw new Error('no Rive ctor');

        riveInst = new RiveCtor({
          src: RIV_SRC,
          canvas: canvas,
          autoplay: true,
          onLoad: function () {
            try { riveInst.resizeDrawingSurfaceToCanvas(); } catch (_) {}
            place();
            ready = true;
            loading = false;
            log('Silver · Rive online · standby · tap to activate', 'ok');
          },
          onLoadError: function (err) {
            loading = false;
            log('Rive load error · check network', 'dim');
            console.warn('[SN Rive]', err);
          },
        });
      })
      .catch(function (e) {
        loading = false;
        log('Rive script failed · ' + (e && e.message ? e.message : e), 'dim');
      });
  }

  function activate() {
    MODE = 'active';
    fireInput('fly', true);
    fireInput('hover', true);
    fireInput('active', true);
    fireInput('click', true);
    fireInput('tap', true);
    fireInput('play', true);
    log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SILVER (Rive) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', 'dim');
    log('Helper active \u00b7 simulation game', 'ok');
    log('  simulate pizza order', 'ok');
    log('  simulate delivery', 'ok');
    log('  simulate payment', 'ok');
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview('Silver Rive active');
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        panel.classList.add('mid');
      }
    } catch (_) {}
    setTimeout(function () {
      if (MODE === 'active') {
        MODE = 'standby';
        fireInput('fly', false);
        fireInput('hover', false);
        fireInput('active', false);
        log('Silver \u00b7 standby', 'dim');
      }
    }, 25000);
  }

  function boot() { startRive(); }

  window.addEventListener('resize', function () { place(); }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 2000);
  setTimeout(boot, 5000);

  global.SNChromeHelper = {
    build: BUILD,
    activate: activate,
    mode: function () { return MODE; },
    rive: function () { return riveInst; },
    setSrc: function (url) {
      RIV_SRC = url;
      try { if (riveInst && riveInst.cleanup) riveInst.cleanup(); } catch (_) {}
      riveInst = null;
      loading = false;
      startRive();
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
