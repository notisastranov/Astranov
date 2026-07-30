/**
 * SNLiveBridge — runtime control without redeploy
 *
 * Browser polls public JSON on Supabase storage:
 *   {sbUrl}/storage/v1/object/public/debug-pub/live-bridge.json
 *
 * Agent / superuser writes via edge debug-write:
 *   POST /functions/v1/debug-write
 *   { "kind": "live_bridge", "seq": 1, "cmds": [ { "op": "sim_speed", "ms": 5500 } ] }
 *
 * Ops: sim_start|sim_stop|sim_speed|sim_burst|cli|credit_fee|super_show|notice
 */
(function (global) {
  'use strict';

  var lastSeq = 0;
  var timer = null;
  var pollMs = 5000;

  function log(m, c) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(m, c || 'dim');
    } catch (e) {}
  }

  function bridgeUrl() {
    var base = (global.SN_CONFIG && SN_CONFIG.sbUrl) || global.SB_URL || '';
    return base.replace(/\/$/, '') + '/storage/v1/object/public/debug-pub/live-bridge.json';
  }

  function applyCmd(cmd) {
    if (!cmd || !cmd.op) return;
    var op = String(cmd.op).toLowerCase();
    log('Bridge IN · ' + op + (cmd.ms ? ' ' + cmd.ms : '') + (cmd.text ? ' ' + cmd.text : ''), 'cmd');
    try {
      if (op === 'sim_start' && global.SNSim33) {
        SNSim33.start({ ms: cmd.ms || 5500 });
      } else if (op === 'sim_stop' && global.SNSim33) {
        SNSim33.stop();
      } else if (op === 'sim_speed' && global.SNSim33 && SNSim33.setSpeed) {
        SNSim33.setSpeed(cmd.ms || 5500);
      } else if (op === 'sim_burst' && global.SNSim33) {
        void SNSim33.burst(cmd.n || 5);
      } else if (op === 'cli' && global.SNCli && SNCli.run) {
        void SNCli.run(String(cmd.text || cmd.cmd || ''));
      } else if (op === 'credit_fee' && global.SNCurrency && SNCurrency.notePlatformFee) {
        SNCurrency.notePlatformFee(Number(cmd.amount) || 0.01, { why: 'bridge' });
      } else if (op === 'take_fee' && global.SNCurrency && SNCurrency.takePlatformFeeFrom) {
        SNCurrency.takePlatformFeeFrom(Number(cmd.gross) || 10, 'bridge');
      } else if (op === 'super_show' && global.SNSuper) {
        SNSuper.show();
      } else if (op === 'notice' && global.SNField && SNField.setNotice) {
        SNField.setNotice(String(cmd.text || '').slice(0, 48));
      } else if (op === 'preview' && global.SNCli && SNCli.preview) {
        SNCli.preview(String(cmd.text || ''));
      } else {
        log('Bridge · unknown op ' + op, 'err');
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
    void poll();
    timer = setInterval(function () {
      void poll();
    }, pollMs);
    log('Live bridge · polling for remote cmds', 'dim');
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  /** Local inject (console / agent shell eval in page) */
  function inject(cmds, seq) {
    applyPayload({ seq: seq || Date.now(), cmds: Array.isArray(cmds) ? cmds : [cmds] });
  }

  /**
   * Publish cmds via debug-write (works if function is deployed with service role).
   * Returns fetch promise.
   */
  function publish(cmds, seq) {
    var cfg = global.SN_CONFIG || {};
    var url = (cfg.sbUrl || global.SB_URL || '').replace(/\/$/, '') + '/functions/v1/debug-write';
    var body = {
      kind: 'live_bridge',
      seq: seq || Date.now(),
      cmds: Array.isArray(cmds) ? cmds : [cmds],
      from: 'client',
      at: new Date().toISOString(),
    };
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.sbKey || global.SB_KEY || '',
        Authorization: 'Bearer ' + (cfg.sbKey || global.SB_KEY || ''),
      },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().catch(function () {
        return { ok: r.ok };
      });
    });
  }

  setTimeout(start, 4000);

  global.SNLiveBridge = {
    start: start,
    stop: stop,
    poll: poll,
    inject: inject,
    publish: publish,
    applyCmd: applyCmd,
    bridgeUrl: bridgeUrl,
    get lastSeq() {
      return lastSeq;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
