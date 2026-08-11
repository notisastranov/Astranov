/* Astranov — Silver helper · living AI companion
 * Build: 20260811223000-silver-ai
 * Standby: quiet hover top-right. Tap → wake AI, talk, fly to help, take orders.
 * Collective memory: SNAstranovMind learn + SNAi history (local + shared when online).
 */
(function (global) {
  'use strict';
  var BUILD = '20260811223000-silver-ai';
  var MODE = 'standby'; // standby | active | fly | talk
  var canvas = null;
  var ctx = null;
  var hit = null;
  var raf = 0;
  var t0 = 0;
  var ready = false;
  var activeUntil = 0;
  var flyTarget = null;
  var pose = { flap: 0, bob: 0, lean: 0, thrust: 0, glow: 0.35, size: 34 };
  var home = { x: 0, y: 0 };
  var pos = { x: 0, y: 0 };
  var bubble = null;
  var bubbleUntil = 0;
  var lastSpoke = '';

  function log(msg, kind) {
    try {
      if (global.SNCli && SNCli.log) SNCli.log(msg, kind || 'ok');
    } catch (_) {}
  }

  function topChromeBottom() {
    try {
      var el =
        document.getElementById('sn-topchrome-panel') ||
        document.getElementById('sn-topchrome');
      if (el) return Math.max(48, Math.round(el.getBoundingClientRect().bottom + 4));
    } catch (_) {}
    return 64;
  }

  function killBroken() {
    try {
      ['sn-silver-rive', 'sn-helper-fx', 'sn-silver-calm'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      var old = document.getElementById('sn-helper-canvas');
      if (old) {
        old.style.opacity = '0';
        old.style.pointerEvents = 'none';
        old.style.visibility = 'hidden';
      }
    } catch (_) {}
  }

  function ensureCanvas() {
    if (canvas && document.body.contains(canvas)) return ctx;
    canvas = document.getElementById('sn-silver-vector');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'sn-silver-vector';
      document.body.appendChild(canvas);
    }
    canvas.style.cssText =
      'position:fixed;inset:0;z-index:98;pointer-events:none;width:100%;height:100%;background:transparent;';
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
    return ctx;
  }

  function resize() {
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    }
  }

  function homeAnchor() {
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    var x = Math.round(w - 48);
    var y = topChromeBottom() + 30;
    y = Math.min(Math.max(y, 56), Math.round(h * 0.18));
    x = Math.min(Math.max(x, 36), w - 30);
    return { x: x, y: y };
  }

  function tickPose(now) {
    var t = (now - t0) / 1000;
    if (MODE === 'standby') {
      pose.flap = Math.sin(t * 1.1) * 0.12;
      pose.bob = Math.sin(t * 0.9) * 2.2;
      pose.lean = Math.sin(t * 0.45) * 0.04;
      pose.thrust = 0;
      pose.glow = 0.28 + Math.sin(t * 0.7) * 0.04;
      pose.size = 32;
    } else if (MODE === 'fly') {
      pose.flap = Math.sin(t * 8) * 0.55;
      pose.bob = Math.sin(t * 5) * 3;
      pose.lean = 0.2;
      pose.thrust = 0.7 + Math.sin(t * 12) * 0.15;
      pose.glow = 0.75;
      pose.size = 36;
    } else {
      // active / talk
      pose.flap = Math.sin(t * 3.2) * 0.28;
      pose.bob = Math.sin(t * 2.1) * 2.6;
      pose.lean = Math.sin(t * 1.4) * 0.1;
      pose.thrust = 0.15;
      pose.glow = 0.55 + Math.sin(t * 2.5) * 0.12;
      pose.size = 36;
    }
  }

  function drawRobot(c, x, y) {
    var s = pose.size;
    c.save();
    c.translate(x, y + pose.bob);
    c.rotate(pose.lean);

    // soft aura (no red corners)
    var g = c.createRadialGradient(0, 0, 2, 0, 0, s * 1.6);
    g.addColorStop(0, 'rgba(180,220,255,' + (0.12 + pose.glow * 0.12) + ')');
    g.addColorStop(1, 'rgba(80,140,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, s * 1.6, 0, Math.PI * 2);
    c.fill();

    // wings
    function wing(side) {
      c.save();
      c.scale(side, 1);
      c.rotate(-0.35 + pose.flap * side);
      var wg = c.createLinearGradient(0, 0, s * 1.4, 0);
      wg.addColorStop(0, 'rgba(210,230,255,0.95)');
      wg.addColorStop(1, 'rgba(120,160,210,0.35)');
      c.fillStyle = wg;
      c.beginPath();
      c.moveTo(s * 0.15, -s * 0.1);
      c.quadraticCurveTo(s * 0.9, -s * 0.55, s * 1.35, -s * 0.1);
      c.quadraticCurveTo(s * 0.85, s * 0.15, s * 0.2, s * 0.2);
      c.closePath();
      c.fill();
      c.restore();
    }
    wing(-1);
    wing(1);

    // body
    var bg = c.createLinearGradient(-s * 0.35, -s * 0.5, s * 0.4, s * 0.55);
    bg.addColorStop(0, '#eef6ff');
    bg.addColorStop(0.45, '#b8cce0');
    bg.addColorStop(1, '#6a849e');
    c.fillStyle = bg;
    c.beginPath();
    c.ellipse(0, s * 0.05, s * 0.32, s * 0.48, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 1.2;
    c.stroke();

    // head
    c.fillStyle = '#d8e8f8';
    c.beginPath();
    c.ellipse(0, -s * 0.38, s * 0.28, s * 0.26, 0, 0, Math.PI * 2);
    c.fill();

    // visor
    var vg = c.createLinearGradient(-s * 0.18, -s * 0.45, s * 0.18, -s * 0.3);
    if (MODE === 'standby') {
      vg.addColorStop(0, 'rgba(40,140,255,0.85)');
      vg.addColorStop(1, 'rgba(20,80,180,0.9)');
    } else {
      vg.addColorStop(0, 'rgba(80,255,180,0.9)');
      vg.addColorStop(1, 'rgba(40,200,255,0.95)');
    }
    c.fillStyle = vg;
    c.beginPath();
    c.ellipse(0, -s * 0.38, s * 0.18, s * 0.1, 0, 0, Math.PI * 2);
    c.fill();

    // thrust only when flying
    if (pose.thrust > 0.05) {
      c.fillStyle = 'rgba(120,200,255,' + (0.25 + pose.thrust * 0.35) + ')';
      c.beginPath();
      c.moveTo(-s * 0.12, s * 0.5);
      c.lineTo(0, s * 0.5 + s * 0.55 * pose.thrust);
      c.lineTo(s * 0.12, s * 0.5);
      c.closePath();
      c.fill();
    }

    // speech bubble
    if (bubble && nowBubble()) {
      drawBubble(c, 0, -s * 0.95, bubble);
    }

    c.restore();
  }

  function nowBubble() {
    return performance.now() < bubbleUntil;
  }

  function drawBubble(c, x, y, text) {
    var lines = String(text || '').slice(0, 72);
    c.save();
    c.font = '600 11px system-ui,sans-serif';
    var w = Math.min(180, Math.max(70, c.measureText(lines).width + 16));
    var h = 28;
    c.fillStyle = 'rgba(0,12,28,0.82)';
    c.strokeStyle = 'rgba(100,190,255,0.65)';
    c.lineWidth = 1;
    roundRect(c, x - w / 2, y - h - 6, w, h, 10);
    c.fill();
    c.stroke();
    c.fillStyle = '#cfe8ff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(lines, x, y - h / 2 - 6);
    c.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function ensureHit() {
    if (hit && document.body.contains(hit)) return hit;
    hit = document.createElement('button');
    hit.id = 'sn-helper-hit';
    hit.type = 'button';
    hit.title = 'Silver · tap to talk · AI companion';
    hit.setAttribute('aria-label', 'Silver AI helper');
    hit.style.cssText =
      'position:fixed;z-index:130;width:52px;height:52px;border:none;padding:0;' +
      'background:transparent;cursor:pointer;border-radius:50%;outline:none;' +
      '-webkit-tap-highlight-color:transparent;';
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

  function placeHit(x, y) {
    var h = ensureHit();
    h.style.left = Math.round(x - 26) + 'px';
    h.style.top = Math.round(y - 26) + 'px';
  }

  function setMode(m) {
    MODE = m;
    t0 = performance.now();
    if (m === 'active' || m === 'talk' || m === 'fly') {
      activeUntil = performance.now() + 90000;
    }
  }

  function speak(text, opts) {
    opts = opts || {};
    var t = String(text || '').trim();
    if (!t) return;
    lastSpoke = t;
    bubble = t.length > 64 ? t.slice(0, 61) + '…' : t;
    bubbleUntil = performance.now() + (opts.ms || 6500);
    log('Silver · ' + t, opts.kind || 'ok');
    try {
      if (global.SNCli && SNCli.preview) SNCli.preview('🤖 ' + t.slice(0, 72));
    } catch (_) {}
    try {
      if (global.SNAi && SNAi.showOnGlobe) SNAi.showOnGlobe(t.slice(0, 80));
    } catch (_) {}
    // Voice: ONLY when user explicitly activated helper (no boot beeps)
    if (opts.voice !== false && MODE !== 'standby') {
      try {
        if (global.speechSynthesis) {
          global.speechSynthesis.cancel();
          // Prefer quiet text unless speakOut already on
          var speakOut = false;
          try {
            speakOut = !!(global.SNCli && SNCli.handsfreeOn && global.__SN_SILVER_VOICE);
          } catch (_) {}
          if (speakOut || opts.forceVoice) {
            var u = new SpeechSynthesisUtterance(t.slice(0, 160));
            u.rate = 1.02;
            u.pitch = 1.05;
            u.volume = 0.85;
            global.speechSynthesis.speak(u);
          }
        }
      } catch (_) {}
    }
  }

  function openCliForTalk() {
    try {
      var panel = document.getElementById('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        panel.classList.add('mid');
      }
      var inp = document.getElementById('cli-in');
      if (inp) {
        inp.focus({ preventScroll: true });
        inp.placeholder = 'Talk to Silver / Astranov Mind…';
      }
    } catch (_) {}
  }

  function wakeAiStack() {
    try {
      if (global.SNAi) {
        if (SNAi.bootPresence) SNAi.bootPresence();
        if (SNAi.listeningOn) SNAi.listeningOn();
      }
    } catch (_) {}
    try {
      // Text CLI for chat — do NOT auto-start speech recognition (Android beeps)
      if (global.SNCli) {
        global.__SN_SILVER_ACTIVE = true;
        global.__SN_SILVER_VOICE = false;
      }
    } catch (_) {}
    // Collective mind: mark session
    try {
      var key = 'sn:silver-sessions';
      var n = Number(localStorage.getItem(key) || 0) + 1;
      localStorage.setItem(key, String(n));
      localStorage.setItem('sn:silver-last', String(Date.now()));
    } catch (_) {}
  }

  function flyToScreen(x, y, ms) {
    setMode('fly');
    flyTarget = { x: x, y: y, until: performance.now() + (ms || 1600) };
  }

  function flyHelpTask(kind) {
    var a = homeAnchor();
    var w = window.innerWidth || 400;
    var h = window.innerHeight || 700;
    if (kind === 'map') flyToScreen(w * 0.5, h * 0.42, 1800);
    else if (kind === 'cli') flyToScreen(w * 0.5, h - 120, 1400);
    else flyToScreen(a.x - 40, a.y + 80, 1200);
    setTimeout(function () {
      if (MODE === 'fly') setMode('active');
      flyTarget = null;
    }, 1700);
  }

  async function askMind(message) {
    var msg = String(message || '').trim();
    if (!msg) return;
    setMode('talk');
    speak('Thinking…', { voice: false, ms: 2000 });
    try {
      // Prefer full SNAi (Grok-backed aicycle + local mind + memory)
      if (global.SNAi && typeof SNAi.ask === 'function') {
        var ans = await SNAi.ask(msg, { mode: 'chat', source: 'silver' });
        if (ans) {
          speak(String(ans).slice(0, 220), { kind: 'ok', ms: 9000 });
          // teach collective local mind
          try {
            if (global.SNAstranovMind && SNAstranovMind.learnInteraction) {
              SNAstranovMind.learnInteraction(msg, ans, { source: 'silver' });
            } else if (global.SNFreeMind && SNFreeMind.teach) {
              SNFreeMind.teach(msg, String(ans).slice(0, 400), ['silver', 'user']);
            }
          } catch (_) {}
          // fly if task-ish
          if (/\b(find|locate|order|shop|deliver|map|pizza|call|route)\b/i.test(msg)) {
            flyHelpTask(/locate|map|route/i.test(msg) ? 'map' : 'cli');
            try {
              if (global.SNHelper) {
                if (SNHelper.init) SNHelper.init();
                var posH = global._snLastPos || global._snPhysPos;
                if (SNHelper.flyTo)
                  SNHelper.flyTo(posH || { lat: 36.43, lng: 28.22 }, {
                    kind: 'assist',
                    label: 'SILVER',
                    detail: msg.slice(0, 36),
                    status: 'assist',
                    log: false,
                  });
              }
            } catch (_) {}
          }
          return ans;
        }
      }
      // Free mind offline
      if (global.SNAstranovMind && SNAstranovMind.answer) {
        var r = SNAstranovMind.answer(msg);
        var text = (r && (r.text || r.a || r.answer)) || (typeof r === 'string' ? r : null);
        if (text) {
          speak(String(text).slice(0, 220), { kind: 'ok', ms: 9000 });
          return text;
        }
      }
      if (global.SNCli && SNCli.run) {
        await SNCli.run(msg);
        speak('On it · check the CLI', { ms: 4000 });
        return;
      }
      speak("I'm here. Type in the CLI — locate, power on, call, shops…", { ms: 7000 });
    } catch (e) {
      speak('Glitch · ' + (e && e.message ? e.message : 'try again'), {
        kind: 'err',
        ms: 5000,
      });
    }
  }

  function activate() {
    killBroken();
    setMode('active');
    wakeAiStack();
    openCliForTalk();
    flyHelpTask('cli');

    var greet =
      'Silver online. I am your Astranov companion — collective memory on this device, Grok-class mind when the net is up. Tell me what to do.';
    speak(greet, { kind: 'ok', ms: 9000, voice: false });
    log('──────── SILVER AI ────────', 'dim');
    log('Tap me anytime · type in CLI · I fly for tasks · memory grows with you', 'ok');
    log('Examples: locate · power on · find pizza · call · polygon · help', 'dim');

    // Hook next CLI submits as Silver conversation while active
    try {
      installCliHook();
    } catch (_) {}

    // Auto-run a light presence through free mind
    try {
      if (global.SNAstranovMind && SNAstranovMind.think) {
        SNAstranovMind.think('silver activated · user session', 'status');
      }
    } catch (_) {}
  }

  function installCliHook() {
    if (global.__SN_SILVER_CLI_HOOK) return;
    global.__SN_SILVER_CLI_HOOK = true;
    if (!global.SNCli || typeof SNCli.run !== 'function') return;
    var prev = SNCli.run.bind(SNCli);
    SNCli.run = function (raw) {
      var line = String(raw || '').trim();
      var low = line.toLowerCase();
      // While silver active, conversational lines go through mind first
      if (
        global.__SN_SILVER_ACTIVE &&
        line &&
        !/^(locate|gps|power|call|video|hang|polygon|poly|global|city|map|shops|layers|send|help money|market)\b/i.test(
          low
        ) &&
        line.length > 2 &&
        !/^\//.test(line)
      ) {
        // Parallel: still allow command-like, but chat gets askMind
        if (
          /^(hi|hello|hey|silver|helper|who are you|what can you|help|find |order |where |how |why |can you)/i.test(
            low
          ) ||
          /\?$/.test(line) ||
          line.split(/\s+/).length >= 3
        ) {
          setMode('talk');
          return askMind(line).then(function (ans) {
            // If mind returned nothing useful, fall through
            if (!ans) return prev(raw);
            return ans;
          });
        }
      }
      return prev(raw);
    };
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    var c = ensureCanvas();
    if (!c) return;
    var minDt = MODE === 'standby' ? 40 : 22;
    if (frame._last && now - frame._last < minDt) return;
    frame._last = now;

    // expire active
    if (MODE !== 'standby' && activeUntil && now > activeUntil) {
      setMode('standby');
      flyTarget = null;
      global.__SN_SILVER_ACTIVE = false;
      speak('Standing by. Tap me when you need me.', { voice: false, ms: 3500, kind: 'dim' });
    }

    var a = homeAnchor();
    home.x = a.x;
    home.y = a.y;
    if (!pos.x) {
      pos.x = a.x;
      pos.y = a.y;
    }

    var tx = a.x;
    var ty = a.y;
    if (flyTarget && now < flyTarget.until) {
      tx = flyTarget.x;
      ty = flyTarget.y;
    } else if (MODE === 'active' || MODE === 'talk') {
      tx = a.x - 8;
      ty = a.y + 10;
    }
    // smooth follow
    pos.x += (tx - pos.x) * (MODE === 'fly' ? 0.14 : 0.08);
    pos.y += (ty - pos.y) * (MODE === 'fly' ? 0.14 : 0.08);

    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    c.clearRect(0, 0, w, h);
    tickPose(now);
    drawRobot(c, pos.x, pos.y);
    placeHit(pos.x, pos.y);
  }

  function boot() {
    killBroken();
    t0 = performance.now();
    ensureCanvas();
    ensureHit();
    var a = homeAnchor();
    pos.x = a.x;
    pos.y = a.y;
    if (!raf) raf = requestAnimationFrame(frame);
    if (!ready) {
      ready = true;
      // Quiet boot — no beep, no TTS
      try {
        if (global.SNCli && SNCli.preview) SNCli.preview('Silver standby');
      } catch (_) {}
    }
    try {
      installCliHook();
    } catch (_) {}
  }

  window.addEventListener('resize', resize, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 1000);
  setTimeout(boot, 3200);

  global.SNChromeHelper = {
    build: BUILD,
    activate: activate,
    setMode: setMode,
    mode: function () {
      return MODE;
    },
    fly: function () {
      flyHelpTask('map');
    },
    speak: speak,
    ask: askMind,
    standby: function () {
      setMode('standby');
      global.__SN_SILVER_ACTIVE = false;
    },
  };
  // Alias so SNAi helper paths can find silver
  if (!global.SNHelper || !global.SNHelper.flyTo) {
    global.SNSilver = global.SNChromeHelper;
  }
})(typeof window !== 'undefined' ? window : globalThis);
