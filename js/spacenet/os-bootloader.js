/**
 * ASTRANOV OS BOOTLOADER
 * Operating-system style cold start for any device.
 *
 * - Text console during boot (not a silent spinner)
 * - Staged module load with [ OK ] / [WARN] / [FAIL]
 * - Diagnostics + automatic repair attempts + user fix offers
 * - Never claims READY until verified (canvas + shell + CLI)
 * - CLI commands after handoff: boot · diagnostics · repair · kernel status
 *
 * This is the sole entry after index.html. Professional path — not a game splash.
 */
(function (global) {
  'use strict';

  if (global.__snOsBoot) return;
  global.__snOsBoot = 1;

  var BUILD =
    (document.querySelector('meta[name="astranov-build"]') || {}).content || 'os-1';
  var CDN_GH = 'https://cdn.jsdelivr.net/gh/notisastranov/astranov.eu@main';
  var t0 = performance.now();
  var lines = [];
  var report = {
    build: BUILD,
    startedAt: new Date().toISOString(),
    stages: [],
    checks: [],
    fixes: [],
    loadStats: { ok: 0, fail: 0, cdn: 0 },
    ready: false,
    degraded: false,
  };

  var consoleEl = null;
  var bootEl = document.getElementById('boot');

  /* ───────── Boot console UI ───────── */
  function ensureConsole() {
    if (!bootEl) {
      bootEl = document.createElement('div');
      bootEl.id = 'boot';
      bootEl.setAttribute('aria-busy', 'true');
      document.body.appendChild(bootEl);
    }
    bootEl.classList.remove('hide');
    bootEl.style.cssText =
      'position:fixed;inset:0;z-index:500;background:#000105;display:flex;flex-direction:column;' +
      'padding:calc(12px + env(safe-area-inset-top,0px)) 14px 14px;box-sizing:border-box;' +
      'font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;color:#9ec8ff;';
    bootEl.innerHTML =
      '<div id="sn-os-head" style="flex:0 0 auto;margin-bottom:10px">' +
      '<div style="font:800 13px/1.2 Space Grotesk,system-ui,sans-serif;letter-spacing:0.22em;color:#3d9eff;' +
      'text-shadow:0 0 12px rgba(61,158,255,0.7)">ASTRANOV SPACENET</div>' +
      '<div id="sn-os-sub" style="font:600 10px/1.4 JetBrains Mono,monospace;color:#6a8ab8;margin-top:6px">' +
      'OPERATING SYSTEM · BOOTLOADER · build ' +
      esc(BUILD) +
      '</div></div>' +
      '<pre id="sn-os-console" style="flex:1 1 auto;margin:0;overflow:auto;white-space:pre-wrap;word-break:break-word;' +
      'font:500 11px/1.45 JetBrains Mono,ui-monospace,Menlo,monospace;color:#b8d4ff"></pre>' +
      '<div id="sn-os-actions" style="flex:0 0 auto;display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>';
    consoleEl = document.getElementById('sn-os-console');
    return consoleEl;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>');
  }

  function paint() {
    if (!consoleEl) ensureConsole();
    if (!consoleEl) return;
    var html = lines
      .map(function (L) {
        var c = '#b8d4ff';
        if (L.lvl === 'ok') c = '#3dd68c';
        else if (L.lvl === 'fail') c = '#e82127';
        else if (L.lvl === 'warn') c = '#e8c547';
        else if (L.lvl === 'hdr') c = '#7ec8ff';
        else if (L.lvl === 'dim') c = '#6a8ab8';
        return (
          '<span style="color:' +
          c +
          '">' +
          esc(L.tag) +
          '</span> ' +
          '<span style="color:' +
          c +
          '">' +
          esc(L.msg) +
          '</span>'
        );
      })
      .join('\n');
    consoleEl.innerHTML = html;
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function out(tag, msg, lvl) {
    lines.push({ tag: tag, msg: String(msg || ''), lvl: lvl || 'dim', t: performance.now() - t0 });
    if (lines.length > 400) lines = lines.slice(-300);
    paint();
    try {
      if (global.SNCli && SNCli.log) {
        var cls = lvl === 'fail' ? 'err' : lvl === 'ok' ? 'ok' : lvl === 'warn' ? 'dim' : 'dim';
        SNCli.log(tag + ' ' + msg, cls, true);
      }
    } catch (_) {}
  }

  function hdr(msg) {
    out('──', msg, 'hdr');
  }
  function ok(msg) {
    out('[ OK ]', msg, 'ok');
  }
  function warn(msg) {
    out('[WARN]', msg, 'warn');
  }
  function fail(msg) {
    out('[FAIL]', msg, 'fail');
  }
  function info(msg) {
    out('[....]', msg, 'dim');
  }
  function fix(msg) {
    out('[FIX ]', msg, 'warn');
    report.fixes.push({ t: Date.now(), msg: String(msg) });
  }

  function recordCheck(id, pass, detail, fixHint) {
    var row = { id: id, pass: !!pass, detail: detail || '', fix: fixHint || '', ms: Math.round(performance.now() - t0) };
    report.checks.push(row);
    if (pass) ok(id + (detail ? ' · ' + detail : ''));
    else {
      fail(id + (detail ? ' · ' + detail : ''));
      if (fixHint) fix(fixHint);
    }
    return row;
  }

  function setActions(btns) {
    var box = document.getElementById('sn-os-actions');
    if (!box) return;
    box.innerHTML = '';
    (btns || []).forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button';
      el.textContent = b.label;
      el.style.cssText =
        'border-radius:999px;border:1px solid rgba(61,158,255,0.55);background:rgba(8,24,56,0.9);' +
        'color:#7ec8ff;font:700 11px/1 Inter,system-ui,sans-serif;padding:10px 14px;cursor:pointer';
      el.onclick = function () {
        try {
          b.fn();
        } catch (e) {
          fail('action · ' + (e && e.message ? e.message : e));
        }
      };
      box.appendChild(el);
    });
  }

  /* ───────── Script loader ───────── */
  function originsFor(src) {
    if (/^https?:\/\//i.test(src)) return [src];
    var path = String(src || '').replace(/^\//, '').split('?')[0];
    var local = '/' + path + (src.indexOf('?') >= 0 ? src.slice(src.indexOf('?')) : '') ;
    if (local.indexOf('?') < 0) local += '?v=' + encodeURIComponent(BUILD);
    else local += '&v=' + encodeURIComponent(BUILD);
    var list = [local];
    try {
      var base = String(global.SN_ASSET_BASE || '').replace(/\/$/, '');
      if (base && base.indexOf(location.origin) !== 0)
        list.push(base + '/' + path + '?v=' + encodeURIComponent(BUILD));
    } catch (_) {}
    list.push(CDN_GH + '/' + path + '?v=' + encodeURIComponent(BUILD));
    var seen = {};
    return list.filter(function (u) {
      if (seen[u]) return false;
      seen[u] = 1;
      return true;
    });
  }

  function loadUrl(url, timeoutMs) {
    timeoutMs = timeoutMs || 12000;
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.async = true;
      s.src = url;
      var done = false;
      var to = setTimeout(function () {
        if (done) return;
        done = true;
        try {
          s.remove();
        } catch (_) {}
        reject(new Error('timeout'));
      }, timeoutMs);
      s.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        report.loadStats.ok++;
        if (url.indexOf('jsdelivr') >= 0) report.loadStats.cdn++;
        resolve(url);
      };
      s.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(to);
        try {
          s.remove();
        } catch (_) {}
        report.loadStats.fail++;
        reject(new Error('load fail'));
      };
      document.head.appendChild(s);
    });
  }

  function loadScript(src, timeoutMs) {
    var urls = originsFor(src);
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error('all origins fail · ' + src));
      var u = urls[i++];
      return loadUrl(u, timeoutMs || 12000).catch(function () {
        return next();
      });
    }
    return next();
  }

  function loadStage(name, list, opts) {
    opts = opts || {};
    hdr('STAGE · ' + name);
    report.stages.push({ name: name, start: performance.now() - t0 });
    var soft = opts.soft !== false;
    return Promise.all(
      list.map(function (src) {
        var short = String(src).split('/').pop();
        info('load ' + short);
        return loadScript(src, opts.timeout || 12000)
          .then(function (url) {
            var via = url.indexOf('jsdelivr') >= 0 ? 'cdn' : 'local';
            ok(short + ' · ' + via + ' · ' + Math.round(performance.now() - t0) + 'ms');
            return { src: src, ok: true, url: url };
          })
          .catch(function (e) {
            if (soft) {
              warn(short + ' · missing · continuing');
              return { src: src, ok: false, error: String(e && e.message ? e.message : e) };
            }
            fail(short + ' · ' + (e && e.message ? e.message : e));
            return Promise.reject(e);
          });
      })
    );
  }

  /* ───────── Stages ───────── */
  var STAGE_KERNEL = [
    '/js/spacenet/skin.js',
    '/js/spacenet/config.js',
    '/js/spacenet/currency.js',
    '/js/spacenet/game-loop.js',
    '/js/spacenet/profiles.js',
    '/js/spacenet/cli.js',
    '/js/spacenet/ui.js',
  ];
  var STAGE_DISPLAY = ['/js/spacenet/spacenet-grid.js', '/js/spacenet/globe.js'];
  var STAGE_DRIVERS = [
    '/js/spacenet/map.js',
    '/js/spacenet/tasks.js',
    '/js/spacenet/field.js',
    '/js/spacenet/delivery-rules.js',
    '/js/spacenet/poly-engine.js',
    '/js/spacenet/reassign-engine.js',
    '/js/spacenet/wish-inbox.js',
    '/js/spacenet/poly-scheduler.js',
    '/js/spacenet/marina-berths.js',
    '/js/spacenet/home.js',
    '/js/spacenet/helper.js',
  ];
  var STAGE_SERVICES = [
    '/js/spacenet/free-ai.js',
    '/js/spacenet/subscription.js',
    '/js/spacenet/ai.js',
    '/js/spacenet/os-will.js',
  ];

  function loadThree() {
    hdr('STAGE · graphics engine');
    info('THREE.js');
    return loadUrl(
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
      14000
    )
      .catch(function () {
        warn('cdnjs failed · try jsdelivr');
        return loadUrl('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js', 14000);
      })
      .then(function () {
        recordCheck('THREE', !!global.THREE, global.THREE ? 'r' + (global.THREE.REVISION || '?') : 'missing', 'Check network · CDN block · retry boot');
      })
      .catch(function (e) {
        recordCheck('THREE', false, String(e && e.message ? e.message : e), 'Allow CDN or host three.min.js locally');
      });
  }

  function checkDom() {
    hdr('STAGE · preflight');
    recordCheck('document', !!document.body, document.readyState, 'Reload page');
    recordCheck('boot-root', !!document.getElementById('boot') || !!bootEl, 'overlay', 'index.html #boot missing');
    recordCheck('globe-host', !!document.getElementById('globe'), '#globe', 'index.html #globe missing');
    recordCheck('cli-host', !!document.getElementById('cli-log') && !!document.getElementById('cli-in'), '#cli-log + #cli-in', 'index.html dock/CLI missing');
    recordCheck('topchrome', !!document.getElementById('sn-topchrome'), '#sn-topchrome', 'index.html top chrome missing');
    recordCheck('localStorage', (function () {
      try {
        localStorage.setItem('sn:os-probe', '1');
        localStorage.removeItem('sn:os-probe');
        return true;
      } catch (_) {
        return false;
      }
    })(), 'rw', 'Private mode may block storage · prefs will not persist');
    var ua = (navigator.userAgent || '').slice(0, 80);
    info('device · ' + ua);
    info('viewport · ' + window.innerWidth + '×' + window.innerHeight);
    info('online · ' + (navigator.onLine ? 'yes' : 'no'));
  }

  function initKernel() {
    hdr('STAGE · kernel init');
    try {
      if (global.SNCli && SNCli.init) {
        SNCli.init();
        recordCheck('SNCli', true, 'init', null);
      } else recordCheck('SNCli', false, 'no global', 'cli.js failed to load · repair kernel');
    } catch (e) {
      recordCheck('SNCli', false, e.message || e, 'repair kernel');
    }
    try {
      if (global.SNUi && SNUi.init) SNUi.init();
      recordCheck('SNUi', !!global.SNUi, global.SNUi ? 'ok' : 'missing', null);
    } catch (e) {
      recordCheck('SNUi', false, e.message || e, null);
    }
    try {
      if (global.SNGameLoop) {
        if (SNGameLoop.power) SNGameLoop.power();
        else if (SNGameLoop.start) SNGameLoop.start();
        recordCheck('SNGameLoop', true, 'powered', null);
      } else recordCheck('SNGameLoop', false, 'missing', 'game-loop.js');
    } catch (e) {
      recordCheck('SNGameLoop', false, e.message || e, null);
    }
    // Kill game chrome forever on money path
    try {
      document.body.classList.remove('sn-space-scene-on', 'sn-game-dock-on', 'sn-game-on');
      var gd = document.getElementById('sn-game-dock');
      if (gd) gd.remove();
    } catch (_) {}
  }

  function initDisplay() {
    hdr('STAGE · display · Earth');
    var okG = false;
    try {
      if (global.SNGlobe && typeof SNGlobe.init === 'function') {
        okG = !!SNGlobe.init();
      }
    } catch (e) {
      fail('globe init exception · ' + (e && e.message ? e.message : e));
    }
    var canvas = document.querySelector('#globe canvas');
    var cw = canvas ? canvas.width : 0;
    var ch = canvas ? canvas.height : 0;
    recordCheck('SNGlobe', !!global.SNGlobe, global.SNGlobe ? 'present' : 'missing', 'Reload · check globe.js + THREE');
    recordCheck(
      'globe-canvas',
      !!(canvas && cw > 8 && ch > 8),
      canvas ? cw + '×' + ch : 'no canvas',
      'initGlobe failed · type: repair display'
    );
    recordCheck('globe-init', okG || !!(canvas && cw > 8), okG ? 'init true' : canvas ? 'canvas without init flag' : 'failed', 'repair display');
    // Physics probe
    try {
      if (global.SNGlobe && SNGlobe.getPhysics) {
        var ph = SNGlobe.getPhysics();
        recordCheck('globe-physics', !!(ph && ph.inertia !== undefined), ph ? 'inertia=' + ph.inertia + ' tier=' + ph.tier : 'n/a', null);
      }
    } catch (_) {}
    return !!(canvas && cw > 8 && ch > 8);
  }

  function initDrivers() {
    hdr('STAGE · drivers');
    function softInit(name, g, fn) {
      try {
        if (g && typeof g[fn] === 'function') {
          g[fn]();
          recordCheck(name, true, fn + '()', null);
          return true;
        }
        recordCheck(name, !!g, g ? 'no ' + fn : 'missing', 'module load failed');
        return !!g;
      } catch (e) {
        recordCheck(name, false, e.message || e, 'repair drivers');
        return false;
      }
    }
    softInit('SNField', global.SNField, 'init');
    softInit('SNPolyScheduler', global.SNPolyScheduler, 'init');
    softInit('SNPolyEngine', global.SNPolyEngine, 'init');
    softInit('SNReassignEngine', global.SNReassignEngine, 'init');
    softInit('SNWishInbox', global.SNWishInbox, 'init');
    softInit('SNMarina', global.SNMarina, 'init');
    softInit('SNHome', global.SNHome, 'init');
    try {
      if (global.SNHelper && SNHelper.init) SNHelper.init({ autoWake: false, sleep: true });
      recordCheck('SNHelper', !!global.SNHelper, 'sleep', null);
    } catch (e) {
      recordCheck('SNHelper', false, e.message || e, null);
    }
    try {
      if (global.SNGlobe && SNGlobe.setGameMode) SNGlobe.setGameMode(false);
    } catch (_) {}
  }

  function initServices() {
    hdr('STAGE · services');
    try {
      if (global.SNSubscription && SNSubscription.init) SNSubscription.init();
      recordCheck('SNSubscription', !!global.SNSubscription, global.SNSubscription && SNSubscription.status ? SNSubscription.status().mode : 'n/a', 'subscribe via PayPal · owner login for free Grok path');
    } catch (e) {
      recordCheck('SNSubscription', false, e.message || e, null);
    }
    try {
      if (global.SNAi && SNAi.bootPresence) SNAi.bootPresence();
      recordCheck('SNAi', !!global.SNAi, 'present', null);
    } catch (e) {
      recordCheck('SNAi', false, e.message || e, null);
    }
    try {
      if (global.SNOsWill && SNOsWill.init) SNOsWill.init();
      if (global.SNOsWill && SNOsWill.rehydrate) SNOsWill.rehydrate();
      recordCheck('SNOsWill', !!global.SNOsWill, 'dynamic OS · every user is a developer', null);
    } catch (e) {
      recordCheck('SNOsWill', false, e.message || e, null);
    }
    try {
      recordCheck('SNAstranovMind', !!(global.SNAstranovMind || global.SNFreeMind), 'free mind', null);
    } catch (_) {}
  }

  function softAuth() {
    hdr('STAGE · auth (soft)');
    return loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js', 12000)
      .then(function () {
        ok('supabase-js');
        return loadScript('/js/spacenet/auth.js', 8000);
      })
      .then(function () {
        try {
          if (global.SNAuth && SNAuth.init) SNAuth.init();
          recordCheck('SNAuth', !!global.SNAuth, 'init', null);
        } catch (e) {
          recordCheck('SNAuth', false, e.message || e, null);
        }
      })
      .catch(function (e) {
        warn('auth soft-fail · ' + (e && e.message ? e.message : e));
        recordCheck('SNAuth', false, 'soft-fail', 'Auth optional until login · CORS on api.astranov.eu may block health');
      });
  }

  /* ───────── Health gate ───────── */
  function runHealthGate() {
    hdr('STAGE · health gate');
    var critical = ['document', 'cli-host', 'globe-host', 'SNCli', 'globe-canvas'];
    var failed = report.checks.filter(function (c) {
      return critical.indexOf(c.id) >= 0 && !c.pass;
    });
    var warnN = report.checks.filter(function (c) {
      return !c.pass;
    }).length;
    var passN = report.checks.filter(function (c) {
      return c.pass;
    }).length;
    info('checks · ' + passN + ' pass · ' + warnN + ' fail/warn · load ok ' + report.loadStats.ok + ' fail ' + report.loadStats.fail);
    if (failed.length) {
      report.degraded = true;
      report.ready = false;
      fail('HEALTH · ' + failed.length + ' critical failure(s)');
      failed.forEach(function (f) {
        fail('  · ' + f.id + (f.detail ? ' · ' + f.detail : ''));
        if (f.fix) fix(f.fix);
      });
      return false;
    }
    // globe required for ready
    var canvas = document.querySelector('#globe canvas');
    if (!canvas) {
      report.degraded = true;
      report.ready = false;
      fail('HEALTH · no globe canvas');
      fix('Type: repair display · or Retry boot');
      return false;
    }
    report.ready = true;
    report.degraded = warnN > 0;
    ok('HEALTH · system ' + (report.degraded ? 'DEGRADED but OPERATIONAL' : 'READY'));
    return true;
  }

  /* ───────── Repair ───────── */
  function repairDisplay() {
    hdr('REPAIR · display');
    return loadThree()
      .then(function () {
        return loadStage('display-repair', STAGE_DISPLAY, { soft: true });
      })
      .then(function () {
        var okC = initDisplay();
        if (okC) ok('repair display · canvas up');
        else fail('repair display · still no canvas');
        return okC;
      });
  }

  function repairKernel() {
    hdr('REPAIR · kernel');
    return loadStage('kernel-repair', STAGE_KERNEL, { soft: true }).then(function () {
      initKernel();
      return !!global.SNCli;
    });
  }

  function repairDrivers() {
    hdr('REPAIR · drivers');
    return loadStage('drivers-repair', STAGE_DRIVERS, { soft: true }).then(function () {
      initDrivers();
      return !!global.SNPolyScheduler;
    });
  }

  function fullDiagnostics() {
    hdr('DIAGNOSTICS · live');
    var items = [
      ['THREE', !!global.THREE],
      ['SNGlobe', !!global.SNGlobe],
      ['canvas', !!document.querySelector('#globe canvas')],
      ['SNCli', !!global.SNCli],
      ['SNField', !!global.SNField],
      ['SNPolyScheduler', !!global.SNPolyScheduler],
      ['SNPolyEngine', !!global.SNPolyEngine],
      ['SNReassignEngine', !!global.SNReassignEngine],
      ['SNSubscription', !!global.SNSubscription],
      ['SNAi', !!global.SNAi],
      ['SNAuth', !!global.SNAuth],
      ['SNMap', !!global.SNMap],
      ['power-btn', !!document.getElementById('sn-task-launch')],
    ];
    items.forEach(function (it) {
      if (it[1]) ok(it[0]);
      else fail(it[0] + ' · missing');
    });
    try {
      fetch('/api/health')
        .then(function (r) {
          return r.json();
        })
        .then(function (h) {
          ok('api/health · xai=' + !!h.xai + ' · paypal=' + !!h.paypal);
        })
        .catch(function () {
          warn('api/health · unreachable (static host ok)');
        });
    } catch (_) {}
    return items;
  }

  /* ───────── Handoff ───────── */
  function handoff(success) {
    hdr(success ? 'HANDOFF · operational' : 'HANDOFF · degraded');
    var ms = Math.round(performance.now() - t0);
    report.finishedAt = new Date().toISOString();
    report.bootMs = ms;
    try {
      localStorage.setItem('sn:os-boot-report', JSON.stringify(report));
    } catch (_) {}

    // Seed CLI with boot summary
    try {
      if (global.SNCli) {
        if (SNCli.init) SNCli.init();
        // expand CLI enough to read
        try {
          if (global.SNUi && SNUi.setSize) SNUi.setSize('mid');
          else {
            var panel = document.getElementById('panel');
            if (panel) {
              panel.classList.remove('collapsed');
              panel.classList.add('mid');
            }
          }
        } catch (_) {}
        SNCli.log('══════════════════════════════════════', 'ok', true);
        SNCli.log('Astranov SpaceNet Operating System · boot ' + ms + 'ms · ' + (success ? 'READY' : 'DEGRADED'), success ? 'ok' : 'err', true);
        SNCli.log('build ' + BUILD, 'dim', true);
        var fails = report.checks.filter(function (c) {
          return !c.pass;
        });
        if (fails.length) {
          SNCli.log('Failures: ' + fails.map(function (f) {
            return f.id;
          }).join(', '), 'err', true);
          fails.slice(0, 6).forEach(function (f) {
            if (f.fix) SNCli.log('FIX · ' + f.fix, 'dim', true);
          });
        } else {
          SNCli.log('All critical checks passed', 'ok', true);
        }
        SNCli.log('Commands: will · reshape · diagnostics · power on · plan status', 'dim', true);
        SNCli.log('You are a developer · speak changes · the OS reshapes to your will', 'ok', true);
        SNCli.log('══════════════════════════════════════', 'ok', true);
      }
    } catch (_) {}

    // Install CLI intercepts for OS commands
    installCliHooks();

    // Bootloader becomes the CLI — not a discarded splash
    if (success) {
      info('minimizing bootloader → CLI');
      setActions([
        {
          label: 'Continue',
          fn: function () {
            minimizeBootToCli();
          },
        },
        {
          label: 'Diagnostics',
          fn: function () {
            fullDiagnostics();
          },
        },
      ]);
      setTimeout(function () {
        minimizeBootToCli();
      }, 900);
    } else {
      setActions([
        {
          label: 'Retry boot',
          fn: function () {
            location.reload();
          },
        },
        {
          label: 'Repair display',
          fn: function () {
            repairDisplay().then(function (okC) {
              if (okC) {
                report.ready = true;
                handoff(true);
              }
            });
          },
        },
        {
          label: 'Repair kernel',
          fn: function () {
            repairKernel();
          },
        },
        {
          label: 'Open CLI degraded',
          fn: function () {
            minimizeBootToCli();
          },
        },
      ]);
      warn('System did not pass health gate · choose a fix above');
    }

    global.SNOsBoot = api;
    global.__snBooting = 0;
    try {
      document.dispatchEvent(new CustomEvent('sn:os-ready', { detail: report }));
    } catch (_) {}
  }

  /**
   * Morph full-screen bootloader into the dock CLI (OS continues in CLI).
   * Report lines are already seeded; expand CLI mid so user can read.
   */
  function minimizeBootToCli() {
    try {
      // Ensure map not covering globe
      try {
        if (global.SNMap && SNMap.active && SNMap.close) SNMap.close();
      } catch (_) {}
      // Ensure globe at GLOBAL if stuck deep without canvas sense
      try {
        if (global.SNGlobe && SNGlobe.goToTier) SNGlobe.goToTier('global');
      } catch (_) {}

      // Expand CLI with boot transcript
      try {
        if (global.SNCli && SNCli.init) SNCli.init();
      } catch (_) {}
      try {
        if (global.SNUi && SNUi.setSize) SNUi.setSize('mid');
        else {
          var panel = document.getElementById('panel');
          if (panel) {
            panel.classList.remove('collapsed', 'cli-quiet');
            panel.classList.add('mid');
            panel.style.maxHeight = '32vh';
          }
        }
      } catch (_) {}
      try {
        if (global.SNCli && SNCli.log) {
          SNCli.log('Astranov SpaceNet Operating System · bootloader → CLI · system online', 'ok', true);
          SNCli.log('Top: tap gadgets handle · Globe: wheel zoom (no spin) · power ON for tasks', 'dim', true);
        }
      } catch (_) {}
      // Focus CLI input
      try {
        var inp = document.getElementById('cli-in');
        if (inp) inp.placeholder = 'diagnostics · repair · power on · help';
      } catch (_) {}
    } catch (_) {}
    killOverlay();
  }

  function killOverlay() {
    try {
      var el = document.getElementById('boot');
      if (!el) return;
      el.classList.add('hide');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
      el.setAttribute('aria-busy', 'false');
      setTimeout(function () {
        try {
          el.remove();
        } catch (_) {}
      }, 180);
    } catch (_) {}
  }

  function installCliHooks() {
    try {
      if (!global.SNCli || typeof SNCli.run !== 'function') return;
      if (SNCli._snOsBound === SNCli.run) return;
      var orig = SNCli.run.bind(SNCli);
      SNCli.run = async function (raw) {
        var low = String(raw || '').trim().toLowerCase();
        if (
          low === 'boot' ||
          low === 'diagnostics' ||
          low === 'diag' ||
          low === 'repair' ||
          low === 'repair display' ||
          low === 'repair kernel' ||
          low === 'repair drivers' ||
          low === 'kernel status' ||
          low === 'os status' ||
          low === 'boot report'
        ) {
          try {
            if (SNCli.beginTurn) SNCli.beginTurn();
          } catch (_) {}
          try {
            if (SNCli.log) SNCli.log(String(raw).trim(), 'cmd');
          } catch (_) {}
          if (low === 'boot' || low === 'boot report' || low === 'kernel status' || low === 'os status') {
            SNCli.log('Astranov SpaceNet Operating System · ' + (report.ready ? 'READY' : 'NOT READY') + ' · ' + (report.bootMs || '?') + 'ms · build ' + BUILD, report.ready ? 'ok' : 'err');
            report.checks.slice(-20).forEach(function (c) {
              SNCli.log((c.pass ? '✓ ' : '✗ ') + c.id + (c.detail ? ' · ' + c.detail : ''), c.pass ? 'ok' : 'err');
            });
          } else if (low === 'diagnostics' || low === 'diag') {
            fullDiagnostics();
            lines.slice(-40).forEach(function (L) {
              if (SNCli.log) SNCli.log(L.tag + ' ' + L.msg, L.lvl === 'fail' ? 'err' : L.lvl === 'ok' ? 'ok' : 'dim', true);
            });
          } else if (low === 'repair' || low === 'repair display') {
            await repairDisplay();
          } else if (low === 'repair kernel') {
            await repairKernel();
          } else if (low === 'repair drivers') {
            await repairDrivers();
          }
          try {
            if (SNCli.endTurn) SNCli.endTurn();
          } catch (_) {}
          return;
        }
        return orig(raw);
      };
      SNCli._snOsBound = SNCli.run;
    } catch (_) {}
  }

  /* ───────── SNLoader bridge (compat) ───────── */
  function installLoader() {
    var MODULE_MAP = {
      engine: { src: '/js/spacenet/poly-engine.js', global: 'SNPolyEngine' },
      reassign: { src: '/js/spacenet/reassign-engine.js', global: 'SNReassignEngine' },
      poly: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
      money: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
      offers: { src: '/js/spacenet/poly-scheduler.js', global: 'SNPolyScheduler' },
      field: { src: '/js/spacenet/field.js', global: 'SNField' },
      map: { src: '/js/spacenet/map.js', global: 'SNMap' },
      globe: { src: '/js/spacenet/globe.js', global: 'SNGlobe' },
      ai: { src: '/js/spacenet/ai.js', global: 'SNAi' },
      subscription: { src: '/js/spacenet/subscription.js', global: 'SNSubscription' },
      will: { src: '/js/spacenet/os-will.js', global: 'SNOsWill' },
      'os-will': { src: '/js/spacenet/os-will.js', global: 'SNOsWill' },
      auth: { src: '/js/spacenet/auth.js', global: 'SNAuth' },
      helper: { src: '/js/spacenet/helper.js', global: 'SNHelper' },
      marina: { src: '/js/spacenet/marina-berths.js', global: 'SNMarina' },
    };
    global.SNLoader = {
      _p: {},
      ensure: function (names) {
        var list = Array.isArray(names) ? names : [names];
        var self = this;
        return Promise.all(
          list.map(function (n) {
            var key = String(n || '').toLowerCase();
            if (self._p[key]) return self._p[key];
            var entry = MODULE_MAP[key];
            if (!entry) return Promise.resolve();
            if (entry.global && global[entry.global]) return Promise.resolve();
            self._p[key] = loadScript(entry.src, 12000);
            return self._p[key];
          })
        );
      },
    };
    global.SNRecover = function (opts) {
      try {
        if (global.SNGlobe && SNGlobe.setGameMode) SNGlobe.setGameMode(false);
      } catch (_) {}
      try {
        document.body.classList.remove('sn-space-scene-on', 'sn-game-on');
      } catch (_) {}
      return true;
    };
    global.SNPerf = global.SNPerf || {};
  }

  /* ───────── MAIN SEQUENCE ───────── */
  async function boot() {
    ensureConsole();
    installLoader();
    hdr('Astranov SpaceNet Operating System');
    info('Astranov SpaceNet Operating System');
    info('build ' + BUILD);
    info('time ' + new Date().toISOString());
    info('professional delivery OS · every user is a developer');

    try {
      checkDom();

      await loadStage('kernel', STAGE_KERNEL, { soft: false, timeout: 14000 }).catch(async function (e) {
        fail('kernel hard-fail · ' + (e && e.message ? e.message : e));
        fix('Retry boot · check network · CDN');
        await loadStage('kernel-soft', STAGE_KERNEL, { soft: true });
      });
      initKernel();

      await loadThree();
      await loadStage('display', STAGE_DISPLAY, { soft: true });
      var displayOk = initDisplay();
      if (!displayOk) {
        warn('display failed · auto-repair once');
        await repairDisplay();
        displayOk = !!document.querySelector('#globe canvas');
      }

      await loadStage('drivers', STAGE_DRIVERS, { soft: true });
      initDrivers();
      // Guard: boot must be GLOBAL globe, not a random city dive
    try {
      if (global.SNGlobe && SNGlobe.goToTier && SNGlobe.currentTier) {
        var tier = SNGlobe.currentTier();
        if (tier && tier !== 'global' && tier !== 'orbit' && tier !== 'planet') {
          SNGlobe.goToTier('global');
          warn('boot guard · returned to GLOBAL globe');
        }
      }
    } catch (_) {}
    // Never boot into truncated street map
      try {
        if (global.SNMap && SNMap.active && SNMap.close) {
          SNMap.close();
          warn('closed street map on boot · stay on 3D globe');
        }
      } catch (_) {}
      try {
        document.body.classList.remove('city-map-on');
        var cm = document.getElementById('city-map');
        if (cm) cm.classList.remove('active');
      } catch (_) {}

      // Services non-blocking parallel with auth
      var svc = loadStage('services', STAGE_SERVICES, { soft: true }).then(function () {
        initServices();
      });
      var auth = softAuth();
      await Promise.race([
        Promise.all([svc, auth]),
        new Promise(function (r) {
          setTimeout(r, 8000);
        }),
      ]);
      // don't wait forever on services
      setTimeout(function () {
        try {
          initServices();
        } catch (_) {}
      }, 100);

      var healthy = runHealthGate();
      global.SNPerf.bootMs = Math.round(performance.now() - t0);
      global.SNPerf.shellMs = global.SNPerf.bootMs;
      handoff(healthy);

      // Late service finish
      svc.then(function () {
        initServices();
        installCliHooks();
      }).catch(function () {});
      auth.then(function () {
        installCliHooks();
      }).catch(function () {});
    } catch (e) {
      fail('BOOTLOADER EXCEPTION · ' + (e && e.message ? e.message : e));
      fix('Retry boot');
      setActions([
        {
          label: 'Retry boot',
          fn: function () {
            location.reload();
          },
        },
        {
          label: 'Enter degraded',
          fn: function () {
            killOverlay();
          },
        },
      ]);
      report.ready = false;
      report.degraded = true;
      try {
        localStorage.setItem('sn:os-boot-report', JSON.stringify(report));
      } catch (_) {}
    }
  }

  var api = {
    boot: boot,
    report: function () {
      return report;
    },
    lines: function () {
      return lines.slice();
    },
    diagnostics: fullDiagnostics,
    repairDisplay: repairDisplay,
    repairKernel: repairKernel,
    repairDrivers: repairDrivers,
    killOverlay: killOverlay,
    minimizeBootToCli: minimizeBootToCli,
    out: out,
  };
  global.SNOsBoot = api;
  global.SNOsBootloader = api;

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      boot();
    });
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
