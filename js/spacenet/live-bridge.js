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
  var pollMs = 3000;

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
      if (op === 'sim_task' || op === 'sim' || op === 'train') {
        log('Bridge · sim/train removed · use first_loop / cli', 'dim');
      } else if (op === 'first_loop' || op === 'first_delivery' || op === 'first_order') {
        if (global.SNMarket && SNMarket.runFirstLoop) {
          void SNMarket.runFirstLoop({ skipLocate: !!cmd.skipLocate });
        } else log('Bridge · market not loaded yet', 'err');
      } else if (op === 'donate_on' && global.SNResources) {
        SNResources.setDonate(true);
      } else if (op === 'donate_off' && global.SNResources) {
        SNResources.setDonate(false);
      } else if (op === 'mine_on' && global.SNResources) {
        SNResources.setMining(true);
      } else if (op === 'mine_off' && global.SNResources) {
        SNResources.setMining(false);
      } else if (op === 'status' || op === 'monitor') {
        var st = {
          build: (document.querySelector('meta[name="astranov-build"]') || {}).content || '',
          mine: global.SNResources && SNResources.report && SNResources.report(),
          market: global.SNMarket && SNMarket.coachStatus && SNMarket.coachStatus(),
          shellMs: performance.now(),
        };
        log('Monitor · ' + JSON.stringify(st).slice(0, 220), 'dim');
        console.info('[Astranov monitor]', st);
      } else if (op === 'task_fit' && global.SNTaskBoard && SNTaskBoard.listCompatibleOnCli) {
        SNTaskBoard.listCompatibleOnCli();
      } else if (op === 'cli' && global.SNCli && SNCli.run) {
        void SNCli.run(String(cmd.text || cmd.cmd || ''));
      } else if (op === 'ai' && global.SNAi && SNAi.ask) {
        void SNAi.ask(String(cmd.text || cmd.msg || ''));
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
      } else if (op === 'locate' && global.SNCli && SNCli.run) {
        void SNCli.run('locate');
      } else if (op === 'me' || op === 'user') {
        if (global.SNField && SNField.openLoggedInUser) SNField.openLoggedInUser();
        else if (global.SNCli && SNCli.run) void SNCli.run('me');
      } else if (op === 'reload' || op === 'hard_reload') {
        try {
          if (global.SNHome && SNHome.hardReload) SNHome.hardReload();
          else location.reload();
        } catch (_) {
          location.reload();
        }
      } else if (op === 'order' || op === 'pizza') {
        if (global.SNCli && SNCli.run)
          void SNCli.run(String(cmd.text || 'order me a pizza'));
      } else if (op === 'timeline' && global.SNTimeline) {
        if (cmd.offset != null) SNTimeline.setOffset(cmd.offset, { freeze: !!cmd.freeze });
        else if (cmd.present) SNTimeline.present();
      } else if (op === 'owner_note' || op === 'note' || op === 'fix') {
        var note = String(cmd.text || cmd.msg || '').slice(0, 500);
        try {
          var bag = JSON.parse(localStorage.getItem('sn:owner-notes-v1') || '[]');
          if (!Array.isArray(bag)) bag = [];
          bag.unshift({ t: Date.now(), text: note });
          localStorage.setItem('sn:owner-notes-v1', JSON.stringify(bag.slice(0, 40)));
        } catch (_) {}
        log('Owner note saved · ' + note.slice(0, 80), 'ok');
        if (global.SNCli && SNCli.preview) SNCli.preview('Note saved for agent');
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

  setTimeout(start, 1500);

  function ownerNote(text) {
    var note = String(text || '').trim().slice(0, 500);
    if (!note) return Promise.resolve({ ok: false, error: 'empty' });
    applyCmd({ op: 'owner_note', text: note });
    // Publish so remote agent / other sessions can pick it up
    return publish([{ op: 'owner_note', text: note, from: 'cli' }]).catch(function (e) {
      log('Bridge publish soft-fail · note kept local · ' + (e && e.message ? e.message : e), 'dim');
      return { ok: true, local: true };
    });
  }

  global.SNLiveBridge = {
    start: start,
    stop: stop,
    poll: poll,
    inject: inject,
    publish: publish,
    applyCmd: applyCmd,
    ownerNote: ownerNote,
    bridgeUrl: bridgeUrl,
    get lastSeq() {
      return lastSeq;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
