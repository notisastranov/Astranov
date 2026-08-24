/* live-bridge P0 20260824174000-chrome-alive · silence session_heartbeat spam */
(function (global) {
  'use strict';
  var lastSeq = 0;
  var timer = null;
  var POLL_MS = 2800;

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (e) {}
  }

  function bridgeUrl() {
    var base = (global.SN_CONFIG && SN_CONFIG.sbUrl) || global.SB_URL || '';
    return base.replace(/\/$/, '') + '/storage/v1/object/public/debug-pub/live-bridge.json';
  }

  function isGuest() {
    try {
      return !(global.SNAuth && SNAuth.user);
    } catch (_) {
      return true;
    }
  }

  function isInternalNote(cmd) {
    var t = String((cmd && (cmd.text || cmd.msg)) || (cmd && cmd.op) || '');
    if (/USAGE SHIP|ASTRANOV LAW|Push main|openHandoffs|js\/spacenet|\[SOS\]/i.test(t)) return true;
    var from = String((cmd && cmd.from) || '');
    if (/usage-ship|scenarios|prefs|guardian/i.test(from)) return true;
    return false;
  }

  function applyCmd(cmd) {
    if (!cmd || !cmd.op) return;
    var op = String(cmd.op).toLowerCase();
    /* P0 20260824174000: never spam CLI with heartbeats / hello / ping */
    if (op === 'session_heartbeat' || op === 'heartbeat' || op === 'hello' ||
        op === 'session_hello' || op === 'ping' || op === 'pong' || op === 'keepalive') {
      return;
    }
    if (op === 'owner_note' || op === 'note' || op === 'fix' || op === 'sos') {
      if (isGuest() || isInternalNote(cmd) || op === 'sos') return;
    }
    if (!isInternalNote(cmd))
      log('Bridge IN · ' + op + (cmd.ms ? ' ' + cmd.ms : ''), 'cmd');
    try {
      if (op === 'cli' && global.SNCli && SNCli.run) {
        void SNCli.run(String(cmd.text || cmd.cmd || ''));
      } else if (op === 'reload' || op === 'hard_reload') {
        try {
          if (global.SNHome && SNHome.hardReload) SNHome.hardReload();
          else location.reload();
        } catch (_) {
          location.reload();
        }
      } else if (op === 'locate' && global.SNCli && SNCli.run) {
        void SNCli.run('locate');
      } else if (op === 'order' || op === 'pizza') {
        if (global.SNCli && SNCli.run)
          void SNCli.run(String(cmd.text || 'order me a pizza'));
      } else if (op === 'owner_note' || op === 'note' || op === 'fix') {
        var note = String(cmd.text || cmd.msg || '').slice(0, 500);
        try {
          var bag = JSON.parse(localStorage.getItem('sn:owner-notes-v1') || '[]');
          if (!Array.isArray(bag)) bag = [];
          bag.unshift({ t: Date.now(), text: note });
          localStorage.setItem('sn:owner-notes-v1', JSON.stringify(bag.slice(0, 40)));
        } catch (_) {}
        log('Owner note saved · ' + note.slice(0, 80), 'ok');
      } else if (op === 'session_heartbeat' || op === 'heartbeat' || op === 'hello' ||
                 op === 'session_hello' || op === 'ping' || op === 'pong') {
        /* silent */
      } else {
        /* unknown ops stay quiet unless clearly actionable */
      }
    } catch (e) {
      log('Bridge fail · ' + (e.message || e), 'err');
    }
  }

  function applyPayload(j) {
    if (!j || typeof j !== 'object') return;
    var seq = Number(j.seq) || 0;
    if (seq && seq <= lastSeq) return;
    if (seq) lastSeq = seq;
    var cmds = j.cmds || j.commands || [];
    if (!Array.isArray(cmds) && j.op) cmds = [j];
    var i;
    for (i = 0; i < cmds.length; i++) applyCmd(cmds[i]);
  }

  async function poll() {
    try {
      var url = bridgeUrl() + '?t=' + Date.now();
      var r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return;
      var j = await r.json();
      applyPayload(j);
    } catch (e) {
      /* file missing until first write — ok */
    }
  }

  function start() {
    if (timer) return;
    poll();
    timer = setInterval(poll, POLL_MS);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  global.SNLiveBridge = { start: start, stop: stop, poll: poll, applyCmd: applyCmd };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(start, 1200);
    });
  } else {
    setTimeout(start, 1200);
  }
})(typeof window !== 'undefined' ? window : globalThis);
