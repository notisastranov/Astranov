// === PERF LAZY — defer 574KB pack; never freeze first paint ===
// AI HANDOFF: astranov-continuity.js → features.perfLazyBoot
(function perfLazyBoot() {
  const LM = window.LazyModules;
  if (!LM || LM._perfLazy) return;
  LM._perfLazy = true;

  const mobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 960);

  if (mobile()) window._globePerfLite = true;

  // Long defaults so boot never races the 574KB pack
  const delayMs = () => {
    const base = window.SlumberManager?.deferredDelay?.() ?? 2800;
    return mobile() ? Math.max(base, 7000) : Math.max(base, 4000);
  };
  const bootAt = () => window._bootAt || Date.now();

  if (!window._lazyUserReady) {
    const mark = () => { window._lazyUserReady = true; };
    ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(ev => {
      window.addEventListener(ev, mark, { passive: true, once: false });
    });
  }

  function shouldDefer() {
    return !window._deferredBootDone && !window._lazyUserReady;
  }

  function waitMs() {
    return Math.max(0, delayMs() - (Date.now() - bootAt()));
  }

  function deferRun(fn) {
    const w = shouldDefer() ? waitMs() : 0;
    if (w <= 0) {
      return new Promise(resolve => {
        // Always yield a macrotask so boot/animation frames stay free
        setTimeout(() => Promise.resolve().then(fn).then(resolve).catch(() => resolve()), 0);
      });
    }
    return new Promise(resolve => {
      const go = () => Promise.resolve().then(fn).then(resolve).catch(() => resolve());
      if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: w + 1200 });
      else setTimeout(go, w);
    });
  }

  const origLoad = LM.load.bind(LM);
  const origEnsure = LM.ensure.bind(LM);
  const origSchedule = LM.schedule?.bind(LM);

  LM.ensure = function() {
    if (!shouldDefer()) return origEnsure();
    return deferRun(() => origEnsure());
  };

  LM.whenReady = function(fn) {
    if (window._deferredBootDone) return Promise.resolve().then(() => fn?.());
    return deferRun(() => origLoad().then(() => {
      if (!window._deferredBootDone && window.DeferredBoot?.run) {
        // Yield before running huge DeferredBoot so UI stays responsive
        return new Promise(res => setTimeout(() => {
          try { window.DeferredBoot.run(); } catch (e) { console.error('[DeferredBoot]', e); }
          res(fn?.());
        }, 30));
      }
      return fn?.();
    }).catch((err) => {
      console.error('[perf-lazy] deferred load failed', err);
      return fn?.();
    }));
  };

  LM.scheduleBrain = function(fn) {
    if (typeof fn !== 'function') return LM.whenReady(fn);
    return LM.whenReady(() => {
      wrapBrainBoot();
      return fn();
    });
  };

  if (origSchedule) {
    LM.schedule = function() {
      if (shouldDefer()) {
        const w = Math.max(waitMs(), mobile() ? 8000 : 5000);
        setTimeout(() => {
          if (window._lazyUserReady || Date.now() - bootAt() > w) origSchedule();
        }, w);
        return;
      }
      setTimeout(() => origSchedule(), 50);
    };
  }

  function wrapBrainBoot() {
    const BN = window.BrainNeurons;
    if (!BN || BN._perfDeduped) return;
    const orig = BN.boot?.bind(BN);
    if (!orig) return;
    BN._perfDeduped = true;
    let inflight = null;
    BN.boot = function() {
      if (BN._booted) return inflight || Promise.resolve();
      if (!inflight) {
        inflight = Promise.resolve(orig()).then(() => { BN._booted = true; }).catch(() => {});
      }
      return inflight;
    };
  }

  function capDprHard() {
    const r = window.renderer;
    if (!r?.setPixelRatio) return;
    const cap = mobile()
      ? Math.min(window.SlumberManager?.quality?.pixelRatio ?? 0.85, 0.9)
      : Math.min(window.SlumberManager?.quality?.pixelRatio ?? 1.25, 1.25);
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  }

  setTimeout(capDprHard, 100);
  let hookN = 0;
  const hookIv = setInterval(() => {
    hookN++;
    wrapBrainBoot();
    if (mobile()) window._globePerfLite = true;
    if (window.SlumberManager?._inited) capDprHard();
    if (hookN > 15) clearInterval(hookIv);
  }, 400);
})();
