/* Astranov live activity CLI
 * Feed = your turn only · lines stream like a living terminal.
 * Map / globe depict what the system is doing (camera · pulse · routes).
 * No boot spam · no left-bar chat cards · no free-floating noise.
 */
(function (global) {
  'use strict';

  const hist = [];
  let histIdx = -1;
  const FEED_MAX = 120;
  let feedFilter = '';
  let stickBottom = true;
  /** >0 while handling user send — only then may feed write */
  let turnOpen = 0;
  let activityLabel = 'idle';

  function $(id) {
    return document.getElementById(id);
  }

  function setActivity(label) {
    activityLabel = String(label || 'idle').slice(0, 28);
    const el = $('cli-activity');
    if (el) el.textContent = activityLabel;
  }

  /** User-facing speech only — never engine names (Leaflet) or internal OS dumps */
  function userFace(text) {
    return String(text || '')
      .replace(/\bLeaflet\b/gi, 'map')
      .replace(/\bleaflet\b/gi, 'map')
      .replace(/\bOpenStreetMap\b/gi, 'street map')
      .replace(/\bOverpass\b/gi, 'map search')
      .replace(/\bOpenSky\b/gi, 'air traffic')
      .replace(/\bCarto\b/gi, 'map style')
      .replace(/\bSPACENET\b/g, 'Astranov')
      .replace(/\bSpaceNet\b/g, 'Astranov')
      .replace(/\bspacenet\b/g, 'astranov')
      .replace(/\bAlmighty crawl\b/gi, 'Looking around')
      .replace(/\bAlmighty\b/gi, 'Search')
      .replace(/\bEdge vendors upsert\b/gi, 'Shops found')
      .replace(/\bEdge vendors\b/gi, 'Shops')
      .replace(/\bfree mind\b/gi, 'me')
      .replace(/https?:\/\/[a-z0-9-]+\.supabase\.co[^\s]*/gi, 'astranov.eu')
      .replace(/\bsupabase(?:\.co)?\b/gi, 'astranov.eu')
      .replace(/\bSNGlobe\b/g, 'globe')
      .replace(/\bGIS path\b/gi, 'Google sign-in')
      .replace(/\bDB shops\b/gi, 'shops')
      .replace(/\b thrash\b/gi, '')
      // Kill junk categories that used to flood the feed
      .replace(/\bNigerian comedy films\b/gi, '')
      .replace(/\bd3-polygon\b/gi, '')
      .replace(/\bAtari\b/gi, '')
      .replace(/\s*[·]\s*/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * GPS locate that does NOT require the 3D globe module.
   * Returns { lat, lng, fallback, reason?, accuracy? }
   */
  function gpsLocate() {
    return new Promise(function (resolve) {
      const rhodes = { lat: 36.4341, lng: 28.2176, fallback: true };
      if (!navigator.geolocation) {
        resolve(Object.assign({}, rhodes, { reason: 'unsupported' }));
        return;
      }
      if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
        resolve(Object.assign({}, rhodes, { reason: 'insecure' }));
        return;
      }
      let done = false;
      const finish = function (r) {
        if (done) return;
        done = true;
        resolve(r);
      };
      const t = setTimeout(function () {
        finish(Object.assign({}, rhodes, { reason: 'timeout' }));
      }, 16000);
      try {
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            clearTimeout(t);
            finish({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              fallback: false,
              accuracy: pos.coords.accuracy,
            });
          },
          function (err) {
            clearTimeout(t);
            const code = err && err.code;
            finish(
              Object.assign({}, rhodes, {
                reason: code === 1 ? 'denied' : code === 2 ? 'unavailable' : code === 3 ? 'timeout' : 'error',
                code: code,
              })
            );
          },
          { enableHighAccuracy: true, timeout: 14000, maximumAge: 20000 }
        );
      } catch (e) {
        clearTimeout(t);
        finish(Object.assign({}, rhodes, { reason: 'error' }));
      }
    });
  }

  function setLive(on) {
    try {
      const panel = $('panel');
      if (panel) panel.classList.toggle('cli-live', !!on);
    } catch (_) {}
  }

  function beginTurn() {
    turnOpen++;
    setLive(true);
    setActivity('working');
    try {
      const panel = $('panel');
      if (panel && panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed', 'mid');
        panel.classList.add('expanded');
      }
    } catch (_) {}
  }

  function endTurn() {
    turnOpen = Math.max(0, turnOpen - 1);
    if (turnOpen === 0) {
      setLive(false);
      setActivity('idle');
    }
  }

  function inTurn() {
    return turnOpen > 0;
  }

  /**
   * Depict CLI activity on map / globe — the world is the UI.
   * kind: locate|fly|shops|order|delivery|global|city|food|pulse|work
   */
  function depict(kind, opts) {
    opts = opts || {};
    const G = global.SNGlobe;
    const M = global.SNMap;
    const pos =
      opts.lat != null
        ? { lat: Number(opts.lat), lng: Number(opts.lng) }
        : global._snLastPos ||
          (global.SNTasks && SNTasks.pos) ||
          (G && G.focusPos && G.focusPos()) ||
          null;
    try {
      if (kind === 'locate' || kind === 'pulse') {
        if (pos && G && G.pulse) G.pulse(pos.lat, pos.lng, 0x3d9eff, opts.label || 'You', 14000);
        if (pos && G && G.flyNear) G.flyNear(pos.lat, pos.lng, opts.tier || 'national');
        if (G && G.setHud) G.setHud(opts.label || 'Locate');
        setActivity(kind === 'locate' ? 'locate' : 'pulse');
        return;
      }
      if (kind === 'global') {
        if (G && G.goToTier) G.goToTier('global');
        if (M && M.close) M.close();
        if (G && G.setHud) G.setHud('GLOBAL Earth');
        setActivity('global');
        return;
      }
      if (kind === 'city' || kind === 'map') {
        if (pos && M && M.open) void M.open(pos.lat, pos.lng);
        if (G && G.setHud) G.setHud(opts.label || 'City map');
        setActivity('city');
        return;
      }
      if (kind === 'fly' || kind === 'go') {
        if (pos && G && G.goToPlace) {
          G.goToPlace(pos.lat, pos.lng, {
            tier: opts.tier || 'national',
            body: opts.body || 'earth',
            pulse: true,
            label: opts.label || '',
            openMap: !!opts.openMap,
          });
        } else if (pos && G && G.flyNear) {
          G.flyNear(pos.lat, pos.lng, opts.tier || 'national');
        }
        if (G && G.setHud) G.setHud(opts.label || 'Fly');
        setActivity('fly');
        return;
      }
      if (kind === 'shops' || kind === 'food' || kind === 'vendors') {
        if (pos && G && G.goToPlace) {
          G.goToPlace(pos.lat, pos.lng, {
            tier: 'city',
            body: 'earth',
            pulse: true,
            label: opts.label || 'Vendors',
            openMap: true,
          });
        } else if (pos && M && M.open) {
          void M.open(pos.lat, pos.lng);
        }
        if (M && M.showProfiles) M.showProfiles();
        if (pos && G && G.pulse) G.pulse(pos.lat, pos.lng, 0xffcc44, opts.label || 'Shop', 16000);
        if (G && G.setHud) G.setHud(opts.label || 'Shops');
        setActivity(kind === 'food' ? 'food' : 'shops');
        return;
      }
      if (kind === 'order' || kind === 'delivery' || kind === 'tasks') {
        if (pos && M && M.open) void M.open(pos.lat, pos.lng);
        if (M && M.showTasks) M.showTasks();
        if (M && M.showProfiles) M.showProfiles();
        try {
          if (global.SNField && SNField.refreshRoutes) void SNField.refreshRoutes(true);
        } catch (_) {}
        if (pos && G && G.pulse) G.pulse(pos.lat, pos.lng, 0x00dcff, opts.label || 'Route', 18000);
        if (G && G.setHud) G.setHud(opts.label || 'Delivery');
        setActivity(kind === 'order' ? 'order' : 'route');
        return;
      }
      if (kind === 'work') {
        setActivity(opts.label || 'work');
        if (G && G.setHud) G.setHud(opts.label || 'Working…');
        return;
      }
    } catch (e) {
      console.warn('[SNCli.depict]', e);
    }
  }

  /** Stream a progress line + optional map depict in one call */
  function activity(text, mapKind, mapOpts) {
    if (mapKind) depict(mapKind, mapOpts || {});
    if (text) {
      setActivity(String(text).slice(0, 24));
      preview(text);
      return log(text, 'dim');
    }
    return null;
  }

  function feedBox() {
    const box = $('cli-log');
    if (!box) return null;
    try {
      const strip = $('cli-tile-strip');
      if (strip) strip.remove();
      const exp = $('cli-tile-expand');
      if (exp) exp.remove();
    } catch (_) {}
    let hint = $('cli-feed-search-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'cli-feed-search-hint';
      box.insertBefore(hint, box.firstChild);
    }
    if (!box._snFeedBound) {
      box._snFeedBound = true;
      box.addEventListener(
        'scroll',
        () => {
          stickBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
        },
        { passive: true }
      );
    }
    return box;
  }

  function trimFeed(box) {
    if (!box) return;
    while (box.children.length > FEED_MAX + 2) {
      const n = box.children[1] || box.firstChild;
      if (n && n.id === 'cli-feed-search-hint') {
        if (box.children[2]) box.removeChild(box.children[2]);
        else break;
      } else if (n) box.removeChild(n);
      else break;
    }
  }

  function scrollFeedToEnd(box) {
    if (!box || !stickBottom || feedFilter) return;
    box.scrollTop = box.scrollHeight;
  }

  function applyFeedFilter(q) {
    const box = feedBox();
    if (!box) return 0;
    feedFilter = String(q || '')
      .trim()
      .toLowerCase()
      .replace(/^[/？?]\s*/, '')
      .replace(/^search\s+/i, '');
    const hint = $('cli-feed-search-hint');
    let n = 0;
    if (!feedFilter) {
      box.classList.remove('filtering');
      if (hint) hint.textContent = '';
      box.querySelectorAll('.cli-feed-item').forEach((el) => el.classList.remove('match'));
      return 0;
    }
    box.classList.add('filtering');
    box.querySelectorAll('.cli-feed-item').forEach((el) => {
      const hay = (el.getAttribute('data-search') || el.textContent || '').toLowerCase();
      const ok = hay.indexOf(feedFilter) >= 0;
      el.classList.toggle('match', ok);
      if (ok) n++;
    });
    if (hint) {
      hint.textContent =
        n > 0
          ? 'Search · “' + feedFilter + '” · ' + n + ' · clear input to exit'
          : 'Search · “' + feedFilter + '” · no matches · clear input to exit';
    }
    return n;
  }

  /**
   * Live stream line — ONLY during user turn (or force).
   * No card chrome · map may already be moving via depict().
   */
  function log(text, cls, force) {
    if (!force && !inTurn()) {
      if (cls === 'err') {
        try {
          preview(String(text || '').slice(0, 90));
        } catch (_) {}
      }
      return null;
    }
    const box = feedBox();
    if (!box) return null;
    box.querySelectorAll('.cli-feed-item.is-latest').forEach((el) => {
      el.classList.remove('is-latest');
    });
    const wrap = document.createElement('div');
    wrap.className = 'cli-feed-item is-latest';
    if (cls === 'dim' || cls === 'progress') wrap.classList.add('cli-act');
    const line = document.createElement('div');
    const kind = cls === 'dim' ? 'progress' : cls || 'ok';
    line.className = 'cli-line' + (kind ? ' ' + kind : '');
    const face = userFace(text);
    const body = document.createElement('div');
    body.className = 'cli-body';
    body.textContent = face;
    line.appendChild(body);
    wrap.appendChild(line);
    wrap.setAttribute('data-search', String(face || ''));
    if (feedFilter) {
      wrap.classList.toggle(
        'match',
        String(face || '')
          .toLowerCase()
          .indexOf(feedFilter) >= 0
      );
    }
    box.appendChild(wrap);
    trimFeed(box);
    scrollFeedToEnd(box);
    if (cls === 'ok' || cls === 'cmd') preview(String(face || '').slice(0, 90));
    return wrap;
  }

  /** Dead API — tiles never inject into CLI (map multi-tile only) */
  function appendTilePost() {
    return null;
  }

  function preview(text) {
    const face = userFace(text);
    const el = $('cli-preview');
    if (el) el.textContent = face || '';
    try {
      if (global.SNGlobe?.setHud) SNGlobe.setHud(String(face || '').slice(0, 72));
    } catch (_) {}
  }

    function help() {
    log("Hey — I'm Astranov Mind. Your memory on this app.", 'ok');
    log('Village: aksaki · pitogyra · mpyronia · Archangelos · Telemachos pilot', 'ok');
    log('Order: order me a pizza you judge…  OR  order pitogyra mpyronia', 'ok');
    log('Money loop: first delivery · order me · drive on · deliver me · market status', 'ok');
    log('Team: coord need driver and vendor for pizza for 3 · assign 2 drivers nearest', 'ok');
    log('Plans: plan list · plan status · claim · task list · task map', 'dim');
    log('Map: locate · shops · fly athens · fly archangelos · dark map', 'dim');
    log('Mind: mind · mind wipe · cancel · pilot home', 'dim');
    preview('Astranov Mind · talk Greeklish or English');
  }

  function moneyStatus() {
    const C = global.SNCurrency;
    if (!C) {
      log('Currency offline', 'err');
      return;
    }
    (C.status?.() || ['S primary']).forEach((ln) =>
      log(ln, /PRIMARY|Wallet|secondary|Fees/i.test(ln) ? 'ok' : 'dim')
    );
    preview('S ' + (C.format?.(C.balance?.() || 0) || '') + ' · index ' + (C.networkIndex?.()?.toFixed?.(4) || '?'));
  }

  function dumpBrain(mode) {
    const B = global.SNBrain;
    if (!B) {
      log('Brain offline — js/spacenet/brain.js missing', 'err');
      return;
    }
    if (mode === 'verify') {
      const v = B.verify();
      log(v.ok ? '── Brain VERIFY OK ──' : '── Brain VERIFY FAIL ──', v.ok ? 'ok' : 'err');
      (v.checks || []).forEach((c) => {
        log((c.pass ? '✓ ' : '✗ ') + c.id + (c.detail ? ' · ' + c.detail : ''), c.pass ? 'ok' : 'err');
      });
      preview(v.ok ? 'Brain OK · ' + v.build : 'Brain FAIL');
      return;
    }
    const lines = mode === 'law' ? B.lawLines() : B.summaryLines();
    lines.forEach((ln) => log(ln, /✗|FAIL|WHY/.test(ln) ? 'dim' : 'ok'));
    preview('Astranov Brain · type verify');
  }

  const CITIES = {
    athens: [37.9838, 23.7275],
    rhodes: [36.4341, 28.2176],
    rodos: [36.4341, 28.2176],
    london: [51.5074, -0.1278],
    paris: [48.8566, 2.3522],
    berlin: [52.52, 13.405],
    rome: [41.9028, 12.4964],
    newyork: [40.7128, -74.006],
    tokyo: [35.6762, 139.6503],
    dubai: [25.2048, 55.2708],
    starbase: [25.997, -97.156],
  };

  async function run(raw) {
    let line = String(raw || '').trim();
    if (!line) return;
    // Astranov Mind — Archangelos / Greeklish before routing
    try {
      if (global.ArcangeloDialect && ArcangeloDialect.normalizeForRouting) {
        const n = ArcangeloDialect.normalizeForRouting(line);
        if (n) line = n;
      }
    } catch (_) {}
    // /search or ?query → filter feed only (does not pollute history)
    if (/^[/？?]/.test(line) || /^search\s+/i.test(line)) {
      const q = line.replace(/^search\s+/i, '').replace(/^[/？?]\s*/, '');
      if (!q) {
        applyFeedFilter('');
        preview('Search off');
        return;
      }
      const n = applyFeedFilter(q);
      preview(n + ' match · clear / to exit');
      return;
    }
    beginTurn();
    hist.push(line);
    histIdx = hist.length;
    if (feedFilter) applyFeedFilter('');
    log(line, 'cmd');
    global.SNRibbon?.infer?.(line);

    const low = line.toLowerCase();
    const Tasks = global.SNTasks;
    const Globe = global.SNGlobe;

    try {
      if (low === 'help' || low === '?' || low === 'commands') {
        help();
        return;
      }
      if (low === 'clear' || low === 'clear feed') {
        const box = feedBox();
        if (box) {
          box.innerHTML = '';
          const hint = document.createElement('div');
          hint.id = 'cli-feed-search-hint';
          box.appendChild(hint);
        }
        applyFeedFilter('');
        stickBottom = true;
        preview('cleared');
        return;
      }
      if (low === 'brain' || low === 'memory') {
        dumpBrain('summary');
        return;
      }
      // Real use: task board · route-compatible jobs
      if (
        low === 'sim task' ||
        /^sim\s+task\b/.test(low) ||
        low === 'sim route' ||
        low === 'drive task' ||
        /^sim\b/.test(low)
      ) {
        log('Sim/training removed · use task list · claim · deliver · task map', 'dim');
        return;
      }
                  if (low === 'task fit' || low === 'tasks fit' || low === 'compatible' || low === 'fit tasks') {
        if (global.SNTaskBoard?.listCompatibleOnCli) SNTaskBoard.listCompatibleOnCli();
        else log('Task board loading · hard refresh', 'err');
        return;
      }
      // Plan queries first (before isCoordIntent — "plan" must not create)
      if (low === 'plan list' || low === 'plans' || low === 'plans list') {
        const plans = Tasks?.listPlans?.({ all: true }) || [];
        if (!plans.length) {
          log('No plans · coord need driver and vendor for pizza for 3', 'dim');
        } else {
          plans.slice(0, 12).forEach((p) => {
            log(
              (p.status || 'open') +
                ' · ' +
                String(p.id).slice(-8) +
                (p.food ? ' · ' + p.food : '') +
                (p.party ? ' · ×' + p.party : '') +
                ' · ' +
                (p.taskIds?.length || 0) +
                ' tasks',
              'ok'
            );
          });
        }
        preview(plans.length + ' plans');
        return;
      }
      if (low === 'plan status' || low === 'plan' || /^plan\s+status\b/.test(low)) {
        const idPart = line.replace(/^plan(\s+status)?\s*/i, '').trim();
        const st = Tasks?.planStatus?.(idPart || undefined);
        if (st?.ok) {
          const body = Tasks.formatPlanCli?.(st) || st.reply;
          String(body)
            .split('\n')
            .forEach((ln) => {
              if (ln.trim()) log(ln.trim(), 'ok');
            });
          preview('Plan status');
        } else log(st?.error || 'no plan', 'dim');
        return;
      }
      // Multi-user coordination plans (P0)
      if (
        /^coord\b|^coordinate\b|^team\b/.test(low) ||
        (Tasks?.isCoordIntent && Tasks.isCoordIntent(line))
      ) {
        const text = line.replace(/^(coord|coordinate|team)\s*/i, '').trim() || line;
        activity('coordinating…', 'work', { label: 'Coord' });
        const r = Tasks?.createPlan?.(text);
        if (r?.ok) {
          const body = Tasks.formatPlanCli?.(r) || r.reply || 'Plan created';
          String(body)
            .split('\n')
            .forEach((ln) => {
              if (ln.trim()) log(ln.trim(), 'ok');
            });
          preview('Plan · ' + (r.tasks?.length || 0) + ' tasks');
          try {
            if (global.SNMap?.active) {
              global.SNMap.showTasks?.();
              global.SNMap.showProfiles?.();
            }
          } catch (_) {}
        } else log(r?.error || 'Could not create plan', 'err');
        return;
      }
      if (/^assign\b/.test(low)) {
        activity('assigning…', 'work', { label: 'Assign' });
        const r = Tasks?.assignPlan?.(line);
        if (r?.ok) {
          const body = Tasks.formatPlanCli?.(r) || r.reply || 'Assigned';
          String(body)
            .split('\n')
            .forEach((ln) => {
              if (ln.trim()) log(ln.trim(), 'ok');
            });
          preview('Assigned');
        } else log(r?.error || 'assign failed', 'err');
        return;
      }
      if (low === 'advise' || low === 'traffic' || low === 'scan advise') {
        if (global.SNTaskBoard?.adviseScan) SNTaskBoard.adviseScan();
        else log('Advise offline', 'dim');
        return;
      }
      if (/^task\s+open\b|^open\s+task\b/.test(low)) {
        const id = line.replace(/^(task\s+open|open\s+task)\s*/i, '').trim();
        const open = Tasks?.list?.({ all: true }) || [];
        const t =
          (id && open.find((x) => x.id === id || String(x.title || '').toLowerCase().includes(id.toLowerCase()))) ||
          open[0];
        if (t && global.SNTaskBoard?.openTaskTile) SNTaskBoard.openTaskTile(t);
        else log('No task · task list', 'dim');
        return;
      }
      if (low === 'task map' || low === 'tasks map' || low === 'preview tasks') {
        const open = Tasks?.list?.({ all: true }) || [];
        const t =
          open.find((x) => x.status === 'claimed' || x.status === 'in_progress') || open[0];
        if (t && global.SNTaskBoard?.previewTaskOnMap)
          await SNTaskBoard.previewTaskOnMap(t, { fit: true, force: true });
        else log('No tasks to preview', 'dim');
        return;
      }
      if (low === 'super' || low === 'fleet' || low === 'super deck') {
        if (global.SNSuper && SNSuper.show) SNSuper.show();
        else log('Super deck loading · hard refresh', 'err');
        return;
      }
      if (/^bridge\b/.test(low)) {
        const rest = line.replace(/^bridge\s*/i, '').trim();
        if (!rest || rest === 'status') {
          log(
            'Bridge · ' +
              (global.SNLiveBridge?.bridgeUrl?.() || 'n/a') +
              ' · seq ' +
              (global.SNLiveBridge?.lastSeq || 0),
            'dim'
          );
          return;
        }
        if (global.SNLiveBridge?.inject) {
          SNLiveBridge.inject([{ op: 'cli', text: rest }]);
          log('Bridge inject · cli ' + rest, 'ok');
        }
        return;
      }
      // Astranov Mind — permanent owner memory
      if (
        low === 'free mind' ||
        low === 'free ai' ||
        low === 'astranov mind' ||
        low === 'mind status' ||
        low === 'mind' ||
        low === 'my mind'
      ) {
        const st = (global.SNAstranovMind || global.SNFreeMind)?.status?.() || {};
        log('── Astranov Mind ──', 'ok');
        log(
          'Owner memory · ' +
            (st.learned || 0) +
            ' lived notes · ' +
            (st.seeds || 0) +
            ' seed memories · train ' +
            (st.train || 'v6') +
            ' · evolves forever',
          'ok'
        );
        log('English · Greek · Greeklish · ancient · Telemachos · tray pitogyra mpyronia', 'dim');
        log('If broken speech: mind wipe · then hard refresh', 'dim');

        preview('Astranov Mind');
        global.SNGlobe?.setHud?.('ASTRANOV MIND');
        return;
      }
      if (
        low === 'telemachos' ||
        low === 'tilemaxos' ||
        low === 'pilot' ||
        low === 'drone' ||
        /^pilot\b|^telemach|^tilemax|^deliver\b/i.test(low)
      ) {
        if (global.SNTelemachos?.cli) {
          const r = await SNTelemachos.cli(line);
          log(
            r?.tray
              ? 'Telemachos · ' + r.tray
              : 'Telemachos (Τηλέμαχος) · drone pilot ready',
            'ok'
          );
          preview('Telemachos');
        } else log('Telemachos loading · hard refresh', 'err');
        return;
      }
      if (low === 'archangelos' || low === 'arcangelo' || /^fly\s+archangel/i.test(low)) {
        if (global.SNTelemachos?.flyHome) await SNTelemachos.flyHome();
        else log('Archangelos · 36.215, 28.125 Rhodes', 'ok');
        preview('Archangelos');
        return;
      }
      if (
        low === 'mind wipe' ||
        low === 'wipe mind' ||
        low === 'forget all' ||
        low === 'clear mind' ||
        low === 'mind reset'
      ) {
        try {
          const w = global.SNFreeMind?.wipe?.('cli');
          log('Memory cleared. Fresh start — talk normally.', 'ok');
          log('Notes kept: ' + (w && w.learned != null ? w.learned : '?'), 'dim');
          preview('Fresh');
        } catch (eW) {
          log('Could not clear memory — hard refresh the page.', 'err');
        }
        return;
      }
      if (low === 'free export' || low === 'mind export' || low === 'export mind') {
        try {
          const pack = global.SNFreeMind?.exportTrainset?.();
          if (!pack) {
            log('Free mind loading · hard refresh', 'err');
            return;
          }
          const json = JSON.stringify(pack, null, 2);
          if (navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText(json).then(
              () => log('Trainset copied · ' + pack.count + ' rows', 'ok'),
              () => log('Copy failed · see console', 'err')
            );
          } else {
            log('Trainset ' + pack.count + ' rows · clipboard unavailable', 'dim');
          }
          console.log('[SNFreeMind trainset]', pack);
          preview(pack.count + ' train rows');
        } catch (e) {
          log('Export fail · ' + (e.message || e), 'err');
        }
        return;
      }
      if (/^teach\b/i.test(low)) {
        if (global.SNAi?.ask) {
          const reply = await SNAi.ask(line);
          if (reply) {
            log(reply, 'ok');
            preview(String(reply).slice(0, 80));
          }
        } else if (global.SNFreeMind?.answer) {
          const r = SNFreeMind.answer(line);
          log(r.text || 'noted', 'ok');
        }
        return;
      }
      if (low === 'law' || low === 'rules' || low === 'invariants') {
        dumpBrain('law');
        return;
      }
      if (low === 'verify' || low === 'check' || low === 'brain verify' || low === 'verify brain') {
        dumpBrain('verify');
        return;
      }
      // next / show all / prev → AI vendor carousel (globe + tile)
      if (
        /^(next|επόμεν|επομεν|άλλο|αλλο|another|next\s*one|n|prev|previous|back|show\s*all|all|όλα|ολα|όλοι|ολοι)$/i.test(
          low
        ) ||
        low === '>>' ||
        low === '<<'
      ) {
        if (global.SNAi?.ask) {
          const reply = await SNAi.ask(line);
          if (reply) {
            log(reply, 'ok');
            preview(String(reply).slice(0, 80));
          }
        } else log('AI loading · hard refresh', 'err');
        return;
      }
      // Escape pizza / order pause
      if (
        /\b(cancel|stop order|clear order|never mind|forget (it|the order)|abort|unstick)\b/i.test(
          low
        )
      ) {
        try {
          global.SNMarket?.clearPending?.('Order pause cleared');
        } catch (_) {}
        log("Cleared. Not stuck on pizza — say what you need.", 'ok');
        preview('ready');
        return;
      }
      // Pending lazy-order location confirm — exact yes/no only
      if (
        global.SNMarket?.loadPending?.() &&
        (global.SNMarket.isLocConfirmLine?.(line) ||
          /^(yes|y|ok|okay|no|nope|wrong|ν|ναι|όχι)$/i.test(low))
      ) {
        activity('location check…', 'work', { label: 'Confirm' });
        const cr = await global.SNMarket.confirmLocationAndOrder(line);
        if (cr?.summary) {
          String(cr.summary)
            .split('\n')
            .forEach((ln) => {
              if (ln.trim()) log(ln.trim(), /failed|reject|error/i.test(ln) ? 'err' : 'ok');
            });
        } else if (cr?.reply) log(cr.reply, cr.ok ? 'ok' : 'err');
        if (cr?.best) {
          depict(cr.ok ? 'order' : 'locate', {
            lat: cr.best?.lat || cr.pos?.lat,
            lng: cr.best?.lng || cr.pos?.lng,
            label: cr.best?.shopName || cr.best?.name || 'You',
          });
        }
        preview(cr?.eatLine || cr?.reply || 'done');
        if (cr?.eatLine) replyOut(cr.eatLine);
        return;
      }
      // Food — strict parser only. Full pay loop only when user orders.
      {
        const fi = global.SNMarket?.parseFoodIntent?.(line);
        if (
          fi &&
          !/^(list\s+shop|menu\s+add|order\s+me\s*$|drive\s+on|first\s+delivery)/i.test(low)
        ) {
          const wantOrder =
            fi.autoOrder === true ||
            fi.lazyJudge === true ||
            (/\border\b/i.test(low) &&
              /\b(pizza|sushi|burger|coffee|food|souvlaki|kebab)\b/i.test(low));
          fi.autoOrder = wantOrder;
          fi.lazyJudge = wantOrder;
          fi.browseOnly = !wantOrder;
          fi.raw = line;
          activity(
            (wantOrder ? 'ordering ' : 'finding ') + (fi.food || 'food') + '…',
            'food',
            { label: fi.food || 'food' }
          );
          const r = await global.SNMarket.fulfillFoodIntent(fi, {
            autoOrder: wantOrder,
            quiet: false,
            judgeAll: wantOrder,
          });
          if (r?.best) {
            depict(wantOrder ? 'order' : 'food', {
              lat: r.best.lat,
              lng: r.best.lng,
              label: r.best.shopName || r.best.name || fi.food,
            });
          }
          if (r?.needsConfirm) {
            log(r.reply || 'Is this your location? Yes or no.', 'ok');
            preview('waiting · yes / no');
            replyOut(r.reply || 'Is this your location?');
            return;
          }
          if (r?.summary && wantOrder) {
            String(r.summary)
              .split('\n')
              .forEach((ln) => {
                if (ln.trim())
                  log(ln.trim(), /failed|error|PAY · failed|reject/i.test(ln) ? 'err' : 'ok');
              });
          } else if (r?.reply) log(r.reply, r.ok ? 'ok' : 'err');
          else if (r?.error) log(r.error, 'err');
          else if (!wantOrder && r?.best)
            log('Found ' + (r.best.shopName || r.best.name) + ' — say order to buy.', 'ok');
          preview(r?.eatLine || r?.reply || (r?.ok ? 'done' : 'ok'));
          if (r?.eatLine) replyOut(r.eatLine);
          else if (r?.reply) replyOut(r.reply);
          return;
        }
      }
      // First marketplace loop + usage (SpaceNet coaches the same path)
      if (
        low === 'first delivery' ||
        low === 'first loop' ||
        low === 'first order' ||
        low === 'πρώτη παράδοση'
      ) {
        activity('first order · reshaping map…', 'work', { label: 'First order' });
        depict('shops', { label: 'First order' });
        log('first order · shop → menu → pay → drive → you', 'ok');
        if (global.SNMarket?.runFirstLoop) {
          const r = await global.SNMarket.runFirstLoop({ skipLocate: true });
          if (r?.ok) {
            const p = global._snLastPos || global.SNTasks?.pos;
            if (p) depict('delivery', { lat: p.lat, lng: p.lng, label: 'Delivered' });
            log('shop live · ' + (r.listed?.shop || 'ok'), 'ok');
            log(
              'menu · ' +
                (r.menu?.item?.name || 'item') +
                ' · ' +
                (global.SNCurrency?.format?.(r.menu?.item?.price ?? r.total) ||
                  (r.total != null ? r.total + ' S' : '')),
              'ok'
            );
            log(
              'paid · ' +
                (global.SNCurrency?.format?.(r.total ?? r.order?.total) ||
                  (r.order?.total != null ? r.order.total + ' S' : 'S')),
              'ok'
            );
            log('driver claimed · delivered to you', 'ok');
            log('FIRST ORDER COMPLETE', 'ok');
            preview('FIRST ORDER DONE · on map');
          } else {
            log(
              'first order failed · ' +
                (r?.error ||
                  r?.order?.error ||
                  r?.delivery?.error ||
                  r?.listed?.error ||
                  r?.menu?.error ||
                  'unknown'),
              'err'
            );
          }
        } else {
          log('Market not loaded · hard refresh', 'err');
        }
        return;
      }
      if (/^list\s+shop\b/.test(low) || /^shop\s+name\b/.test(low)) {
        const name = line.replace(/^(list\s+shop|shop\s+name)\s+/i, '').trim() || 'My shop';
        const r = global.SNMarket?.listShop?.(name);
        log(r?.ok ? 'Shop listed · ' + r.shop + ' · next: menu add Name 5' : r?.error || 'fail', r?.ok ? 'ok' : 'err');
        return;
      }
      if (/^menu\s+add\b/.test(low) || /^add\s+item\b/.test(low)) {
        const m = line.match(/^(?:menu\s+add|add\s+item)\s+(.+?)\s+(\d+(?:[.,]\d+)?)/i);
        if (!m) {
          log('Usage: menu add Espresso 3.5', 'dim');
          return;
        }
        const r = global.SNMarket?.addMenuItem?.(m[1].trim(), parseFloat(m[2].replace(',', '.')));
        log(r?.ok ? 'Menu item added · next: order me' : r?.error || 'fail', r?.ok ? 'ok' : 'err');
        return;
      }
      if (low === 'order me' || low === 'order self' || low === 'buy from me') {
        const r = global.SNMarket?.orderFromMyShop?.(1);
        log(
          r?.ok
            ? 'Order ' + (global.SNCurrency?.format?.(r.total) || r.total + ' S') + ' · next: drive on'
            : r?.error || 'order fail',
          r?.ok ? 'ok' : 'err'
        );
        return;
      }
      if (low === 'drive on' || low === 'driver on' || low === 'go online') {
        const r = global.SNMarket?.goDriverOnline?.();
        log(r?.ok ? 'Driver ONLINE · next: deliver me' : r?.error || 'fail', r?.ok ? 'ok' : 'err');
        return;
      }
      if (low === 'deliver me' || low === 'claim and deliver' || low === 'finish delivery') {
        const r = global.SNMarket?.claimAndComplete?.();
        if (r?.ok) {
          const s = r.settled || {};
          log(
            'Delivered · settled' +
              (s.driverPaid != null ? ' · driver ' + s.driverPaid + ' S' : '') +
              (s.vendorPaid != null ? ' · vendor ' + s.vendorPaid + ' S' : ''),
            'ok'
          );
          preview('DELIVERED · settled');
        } else {
          log(r?.error || 'fail', 'err');
        }
        return;
      }
      if (low === 'market status' || low === 'marketplace' || low === 'orders status') {
        const open = (global.SNTasks?.list?.({ kind: 'delivery' }) || []).filter(
          (t) => t.status !== 'done'
        );
        const done = (global.SNTasks?.list?.({ all: true, kind: 'delivery' }) || []).filter(
          (t) => t.status === 'done'
        );
        const w = global.SNCurrency?.snapshot?.() || {};
        log(
          'Market · open deliveries ' +
            open.length +
            ' · done ' +
            done.length +
            ' · wallet ' +
            (w.line || '?') +
            ' · vault ' +
            (global.SNCurrency?.format?.(w.platformFees) || (w.platformFees || 0) + ' S'),
          'ok'
        );
        open.slice(0, 6).forEach((t) => {
          log(
            '  ' +
              (t.status || '?') +
              ' · ' +
              String(t.title || '').slice(0, 42) +
              (t.total_s != null ? ' · ' + t.total_s + ' S' : ''),
            'dim'
          );
        });
        preview(open.length + ' open · market');
        return;
      }
      if (
        low === 'mesh' ||
        low === 'network' ||
        low === 'network orders' ||
        low === 'open deliveries' ||
        low === 'mesh pull'
      ) {
        try {
          if (!global.SNMeshOrders) {
            log('Mesh loading · try again in a second', 'dim');
            return;
          }
          activity('mesh · network deliveries…', 'delivery', { label: 'Mesh' });
          const r = await global.SNMeshOrders.pullOpenOrders({ quiet: false });
          const st = global.SNMeshOrders.status?.() || {};
          log(
            'Mesh · network open ' +
              (st.openNetwork || 0) +
              ' · pulled ' +
              (r?.imported || 0) +
              ' · total near ' +
              (r?.count || 0),
            r?.ok ? 'ok' : 'dim'
          );
          preview('mesh · ' + (st.openNetwork || 0));
        } catch (e) {
          log('Mesh · ' + (e.message || e), 'err');
        }
        return;
      }
      if (low === 'usage' || low === 'usage summary' || low === 'stats') {
        const s = global.SNUsage?.summary?.(14);
        if (!s) {
          log('Usage offline', 'err');
          return;
        }
        log('Usage · Athens ' + s.athensToday + ' · ' + s.events + ' events · handoffs ' + s.openHandoffs, 'ok');
        (s.top || []).forEach((t) => log('· ' + t.name + ' ×' + t.n, 'dim'));
        const f = s.flags || {};
        log(
          'Flags · vendor=' +
            !!f.firstVendorListed +
            ' delivery=' +
            !!f.firstDeliveryDone,
          'dim'
        );
        return;
      }
      if (low === 'usage export' || low === 'ship packet' || low === 'export usage') {
        const pkt = global.SNUsage?.shipPacket?.() || '';
        log('── ship packet (copy for coding agent / midnight) ──', 'ok');
        pkt.split('\n').forEach((ln) => log(ln, 'dim'));
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            void navigator.clipboard.writeText(pkt);
            log('Copied ship packet to clipboard', 'ok');
          }
        } catch (_) {}
        return;
      }
      if (low === 'close tile' || low === 'closetile' || low === 'tile close' || low === 'close panel') {
        global.SNTile?.close?.();
        global.SNCli?.stopHandsfree?.('stopped');
        try {
          global.speechSynthesis?.cancel?.();
        } catch (_) {}
        global.SNUi?.resetChrome?.();
        log('Tile closed · chrome reset · voice stopped', 'ok');
        return;
      }
      if (low === 'reset ui' || low === 'reset chrome' || low === 'unscatter') {
        global.SNTile?.close?.();
        global.SNCli?.stopHandsfree?.('stopped');
        try {
          global.speechSynthesis?.cancel?.();
        } catch (_) {}
        global.SNUi?.resetChrome?.();
        log('UI reset · CLI bottom · controls in corners', 'ok');
        return;
      }
      if (low === 'stop talking' || low === 'shut up' || low === 'silence' || low === 'stop voice') {
        try {
          global.speechSynthesis?.cancel?.();
        } catch (_) {}
        global.SNCli?.stopHandsfree?.('stopped');
        log('Voice stopped', 'ok');
        return;
      }
      if (low === 'voice on' || low === 'speak on' || low === 'tts on') {
        hfSpeakOut = true;
        try {
          localStorage.setItem(VOICE_KEY, '1');
        } catch (_) {}
        warmVoices();
        speakAi('Voice on.', 'test');
        log('Voice ON · replies may be spoken · type voice off to silence', 'ok');
        return;
      }
      if (low === 'voice off' || low === 'speak off' || low === 'tts off') {
        hfSpeakOut = false;
        try {
          localStorage.setItem(VOICE_KEY, '0');
        } catch (_) {}
        killSpeech();
        log('Voice OFF · AI stays silent', 'ok');
        return;
      }
      if (low === 'voice test' || low === 'test voice' || low === 'say test') {
        warmVoices();
        speakAi('Astranov voice test.', 'test');
        log('Voice test · one short line only', 'ok');
        return;
      }
      if (low === 'handoff' || low === 'handoffs') {
        const list = global.SNUsage?.openHandoffs?.() || [];
        if (!list.length) log('No open handoffs · report a pain in chat to queue one', 'dim');
        else list.slice(0, 12).forEach((h, i) => log(i + 1 + '. ' + h.note.slice(0, 100), 'ok'));
        return;
      }
      if (/^handoff\s+/.test(low)) {
        const note = line.replace(/^handoff\s+/i, '').trim();
        global.SNUsage?.handoff?.(note, { source: 'cli' });
        log('Handoff queued · Athens midnight ship picks one fix', 'ok');
        return;
      }

      // Unified multi-role tile juice
      if (low === 'menu home' || low === 'home menu' || low === 'account' || low === 'settings') {
        if (global.SNHome?.toggle) global.SNHome.toggle();
        else log('Home menu loading…', 'dim');
        return;
      }
      if (low === 'routes' || low === 'radar routes' || low === 'show routes') {
        log('Rhodes · delivery polygons on radar (vendor→client · ETA · km/h)…', 'dim');
        const list = (await global.SNField?.refreshRoutes?.(true)) || global.SNField?.routes || [];
        if (!list.length) log('No open delivery routes · order from a vendor first', 'dim');
        else {
          list.forEach((r) =>
            log(
              '━ ' +
                (r.label || r.id) +
                (r.km != null ? ' · ' + Number(r.km).toFixed(2) + ' km' : '') +
                (r.eta ? ' · ETA ' + r.eta : '') +
                (r.speedKmh != null ? ' · ' + Math.round(r.speedKmh) + ' km/h' : '') +
                ' · ' +
                (r.points?.length || 0) +
                ' pts',
              'ok'
            )
          );
          // Do not auto-expand radar — user taps radar for big view
          preview((list[0] && list[0].label) || 'routes');
        }
        return;
      }
      if (low === 'support list' || low === 'support') {
        const list = global.SNHome?.supportList?.() || [];
        if (!list.length) log('No support requests · type: support help <your question>', 'dim');
        else
          list.slice(0, 12).forEach((r) =>
            log(
              (r.status === 'open' ? '○ ' : '● ') +
                r.id +
                ' · ' +
                String(r.text).slice(0, 60) +
                (r.helper ? ' · helped by ' + r.helper : ''),
              r.status === 'open' ? 'ok' : 'dim'
            )
          );
        log('Ambassadors: support claim [id] · earn S', 'dim');
        return;
      }
      if (/^support\s+help\b|^support\s+ask\b/.test(low)) {
        const text = line.replace(/^support\s+(help|ask)\s+/i, '').trim() || 'Need help on SpaceNet';
        const r = global.SNHome?.supportRequest?.(text);
        log(r ? 'Support request open · ' + r.id : 'Support offline', r ? 'ok' : 'err');
        return;
      }
      if (/^support\s+claim\b|^help\s+claim\b/.test(low)) {
        const id = line.replace(/^(support\s+claim|help\s+claim)\s*/i, '').trim() || null;
        const r = global.SNHome?.supportClaim?.(id || undefined);
        if (r?.ok)
          log(
            'Helped · +' +
              (global.SNCurrency?.format?.(r.reward) || r.reward + ' S') +
              ' ambassador mine',
            'ok'
          );
        else log(r?.error || 'claim failed', 'err');
        return;
      }
      if (low === 'me' || low === 'profile' || low === 'tile' || low === 'plus' || low === 'my tile') {
        global.SNTile?.openMe?.();
        log('Your tile · or Astranov SpaceNet menu for vendor/driver/ambassador', 'ok');
        return;
      }
      if (low === 'roles' || low === 'role') {
        const me = global.SNProfiles?.me?.();
        if (!me) {
          log('Profiles loading…', 'dim');
          return;
        }
        Object.keys(global.SNProfiles.ROLES).forEach((k) => {
          log((me.roles[k] ? '● ' : '○ ') + k + ' · ' + global.SNProfiles.ROLES[k].label, me.roles[k] ? 'ok' : 'dim');
        });
        log('Toggle: role vendor worker · role dating · role driver', 'dim');
        global.SNTile?.openMe?.('about');
        return;
      }
      if (/^role\s+/.test(low)) {
        const role = low.replace(/^role\s+/, '').trim().split(/\s+/)[0];
        const me = global.SNProfiles?.me?.();
        if (!me || !global.SNProfiles.ROLES[role]) {
          log('Roles: social dating vendor driver client worker', 'dim');
          return;
        }
        const p = global.SNProfiles.toggleRole(me.id, role);
        log('Role ' + role + ' · ' + (p.roles[role] ? 'ON' : 'off'), 'ok');
        global.SNTile?.open?.(p);
        global.SNMap?.showProfiles?.();
        return;
      }
      if (low === 'menu') {
        // Menu lives on vendor tile only — strip chips + expand Menu tab
        const vendors = global.SNProfiles?.list?.({ role: 'vendor' }) || [];
        if (!vendors.length) {
          const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
          await global.SNCommerce?.ensureSector?.(p.lat, p.lng, { openMap: false });
        }
        const list = global.SNProfiles?.list?.({ role: 'vendor' }) || [];
        list.slice(0, 12).forEach((v) => {
          log('🏪 ' + (v.shopName || v.name) + ' · ' + (v.menu?.length || 0) + ' items', 'ok');
        });
        const first = list[0];
        if (first) {
          global.SNMap?.showProfiles?.();
          global.SNTile?.open?.(first, { tab: 'menu' });
        } else {
          log('No vendors · shops or long-press map · multi-tile on map', 'dim');
        }
        preview((list.length || 0) + ' vendors · multi-tile on map');
        return;
      }
      if (low === 'drivers' || low === 'driver') {
        const list = global.SNProfiles?.list?.({ role: 'driver' }) || [];
        if (!list.length) {
          log('No drivers yet · open ME tile · enable Driver · Go online to claim deliveries', 'dim');
          global.SNTile?.openMe?.('drive');
        } else {
          list.forEach((d) => {
            log(
              '🛵 ' + d.name + ' · ' + (d.driverOnline ? 'ONLINE' : 'off') + ' · ' + (d.vehicle || ''),
              d.driverOnline ? 'ok' : 'dim'
            );
          });
          const d0 = list[0];
          if (d0?.lat != null) {
            await global.SNMap?.open?.(d0.lat, d0.lng);
            global.SNMap?.showProfiles?.();
            global.SNTile?.open?.(d0, { tab: 'drive' });
          }
        }
        return;
      }
      if (low === 'dates' || low === 'dating people' || low === 'people') {
        const list = global.SNProfiles?.list?.({ role: 'dating' }) || [];
        if (!list.length) {
          log('No dating profiles yet · open ME · enable Dating role (real users only)', 'dim');
          global.SNTile?.openMe?.('dating');
        } else {
          list.forEach((d) => {
            log('💕 ' + d.name + ' · ' + (d.lookingFor || 'open'), 'ok');
          });
          const d0 = list[0];
          if (d0) {
            if (d0.lat != null) await global.SNMap?.open?.(d0.lat, d0.lng);
            global.SNMap?.showProfiles?.();
            global.SNTile?.open?.(d0, { tab: 'dating' });
          }
        }
        return;
      }
      if (low === 'cart' || low === 'basket') {
        const items = global.SNProfiles?.cart?.() || [];
        if (!items.length) log('Cart empty · vendors · tap + on menu items', 'dim');
        else {
          items.forEach((i) =>
            log(
              '· ' +
                i.name +
                ' ' +
                (global.SNCurrency?.format?.(i.price) || i.price + ' S') +
                ' · ' +
                i.vendorName,
              'ok'
            )
          );
          log(
            'Total ' +
              (global.SNCurrency?.format?.(global.SNProfiles.cartTotal() || 0) ||
                (global.SNProfiles.cartTotal() || 0).toFixed(2) + ' S'),
            'ok'
          );
        }
        global.SNTile?.openMe?.('cart');
        return;
      }
      if (low === 'order' || low === 'checkout' || low === 'pay') {
        const r = global.SNProfiles?.placeOrder?.();
        if (!r?.ok) {
          log(r?.error || 'cart empty · open vendors first', 'err');
          return;
        }
        log(
          'Order ' +
            (global.SNCurrency?.format?.(r.total) || r.total.toFixed(2) + ' S') +
            ' · delivery opened for drivers',
          'ok'
        );
        await global.SNMap?.open?.();
        global.SNMap?.showTasks?.();
        global.SNMap?.showProfiles?.();
        return;
      }
      if (
        low === 'seed' ||
        low === 'seed city' ||
        low === 'tiles' ||
        low === 'scan city' ||
        low === 'scan' ||
        low === 'fill sector'
      ) {
        const pos = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        log('Live sector scan · DB + crawlers (no dummy seeds)…', 'dim');
        const r = await global.SNCommerce?.ensureSector?.(pos.lat, pos.lng, { openMap: true });
        log(
          r?.count
            ? 'Sector · ' + r.count + ' live tiles · ' + (r.source || 'live')
            : 'No POIs here · try fly athens · or long-press to create',
          r?.count ? 'ok' : 'dim'
        );
        return;
      }
      if (
        low === 's' ||
        low === 'money' ||
        low === 'currency' ||
        low === 'rate' ||
        low === 'spacenets' ||
        low === 'space nets'
      ) {
        moneyStatus();
        // No ribbon money/finance buttons — finance UI = top-right S HUD only
        return;
      }
      if (low === 'wallet' || low === 'balance' || low === 'fees' || low === 'platform') {
        const C = global.SNCurrency;
        const snap = C?.snapshot?.() || { balance: 0, mined: 0, platformFees: 0 };
        log('Wallet ' + (C?.format?.(snap.balance) || snap.balance + ' S'), 'ok');
        log(
          'Your platform 3% lifetime · ' +
            (C?.format?.(snap.platformFees) || (snap.platformFees || 0) + ' S'),
          'ok'
        );
        log('Mined lifetime ' + (C?.format?.(snap.mined) || snap.mined), 'dim');
        log('Finance menu · tap top-right S balance (not on CLI ribbon)', 'dim');
        global.SNField?.paint?.();
        preview(
          (snap.line || 'wallet') +
            ' · fees ' +
            (C?.format?.(snap.platformFees) || (snap.platformFees || 0) + ' S')
        );
        return;
      }
      if (low === 'finance' || low === 'field' || low === 'ledger') {
        // Open same panel as top-right gadget — never via ribbon buttons
        global.SNField?.openFinance?.();
        log('Finance · opened from money path · or tap top-right S', 'ok');
        return;
      }
      if (low === 'radar') {
        global.SNRadar?.refresh?.();
        log('Radar · Earth ' + (global.SNRadar?.EARTH_KMH || 1671) + ' km/h · blips from shops/places', 'ok');
        return;
      }
      if (low === 'resources' || low === 'resource' || low === 'performance' || low === 'perf') {
        const lines = global.SNResources?.status?.() || ['resources offline'];
        lines.forEach((ln) => log(ln, /FPS|mine|spare/i.test(ln) ? 'ok' : 'dim'));
        global.SNRibbon?.setTask?.('mine');
        preview(global.SNResources?.report?.()?.line || 'resources');
        return;
      }
      if (low === 'mine on' || low === 'mining on' || low === 'mine') {
        if (!global.SNResources?.checkTerms?.()) {
          global.SNField?.showTerms?.();
          log('Accept mesh terms to mine in S', 'dim');
          return;
        }
        global.SNResources?.setMining?.(true);
        log('Mining on · earn S from spare capacity', 'ok');
        global.SNRibbon?.setTask?.('mine');
        return;
      }
      if (low === 'mine off' || low === 'mining off') {
        global.SNResources?.setMining?.(false);
        log('Mining off', 'dim');
        return;
      }
      if (low === 'donate on' || low === 'mesh on' || low === 'seti on') {
        global.SNResources?.setDonate?.(true);
        log('Mesh donate ON · SETI-style spare capacity → S', 'ok');
        return;
      }
      if (low === 'donate off' || low === 'mesh off') {
        global.SNResources?.setDonate?.(false);
        return;
      }
      if (
        low === 'device main' ||
        low === 'role main' ||
        low === 'device secondary' ||
        low === 'role secondary' ||
        low === 'device raid' ||
        low === 'role raid' ||
        low === 'device role' ||
        low === 'harvest role'
      ) {
        const role =
          /raid/.test(low) ? 'raid' : /secondary|hot\s*swap|spare/.test(low) ? 'secondary' : /main/.test(low) ? 'main' : null;
        if (role && global.SNResources?.setDeviceRole) {
          const p = global.SNResources.setDeviceRole(role);
          global.SNResources.setMining?.(true);
          global.SNResources.setDonate?.(true);
          log(
            'Device · ' +
              (p?.label || role) +
              ' · harvest ' +
              Math.round((p?.harvest || 0) * 100) +
              '%' +
              (p?.tjMax != null ? ' · TJ max ' + Math.round(p.tjMax * 100) + '%' : ''),
            'ok'
          );
        } else {
          const cur = global.SNResources?.getDeviceRole?.() || 'main';
          log('Device role · ' + cur + ' · set: device main | device secondary | device raid', 'ok');
        }
        return;
      }
      if (low === 'boost') {
        log('Boost · prefer full FPS while active (3 min soft)', 'ok');
        global.SNResources?.noteFrame?.();
        return;
      }
      if (low === 'solo' || low === 'status') {
        const n = Tasks?.list?.()?.length || 0;
        const build = document.querySelector('meta[name="astranov-build"]')?.content || '?';
        const who = global.SNAuth?.user?.email || 'guest';
        const tier = Globe?.tier || '?';
        const phys = Globe?.getPhysics?.();
        const C = global.SNCurrency;
        log('Astranov SpaceNet · build ' + build + ' · zoom ' + tier, 'ok');
        log('user ' + who + ' · open tasks ' + n, 'ok');
        if (C) {
          log(
            'S (SpaceNets) · index ' +
              C.networkIndex().toFixed(4) +
              ' · 1 S ~ ' +
              (C.quote('EUR') || 0).toFixed(4) +
              ' EUR',
            'ok'
          );
        }
        log(
          'AI ' +
            (global.SNAi ? 'ready' : 'loading') +
            ' · brain ' +
            (global.SNBrain?.version || 'off') +
            (phys ? ' · inertia damp ' + phys.damp : ''),
          'dim'
        );
        log('https://astranov.eu · type rate · brain · verify', 'dim');
        preview('Astranov SpaceNet · ' + tier + ' · ' + n + ' tasks');
        return;
      }
      // SPACENET pilot fly grid
      if (low === 'spacenet' || low === 'fly grid' || low === 'grid' || low === 'pilot grid') {
        const path =
          (global.SPACENET && global.SPACENET.pathString && global.SPACENET.pathString()) ||
          'GLOBAL → NATIONAL → REGIONAL → CITY';
        const tier = Globe?.tier || 'global';
        const z = Globe?.getPhysics?.()?.z;
        log('SPACENET · pilot fly grid · without it flying is not possible', 'ok');
        log('Path · ' + path, 'ok');
        log(
          'You are · ' +
            String(tier).toUpperCase() +
            (z != null ? ' · z=' + Number(z).toFixed(2) : '') +
            ' · single-tap deeper · double-tap out',
          'dim'
        );
        preview('SPACENET · ' + path);
        return;
      }
      // Zoom tiers (SPACENET cells)
      if (low === 'solar' || low === 'zoom solar' || low === 'galaxy') {
        Globe?.goToTier?.('solar');
        log('SPACENET · SOLAR', 'ok');
        return;
      }
      if (low === 'global' || low === 'earth' || low === 'world' || low === 'zoom global' || low === 'zoom earth') {
        global.SNMap?.close?.();
        Globe?.setBody?.('earth');
        Globe?.goToTier?.('global');
        log('SPACENET · GLOBAL · full Earth in space · ISS · constellation', 'ok');
        preview('GLOBAL · full Earth in space');
        return;
      }
      if (low === 'national' || low === 'country' || low === 'zoom national') {
        global.SNMap?.close?.();
        Globe?.goToTier?.('national');
        log('SPACENET · NATIONAL', 'ok');
        return;
      }
      if (low === 'regional' || low === 'region' || low === 'zoom regional') {
        global.SNMap?.close?.();
        Globe?.goToTier?.('regional');
        log('SPACENET · REGIONAL', 'ok');
        return;
      }
      if (low === 'zoom city' || low === 'zoom street' || low === 'city zoom') {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        Globe?.goToTier?.('city');
        await global.SNMap?.open?.(p.lat, p.lng);
        log('SPACENET · CITY / street map', 'ok');
        return;
      }
      // Surface layers panel / basemap / overlays
      if (
        low === 'layers' ||
        low === 'map layers' ||
        low === 'layer' ||
        /^map\s+layers?$/.test(low)
      ) {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        if (!global.SNMap?.active) await global.SNMap?.open?.(p.lat, p.lng);
        global.SNMap?.openLayersPanel?.();
        log(
          'Layers · basemap: dark bright sat google traffic · overlays: windy w3w iss sats planes ships',
          'ok'
        );
        return;
      }
      if (/^(map\s+)?(dark|bright|light|sat|satellite|google|traffic|basemap)\b/.test(low) || low === 'map layer') {
        let id = 'dark';
        if (/bright|light/.test(low)) id = 'bright';
        else if (/google/.test(low)) id = 'google';
        else if (/traffic/.test(low)) id = 'traffic';
        else if (/sat/.test(low)) id = 'satellite';
        else if (/dark/.test(low)) id = 'dark';
        else {
          log('Basemap · dark · bright · satellite · google · traffic · or type layers', 'dim');
          return;
        }
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        if (!global.SNMap?.active) await global.SNMap?.open?.(p.lat, p.lng);
        global.SNMap?.setBasemap?.(id, { user: true, log: true });
        return;
      }
      if (
        /^(windy|w3w|what3words|iss|sats?|planes?|aircraft|ships?|roads)\b/.test(low) ||
        /^overlay\s+/.test(low)
      ) {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        if (!global.SNMap?.active) await global.SNMap?.open?.(p.lat, p.lng);
        let id = null;
        if (/windy/.test(low)) id = 'windy';
        else if (/w3w|what3words/.test(low)) id = 'w3w';
        else if (/\biss\b/.test(low)) id = 'iss';
        else if (/sats?/.test(low)) id = 'sats';
        else if (/planes?|aircraft/.test(low)) id = 'planes';
        else if (/ships?/.test(low)) id = 'ships';
        else if (/roads/.test(low)) id = 'trafficLive';
        if (id && global.SNMap?.toggleOverlay) global.SNMap.toggleOverlay(id);
        else log('Overlays · windy · w3w · iss · sats · planes · ships · roads', 'dim');
        return;
      }
      if (low === 'login' || low === 'signin' || low === 'sign in') {
        try {
          if (!global.SNAuth) {
            log('Auth loading · wait a second · try again', 'err');
            return;
          }
          if (global.SNAuth.user) {
            log(
              'Already signed in · ' +
                (global.SNAuth.user.user_metadata?.full_name ||
                  global.SNAuth.user.email ||
                  'user'),
              'ok'
            );
            return;
          }
          log('Sign in · ASTRANOV · astranov.eu (Google on this site only)', 'ok');
          await global.SNAuth.signInGoogle();

        } catch (e) {
          log(String(e.message || e), 'err');
        }
        return;
      }
      if (low === 'logout' || low === 'signout' || low === 'sign out') {
        if (global.SNAuth?.user) await global.SNAuth.signOut();
        log('Signed out', 'ok');
        return;
      }
      // Place tool: pin (1) · targets (multi/topo) · tile
      if (
        low === 'place' ||
        low === 'pin' ||
        low === 'targets' ||
        low === 'target mode' ||
        low === 'tile mode' ||
        low === 'measure' ||
        low === 'clear targets' ||
        low === 'clear pin' ||
        low === 'clear place' ||
        /^mode\s+(pin|targets|tile)$/.test(low)
      ) {
        const Topo = global.SNTopo;
        if (!Topo) {
          log('Place tool offline · hard refresh', 'err');
          return;
        }
        if (low === 'clear targets') {
          Topo.clear('targets');
          return;
        }
        if (low === 'clear pin') {
          Topo.clear('pin');
          return;
        }
        if (low === 'clear place') {
          Topo.clear('all');
          return;
        }
        if (low === 'measure topo' || low === 'topo') {
          if (Topo.measureTopo) {
            const st = await Topo.measureTopo();
            preview(st.areaLabel || st.path3dLabel || st.count + ' pts');
          } else log('Topo measure offline', 'err');
          return;
        }
        if (low === 'measure') {
          const st = Topo.measure();
          log(
            st.count < 3
              ? 'Targets · ' + st.count + ' · need ≥3 for polygon area'
              : 'Polygon · area ' +
                  st.areaLabel +
                  ' · perimeter ' +
                  st.perimeterLabel +
                  (st.engine ? ' · ' + st.engine : ''),
            st.count >= 3 ? 'ok' : 'dim'
          );
          preview(st.count >= 3 ? st.areaLabel : st.count + ' targets');
          return;
        }
        if (low === 'pin' || low === 'mode pin') {
          Topo.setMode('pin');
          Topo.activate();
          return;
        }
        if (low === 'targets' || low === 'target mode' || low === 'mode targets') {
          Topo.setMode('targets');
          Topo.activate();
          return;
        }
        if (low === 'tile mode' || low === 'mode tile') {
          Topo.setMode('tile');
          Topo.activate();
          return;
        }
        // place / add — open full Add menu
        if (Topo.openAddMenu) Topo.openAddMenu();
        else Topo.activate();
        return;
      }
      if (low === 'add' || low === 'add menu' || low === 'add anything') {
        if (global.SNTopo?.openAddMenu) global.SNTopo.openAddMenu();
        else log('Add menu offline · hard refresh', 'err');
        return;
      }
      if (
        low === 'pilot on' ||
        low === 'autopilot on' ||
        low === 'follow sim' ||
        low === 'camera auto'
      ) {
        global.SNMap?.releasePilot?.();
        return;
      }
      if (
        low === 'pilot off' ||
        low === 'autopilot off' ||
        low === 'hold camera' ||
        low === 'camera hold' ||
        low === 'hold'
      ) {
        global.SNMap?.userHoldCamera?.('cli');
        return;
      }
      if (low === 'locate' || low === 'gps' || low === 'where am i') {
        activity('locating you…', 'work', { label: 'Locate' });
        let pos = await gpsLocate();
        try {
          if (Globe?.locate && Globe.ready) {
            const gpos = await Promise.race([
              Globe.locate(),
              new Promise(function (r) {
                setTimeout(function () {
                  r(null);
                }, 12000);
              }),
            ]);
            if (gpos && gpos.lat != null && !gpos.fallback) pos = gpos;
            else if (gpos && gpos.lat != null && pos.fallback) pos = gpos;
          }
        } catch (_) {}
        if (pos && pos.lat != null) {
          Tasks?.setPos?.(pos.lat, pos.lng);
          global._snLastPos = { lat: pos.lat, lng: pos.lng };
          try {
            if (global.SNMap?.open) {
              await global.SNMap.open(pos.lat, pos.lng);
              await global.SNMap.ensure?.();
              if (global.SNMap.markYou) global.SNMap.markYou(pos.lat, pos.lng, 'YOU · here');
              if (global.SNMap.fitLatLngs) {
                global.SNMap.fitLatLngs([{ lat: pos.lat, lng: pos.lng }], {
                  zoom: 15,
                  force: true,
                });
              } else {
                const map = await global.SNMap.ensure?.();
                map?.setView?.([pos.lat, pos.lng], 15);
              }
            }
          } catch (_) {}
          try {
            if (Globe?.goToPlace) {
              Globe.goToPlace(pos.lat, pos.lng, {
                tier: 'city',
                body: 'earth',
                pulse: true,
                label: 'You',
                openMap: true,
              });
            } else if (Globe?.pulse) {
              Globe.pulse(pos.lat, pos.lng, 0x3d9eff, 'You', 16000);
            }
          } catch (_) {}
          depict('locate', { lat: pos.lat, lng: pos.lng, label: 'You', tier: 'city' });
          if (pos.fallback) {
            const why =
              pos.reason === 'denied'
                ? 'location permission denied · allow location for this site and try again'
                : pos.reason === 'timeout'
                  ? 'GPS timed out · try outdoors or enable precise location'
                  : pos.reason === 'insecure'
                    ? 'location needs secure site (https)'
                    : pos.reason === 'unsupported'
                      ? 'this browser has no GPS'
                      : 'GPS soft · blue YOU pin is best estimate · type YES if ok';
            log(why + ' · ' + pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4), 'err');
          } else {
            log(
              'you · ' +
                pos.lat.toFixed(4) +
                ', ' +
                pos.lng.toFixed(4) +
                (pos.accuracy != null ? ' · ±' + Math.round(pos.accuracy) + 'm' : '') +
                ' · blue YOU pin on city map',
              'ok'
            );
          }
        } else {
          log('Locate failed · allow location in browser · try again', 'err');
        }
        return;
      }
      if (
        low === 'global' ||
        low === 'globe' ||
        low === 'earth' ||
        low === 'view global' ||
        low === 'full earth' ||
        low === 'back to earth'
      ) {
        try {
          if (global.SNMap?.close) SNMap.close();
          else if (global.SNMap?.backToGlobe) SNMap.backToGlobe();
        } catch (_) {}
        try {
          Globe?.setBody?.('earth');
          Globe?.goToTier?.('global');
        } catch (_) {}
        depict('global');
        log('GLOBAL · full Earth in space · map closed', 'ok');
        return;
      }
      if (low === 'city' || low === 'map' || low === 'street' || low === 'city map') {
        const p =
          Tasks?.pos ||
          global._snLastPos ||
          { lat: 37.9838, lng: 23.7275 };
        if (p.lat) Tasks?.setPos?.(p.lat, p.lng);
        depict('city', { lat: p.lat, lng: p.lng, label: 'City' });
        try {
          Globe?.goToPlace?.(p.lat, p.lng, { tier: 'city', body: 'earth', pulse: true });
        } catch (_) {}
        await global.SNMap?.open?.(p.lat, p.lng);
        log(
          'city map · ' + Number(p.lat).toFixed(3) + ',' + Number(p.lng).toFixed(3),
          'ok'
        );
        return;
      }
      if (low === 'shops' || low === 'vendors' || low === 'stores') {
        activity('shops on map…', 'shops', { label: 'Shops' });
        if (global.SNAi?.ask) {
          const reply = await SNAi.ask(line);
          if (reply) {
            log(reply, 'ok');
            preview(String(reply).slice(0, 80));
          }
          return;
        }
        const p = Tasks?.pos || global._snLastPos || { lat: 36.4341, lng: 28.2176 };
        Globe?.goToTier?.('city');
        const r = await global.SNCommerce?.ensureSector?.(p.lat, p.lng, { openMap: true });
        const vendors = global.SNProfiles?.list?.({ role: 'vendor' }) || [];
        const n = vendors.length || r?.count || 0;
        log(n ? n + ' shops · tap map target for tile' : 'No shops near focus', n ? 'ok' : 'dim');
        preview(n + ' shops');
        return;
      }
      if (
        low === 'google shops' ||
        low === 'google places' ||
        low === 'fill shops' ||
        low === 'fill google'
      ) {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.4341, lng: 28.2176 };
        if (!global.SNPlacesBusiness?.hasKey?.()) {
          log(
            'Set SN_CONFIG.layers.googleMapsKey (Maps JS + Places API) then hard refresh.',
            'err'
          );
          preview('need Google key');
          return;
        }
        activity('Google Places…', 'shops', { label: 'Google' });
        log('Filling shop tiles from Google Places (photos, hours, phone, website)…', 'dim');
        const g = await SNPlacesBusiness.fillSector(p.lat, p.lng, {
          radiusM: 3000,
          limit: 24,
          details: 14,
        });
        try {
          await global.SNMap?.open?.(p.lat, p.lng);
          global.SNMap?.showProfiles?.();
        } catch (_) {}
        log(
          g?.ok
            ? g.count + ' Google shops on map · tap a pin for full tile'
            : 'Google returned no shops · try locate first · check Places API billing',
          g?.ok ? 'ok' : 'err'
        );
        preview((g?.count || 0) + ' Google shops');
        return;
      }
      if (low === 'thesis' || low === 'garage' || low === 'vault') {
        if (low === 'vault') {
          const places = global.SNSpatial?.list?.() || [];
          if (!places.length) {
            log('Vault empty · put places at real body+lat+lng (no seed demos)', 'dim');
          } else {
            places.forEach((p) => {
              log((p.emoji || '📌') + ' ' + (p.title || p.name) + ' · ' + (p.body || 'earth'), 'ok');
            });
          }
          preview('vault');
          return;
        }
        // Real Rhodes garage coords — land + crawl (SPECS P0-D / P1-C)
        log('Garage · Rhodes · live land + crawl', 'dim');
        if (global.SNCosmos?.go) {
          await global.SNCosmos.go('earth', 36.44125, 28.22255, {
            label: 'Garage Rhodes',
            openMap: true,
          });
        } else {
          await global.SNGlobe?.goToPlace?.(36.44125, 28.22255, {
            tier: 'national',
            openMap: true,
            label: 'Garage',
          });
        }
        preview('garage');
        return;
      }
      if (low === 'cosmos' || low === 'bodies' || low === 'planets') {
        const list = global.SNCosmos?.list?.() || [];
        list.forEach((b) => log('◎ ' + b.name + ' · go to ' + b.id, 'ok'));
        preview('go to mars · moon · jupiter · earth');
        return;
      }
      // go to <planet|place> — real body switch + land + crawl
      {
        const dest = global.SNCosmos?.parseGo?.(line);
        const directBody =
          !dest && global.SNCosmos?.resolve?.(low) && low !== 'earth'
            ? low
            : null;
        if (dest || directBody || low === 'mars' || low === 'cydonia' || low === 'go to mars') {
          const where = dest || directBody || (low.indexOf('cydonia') >= 0 ? 'cydonia' : 'mars');
          preview('Going · ' + where);
          if (global.SNCosmos?.go) {
            const r = await global.SNCosmos.go(where);
            if (r) log('Arrived · ' + (r.body?.name || where), 'ok');
          } else {
            log('SNCosmos offline · cannot land on ' + where, 'err');
          }
          return;
        }
      }
      if (low === 'earth' || low === 'go to earth' || low === 'back to earth') {
        if (global.SNCosmos?.go) await global.SNCosmos.go('earth', null, null, { tier: 'global' });
        else {
          global.SNMap?.close?.();
          Globe?.setBody?.('earth');
          Globe?.goToTier?.('global');
        }
        log('Earth · GLOBAL SNGlobe', 'ok');
        return;
      }
      if (low === 'globe' || low === 'close map' || low === 'back' || low === 'home') {
        global.SNMap?.close?.();
        if (Globe?.bodyId && Globe.bodyId !== 'earth' && global.SNCosmos?.go) {
          await global.SNCosmos.go('earth');
        } else {
          Globe?.setBody?.('earth');
          Globe?.goToTier?.('global');
        }
        log('Back · ' + (Globe?.bodyId || 'earth') + ' GLOBAL', 'ok');
        return;
      }
      // fly <city> → open that city's street map (user-requested only)
      async function openCityAt(lat, lng, label) {
        Tasks?.setPos?.(lat, lng);
        global._snLastPos = { lat, lng };
        if (Globe?.bodyId && Globe.bodyId !== 'earth') Globe.setBody?.('earth');
        try {
          Globe?.goToPlace?.(lat, lng, {
            tier: 'city',
            label: label,
            body: 'earth',
            pulse: false,
            openMap: false,
          });
        } catch (_) {}
        await global.SNMap?.open?.(lat, lng, { force: true });
        log('City map · ' + label + ' · drag holds camera · pilot on for autopilot', 'ok');
        preview(label);
      }
      for (const [name, ll] of Object.entries(CITIES)) {
        if (new RegExp('^(fly\\s+)?' + name + '$', 'i').test(low) || low === 'fly ' + name) {
          await openCityAt(ll[0], ll[1], name === 'rodos' ? 'Rhodes' : name);
          return;
        }
      }
      if (/^fly\s+/.test(low)) {
        const name = low.replace(/^fly\s+/, '').trim();
        const ll = CITIES[name.replace(/\s+/g, '')] || CITIES[name];
        if (ll) {
          await openCityAt(ll[0], ll[1], name === 'rodos' ? 'Rhodes' : name);
        } else if (global.SNSearch?.geocode) {
          preview('Finding · ' + name);
          const places = await SNSearch.geocode(name);
          if (places?.[0]) {
            const p = places[0];
            await openCityAt(p.lat, p.lng, String(p.name || name).slice(0, 40));
          } else if (global.SNCosmos?.resolve?.(name)) {
            global.SNMap?.close?.();
            await global.SNCosmos.go(name);
          } else log('Unknown · fly athens · fly london · global', 'dim');
        } else log('Unknown place · fly athens · fly london · global', 'dim');
        return;
      }
      if (/^task\s*list$|^list$|^tasks$/.test(low)) {
        const open = Tasks?.list?.({ all: true }) || Tasks?.list?.() || [];
        if (!open.length) {
          log('No open tasks · order food or wait for jobs', 'dim');
        } else {
          open.slice(0, 15).forEach((t) => {
            const en = global.SNTaskBoard?.enrich?.(t);
            const price =
              en?.price != null
                ? global.SNCurrency
                  ? SNCurrency.format(en.price)
                  : en.price.toFixed(2) + ' S'
                : '';
            log(
              (t.status || 'open') +
                ' · ' +
                (price ? price + ' · ' : '') +
                t.title.slice(0, 36) +
                (en ? ' · ' + en.vendorName + ' → ' + en.clientName : ''),
              'ok'
            );
          });
          if (global.SNMap?.active) global.SNMap.showTasks?.();
          preview(open.length + ' tasks · task open / task fit');
        }
        return;
      }
      if (/^task\s*claim|^claim\b/.test(low)) {
        const tid = line.split(/\s+/).find((p) => p.startsWith('t_'));
        const r = Tasks?.claim?.(tid);
        if (r?.ok) {
          log('Claimed · ' + r.task.title, 'ok');
          preview('Claimed · ' + r.task.kind);
          if (global.SNTaskBoard?.openTaskTile) SNTaskBoard.openTaskTile(r.task);
          else if (global.SNMap?.active) global.SNMap.showTasks?.();
        } else log(r?.error || 'claim failed', 'err');
        return;
      }
      if (/^task\s*done|^done\b|^complete\b/.test(low)) {
        const tid = line.split(/\s+/).find((p) => p.startsWith('t_'));
        const r = Tasks?.complete?.(tid);
        if (r?.ok) {
          log('Done · ' + r.task.title, 'ok');
          preview('Completed · ' + r.task.kind);
        } else log(r?.error || 'nothing to complete', 'err');
        return;
      }
      if (/^task\s*catalog|^catalog$|^roles$/.test(low)) {
        (Tasks?.CATALOG || []).forEach((c) => log(c.kind + ' · ' + c.title + ' · ' + c.dur, 'ok'));
        return;
      }
      if (
        /^search\b|^find\b|^google\b|^maps\b|^crawl\b|^where\s+is\b|^look\s+up\b|^what\s+is\b|^who\s+is\b|^almighty\b/.test(
          low
        )
      ) {
        const q =
          line
            .replace(
              /^(search|find|google|maps|crawl|almighty|where\s+is|look\s+up|what\s+is|who\s+is)\s+/i,
              ''
            )
            .trim() || line;
        // Map default. crawl/find/search = nearby only. Never full TV/books/npm dump.
        const wantFull = /^almighty\b/.test(low);
        const wantKnowledge = /^(who\s+is|what\s+is|look\s+up)\b/.test(low);
        const crawlMode = wantFull ? 'knowledge' : wantKnowledge ? 'knowledge' : 'map';
        if (global.SNSearch?.crawl) {
          const crawled = await SNSearch.crawl(q, {
            pos: Tasks?.pos || global._snLastPos,
            openMap: crawlMode === 'map',
            all: false,
            mode: crawlMode,
            fly: false,
            quiet: true,
          });
          SNSearch.report?.(crawled, log, { silent: crawlMode === 'map' });
        } else {
          log('Search still loading — try again in a second.', 'dim');
        }
        preview(crawlMode === 'map' ? 'Nearby shops' : 'Lookup');
        return;
      }
      if (/^research\b/.test(low)) {
        const q = line.replace(/^research\s+/i, '').trim() || 'astranov';
        preview('Research…');
        if (global.SNSearch?.crawl) {
          const crawled = await SNSearch.crawl(q, {
            mode: 'knowledge',
            all: false,
            openMap: false,
            fly: false,
            quiet: true,
          });
          SNSearch.report?.(crawled, log);
        }
        if (global.SNAi?.ask) {
          const tip = await SNAi.ask('Short plain answer about: ' + q, { mode: 'chat' });
          if (tip) log(String(tip).slice(0, 200), 'ok');
        }
        return;
      }
      if (/^code\b|^write\s+code\b|^implement\b|^patch\b/.test(low) || /^coders\b/.test(low)) {
        const ask = line
          .replace(/^(code|write\s+code|implement|patch|coders)\s+/i, '')
          .trim() || line;
        preview('Astranov coding…');
        log('── Astranov (Grok-fork) · code ──', 'dim');
        const reply = global.SNAi?.code
          ? await (low.startsWith('coders') ? SNAi.coders(ask) : SNAi.code(ask))
          : await SNAi?.ask?.(ask, { mode: 'code' });
        if (reply) {
          // Split long code across log lines
          String(reply)
            .split('\n')
            .forEach((ln) => log(ln.slice(0, 200), /```/.test(ln) ? 'dim' : 'ok'));
          preview(reply.slice(0, 80));
        } else log('Code edge offline · try again · brain still holds law', 'err');
        return;
      }
      if (/^date\b|^dating\b|coffee\s*date|dinner\s*date|available\s*woman|meet\s*(a\s*)?woman/.test(low)) {
        if (global.SNMarket?.fulfillDatingIntent) {
          log('Dating · search available · send request…', 'dim');
          const r = await global.SNMarket.fulfillDatingIntent(line);
          log(r?.reply || (r?.ok ? 'Dating request open' : r?.error || 'dating failed'), r?.ok ? 'ok' : 'err');
          preview(r?.best?.name || 'dating');
          return;
        }
        const t = Tasks?.create?.(line);
        log('Date open · ' + t.title, 'ok');
        preview(t.title);
        if (global.SNMap?.active) global.SNMap.showTasks?.();
        return;
      }
      if (/^deliver|^delivery\b|food\s*order|\bpackage\b/.test(low)) {
        const t = Tasks?.create?.(line.includes('deliver') || line.includes('delivery') ? line : 'delivery ' + line);
        log('Delivery open · ' + t.title, 'ok');
        preview(t.title);
        if (global.SNMap?.active) global.SNMap.showTasks?.();
        return;
      }
      if (/^errand\b|pharmacy|grocery\s*run/.test(low)) {
        const t = Tasks?.create?.(line);
        log('Errand open · ' + t.title, 'ok');
        preview(t.title);
        return;
      }
      if (
        /^job\b|^gig\b|^hire\b|barman|bartender|cleaner|nanny|waiter|tutor|need\s+a\b|looking\s+for\s+work/.test(
          low
        )
      ) {
        if (global.SNMarket?.fulfillWorkIntent) {
          log('Work · find best available · send offer…', 'dim');
          const r = await global.SNMarket.fulfillWorkIntent(line);
          log(r?.reply || (r?.ok ? 'Work offer open' : r?.error || 'job failed'), r?.ok ? 'ok' : 'err');
          preview(r?.best?.name || r?.role || 'job');
          return;
        }
        const t = Tasks?.create?.(line);
        log('Job open · ' + t.title, 'ok');
        preview(t.title);
        if (global.SNMap?.active) global.SNMap.showTasks?.();
        return;
      }
      if (low === 'order' || low === 'market' || low === 'checkout' || /^market\b|^checkout\b/.test(low)) {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        await global.SNMap?.open?.(p.lat, p.lng);
        const r = await global.SNCommerce?.populateMap?.(p.lat, p.lng, { openMap: true });
        log(
          r?.count
            ? 'Market · ' + r.count + ' shops near you'
            : 'Market · no shops here · try fly <city> · shops',
          r?.count ? 'ok' : 'err'
        );
        preview(r?.count ? r.count + ' shops' : 'market');
        return;
      }
      if ((/^help\b|need\s+help|anyone\s+can|can\s+someone/.test(low) && line.length < 120) || low === 'help me') {
        if (low === 'help' || low === 'help me') {
          /* if exact help already handled */ 
        }
        if (low !== 'help' && low !== '?') {
          const t = Tasks?.create?.({ kind: 'help', title: '🤝 ' + line.slice(0, 50), raw: line });
          log('Help open · ' + t.title, 'ok');
          preview(t.title);
          return;
        }
      }
      if (line.length < 100 && /\b(need|want|looking|work|job|date|deliver)\b/i.test(line)) {
        const t = Tasks?.create?.(line);
        log('Posted · ' + t.title, 'ok');
        preview(t.title);
        return;
      }

      // Freeform → Astranov (same turn only)
      preview('…');
      if (!global.SNAi?.ask) {
        await new Promise((r) => setTimeout(r, 600));
      }
      if (global.SNAi?.ask) {
        const reply = await SNAi.ask(line);
        if (reply) {
          String(reply)
            .split('\n')
            .forEach((ln) => {
              if (ln.trim()) log(ln, 'ok');
            });
          preview(reply.replace(/^(SpaceNet|Astranov)\s*[·:.-]\s*/i, '').slice(0, 80));
          replyOut(reply);
          return;
        }
      }
      log('System loading · try again in a moment', 'err');
      preview('loading…');
    } catch (e) {
      log('Error: ' + (e.message || e), 'err');
    } finally {
      endTurn();
    }
  }

  let speechRec = null;
  let handsfreeOn = false;
  let hfRestartTimer = null;
  let hfLastHeard = 0;
  let hfMutedUntil = 0; // ignore mic while TTS / cooldown (kills feedback loop)
  let hfBusy = false; // one command at a time
  let hfRunTimes = []; // runaway guard
  let hfPending = ''; // last transcript (final or interim) to auto-send
  /**
   * Talk mode: when AI hands-free is ON, SpaceNet speaks replies (conversation).
   * voice off / hands-free off stops spoken replies. Boot stays silent.
   */
  let hfSpeakOut = false;
  let voicesReady = false;
  const VOICE_KEY = 'sn:tts-speak-v1';

  function talking() {
    return !!(handsfreeOn || hfSpeakOut);
  }

  function setHandsfreeUi(on, label) {
    // Ribbon is the only hands-free control (bottom bar removed)
    const btns = [$('btn-handsfree'), $('sn-rib-hf')].filter(Boolean);
    btns.forEach((btn) => {
      btn.classList.toggle('on', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on
        ? 'SpaceNet talking · listen + speak · tap AI to stop'
        : 'AI · talk to SpaceNet';
    });
    if (label) preview(label);
  }

  /** Speak AI / system reply during conversation (hands-free or voice on) */
  function replyOut(text) {
    const t = String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return;
    if (!talking()) return;
    speakAi(t);
  }

  function muteMic(ms) {
    hfMutedUntil = Date.now() + (ms || 2000);
  }

  function killSpeech() {
    try {
      if (global.speechSynthesis) {
        global.speechSynthesis.cancel();
        try {
          global.speechSynthesis.resume();
        } catch (_) {}
      }
    } catch (_) {}
  }

  function warmVoices() {
    try {
      const synth = global.speechSynthesis;
      if (!synth) return;
      const list = synth.getVoices() || [];
      if (list.length) voicesReady = true;
      if (typeof synth.onvoiceschanged !== 'undefined') {
        synth.onvoiceschanged = function () {
          voicesReady = (synth.getVoices() || []).length > 0;
        };
      }
    } catch (_) {}
  }

  /**
   * Prefer natural / neural / female voices; avoid classic robotic male (David, etc.).
   */
  function pickVoice(lang) {
    try {
      const voices = global.speechSynthesis?.getVoices?.() || [];
      if (!voices.length) return null;
      const want = String(lang || 'en-US').toLowerCase();
      const want2 = want.slice(0, 2);
      function score(v) {
        let s = 0;
        const n = String(v.name || '').toLowerCase();
        const l = String(v.lang || '').toLowerCase();
        if (l === want) s += 12;
        else if (l.indexOf(want2) === 0) s += 6;
        else if (/en/.test(l) && want2 === 'en') s += 3;
        else s -= 4;
        // Quality signals
        if (/natural|neural|online|premium|enhanced|wavenet|studio|google/.test(n)) s += 18;
        if (/aria|jenny|sara|susan|samantha|zira|moira|karen|victoria|linda|emma|sonia|catherine|hazel/.test(n))
          s += 16;
        if (/female|woman/.test(n)) s += 14;
        // Penalize robotic defaults
        if (/david|mark|george|daniel|ravi|microsoft david|espeak|robot|sam\b|fred/.test(n)) s -= 25;
        if (/male/.test(n) && !/female/.test(n)) s -= 6;
        if (v.localService === false) s += 8; // often cloud / higher quality
        return s;
      }
      const ranked = voices.slice().sort(function (a, b) {
        return score(b) - score(a);
      });
      return ranked[0] || null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Speak SpaceNet text in conversation (hands-free / voice on / force test).
   * Never speaks on cold boot — only after user taps AI or says voice on.
   */
  function speakAi(text, force) {
    if (force !== 'test' && !talking() && force !== true) return;
    try {
      const synth = global.speechSynthesis;
      if (!synth || !global.SpeechSynthesisUtterance) {
        if (force === 'test') log('No speech synthesis · try Chrome/Edge', 'err');
        return;
      }
      warmVoices();
      try {
        synth.resume();
      } catch (_) {}
      const clean = String(text || '')
        .replace(/^SpaceNet\s*[·:.-]\s*/gi, '')
        .replace(/^SPACENET\s*[·:.-]\s*/gi, '')
        .replace(/[🎙➤⋮🏠🎯]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 320);
      if (!clean) return;
      synth.cancel();
      muteMic(Math.min(24000, 1800 + clean.length * 50));
      try {
        if (speechRec) speechRec.abort();
      } catch (_) {}
      const lang = /^el/i.test(navigator.language || '') ? 'el-GR' : navigator.language || 'en-US';
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang;
      u.rate = 0.98;
      u.pitch = 1.08;
      u.volume = 1;
      const voice = pickVoice(lang);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang || lang;
      }
      u.onend = () => {
        muteMic(900);
        if (handsfreeOn && !hfBusy) scheduleListenRestart(900);
      };
      u.onerror = (ev) => {
        try {
          log('Voice error · ' + ((ev && ev.error) || 'speak failed'), 'dim');
        } catch (_) {}
        muteMic(400);
        if (handsfreeOn && !hfBusy) scheduleListenRestart(700);
      };
      setTimeout(function () {
        try {
          synth.resume();
          synth.speak(u);
        } catch (e) {
          log('Could not speak · ' + (e.message || e), 'err');
        }
      }, 60);
    } catch (e) {
      try {
        log('Speak failed · ' + (e.message || e), 'err');
      } catch (_) {}
    }
  }

  function scheduleListenRestart(ms) {
    if (hfRestartTimer) clearTimeout(hfRestartTimer);
    hfRestartTimer = setTimeout(() => {
      hfRestartTimer = null;
      if (!handsfreeOn || !speechRec || hfBusy) return;
      if (Date.now() < hfMutedUntil) {
        scheduleListenRestart(400);
        return;
      }
      try {
        speechRec.start();
        setHandsfreeUi(true, 'ASTRANOV LISTENING');
      } catch (_) {
        /* already started */
      }
    }, ms || 600);
  }

  function stopHandsfree(reason) {
    handsfreeOn = false;
    killSpeech();
    hfBusy = false;
    if (hfRestartTimer) {
      clearTimeout(hfRestartTimer);
      hfRestartTimer = null;
    }
    try {
      if (speechRec) {
        speechRec.onend = null;
        speechRec.onerror = null;
        speechRec.onresult = null;
        speechRec.onstart = null;
        speechRec.abort();
      }
    } catch (_) {}
    speechRec = null;
    try {
      global.speechSynthesis?.cancel?.();
    } catch (_) {}
    setHandsfreeUi(false, reason || 'Hands-free off');
  }

  function isEchoGarbage(t) {
    const low = String(t || '')
      .toLowerCase()
      .trim();
    if (low.length < 1) return true;
    // Echo of our own TTS / system status only — do not block real commands
    if (
      /^(spacenet\s*)?listening[.!]?$/.test(low) ||
      /^spacenet\s*off[.!]?$/.test(low) ||
      /astranov\s*listening|tap (again|🎙)|hands-?free off|mic (live|denied)/i.test(low)
    )
      return true;
    if (/^astranov(\s+ai)?[.!]?$/i.test(low)) return true;
    return false;
  }

  /**
   * Auto-send transcribed voice into CLI conversation (always run — never leave only in input).
   */
  function commitVoice(raw) {
    const t = String(raw || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return false;
    if (Date.now() < hfMutedUntil) return false;
    if (hfBusy) return false;
    if (isEchoGarbage(t)) {
      log('🎙 ignored echo · ' + t.slice(0, 40), 'dim');
      return false;
    }
    const now = Date.now();
    if (now - hfLastHeard < 700) return false;
    hfLastHeard = now;
    if (runawayTrip()) return false;

    hfBusy = true;
    hfPending = '';
    muteMic(6000);
    const input = $('cli-in');
    if (input) {
      input.value = t;
    }
    log('🎙 › ' + t, 'cmd');
    preview('…');
    void (async () => {
      try {
        // Clear field like form submit, then run freeform/AI path (run → replyOut speaks)
        if (input) input.value = '';
        await run(t);
      } catch (e) {
        log('Voice send · ' + (e.message || e), 'err');
      } finally {
        hfBusy = false;
        // Restart listen after speak ends (speakAi onend) or soon if silent path
        if (handsfreeOn && !hfSpeakOut) scheduleListenRestart(600);
      }
    })();
    return true;
  }

  function runawayTrip() {
    const now = Date.now();
    hfRunTimes = hfRunTimes.filter((t) => now - t < 12000);
    hfRunTimes.push(now);
    if (hfRunTimes.length >= 4) {
      stopHandsfree('Hands-free auto-stopped (loop guard)');
      log('🎙 Auto-stopped · was firing too fast · type instead or tap 🎙 once to try again', 'err');
      return true;
    }
    return false;
  }

  function toggleHandsfree() {
    const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (handsfreeOn) {
      hfSpeakOut = false;
      try {
        localStorage.setItem(VOICE_KEY, '0');
      } catch (_) {}
      killSpeech();
      stopHandsfree('ASTRANOV OFF');
      try {
        if (global.SNAi && SNAi.listeningOff) SNAi.listeningOff();
        else {
          log('ASTRANOV OFF', 'dim');
          preview('ASTRANOV OFF');
          global.SNGlobe?.setHud?.('ASTRANOV OFF');
        }
      } catch (_) {
        log('ASTRANOV OFF', 'dim');
      }
      return;
    }
    // Conversation mode: listen + speak what is happening
    hfSpeakOut = true;
    try {
      localStorage.setItem(VOICE_KEY, '1');
    } catch (_) {}
    try {
      if (global.SNAi && SNAi.listeningOn) SNAi.listeningOn();
      else {
        log('ASTRANOV LISTENING', 'ok');
        preview('ASTRANOV LISTENING');
        global.SNGlobe?.setHud?.('ASTRANOV LISTENING');
      }
    } catch (_) {
      log('ASTRANOV LISTENING', 'ok');
      preview('ASTRANOV LISTENING');
    }
    // Spoken open so user knows conversation is live
    setTimeout(function () {
        speakAi('I am Astranov. I am listening. Tell me what you need.', true);
    }, 200);
    if (!global.isSecureContext && location.hostname !== 'localhost') {
      log('Mic needs HTTPS · type to talk · I can still reply in text', 'dim');
      return;
    }
    if (!SR) {
      log('No speech API · type to me · I still reply in text and voice', 'dim');
      preview('Astranov · type to talk');
      return;
    }

    // Kill any stuck TTS from previous session
    try {
      global.speechSynthesis?.cancel?.();
    } catch (_) {}
    try {
      global.SNTile?.close?.();
    } catch (_) {}
    // Do not auto-resize CLI panel on hands-free

    speechRec = new SR();
    const nav = navigator.language || 'en-US';
    speechRec.lang = /^el/i.test(nav) ? 'el-GR' : nav;
    // interim helps fill the box; we commit on final OR onend with pending
    speechRec.interimResults = true;
    speechRec.continuous = false;
    speechRec.maxAlternatives = 1;
    hfPending = '';

    speechRec.onstart = () => {
      setHandsfreeUi(true, 'ASTRANOV LISTENING');
      preview('ASTRANOV LISTENING · speak');
    };

    speechRec.onresult = (ev) => {
      try {
        if (Date.now() < hfMutedUntil) return;
        if (hfBusy) return;
        let finalText = '';
        let interimText = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const piece = ev.results[i][0]?.transcript || '';
          if (ev.results[i].isFinal) finalText += piece;
          else interimText += piece;
        }
        const shown = String(finalText || interimText || '').trim();
        if (shown) {
          hfPending = shown;
          const input = $('cli-in');
          if (input) input.value = shown;
          preview('🎙 ' + shown.slice(0, 48));
        }
        // Final chunk → auto-send immediately
        const fin = String(finalText || '').trim();
        if (fin) {
          commitVoice(fin);
        }
      } catch (e) {
        log('Voice result · ' + (e.message || e), 'err');
        hfBusy = false;
      }
    };

    speechRec.onerror = (ev) => {
      const code = (ev && ev.error) || 'error';
      if (code === 'aborted') return;
      if (code === 'no-speech') {
        if (handsfreeOn && !hfBusy) scheduleListenRestart(400);
        return;
      }
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        stopHandsfree('Mic blocked');
        log('Mic denied · allow microphone · then tap AI once', 'err');
        return;
      }
      if (code === 'network') {
        log('Voice network error · try again', 'dim');
      }
      if (handsfreeOn && !hfBusy) scheduleListenRestart(700);
    };

    speechRec.onend = () => {
      // Many browsers only settle transcript at end — force auto-send then
      if (handsfreeOn && !hfBusy && hfPending) {
        const pending = hfPending;
        hfPending = '';
        if (commitVoice(pending)) return;
      }
      if (handsfreeOn && !hfBusy && Date.now() >= hfMutedUntil) scheduleListenRestart(500);
    };

    handsfreeOn = true;
    killSpeech();
    hfRunTimes = [];
    hfBusy = false;
    hfPending = '';
    // Short mute so greeting does not eat first words
    muteMic(350);
    setHandsfreeUi(true, 'ASTRANOV LISTENING');
    warmVoices();
    try {
      speechRec.start();
      try {
        if (global.SNUsage?.track) SNUsage.track('handsfree_on', { speakOut: !!hfSpeakOut });
      } catch (_) {}
      log('ASTRANOV LISTENING · speak · auto-sends to CLI', 'ok');
    } catch (e) {
      log('Mic soft-fail · type to SpaceNet', 'dim');
    }
  }

  function init() {
    // Always kill orphan TTS from prior tab / autoplay
    killSpeech();
    hfSpeakOut = false;
    handsfreeOn = false;
    const form = $('cli-form');
    const input = $('cli-in');
    if (!form || !input || form._snBound) return;
    form._snBound = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      input.classList.remove('searching');
      void run(v);
    });
    $('btn-send')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      form.requestSubmit?.() || form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
    const hf = $('btn-handsfree');
    if (hf && !hf._snHf) {
      hf._snHf = true;
      hf.type = 'button';
      hf.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleHandsfree();
        },
        true
      );
    }
    // Live feed search while typing / or ?
    input.addEventListener('input', () => {
      const v = input.value || '';
      if (/^[/？?]/.test(v) || /^search\s+/i.test(v)) {
        input.classList.add('searching');
        const q = v.replace(/^search\s+/i, '').replace(/^[/？?]\s*/, '');
        applyFeedFilter(q);
        preview(q ? 'Searching feed…' : 'Type to search feed history');
      } else if (feedFilter) {
        input.classList.remove('searching');
        applyFeedFilter('');
        preview('Talk to SpaceNet…');
      } else {
        input.classList.remove('searching');
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx > 0) {
          histIdx--;
          input.value = hist[histIdx] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < hist.length - 1) {
          histIdx++;
          input.value = hist[histIdx] || '';
        } else {
          histIdx = hist.length;
          input.value = '';
        }
      } else if (e.key === 'Escape') {
        if (feedFilter || /^[/？?]/.test(input.value || '')) {
          e.preventDefault();
          input.value = '';
          input.classList.remove('searching');
          applyFeedFilter('');
          preview('Talk to SpaceNet…');
          return;
        }
        if (global.SNMap?.active) global.SNMap.backToGlobe?.() || global.SNMap.close?.();
        else global.SNMap?.close?.();
      }
    });
    // Edge buttons may be hidden — ribbon owns tools; keep aliases if present
    $('btn-locate')?.addEventListener('click', () => void run('locate'));
    $('btn-help')?.addEventListener('click', () => void run('help'));
    $('btn-earth')?.addEventListener('click', () => void run('earth'));
    feedBox();
    // Empty feed until YOU speak — live idle
    setActivity('idle');
    setLive(false);
    preview('type · map follows');
    try {
      document.querySelectorAll('#cli-log .cli-tile-block').forEach((el) => el.remove());
    } catch (_) {}
    warmVoices();
    setTimeout(() => {
      try {
        if (global.SNAi?.bootPresence && !global.SNAi.history?.length) SNAi.bootPresence();
      } catch (_) {}
    }, 900);
  }

  global.SNCli = {
    init,
    run,
    log,
    help,
    preview,
    appendTilePost,
    applyFeedFilter,
    feedBox,
    beginTurn,
    endTurn,
    inTurn,
    activity,
    depict,
    setActivity,
    setLive,
    userFace,
    gpsLocate,
    toggleHandsfree,
    speakAi,
    stopHandsfree,
    get handsfreeOn() {
      return handsfreeOn;
    },
  };
})(window);
