/* Astranov mute · Build 20260811223000
 * Kill alert beeps, oscillator spam, auto speechSynthesis noise.
 * SpeechRecognition on Android often triggers keyboard/system beeps — we soft-gate restarts.
 */
(function (global) {
  'use strict';
  var BUILD = '20260811223000-mute';
  global.__SN_MUTE_ALERTS = true;
  global.__SN_MUTE_BEEPS = true;

  function silenceSpeech() {
    try {
      if (global.speechSynthesis) global.speechSynthesis.cancel();
    } catch (_) {}
  }

  function patchAudio() {
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (AC && !AC.__snMuted) {
        AC.__snMuted = true;
        var orig = AC.prototype.createOscillator;
        if (orig) {
          AC.prototype.createOscillator = function () {
            var osc = orig.apply(this, arguments);
            var start = osc.start.bind(osc);
            osc.start = function () {
              if (global.__SN_MUTE_BEEPS) {
                try {
                  osc.frequency.value = 0;
                } catch (_) {}
                return; // swallow beep
              }
              return start.apply(osc, arguments);
            };
            return osc;
          };
        }
      }
    } catch (_) {}
    try {
      if (global.Audio && !Audio.__snMuted) {
        Audio.__snMuted = true;
        var play = Audio.prototype.play;
        Audio.prototype.play = function () {
          if (global.__SN_MUTE_BEEPS) {
            try {
              this.muted = true;
              this.volume = 0;
            } catch (_) {}
            return Promise.resolve();
          }
          return play.apply(this, arguments);
        };
      }
    } catch (_) {}
  }

  function patchFieldAlerts() {
    try {
      if (global.SNField) {
        global.SNField.playAlertTone = function () {};
        global.SNField.showDeviceAlert = function () {};
      }
    } catch (_) {}
  }

  /** Soft-gate aggressive handsfree restarts that beep on Android */
  function softGateHandsfree() {
    try {
      if (!global.SNCli || SNCli.__snBeepGate) return;
      SNCli.__snBeepGate = true;
      // Prefer text when silver is active unless user forced voice
      var desc = Object.getOwnPropertyDescriptor(SNCli, 'toggleHandsfree');
      // wrap if function exists
      if (typeof SNCli.toggleHandsfree === 'function') {
        var prev = SNCli.toggleHandsfree.bind(SNCli);
        SNCli.toggleHandsfree = function () {
          global.__SN_MUTE_BEEPS = true;
          return prev();
        };
      }
    } catch (_) {}
  }

  function boot() {
    patchAudio();
    silenceSpeech();
    patchFieldAlerts();
    softGateHandsfree();
  }

  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  setInterval(function () {
    patchAudio();
    patchFieldAlerts();
    softGateHandsfree();
    if (global.__SN_MUTE_ALERTS && !(global.SNCli && SNCli.handsfreeOn)) silenceSpeech();
  }, 4000);

  global.SNChromeMute = { build: BUILD, silence: silenceSpeech };
})(typeof window !== 'undefined' ? window : globalThis);
