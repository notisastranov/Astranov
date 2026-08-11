/* Hard mute SpaceNet device tones · Build 20260811140500 */
(function (g) {
  'use strict';
  g.__SN_MUTE_ALERTS = true;
  try {
    if (g.speechSynthesis) g.speechSynthesis.cancel();
  } catch (_) {}
  try {
    var AC = g.AudioContext || g.webkitAudioContext;
    if (AC && !AC.__snSilentWrap) {
      var Orig = AC;
      function SilentAC() {
        var ctx = new Orig(arguments.length ? arguments[0] : undefined);
        try {
          ctx.__snSilent = true;
        } catch (_) {}
        var _co = ctx.createOscillator.bind(ctx);
        ctx.createOscillator = function () {
          var o = _co();
          try {
            o.start = function () {};
            o.stop = function () {};
            o.connect = function () { return o; };
          } catch (_) {}
          return o;
        };
        return ctx;
      }
      SilentAC.prototype = Orig.prototype;
      SilentAC.__snSilentWrap = true;
      try {
        g.AudioContext = SilentAC;
        if (g.webkitAudioContext) g.webkitAudioContext = SilentAC;
      } catch (_) {}
    }
  } catch (_) {}
  try {
    if (navigator.vibrate) {
      navigator.vibrate = function () { return false; };
    }
  } catch (_) {}
})(typeof window !== 'undefined' ? window : globalThis);
