/**
 * ASTRANOV MIND — lean money path only
 * power on · locate · marina · global · cancel
 */
(function (global) {
  'use strict';

  var NAME = 'Astranov';

  function answer(message, opts) {
    opts = opts || {};
    var raw = String(message || '').trim();
    var low = raw.toLowerCase().replace(/\s+/g, ' ');

    if (!raw) {
      return { text: 'Astranov here — power on · locate · marina · help.', score: 1, via: 'astranov-mind', source: 'empty' };
    }

    if (/\b(who are you|what are you|your name|ποιος εισαι|τι εισαι)\b/i.test(low)) {
      return { text: "I'm Astranov — delivery AI on the live globe. power on · locate · marina. English or Greek.", score: 1, via: 'astranov-mind', source: 'identity' };
    }

    if (/^(help|help me|what can you do|commands|\?)$/i.test(low) ||
        /\b(confus|too much|complicated|clean up|simplify|how does this work)\b/i.test(low)) {
      return { text: 'Simple: power on (tasks) · locate · marina · global · cancel. Scroll zooms · drag spins.', score: 1, via: 'astranov-mind', source: 'help' };
    }

    if (/\b(zoom|scroll|mouse wheel|trackpad|spinning|turns? around|can't zoom|cannot zoom)\b/i.test(low)) {
      return { text: 'Scroll / mouse wheel = zoom. Drag = spin globe. Two-finger pinch also zooms. Type global to reset.', score: 1, via: 'astranov-mind', source: 'controls' };
    }

    if (/\b(marina|berth|yacht park|parking spot|mooring)\b/i.test(low)) {
      try {
        if (global.SNMarina && SNMarina.openMarina) SNMarina.openMarina();
        else if (global.SNCli && SNCli.run) void SNCli.run('marina');
      } catch (_) {}
      return { text: 'Opening marina berth grid — free cells show Æ/night. Tap free to book.', score: 1, via: 'astranov-mind', source: 'marina' };
    }

    if (/\b(cancel|stop|unstick|reset ai|clear busy)\b/i.test(low)) {
      try { if (global.SNCli && SNCli.run) void SNCli.run('cancel'); } catch (_) {}
      return { text: 'Cleared. Ready — power on · locate · marina · help.', score: 1, via: 'astranov-mind', source: 'cancel' };
    }

    if (/\b(power on|market on|tasks on|go live|throw offers|first delivery|order pizza|money)\b/i.test(low)) {
      try {
        if (global.SNPolyScheduler && SNPolyScheduler.activate) SNPolyScheduler.activate();
        else if (global.SNField && SNField.setLaunchMode) SNField.setLaunchMode('on');
        else if (global.SNCli && SNCli.run) void SNCli.run('power on');
      } catch (_) {}
      return { text: 'Power ON — task offers throwing. Accept → polygon → pay → Rai drone.', score: 1, via: 'astranov-mind', source: 'power' };
    }

    if (/\b(locate|where am i|find me|gps|my location)\b/i.test(low)) {
      try {
        if (global.SNCli && SNCli.run) void SNCli.run('locate');
      } catch (_) {}
      return { text: 'Locating you on the map…', score: 1, via: 'astranov-mind', source: 'locate' };
    }

    if (/\b(global|earth|go back|3d|globe)\b/i.test(low)) {
      try {
        if (global.SNCli && SNCli.run) void SNCli.run('global');
      } catch (_) {}
      return { text: 'Back to 3D Earth.', score: 1, via: 'astranov-mind', source: 'global' };
    }

    if (/\b(game|invaders|cockpit|youtube|full os|internet os)\b/i.test(low)) {
      return { text: 'Lean mode: delivery only. power on · locate · marina · help.', score: 1, via: 'astranov-mind', source: 'lean' };
    }

    if (/^(γεια|γειά|καλημέρα|καλησπέρα|hi|hello|hey)\b/i.test(low)) {
      return { text: 'Hey — Astranov. Try: power on · locate · marina · help.', score: 1, via: 'astranov-mind', source: 'greet' };
    }

    return {
      text: 'I hear you — try: power on · locate · marina · global · help · cancel.',
      score: 0.5,
      via: 'astranov-mind',
      source: 'fallback',
    };
  }

  var api = {
    answer: answer,
    ask: function (msg, opts) { return Promise.resolve(answer(msg, opts)); },
    name: NAME,
    mindName: 'Astranov Mind',
  };

  global.SNAstranovMind = api;
  global.SNFreeMind = api;
  global.SNFreeAI = api;
})(typeof window !== 'undefined' ? window : globalThis);
