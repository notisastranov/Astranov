/* SNUsage — product usage + handoff bridge (first-loop → midnight ship)
 * Local-first events. CLI: usage · handoff · usage export
 * Midnight Greek ship reads export / handoff queue (SPECS P4-U).
 */
(function (global) {
  'use strict';

  var KEY = 'sn:usage-v1';
  var HAND = 'sn:handoff-v1';
  var FLAGS = 'sn:usage-flags-v1';
  var MAX = 400;

  var U = { events: [], handoff: [], flags: {} };

  function load() {
    try {
      var e = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(e)) U.events = e.slice(-MAX);
    } catch (_) {
      U.events = [];
    }
    try {
      var h = JSON.parse(localStorage.getItem(HAND) || '[]');
      if (Array.isArray(h)) U.handoff = h.slice(-80);
    } catch (_) {
      U.handoff = [];
    }
    try {
      U.flags = JSON.parse(localStorage.getItem(FLAGS) || '{}') || {};
    } catch (_) {
      U.flags = {};
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(U.events.slice(-MAX)));
      localStorage.setItem(HAND, JSON.stringify(U.handoff.slice(-80)));
      localStorage.setItem(FLAGS, JSON.stringify(U.flags || {}));
    } catch (_) {}
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /** Athens calendar date YYYY-MM-DD for midnight ship buckets */
  function athensDate(d) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Athens',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d || new Date());
    } catch (_) {
      return (d || new Date()).toISOString().slice(0, 10);
    }
  }

  function track(name, payload) {
    var row = {
      t: Date.now(),
      iso: nowIso(),
      athens: athensDate(),
      name: String(name || 'event').slice(0, 80),
      payload: payload && typeof payload === 'object' ? payload : { v: payload },
    };
    U.events.push(row);
    if (U.events.length > MAX) U.events.splice(0, U.events.length - MAX);
    save();
    return row;
  }

  function flag(key, val) {
    U.flags[key] = val == null ? true : val;
    save();
    return U.flags;
  }

  function getFlags() {
    return Object.assign({}, U.flags);
  }

  /** Queue a code/product request for the coding agent (bridge from AI chat) */
  function handoff(note, meta) {
    var row = {
      t: Date.now(),
      iso: nowIso(),
      athens: athensDate(),
      note: String(note || '').slice(0, 2000),
      meta: meta || {},
      status: 'open',
    };
    U.handoff.unshift(row);
    U.handoff = U.handoff.slice(0, 80);
    save();
    track('handoff', { note: row.note.slice(0, 120) });
    return row;
  }

  function openHandoffs() {
    return U.handoff.filter(function (h) {
      return h.status === 'open';
    });
  }

  function markHandoff(i, status) {
    if (U.handoff[i]) {
      U.handoff[i].status = status || 'done';
      save();
    }
  }

  function summary(days) {
    days = days || 7;
    var cut = Date.now() - days * 864e5;
    var recent = U.events.filter(function (e) {
      return e.t >= cut;
    });
    var counts = {};
    recent.forEach(function (e) {
      counts[e.name] = (counts[e.name] || 0) + 1;
    });
    var top = Object.keys(counts)
      .map(function (k) {
        return { name: k, n: counts[k] };
      })
      .sort(function (a, b) {
        return b.n - a.n;
      })
      .slice(0, 12);
    return {
      athensToday: athensDate(),
      events: recent.length,
      top: top,
      flags: getFlags(),
      openHandoffs: openHandoffs().length,
      lastEvents: recent.slice(-8),
    };
  }

  /** Markdown ship packet for midnight Greek fix (copy / paste to agent) */
  function shipPacket() {
    var s = summary(14);
    var hands = openHandoffs().slice(0, 8);
    var lines = [
      '# SpaceNet usage ship packet',
      'Athens date: ' + s.athensToday,
      'Generated: ' + nowIso(),
      '',
      '## Flags',
      '```json',
      JSON.stringify(s.flags, null, 2),
      '```',
      '',
      '## Top events (14d)',
    ];
    s.top.forEach(function (t) {
      lines.push('- ' + t.name + ': ' + t.n);
    });
    lines.push('', '## Open handoffs (bridge AI → code)');
    if (!hands.length) lines.push('- (none)');
    hands.forEach(function (h, i) {
      lines.push((i + 1) + '. ' + h.note + ' · ' + h.iso);
    });
    lines.push('', '## Last events');
    s.lastEvents.forEach(function (e) {
      lines.push('- ' + e.name + ' · ' + e.iso);
    });
    lines.push(
      '',
      '## Ship rule',
      'Pick **one** highest-pain fix. Implement in `js/spacenet/*` only. Probe live. Push main. One fix per Athens midnight.'
    );
    return lines.join('\n');
  }

  function exportJson() {
    return JSON.stringify(
      {
        version: 1,
        athens: athensDate(),
        flags: U.flags,
        events: U.events.slice(-MAX),
        handoff: U.handoff.slice(-80),
        summary: summary(14),
      },
      null,
      2
    );
  }

  load();

  global.SNUsage = {
    track: track,
    flag: flag,
    getFlags: getFlags,
    handoff: handoff,
    openHandoffs: openHandoffs,
    markHandoff: markHandoff,
    summary: summary,
    shipPacket: shipPacket,
    exportJson: exportJson,
    athensDate: athensDate,
    get events() {
      return U.events.slice();
    },
  };
})(window);
