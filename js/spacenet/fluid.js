/**
 * SNFluid — live wire.
 * I change the running app by writing a pulse. No house rebuild.
 * GitHub / Vercel stay the backup shell.
 */
(function (global) {
  'use strict';

  var F = {
    on: true,
    rev: 0,
    note: '',
    src: '',
    at: '',
    timer: 0,
    busy: false,
    lastErr: '',
  };

  var SOURCES = [
    '/fluid/live.json',
    'https://raw.githubusercontent.com/notisastranov/astranov.eu/main/fluid/live.json',
  ];

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (_) {}
  }

  function preview(m) {
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview(m);
    } catch (_) {}
  }

  function apply(pack, src, force) {
    if (!pack || typeof pack !== 'object') return false;
    var rev = Number(pack.rev || 0);
    if (!force && F.rev && rev <= F.rev) return false;
    if (pack.css != null) {
      var el = document.getElementById('sn-fluid-css');
      if (!el) {
        el = document.createElement('style');
        el.id = 'sn-fluid-css';
        document.head.appendChild(el);
      }
      el.textContent = String(pack.css || '');
    }
    if (pack.js && String(pack.js).trim()) {
      try {
        var fn = new Function(
          'SNFluid',
          'SNCli',
          'SNHelper',
          'SNGlobe',
          'SNAi',
          'SNOmma',
          String(pack.js)
        );
        fn(
          global.SNFluid,
          global.SNCli,
          global.SNHelper,
          global.SNGlobe,
          global.SNAi,
          global.SNOmma
        );
      } catch (e) {
        F.lastErr = e && e.message ? e.message : String(e);
        log('Live pulse failed. I kept the last good one.', 'err');
        return false;
      }
    }
    F.rev = rev;
    F.note = String(pack.note || '');
    F.src = src || '';
    F.at = pack.at || new Date().toISOString();
    F.lastErr = '';
    try {
      localStorage.setItem('sn:fluid-rev', String(F.rev));
      localStorage.setItem('sn:fluid-note', F.note);
    } catch (_) {}
    return true;
  }

  async function pullOne(url) {
    var r = await fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), {
      cache: 'no-store',
      mode: 'cors',
    });
    if (!r.ok) throw new Error('no pulse');
    return r.json();
  }

  async function pull(opts) {
    opts = opts || {};
    if (F.busy) return F;
    F.busy = true;
    var i;
    var lastErr = '';
    for (i = 0; i < SOURCES.length; i++) {
      try {
        var pack = await pullOne(SOURCES[i]);
        var changed = apply(pack, SOURCES[i], !!opts.force);
        F.busy = false;
        if (changed && !opts.quiet) {
          log('Live pulse ' + F.rev + (F.note ? ' · ' + F.note : ''), 'ok');
          preview('live · pulse ' + F.rev);
        }
        return { ok: true, changed: changed, rev: F.rev, note: F.note };
      } catch (e) {
        lastErr = e && e.message ? e.message : String(e);
      }
    }
    F.busy = false;
    F.lastErr = lastErr;
    if (opts.speak) log('Live wire is quiet. I will keep listening.', 'dim');
    return { ok: false, err: lastErr };
  }

  function start() {
    F.on = true;
    if (F.timer) return;
    F.timer = setInterval(function () {
      if (!F.on) return;
      if (document.hidden) return;
      pull({ quiet: true });
    }, 4000);
  }

  function stop() {
    F.on = false;
    if (F.timer) {
      try {
        clearInterval(F.timer);
      } catch (_) {}
      F.timer = 0;
    }
  }

  function status() {
    return {
      on: F.on,
      rev: F.rev,
      note: F.note,
      at: F.at,
      listening: !!F.timer,
    };
  }

  function speakStatus() {
    if (!F.on) {
      log('Live wire is off.', 'dim');
      preview('live off');
      return;
    }
    if (F.rev) {
      log('Live wire on. Pulse ' + F.rev + (F.note ? ' · ' + F.note : '') + '.', 'ok');
    } else {
      log('Live wire on. Waiting for the first pulse.', 'ok');
    }
    preview(F.rev ? 'live · pulse ' + F.rev : 'live · listening');
  }

  function init() {
    try {
      F.rev = Number(localStorage.getItem('sn:fluid-rev') || 0) || 0;
      F.note = localStorage.getItem('sn:fluid-note') || '';
    } catch (_) {}
    start();
    pull({ quiet: true });
    return true;
  }

  global.SNFluid = {
    init: init,
    pull: pull,
    apply: apply,
    start: start,
    stop: stop,
    status: status,
    speakStatus: speakStatus,
  };
})(typeof window !== 'undefined' ? window : globalThis);
