/**
 * Field chrome (spartan): radar + home + miner (S + S/day) · CLI top ribbon buttons
 * SPECS P0+P2. No companion. No floating edge docks.
 */
(function (g) {
  'use strict';
  /** Radar center speeds (km/h) + plain-language captions (SPECS radar) */
  var SPEED = {
    orbit: {
      v: 107208,
      mode: 'Earth through space',
      explain: 'Earth orbital speed around the Sun (~29.8 km/s) · center = km/h in space',
    },
    rotate: {
      v: 1671,
      mode: 'Earth rotation',
      explain: 'Earth surface rotation at the equator · how fast ground moves with the planet',
    },
    walk: {
      v: 5,
      mode: 'Walking',
      explain: 'Typical walking speed on Earth surface · street / pedestrian scale',
    },
    drive: {
      v: 50,
      mode: 'Driving',
      explain: 'Typical urban driving on Earth surface · city road scale',
    },
  };
  var EARTH = SPEED.rotate.v;
  var task = 'idle';
  var notice = '';
  var speedMode = 'rotate';
  var mine = {
    on: false,
    terms: false,
    rate: 0,
    session: 0,
    donate: false,
    spare: 0,
    fps: 0,
    rates: { cpu: 0, ram: 0, storage: 0, bandwidth: 0 },
  };
  var sweep = 0;
  var blips = [];
  var fpsBuf = [];
  var lastF = 0;
  var radarBig = false;
  var radarLastTap = 0;
  var RADAR_SM = 120;
  var RADAR_LG = 320;
  /** Active routes for radar: { id, points:[{lat,lng}], color, label } */
  var routes = [];
  var routeFetchBusy = false;
  var routeFetchAt = 0;
  /** Blip kinds: f friend green · c competitor red · v vendor/client yellow */
  var BLIP_COLOR = {
    f: 'rgba(68,255,136,0.95)',
    c: 'rgba(255,85,102,0.95)',
    v: 'rgba(255,204,68,0.95)',
    s: 'rgba(255,204,68,0.95)', // shop = vendor yellow
    p: 'rgba(100,180,255,0.75)',
  };
  var ROUTE_COLORS = [
    'rgba(0,220,255,0.95)',
    'rgba(255,180,60,0.95)',
    'rgba(120,255,160,0.9)',
    'rgba(200,140,255,0.9)',
  ];
  /**
   * SPECS CLI top ribbon — ALWAYS visible permanent basics:
   * 🎯 Locate · 👤 User · ➕ Add · 🗺 Layers · 🎧 AI · ➤ Send
   */
  var RIBBON_CORE = [
    {
      act: 'locate',
      emoji: '🎯',
      text: 'Locate',
      title: 'Locate · expands upward',
      id: 'sn-rib-locate',
    },
    {
      act: 'user',
      emoji: '👤',
      text: 'User',
      title: 'User · expands upward',
      id: 'sn-rib-user',
    },
    {
      act: 'add',
      emoji: '➕',
      text: 'Add',
      title: 'Add · expands upward',
      id: 'sn-rib-add',
    },
    {
      act: 'layers',
      emoji: '🗺',
      text: 'Layers',
      title: 'Layers · basemap + windy ISS planes ships · expands upward',
      id: 'sn-rib-layers',
    },
    {
      act: 'handsfree',
      emoji: '🎧',
      text: 'AI',
      title: 'Hands-free listen (silent) · tap again to stop',
      id: 'sn-rib-hf',
    },
    { act: 'send', emoji: '➤', text: 'Send', title: 'Send to SpaceNet', id: 'sn-rib-send' },
  ];
  var TASKS = {
    idle: [],
    map: ['shops', 'cart', 'order'],
    shops: ['cart', 'order', 'menu'],
    mine: ['mine on', 'mine off'],
    money: ['rate', 'finance'],
    space: ['cosmos'],
    delivery: ['claim', 'cart', 'order'],
  };

  function $(id) {
    return document.getElementById(id);
  }

  /**
   * SPECS: any ribbon button with more than one action MUST expand upward.
   * openRibbonFlyout(anchorEl|selector, { title, items:[{id,e,t,d}] }, onPick)
   */
  function ensureFlyoutCss() {
    if (document.getElementById('sn-rib-fly-css')) return;
    var st = document.createElement('style');
    st.id = 'sn-rib-fly-css';
    st.textContent = [
      '#sn-rib-fly{position:fixed;inset:0;z-index:135;display:none;pointer-events:none}',
      '#sn-rib-fly.open{display:block;pointer-events:auto}',
      '#sn-rib-fly .sn-rib-fly-bg{position:absolute;inset:0;background:rgba(0,0,0,.3)}',
      '#sn-rib-fly .sn-rib-fly-sheet{position:fixed;z-index:136;width:min(300px,calc(100vw - 16px));',
      'max-height:min(58vh,440px);overflow:auto;padding:8px;',
      'background:rgba(0,6,16,.98);border:1px solid rgba(61,158,255,.55);border-radius:14px;',
      'box-shadow:0 -10px 36px rgba(0,0,0,.7),0 0 20px rgba(26,111,212,.25);color:#c8e4ff}',
      '#sn-rib-fly .sn-rib-fly-head{font:700 11px system-ui;color:#3d9eff;letter-spacing:.1em;',
      'text-transform:uppercase;padding:6px 8px 8px;border-bottom:1px solid rgba(26,111,212,.28);margin-bottom:4px}',
      '#sn-rib-fly .sn-rib-fly-opt{border:0;border-radius:10px;background:transparent;color:#e0f0ff;',
      'padding:10px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:10px;width:100%;',
      'font:600 13px system-ui}',
      '#sn-rib-fly .sn-rib-fly-opt:hover,#sn-rib-fly .sn-rib-fly-opt:active{background:rgba(26,111,212,.28)}',
      '#sn-rib-fly .sn-rib-fly-opt .e{font-size:20px;width:28px;text-align:center;flex-shrink:0}',
      '#sn-rib-fly .sn-rib-fly-opt .meta{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '#sn-rib-fly .sn-rib-fly-opt .t{font-weight:700;color:#e8f4ff}',
      '#sn-rib-fly .sn-rib-fly-opt .d{font:10px/1.25 system-ui;color:#6a8aaa}',
      '#sn-rib-fly .sn-rib-fly-cancel{margin-top:4px;width:100%;border:1px solid rgba(61,158,255,.3);',
      'border-radius:10px;background:rgba(0,12,28,.85);color:#8ab4d0;padding:10px;font:600 12px system-ui;cursor:pointer}',
    ].join('');
    document.head.appendChild(st);
  }

  function closeRibbonFlyout() {
    var root = document.getElementById('sn-rib-fly');
    if (root) {
      root.classList.remove('open');
      root.innerHTML = '';
    }
  }

  /**
   * Expand options UPWARD from a ribbon button (SPECS law).
   * @param {HTMLElement|string} anchor
   * @param {{title?:string, items:Array<{id:string,e?:string,t:string,d?:string}>}} cfg
   * @param {function(string):void} onPick
   */
  function openRibbonFlyout(anchor, cfg, onPick) {
    ensureFlyoutCss();
    closeRibbonFlyout();
    // Close competing menus
    try {
      if (g.SNTopo && SNTopo.closeAddMenu) SNTopo.closeAddMenu();
    } catch (e) {}

    var el =
      typeof anchor === 'string' ? document.getElementById(anchor) || document.querySelector(anchor) : anchor;
    var root = document.getElementById('sn-rib-fly');
    if (!root) {
      root = document.createElement('div');
      root.id = 'sn-rib-fly';
      root.setAttribute('role', 'dialog');
      document.body.appendChild(root);
    }
    var items = (cfg && cfg.items) || [];
    var rows = items
      .map(function (o) {
        return (
          '<button type="button" class="sn-rib-fly-opt" data-pick="' +
          o.id +
          '"><span class="e" aria-hidden="true">' +
          (o.e || '·') +
          '</span><span class="meta"><span class="t">' +
          (o.t || o.id) +
          '</span>' +
          (o.d ? '<span class="d">' + o.d + '</span>' : '') +
          '</span></button>'
        );
      })
      .join('');
    root.innerHTML =
      '<div class="sn-rib-fly-bg" data-pick="__close"></div>' +
      '<div class="sn-rib-fly-sheet" id="sn-rib-fly-sheet">' +
      '<div class="sn-rib-fly-head">' +
      ((cfg && cfg.title) || 'Options') +
      '</div>' +
      rows +
      '<button type="button" class="sn-rib-fly-cancel" data-pick="__close">Cancel</button></div>';

    var sheet = root.querySelector('#sn-rib-fly-sheet');
    var pad = 8;
    var w = Math.min(300, window.innerWidth - 16);
    if (el && sheet) {
      var r = el.getBoundingClientRect();
      var left = Math.max(pad, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - pad));
      sheet.style.width = w + 'px';
      sheet.style.left = left + 'px';
      sheet.style.bottom = window.innerHeight - r.top + 8 + 'px';
      sheet.style.top = 'auto';
      sheet.style.transform = 'none';
    } else if (sheet) {
      sheet.style.left = '50%';
      sheet.style.transform = 'translateX(-50%)';
      sheet.style.bottom = '120px';
    }
    root.classList.add('open');
    root.querySelectorAll('[data-pick]').forEach(function (btn) {
      btn.addEventListener(
        'click',
        function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var id = btn.getAttribute('data-pick');
          closeRibbonFlyout();
          if (id && id !== '__close' && typeof onPick === 'function') onPick(id);
        },
        true
      );
    });
  }

  function focusPos() {
    return (
      g._snLastPos ||
      (g.SNTasks && SNTasks.pos) ||
      (g.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) || {
        lat: 36.4341,
        lng: 28.2176,
      }
    );
  }

  function openCityMap() {
    var p = focusPos();
    return (g.SNMap && SNMap.open ? SNMap.open(p.lat, p.lng) : Promise.resolve()).catch(function () {});
  }

  function ribbonAct(act) {
    // Multi-option buttons: ALWAYS expand upward (SPECS)
    if (act === 'locate') {
      openRibbonFlyout(
        'sn-rib-locate',
        {
          title: '🎯 Locate',
          items: [
            { id: 'gps', e: '🎯', t: 'Locate me', d: 'GPS · fly globe to you' },
            { id: 'focus', e: '◎', t: 'Last focus', d: 'Fly to last map focus' },
            { id: 'city', e: '🗺', t: 'My city map', d: 'Open street map at me / focus' },
          ],
        },
        function (id) {
          if (id === 'gps' && g.SNCli && SNCli.run) void SNCli.run('locate');
          else if (id === 'focus') {
            var p = focusPos();
            if (g.SNGlobe && SNGlobe.goToPlace)
              SNGlobe.goToPlace(p.lat, p.lng, { tier: 'national', openMap: false, pulse: true });
          } else if (id === 'city') {
            var p2 = focusPos();
            void openCityMap();
            if (g.SNCli && SNCli.log) SNCli.log('City map · focus', 'ok');
          }
        }
      );
      return;
    }
    if (act === 'user') {
      var signed = !!(g.SNAuth && SNAuth.user);
      openRibbonFlyout(
        'sn-rib-user',
        {
          title: '👤 User',
          items: [
            { id: 'me', e: '👤', t: 'My multi-tile', d: 'Roles · photo · menu' },
            {
              id: 'auth',
              e: signed ? '🚪' : '🔐',
              t: signed ? 'Sign out' : 'Sign in with Google',
              d: 'astranov.eu · Astranov SpaceNet',
            },
            { id: 'home', e: '🏠', t: 'Home menu', d: 'Version · clocks · roles' },
          ],
        },
        function (id) {
          if (id === 'me') {
            if (g.SNTile && SNTile.openMe) SNTile.openMe();
            else if (g.SNCli && SNCli.run) void SNCli.run('me');
          } else if (id === 'auth') {
            if (g.SNAuth && SNAuth.toggle) void SNAuth.toggle();
            else if (g.SNCli && SNCli.run) void SNCli.run(signed ? 'logout' : 'login');
          } else if (id === 'home' && g.SNHome && SNHome.toggle) SNHome.toggle();
        }
      );
      return;
    }
    // ➕ Add → upward menu ONLY
    if (act === 'place' || act === 'add' || act === 'target' || act === 'pin') {
      openRibbonFlyout(
        'sn-rib-add',
        {
          title: '➕ Add',
          items: [
            { id: 'pin', e: '📍', t: 'Pin', d: 'Single location on the map' },
            { id: 'targets', e: '◎', t: 'Polygon / targets', d: 'Multi points · measure land size' },
            { id: 'video', e: '📹', t: 'Video call', d: 'Live video call request' },
            { id: 'vendor', e: '🏪', t: 'Vendor', d: 'List shop · sell in S' },
            { id: 'social', e: '🎬', t: 'Social video post', d: 'Post video to the field' },
            { id: 'emergency', e: '🆘', t: 'Emergency help', d: 'Urgent help on the map' },
          ],
        },
        function (id) {
          try {
            if (g.SNTopo && SNTopo.runAddOption) SNTopo.runAddOption(id);
            else if (g.SNTopo && SNTopo.openAddMenu) {
              // Fallback: open topo menu then can't auto-pick — call internal if exposed
              if (typeof SNTopo._runAdd === 'function') SNTopo._runAdd(id);
              else if (g.SNCli && SNCli.log) SNCli.log('Add · ' + id + ' · hard refresh for full tool', 'dim');
            }
          } catch (e) {
            console.error('[SNField] add pick', e);
          }
        }
      );
      return;
    }
    // 🗺 Layers → upward menu of basemaps + overlays
    if (act === 'layers' || act === 'layer') {
      openRibbonFlyout(
        'sn-rib-layers',
        {
          title: '🗺 Layers',
          items: [
            { id: 'panel', e: '🗺', t: 'Full layers panel', d: 'Open map · all providers' },
            { id: 'dark', e: '🌑', t: 'Dark', d: 'Carto free' },
            { id: 'bright', e: '☀️', t: 'Bright', d: 'Carto free' },
            { id: 'satellite', e: '🛰', t: 'Satellite free', d: 'Esri imagery' },
            { id: 'g_satellite', e: '🌍', t: 'Google Earth sat', d: 'Full Google satellite' },
            { id: 'g_hybrid', e: '🗺', t: 'Google hybrid', d: 'Imagery + labels' },
            { id: 'g_terrain', e: '⛰', t: 'Google topo', d: 'Terrain / topographic' },
            { id: 'g_roadmap', e: '🛣', t: 'Google roads', d: 'Roadmap' },
            { id: 'google', e: 'G', t: 'Google-style free', d: 'OSM HOT stand-in' },
            { id: 'traffic', e: '🚗', t: 'Traffic roads', d: 'Roads basemap' },
            { id: 'windy', e: '🌬', t: 'Windy weather', d: 'Wind overlay' },
            { id: 'w3w', e: '///', t: 'what3words', d: '/// address on map' },
            { id: 'iss', e: '🛸', t: 'ISS', d: 'Live station' },
            { id: 'planes', e: '✈', t: 'Airplanes', d: 'OpenSky traffic' },
            { id: 'ships', e: '🚢', t: 'Ships', d: 'OpenSeaMap marks' },
            { id: 'sats', e: '📡', t: 'Satellites', d: 'ISS + LEO marks' },
            { id: 'topo', e: '📐', t: 'Topo measure', d: 'Area · elev · 3D path' },
          ],
        },
        function (id) {
          void (async function () {
            try {
              await openCityMap();
              if (id === 'panel') {
                if (g.SNMap && SNMap.openLayersPanel) SNMap.openLayersPanel();
                return;
              }
              if (id === 'topo') {
                if (g.SNTopo && SNTopo.measureTopo) await SNTopo.measureTopo();
                else if (g.SNCli && SNCli.run) void SNCli.run('measure');
                return;
              }
              if (
                id === 'dark' ||
                id === 'bright' ||
                id === 'satellite' ||
                id === 'google' ||
                id === 'traffic' ||
                id === 'g_satellite' ||
                id === 'g_hybrid' ||
                id === 'g_terrain' ||
                id === 'g_roadmap'
              ) {
                if (g.SNMap && SNMap.setBasemap) SNMap.setBasemap(id, { user: true, log: true });
                return;
              }
              if (g.SNMap && SNMap.toggleOverlay) g.SNMap.toggleOverlay(id);
            } catch (e) {
              if (g.SNCli && SNCli.log) SNCli.log('Layers · ' + (e.message || e), 'err');
            }
          })();
        }
      );
      return;
    }
    // AI = single action for now (no submenu) — silent hands-free toggle
    if (act === 'handsfree') {
      try {
        if (g.SNCli && SNCli.toggleHandsfree) SNCli.toggleHandsfree();
      } catch (e) {}
      return;
    }
    // Send = single action (no submenu)
    if (act === 'send') {
      var form = $('cli-form');
      if (form) {
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      return;
    }
    if (g.SNCli && SNCli.run) void SNCli.run(act);
  }

  function paintRibbon() {
    var bar = $('sn-task-ribbon');
    if (!bar) return;
    bar.hidden = false;
    bar.setAttribute('aria-hidden', 'false');
    var seen = {};
    var h = '';
    var i;
    for (i = 0; i < RIBBON_CORE.length; i++) {
      var b = RIBBON_CORE[i];
      seen[b.act] = 1;
      var onCls =
        b.act === 'add' && g.SNTopo && SNTopo.active ? ' on' : '';
      h +=
        '<button type="button" class="sn-rib-btn sn-rib-core' +
        onCls +
        '" data-act="' +
        b.act +
        '"' +
        (b.id ? ' id="' + b.id + '"' : '') +
        ' title="' +
        (b.title || b.text) +
        '">' +
        '<span class="sn-rib-emoji" aria-hidden="true">' +
        (b.emoji || '') +
        '</span>' +
        '<span class="sn-rib-txt">' +
        (b.text || b.act) +
        '</span>' +
        '</button>';
    }
    var ctx = TASKS[task] || [];
    for (i = 0; i < ctx.length; i++) {
      var cmd = ctx[i];
      var k = String(cmd).toLowerCase();
      if (seen[k]) continue;
      seen[k] = 1;
      h +=
        '<button type="button" class="sn-rib-btn sn-rib-task" data-run="' +
        String(cmd).replace(/"/g, '') +
        '">' +
        cmd +
        '</button>';
    }
    if (notice) {
      try {
        if (g.SNCli && SNCli.preview) SNCli.preview(notice);
      } catch (e) {}
    }
    bar.innerHTML = h;
    // Sync hands-free visual with CLI state
    try {
      var hf = $('sn-rib-hf');
      if (hf && g.SNCli && SNCli.handsfreeOn) hf.classList.add('on');
    } catch (e2) {}
    bar.querySelectorAll('[data-act]').forEach(function (btn) {
      var act = btn.getAttribute('data-act');
      btn.onclick = function (ev) {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        ribbonAct(act);
        setTimeout(paintRibbon, 50);
      };
    });
    bar.querySelectorAll('[data-run]').forEach(function (btn) {
      btn.onclick = function (ev) {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        if (g.SNCli && SNCli.run) void SNCli.run(btn.getAttribute('data-run'));
      };
    });
  }

  function paint() {
    var C = g.SNCurrency;
    var bal = C ? C.balance() : 0;
    var s = $('fbh-s');
    if (s) s.textContent = C ? C.format(bal) : bal.toFixed(2) + ' S';
    // Mining rate as S per day only (product miner face)
    var mr = $('fbh-mine-rate');
    if (mr) {
      var perDay = (mine.rate || 0) * 24;
      mr.textContent = perDay.toFixed(2) + ' S/day';
    }
    var hud = $('field-balance-hud');
    if (hud) hud.classList.toggle('mining-active', !!mine.on && !!mine.terms);
    paintRibbon();
  }

  function noteFrame() {
    var now = performance.now();
    if (lastF) {
      var dt = now - lastF;
      if (dt > 0 && dt < 500) {
        fpsBuf.push(1000 / dt);
        if (fpsBuf.length > 30) fpsBuf.shift();
        var s = 0;
        for (var i = 0; i < fpsBuf.length; i++) s += fpsBuf[i];
        mine.fps = Math.round(s / fpsBuf.length);
      }
    }
    lastF = now;
    var load = document.hidden ? 0.15 : mine.fps >= 40 ? 0.25 : mine.fps >= 25 ? 0.45 : 0.7;
    mine.spare = Math.max(0, Math.min(100, Math.round((1 - load) * 80) - (mine.donate ? 15 : 0)));
  }

  function tickMine(dt) {
    if (!mine.on || !mine.terms) {
      mine.rate = 0;
      return;
    }
    var load = document.hidden ? 0.2 : mine.fps >= 40 ? 0.3 : 0.55;
    if (load > 0.7) {
      mine.rate = 0;
      return;
    }
    var budget = 1 - load;
    var cores = navigator.hardwareConcurrency || 4;
    var ops = Math.floor(3000 * budget * (cores / 8) * Math.min(dt / 500, 1));
    var h = 0;
    for (var i = 0; i < ops; i++) h = ((h << 5) - h + i) | 0;
    mine.rates.cpu = Math.min(100, Math.round(budget * cores * 8));
    mine.rates.ram = Math.round((navigator.deviceMemory || 4) * 64 * budget);
    mine.rates.storage = Math.round(32 * budget);
    mine.rates.bandwidth = Math.round(200 * budget);
    mine.rate = 0.012 * budget * (document.hidden ? 2 : 1);
    // Ambassador online: experienced support mining boost (SpaceNets S)
    try {
      var me = g.SNProfiles && SNProfiles.me && SNProfiles.me();
      if (me && me.roles && me.roles.ambassador && me.ambassadorOnline !== false) {
        mine.rate += 0.008 * budget;
      }
    } catch (e) {}
    if (mine.rate > 0) {
      var earn = mine.rate * (dt / 3600000);
      mine.session += earn;
      g.SNCurrency && SNCurrency.creditMined(earn);
    }
  }

  function radarSizePx() {
    if (!radarBig) return RADAR_SM;
    return Math.min(RADAR_LG, (typeof window !== 'undefined' ? window.innerWidth : 400) - 24);
  }

  function syncRadarCanvas() {
    var c = $('field-radar-canvas');
    var wrap = $('field-radar');
    if (!c || !wrap) return;
    var px = radarSizePx();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var need = Math.round(px * dpr);
    if (c.width !== need || c.height !== need) {
      c.width = need;
      c.height = need;
    }
  }

  function setRadarExpanded(on) {
    radarBig = !!on;
    var wrap = $('field-radar');
    if (wrap) {
      wrap.classList.toggle('expanded', radarBig);
      wrap.setAttribute('aria-expanded', radarBig ? 'true' : 'false');
      wrap.title = radarBig
        ? 'Double-tap to shrink · routes & contacts'
        : 'Tap expand · routes · friends green · competitors red · vendors yellow';
    }
    syncRadarCanvas();
    if (radarBig) {
      void refreshRoutes(true);
    }
    try {
      if (g.SNUsage && SNUsage.track) SNUsage.track('radar_size', { big: radarBig });
    } catch (e) {}
  }

  function bindRadarTap() {
    var wrap = $('field-radar');
    if (!wrap || wrap._snRadarTap) return;
    wrap._snRadarTap = true;
    wrap.addEventListener(
      'click',
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        var now = Date.now();
        // Double-tap within 320ms → small; single tap → expand
        if (now - radarLastTap < 320) {
          radarLastTap = 0;
          setRadarExpanded(false);
          return;
        }
        radarLastTap = now;
        setTimeout(function () {
          if (radarLastTap && Date.now() - radarLastTap >= 300) {
            // single tap confirmed
            if (!radarBig) setRadarExpanded(true);
            radarLastTap = 0;
          }
        }, 310);
      },
      true
    );
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setRadarExpanded(!radarBig);
      }
    });
  }

  function drawRadar() {
    var c = $('field-radar-canvas');
    if (!c) return;
    syncRadarCanvas();
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var w = c.width,
      h = c.height,
      cx = w / 2,
      cy = h / 2,
      R = Math.min(w, h) / 2 - (radarBig ? 10 : 4);
    var blipR = radarBig ? 4 : 2.2;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,180,255,0.25)';
    ctx.lineWidth = radarBig ? 1.5 : 1;
    for (var n = 1; n <= 3; n++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * n) / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.stroke();
    // Route polygons / polylines under sweep (delivery & active paths)
    drawRoutes(ctx, cx, cy, R);
    // self (center ring)
    ctx.strokeStyle = 'rgba(120,220,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radarBig ? 5 : 3, 0, Math.PI * 2);
    ctx.stroke();
    sweep = (sweep + (radarBig ? 0.05 : 0.07)) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(0,180,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sweep - 0.45, sweep);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,200,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
    ctx.stroke();
    for (var i = 0; i < blips.length; i++) {
      var t = blips[i];
      var x = cx + Math.cos(t.a) * t.r * R;
      var y = cy + Math.sin(t.a) * t.r * R;
      ctx.fillStyle = BLIP_COLOR[t.k] || BLIP_COLOR.p;
      ctx.beginPath();
      ctx.arc(x, y, blipR, 0, Math.PI * 2);
      ctx.fill();
      if (radarBig && t.label) {
        ctx.fillStyle = 'rgba(180,210,230,0.85)';
        ctx.font = '10px system-ui';
        ctx.fillText(String(t.label).slice(0, 12), x + 6, y + 3);
      }
    }
    updateRadarSpeed();
    noteFrame();
  }

  function focusPos() {
    return (
      (g.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) ||
      g._snLastPos ||
      (g.SNTasks && SNTasks.pos) || { lat: 36.43, lng: 28.22 }
    );
  }

  /** Local meters relative to focus (north-up) */
  function toLocalM(lat, lng, focus) {
    var lat0 = Number(focus.lat);
    var lng0 = Number(focus.lng);
    var north = (Number(lat) - lat0) * 111320;
    var east = (Number(lng) - lng0) * 111320 * Math.cos((lat0 * Math.PI) / 180);
    return { x: east, y: north };
  }

  /**
   * Draw full route polygons on radar:
   * - filled corridor polygon along path
   * - centerline polyline
   * - start/end markers
   */
  function drawRoutes(ctx, cx, cy, R) {
    if (!routes || !routes.length) return;
    var focus = focusPos();
    var maxD = 80; // meters floor so short routes still show
    var i, j, loc, pts, route;

    // Fit scale to all route vertices
    for (i = 0; i < routes.length; i++) {
      pts = routes[i].points || [];
      for (j = 0; j < pts.length; j++) {
        loc = toLocalM(pts[j].lat, pts[j].lng, focus);
        var d = Math.sqrt(loc.x * loc.x + loc.y * loc.y);
        if (d > maxD) maxD = d;
      }
    }
    var scale = (R * 0.9) / maxD;

    function toCanvas(lat, lng) {
      var L = toLocalM(lat, lng, focus);
      return {
        x: cx + L.x * scale,
        y: cy - L.y * scale, // north up
      };
    }

    for (i = 0; i < routes.length; i++) {
      route = routes[i];
      pts = route.points || [];
      if (pts.length < 2) continue;
      var col = route.color || ROUTE_COLORS[i % ROUTE_COLORS.length];
      var canvasPts = [];
      for (j = 0; j < pts.length; j++) canvasPts.push(toCanvas(pts[j].lat, pts[j].lng));

      // Corridor polygon (offset polyline both sides)
      var halfW = radarBig ? 5.5 : 3.2;
      var left = [];
      var right = [];
      for (j = 0; j < canvasPts.length; j++) {
        var prev = canvasPts[Math.max(0, j - 1)];
        var next = canvasPts[Math.min(canvasPts.length - 1, j + 1)];
        var dx = next.x - prev.x;
        var dy = next.y - prev.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = (-dy / len) * halfW;
        var ny = (dx / len) * halfW;
        left.push({ x: canvasPts[j].x + nx, y: canvasPts[j].y + ny });
        right.push({ x: canvasPts[j].x - nx, y: canvasPts[j].y - ny });
      }
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (j = 1; j < left.length; j++) ctx.lineTo(left[j].x, left[j].y);
      for (j = right.length - 1; j >= 0; j--) ctx.lineTo(right[j].x, right[j].y);
      ctx.closePath();
      ctx.fillStyle = col.replace('0.95', '0.18').replace('0.9', '0.16');
      if (ctx.fillStyle === col) ctx.fillStyle = 'rgba(0,200,255,0.15)';
      ctx.fill();
      ctx.strokeStyle = col.replace('0.95', '0.45').replace('0.9', '0.4');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Centerline
      ctx.beginPath();
      ctx.moveTo(canvasPts[0].x, canvasPts[0].y);
      for (j = 1; j < canvasPts.length; j++) ctx.lineTo(canvasPts[j].x, canvasPts[j].y);
      ctx.strokeStyle = col;
      ctx.lineWidth = radarBig ? 2.4 : 1.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Start / end
      var a0 = canvasPts[0];
      var a1 = canvasPts[canvasPts.length - 1];
      ctx.fillStyle = 'rgba(68,255,136,0.95)';
      ctx.beginPath();
      ctx.arc(a0.x, a0.y, radarBig ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,100,120,0.95)';
      ctx.beginPath();
      ctx.arc(a1.x, a1.y, radarBig ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      if (radarBig && route.label) {
        ctx.fillStyle = 'rgba(200,230,255,0.9)';
        ctx.font = '10px system-ui';
        ctx.fillText(String(route.label).slice(0, 18), a1.x + 6, a1.y - 4);
      }
    }
  }

  function setRoutes(list) {
    routes = Array.isArray(list) ? list.slice(0, 8) : [];
  }

  function clearRoutes() {
    routes = [];
  }

  function straightRoute(aLat, aLng, bLat, bLng, steps) {
    steps = steps || 12;
    var out = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      out.push({
        lat: aLat + (bLat - aLat) * t,
        lng: aLng + (bLng - aLng) * t,
      });
    }
    return out;
  }

  /** OSRM driving geometry (GeoJSON line) — free public router */
  async function fetchOsrmRoute(aLat, aLng, bLat, bLng) {
    var url =
      'https://router.project-osrm.org/route/v1/driving/' +
      Number(aLng) +
      ',' +
      Number(aLat) +
      ';' +
      Number(bLng) +
      ',' +
      Number(bLat) +
      '?overview=full&geometries=geojson';
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var to = setTimeout(function () {
      try {
        if (ctrl) ctrl.abort();
      } catch (_) {}
    }, 8000);
    try {
      var res = await fetch(url, {
        signal: ctrl ? ctrl.signal : undefined,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('osrm ' + res.status);
      var j = await res.json();
      var coords =
        j &&
        j.routes &&
        j.routes[0] &&
        j.routes[0].geometry &&
        j.routes[0].geometry.coordinates;
      if (!coords || !coords.length) throw new Error('no geom');
      // OSRM = [lng, lat]
      return coords.map(function (c) {
        return { lat: c[1], lng: c[0] };
      });
    } finally {
      clearTimeout(to);
    }
  }

  /**
   * Build radar routes from open delivery tasks (pickup → drop).
   * Full road polygons when OSRM available; straight fallback otherwise.
   */
  async function refreshRoutes(force) {
    if (routeFetchBusy) return routes;
    if (!force && Date.now() - routeFetchAt < 12000) return routes;
    routeFetchBusy = true;
    routeFetchAt = Date.now();
    var next = [];
    try {
      var tasks = [];
      try {
        if (g.SNTasks && SNTasks.list) {
          tasks = SNTasks.list({ all: true }).filter(function (t) {
            return (
              t &&
              (t.kind === 'delivery' || t.role === 'driver') &&
              (t.status === 'open' || t.status === 'claimed' || t.status === 'in_progress') &&
              t.lat != null &&
              t.lng != null
            );
          });
        }
      } catch (_) {}
      // Also manual routes set via setRoutes already in routes — keep non-task ids
      var manual = routes.filter(function (r) {
        return r && r.id && String(r.id).indexOf('task:') !== 0;
      });

      for (var i = 0; i < Math.min(tasks.length, 6); i++) {
        var t = tasks[i];
        var dropLat = t.drop_lat != null ? t.drop_lat : focusPos().lat;
        var dropLng = t.drop_lng != null ? t.drop_lng : focusPos().lng;
        var pts = null;
        try {
          pts = await fetchOsrmRoute(t.lat, t.lng, dropLat, dropLng);
        } catch (_) {
          pts = straightRoute(t.lat, t.lng, dropLat, dropLng, 16);
        }
        if (pts && pts.length >= 2) {
          next.push({
            id: 'task:' + t.id,
            points: pts,
            color: ROUTE_COLORS[i % ROUTE_COLORS.length],
            label: (t.title || 'Route').replace(/^📦\s*/, '').slice(0, 22),
            kind: 'delivery',
          });
        }
      }
      routes = manual.concat(next).slice(0, 8);
    } catch (_) {
    } finally {
      routeFetchBusy = false;
    }
    return routes;
  }

  /** Public: set a route from waypoints (lat/lng array or OSRM fetch between first/last) */
  async function showRoute(waypoints, opts) {
    opts = opts || {};
    var pts = [];
    if (Array.isArray(waypoints) && waypoints.length >= 2) {
      if (waypoints[0].lat != null && waypoints.length > 2 && !opts.osrm) {
        pts = waypoints.map(function (w) {
          return { lat: Number(w.lat), lng: Number(w.lng) };
        });
      } else {
        var a = waypoints[0];
        var b = waypoints[waypoints.length - 1];
        try {
          pts = await fetchOsrmRoute(a.lat, a.lng, b.lat, b.lng);
        } catch (_) {
          pts = straightRoute(a.lat, a.lng, b.lat, b.lng, 16);
        }
      }
    }
    if (pts.length < 2) return null;
    var row = {
      id: opts.id || 'route_' + Date.now().toString(36),
      points: pts,
      color: opts.color || ROUTE_COLORS[0],
      label: opts.label || 'Route',
      kind: opts.kind || 'custom',
    };
    routes = routes.filter(function (r) {
      return r.id !== row.id;
    });
    routes.unshift(row);
    routes = routes.slice(0, 8);
    return row;
  }

  /**
   * Center number + caption under radar:
   * solar → Earth through space (orbit)
   * global/national → Earth rotation (equator)
   * city map / street → walking or driving
   */
  function pickSpeedMode() {
    var tier = (g.SNGlobe && SNGlobe.tier) || 'global';
    var body = (g.SNGlobe && SNGlobe.bodyId) || 'earth';
    var cityOn = !!(g.SNMap && SNMap.active);
    if (body !== 'earth') {
      return {
        v: SPEED.orbit.v,
        mode: String(body).toUpperCase() + ' context',
        explain:
          'Off-Earth body · center shows reference Earth-orbit scale until body telemetry is live',
      };
    }
    if (tier === 'solar') return SPEED.orbit;
    if (cityOn) return SPEED.walk;
    if (tier === 'city') return SPEED.drive;
    if (tier === 'regional') return SPEED.drive;
    if (tier === 'national') return SPEED.rotate;
    return SPEED.rotate; // global default
  }

  function updateRadarSpeed() {
    var s = pickSpeedMode();
    speedMode = s.mode;
    var v = $('fsh-value');
    var u = $('fsh-unit');
    var title = $('fsh-mode-title');
    var exp = $('fsh-explain');
    var wrap = $('field-radar-speed');
    if (v) {
      // Compact display for large orbital number
      if (s.v >= 10000) v.textContent = String(Math.round(s.v / 1000)) + 'k';
      else v.textContent = String(s.v);
    }
    if (u) u.textContent = 'km/h';
    if (title) title.textContent = s.mode;
    if (exp) exp.textContent = s.explain;
    if (wrap) {
      wrap.classList.remove('earth', 'driving', 'idle', 'walk', 'orbit');
      if (s === SPEED.orbit) wrap.classList.add('orbit');
      else if (s === SPEED.walk) wrap.classList.add('walk');
      else if (s === SPEED.drive) wrap.classList.add('driving');
      else wrap.classList.add('earth');
    }
  }

  /**
   * Radar contacts:
   * green f = friends · red c = competitors · yellow v = vendors & clients
   */
  function classifyProfile(p, me) {
    if (!p) return null;
    if (me && p.id === me.id) return null;
    if (p.competitor === true || p.relation === 'competitor') return 'c';
    if (p.friend === true || p.relation === 'friend') return 'f';
    var r = p.roles || {};
    // Marketplace actors — yellow
    if (r.vendor || r.client) return 'v';
    // Competing drivers / workers — red
    if (r.driver || r.worker) return 'c';
    // Social / dating / ambassador — friends green
    if (r.social || r.dating || r.ambassador) return 'f';
    return 'f';
  }

  function bearingFromFocus(lat, lng, focus) {
    // Angle on radar from focus position (simple lng-based azimuth)
    var dLng = (Number(lng) - Number(focus.lng)) * Math.cos((Number(lat) * Math.PI) / 180);
    var dLat = Number(lat) - Number(focus.lat);
    return Math.atan2(dLng, dLat);
  }

  function distRing(lat, lng, focus) {
    var dLat = Number(lat) - Number(focus.lat);
    var dLng = Number(lng) - Number(focus.lng);
    var d = Math.sqrt(dLat * dLat + dLng * dLng);
    return Math.max(0.12, Math.min(0.92, 0.18 + d * 8));
  }

  function refreshBlips() {
    blips = [];
    var focus =
      (g.SNGlobe && SNGlobe.focusPos && SNGlobe.focusPos()) ||
      g._snLastPos ||
      (g.SNTasks && SNTasks.pos) || { lat: 36.43, lng: 28.22 };
    var me = null;
    try {
      me = g.SNProfiles && SNProfiles.me && SNProfiles.me();
    } catch (e) {}

    // Profiles → friends / competitors / vendors & clients
    try {
      var list = (g.SNProfiles && SNProfiles.list && SNProfiles.list()) || [];
      for (var i = 0; i < list.length && blips.length < 28; i++) {
        var p = list[i];
        if (!p || p.lat == null || p.lng == null) continue;
        var kind = classifyProfile(p, me);
        if (!kind) continue;
        blips.push({
          a: bearingFromFocus(p.lat, p.lng, focus),
          r: distRing(p.lat, p.lng, focus),
          k: kind,
          label: p.name || p.shopName || '',
        });
      }
    } catch (e2) {}

    // DB / commerce vendors → yellow (vendors)
    var vs = (g.SNCommerce && SNCommerce.vendors) || [];
    for (var j = 0; j < Math.min(14, vs.length); j++) {
      var v = vs[j];
      if (!v || v.lat == null) continue;
      blips.push({
        a: bearingFromFocus(v.lat, v.lng, focus),
        r: distRing(v.lat, v.lng, focus),
        k: 'v',
        label: v.name || 'Shop',
      });
    }

    // Spatial places — neutral (blue) only if room
    var ps = (g.SNSpatial && SNSpatial.list && SNSpatial.list()) || [];
    for (var k = 0; k < Math.min(4, ps.length) && blips.length < 36; k++) {
      if (ps[k].lat == null) continue;
      blips.push({
        a: bearingFromFocus(ps[k].lat, ps[k].lng, focus),
        r: distRing(ps[k].lat, ps[k].lng, focus),
        k: 'p',
        label: ps[k].name || '',
      });
    }

    // Keep delivery route polygons in sync (throttled)
    void refreshRoutes(false);
  }

  function setTask(name) {
    task = TASKS[name] ? name : 'idle';
    paintRibbon();
  }

  function infer(line) {
    var l = String(line || '').toLowerCase();
    if (/^shops|^menu|^order|^cart|^market/.test(l)) setTask('shops');
    else if (/^city|^map/.test(l)) setTask('map');
    else if (/^mine|^resources|^donate|^boost/.test(l)) setTask('mine');
    else if (/^rate|^wallet|^money|^finance|^s\b/.test(l)) setTask('money');
    else if (/^thesis|^vault|^mars|^go to|^cosmos/.test(l)) setTask('space');
    else if (/^deliver|^claim|^first delivery/.test(l)) setTask('delivery');
    else if (/^global|^locate|^earth|^help/.test(l)) setTask('idle');
  }

  function showTerms() {
    var m = $('sn-miner-terms');
    if (m) m.hidden = false;
  }

  function acceptTerms() {
    try {
      localStorage.setItem('astranov:spacenet-miner-v2', String(Date.now()));
    } catch (e) {}
    mine.terms = true;
    mine.on = true;
    var m = $('sn-miner-terms');
    if (m) m.hidden = true;
    g.SNCli && SNCli.log('Mesh on · mining S', 'ok');
    setTask('mine');
    paint();
  }

  function openFinance(tab) {
    var p = $('spacenet-finance-panel');
    if (!p) return;
    p.hidden = false;
    tab = tab || 'stats';
    var C = g.SNCurrency;
    var body = $('sfp-body');
    var snap = C ? C.snapshot() : { balance: 0, mined: 0 };
    document.querySelectorAll('.sfp-tab').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tab') === tab);
    });
    if (!body) return;
    if (tab === 'mining') {
      body.innerHTML =
        '<div class="sfp-line"><b>Rate</b> ' +
        mine.rate.toFixed(3) +
        ' S/h · session ' +
        mine.session.toFixed(4) +
        ' S</div>' +
        '<div class="sfp-line">FPS ' +
        mine.fps +
        ' · spare ' +
        mine.spare +
        '%</div>' +
        '<div class="sfp-actions"><button type="button" data-cmd="mine on">Mine on</button>' +
        '<button type="button" data-cmd="mine off">Mine off</button>' +
        '<button type="button" data-cmd="donate on">Donate</button></div>';
    } else if (tab === 'platform') {
      body.innerHTML =
        '<div class="sfp-line"><b>Platform</b> 3% of S · <b>Driver</b> 15% gross S</div>';
    } else if (tab === 'p2p') {
      body.innerHTML = '<div class="sfp-line">P2P ledger in S · wallet ' + (C ? C.format(snap.balance) : '') + '</div>';
    } else if (tab === 'reports') {
      body.innerHTML = '<div class="sfp-line dim">CLI: resources · rate · wallet</div>';
    } else {
      body.innerHTML =
        '<div class="sfp-line"><b>Balance</b> ' +
        (C ? C.format(snap.balance) : '') +
        '</div>' +
        '<div class="sfp-line"><b>Mined</b> ' +
        (C ? C.format(snap.mined) : '') +
        '</div>' +
        '<div class="sfp-line dim">S primary · fiat/crypto secondary</div>';
    }
    body.querySelectorAll('[data-cmd]').forEach(function (b) {
      b.onclick = function () {
        g.SNCli && SNCli.run(b.getAttribute('data-cmd'));
        openFinance(tab);
      };
    });
    setTask('money');
  }

  function report() {
    return {
      fps: mine.fps,
      spareScore: mine.spare,
      donating: mine.donate,
      mining: mine.on && mine.terms,
      rateSPerH: mine.rate,
      sessionMined: mine.session,
      rates: mine.rates,
      line:
        'FPS ~' +
        mine.fps +
        ' · spare ' +
        mine.spare +
        '%' +
        (mine.donate ? ' · donate' : '') +
        (mine.on ? ' · ' + mine.rate.toFixed(3) + ' S/h' : ' · mine off'),
    };
  }

  function init() {
    if (init.done) return;
    init.done = true;
    try {
      mine.terms = !!localStorage.getItem('astranov:spacenet-miner-v2');
      mine.on = mine.terms;
      mine.donate = localStorage.getItem('astranov_donate_compute') === '1';
    } catch (e) {}
    paint();
    refreshBlips();
    bindRadarTap();
    syncRadarCanvas();
    drawRadar();
    setInterval(drawRadar, 125);
    setInterval(refreshBlips, 8000);
    setInterval(function () {
      void refreshRoutes(false);
    }, 20000);
    // Warm routes shortly after boot (delivery polygons)
    setTimeout(function () {
      void refreshRoutes(true);
    }, 2500);
    var last = performance.now();
    setInterval(function () {
      var n = performance.now();
      tickMine(n - last);
      last = n;
      paint();
    }, 1000);

    $('field-balance-hud') &&
      ($('field-balance-hud').onclick = function () {
        openFinance('mining');
      });
    // Home button owned by SNHome menu (menu has Back to Earth GLOBAL)
    if (g.SNHome && SNHome.init) SNHome.init();
    else if ($('btn-home')) {
      $('btn-home').onclick = function (e) {
        if (e) e.preventDefault();
        if (g.SNHome && SNHome.toggle) SNHome.toggle();
      };
    }
    $('sfp-close') &&
      ($('sfp-close').onclick = function () {
        var p = $('spacenet-finance-panel');
        if (p) p.hidden = true;
      });
    document.querySelectorAll('.sfp-tab').forEach(function (t) {
      t.onclick = function () {
        openFinance(t.getAttribute('data-tab'));
      };
    });
    $('sn-miner-accept') && ($('sn-miner-accept').onclick = acceptTerms);
    paintRibbon();
  }

  g.SNField = {
    init: init,
    paint: paint,
    paintRibbon: paintRibbon,
    openRibbonFlyout: openRibbonFlyout,
    closeRibbonFlyout: closeRibbonFlyout,
    setTask: setTask,
    infer: infer,
    setNotice: function (t) {
      notice = String(t || '').slice(0, 60);
      paintRibbon();
    },
    showTerms: showTerms,
    openFinance: openFinance,
    closeFinance: function () {
      var p = $('spacenet-finance-panel');
      if (p) p.hidden = true;
    },
    refreshBlips: refreshBlips,
    setRadarExpanded: setRadarExpanded,
    refreshRoutes: refreshRoutes,
    showRoute: showRoute,
    setRoutes: setRoutes,
    clearRoutes: clearRoutes,
    get routes() {
      return routes.slice();
    },
    get radarExpanded() {
      return radarBig;
    },
    updateRadarSpeed: updateRadarSpeed,
    SPEED: SPEED,
    EARTH_KMH: EARTH,
  };

  // Compat thin aliases (boot/cli may call old names)
  g.SNRadar = {
    init: function () {},
    refresh: refreshBlips,
    updateSpeed: updateRadarSpeed,
    EARTH_KMH: EARTH,
    SPEED: SPEED,
  };
  g.SNResources = {
    init: function () {},
    report: report,
    status: function () {
      var r = report();
      return [r.line, 'CPU ' + (r.rates.cpu || 0) + '% · spare ' + r.spareScore + '%', 'Session ' + (g.SNCurrency ? SNCurrency.format(r.sessionMined) : r.sessionMined)];
    },
    checkTerms: function () {
      return mine.terms;
    },
    acceptTerms: acceptTerms,
    setMining: function (on) {
      if (on && !mine.terms) {
        showTerms();
        return false;
      }
      mine.on = !!on;
      paint();
      return true;
    },
    setDonate: function (on) {
      mine.donate = !!on;
      try {
        if (on) localStorage.setItem('astranov_donate_compute', '1');
        else localStorage.removeItem('astranov_donate_compute');
      } catch (e) {}
      paint();
      g.SNCli && SNCli.log(on ? 'Donate on' : 'Donate off', 'ok');
    },
    get mining() {
      return mine.on && mine.terms;
    },
    get rateSPerH() {
      return mine.rate;
    },
    get sessionMined() {
      return mine.session;
    },
    get rates() {
      return mine.rates;
    },
  };
  g.SNRibbon = {
    init: function () {},
    render: paintRibbon,
    setTask: setTask,
    setNotice: function (t) {
      g.SNField.setNotice(t);
    },
    infer: infer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
