// === PERF LAZY + TURBO — defer pack · force lite path · low DPR ===
// AI HANDOFF: astranov-continuity.js → features.perfLazyBoot
(function perfLazyBoot() {
  const LM = window.LazyModules;
  if (!LM || LM._perfLazy) return;
  LM._perfLazy = true;

  const mobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 960);

  // Re-assert lite mode (app.js used to wipe _globePerfLite = false after boot)
  if (mobile()) window._globePerfLite = true;

  const delayMs = () => {
    const base = window.SlumberManager?.deferredDelay?.() ?? 1800;
    return mobile() ? Math.max(base, 5000) : Math.max(base, 2200);
  };
  const bootAt = () => window._bootAt || Date.now();

  if (!window._lazyUserReady) {
    const mark = () => { window._lazyUserReady = true; };
    ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(ev => {
      window.addEventListener(ev, mark, { passive: true });
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
    if (w <= 0) return Promise.resolve().then(fn);
    return new Promise(resolve => {
      const go = () => Promise.resolve().then(fn).then(resolve);
      if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: w + 900 });
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
      if (!window._deferredBootDone && window.DeferredBoot?.run) window.DeferredBoot.run();
      return fn?.();
    }).catch((err) => {
      console.error('[perf-lazy] deferred load failed', err);
      window.MissionSupportReporter?.recordProblem?.('deferred_load', String(err?.message || err));
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
        const w = Math.max(waitMs(), mobile() ? 6000 : 3000);
        setTimeout(() => {
          if (window._lazyUserReady || window._deferredBootDone) origSchedule();
        }, w);
        return;
      }
      origSchedule();
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
      ? Math.min(window.SlumberManager?.quality?.pixelRatio ?? 0.65, 0.7)
      : Math.min(window.SlumberManager?.quality?.pixelRatio ?? 1, 1);
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  }

  capDprHard();
  let hookN = 0;
  const hookIv = setInterval(() => {
    hookN++;
    wrapBrainBoot();
    if (mobile()) window._globePerfLite = true;
    if (window.SlumberManager?._inited) capDprHard();
    if (hookN > 20) clearInterval(hookIv);
  }, 250);
})();
