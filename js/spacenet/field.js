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
  /**
   * Device harvest roles (ASTRANOV technical settings):
   * main — primary phone/PC · conservative spare harvest
   * secondary — hot-swap spare · low harvest · battery / monitor
   * raid — array node · heavy harvest · always below TJ max (thermal ceiling)
   */
  var DEVICE_ROLES = {
    main: {
      id: 'main',
      label: 'Main device',
      harvest: 0.32,
      donateBoost: 1.15,
      workerScale: 0.45,
      maxBudget: 0.55,
      loadCap: 0.72,
      preferHidden: false,
    },
    secondary: {
      id: 'secondary',
      label: 'Secondary device',
      harvest: 0.12,
      donateBoost: 1.0,
      workerScale: 0.18,
      maxBudget: 0.28,
      loadCap: 0.5,
      preferHidden: true,
    },
    raid: {
      id: 'raid',
      label: 'RAID device',
      harvest: 0.78,
      donateBoost: 2.4,
      workerScale: 1.85,
      maxBudget: 0.9,
      loadCap: 0.88,
      preferHidden: false,
      /** Thermal junction soft max — never 100% */
      tjMax: 0.92,
    },
  };
  var ROLE_KEY = 'sn:device-role-v1';

  var mine = {
    on: false,
    terms: false,
    rate: 0,
    session: 0,
    donate: false,
    spare: 0,
    fps: 0,
    rates: { cpu: 0, ram: 0, storage: 0, bandwidth: 0 },
    worker: null,
    workerOps: 0,
    meshPeers: 1,
    deviceRole: 'main',
  };

  function loadDeviceRole() {
    try {
      var r = localStorage.getItem(ROLE_KEY) || 'main';
      if (!DEVICE_ROLES[r]) r = 'main';
      mine.deviceRole = r;
    } catch (e) {
      mine.deviceRole = 'main';
    }
    return mine.deviceRole;
  }

  function roleProfile() {
    return DEVICE_ROLES[mine.deviceRole] || DEVICE_ROLES.main;
  }

  function setDeviceRole(role) {
    var id = String(role || 'main').toLowerCase();
    if (id === 'hotswap' || id === 'hot-swap' || id === 'spare') id = 'secondary';
    if (id === 'array' || id === 'miner') id = 'raid';
    if (!DEVICE_ROLES[id]) id = 'main';
    mine.deviceRole = id;
    try {
      localStorage.setItem(ROLE_KEY, id);
    } catch (e) {}
    // Roles imply mesh donation posture
    if (id === 'raid' || id === 'main') {
      mine.donate = true;
      try {
        localStorage.setItem('astranov_donate_compute', '1');
      } catch (e2) {}
    }
    if (id === 'secondary') {
      // Low harvest · still can donate lightly for monitoring mesh
      mine.donate = true;
      try {
        localStorage.setItem('astranov_donate_compute', '1');
      } catch (e3) {}
    }
    if (mine.on && mine.terms && mine.donate) ensureMineWorker();
    paint();
    try {
      if (g.SNUsage && SNUsage.track) SNUsage.track('device_role', { role: id });
    } catch (e4) {}
    return DEVICE_ROLES[id];
  }
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
  /** Leaflet polylines on city map — independent of camera hold */
  var mapRouteLayers = [];
  /**
   * SPECS CLI top ribbon — ALWAYS visible permanent basics:
   * 🎯 Locate · 👤 User · ➕ Add · 🗺 Layers · 🎧 AI · ➤ Send
   */
  var RIBBON_CORE = [
    {
      act: 'locate',
      emoji: '🎯',
      text: 'Locate',
      title: 'Locate me · GPS recenter',
      id: 'sn-rib-locate',
    },
    {
      act: 'user',
      emoji: '👤',
      text: 'User',
      title: 'Sign in · or your profile when logged in',
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
      title: 'AI · ASTRANOV LISTENING · pizza · next · show all',
      id: 'sn-rib-hf',
    },
    { act: 'send', emoji: '➤', text: 'Send', title: 'Send to Astranov', id: 'sn-rib-send' },
  ];
  /**
   * Context task buttons REMOVED from CLI ribbon.
   * Menu / cart / order / claim live inside expanded CLI tiles only.
   * Ribbon stays permanent 6: Locate · User · Add · Layers · AI · Send.
   */
  var TASKS = {
    idle: [],
    map: [],
    shops: [],
    mine: [],
    money: [],
    space: [],
    delivery: [],
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
    // Locate = single action (GPS recenter) — no submenu
    if (act === 'locate') {
      try {
        if (g.SNCli && SNCli.run) void SNCli.run('locate');
      } catch (e) {}
      return;
    }
    // User = straight login when out · profile tile when in (no submenu)
    if (act === 'user') {
      var signed = !!(g.SNAuth && SNAuth.user);
      try {
        if (!signed) {
          if (g.SNCli && SNCli.run) void SNCli.run('login');
          else if (g.SNAuth && SNAuth.toggle) void SNAuth.toggle();
        } else {
          if (g.SNTile && SNTile.openMe) SNTile.openMe();
          else if (g.SNCli && SNCli.run) void SNCli.run('me');
        }
      } catch (eUser) {
        console.error('[SNField] user', eUser);
      }
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

  /**
   * Permanent CLI top shortcut ribbon:
   * 🎯 Locate · 👤 User · ➕ Add · 🗺 Layers · 🎧 AI · ➤ Send
   * ONLY ➕ and Layers expand menus. All other keys = one action.
   */
  function paintRibbon() {
    var bar = $('sn-task-ribbon');
    if (!bar) return;
    bar.hidden = false;
    bar.removeAttribute('hidden');
    bar.setAttribute('aria-hidden', 'false');
    bar.setAttribute('aria-label', 'CLI shortcuts: locate user add layers AI send');
    var h = '';
    var i;
    var signedIn = !!(g.SNAuth && SNAuth.user);
    for (i = 0; i < RIBBON_CORE.length; i++) {
      var b = RIBBON_CORE[i];
      var onCls = b.act === 'add' && g.SNTopo && SNTopo.active ? ' on' : '';
      var label = b.text || b.act;
      var title = b.title || b.text;
      if (b.act === 'user') {
        label = signedIn ? 'You' : 'Login';
        title = signedIn
          ? 'Your profile tile'
          : 'Sign in · astranov.eu';
        if (signedIn) onCls += ' on';
      }
      h +=
        '<button type="button" class="sn-rib-btn sn-rib-core' +
        onCls +
        '" data-act="' +
        b.act +
        '"' +
        (b.id ? ' id="' + b.id + '"' : '') +
        ' title="' +
        title +
        '">' +
        '<span class="sn-rib-emoji" aria-hidden="true">' +
        (b.emoji || '') +
        '</span>' +
        '<span class="sn-rib-txt">' +
        label +
        '</span>' +
        '</button>';
    }
    if (notice) {
      try {
        if (g.SNCli && SNCli.preview) SNCli.preview(notice);
      } catch (e) {}
    }
    bar.innerHTML = h;
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
  }

  function paint() {
    var C = g.SNCurrency;
    var bal = C ? C.balance() : 0;
    var fees = C && C.platformFees ? C.platformFees() : C && C.snapshot ? (C.snapshot().platformFees || 0) : 0;
    var s = $('fbh-s');
    if (s) s.textContent = C ? C.format(bal) : bal.toFixed(2) + ' S';
    // Architect 3% vault — only grows (SPECS platform fee)
    var fe = $('fbh-fees');
    if (fe) {
      fe.textContent = '3% vault ' + (C && C.format ? C.format(fees) : Number(fees).toFixed(2) + ' S');
      fe.hidden = false;
    }
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

  /**
   * SETI-style mesh donation: idle Web Worker burns spare CPU when donate is on.
   * Rewards S from spare capacity so global users fund the net without servers only.
   */
  function ensureMineWorker() {
    if (mine.worker || typeof Worker === 'undefined') return;
    try {
      var src =
        'var n=0;onmessage=function(e){var ops=e.data&&e.data.ops||40000;var h=0|0;for(var i=0;i<ops;i++){h=((h<<5)-h+i)|0;n++;}postMessage({ops:ops,h:h,n:n});};';
      var blob = new Blob([src], { type: 'application/javascript' });
      var url = URL.createObjectURL(blob);
      mine.worker = new Worker(url);
      mine.worker.onmessage = function (ev) {
        if (ev && ev.data && ev.data.ops) mine.workerOps += Number(ev.data.ops) || 0;
      };
      mine.worker.onerror = function () {
        try {
          mine.worker.terminate();
        } catch (e) {}
        mine.worker = null;
      };
    } catch (e) {
      mine.worker = null;
    }
  }

  function stopMineWorker() {
    if (!mine.worker) return;
    try {
      mine.worker.terminate();
    } catch (e) {}
    mine.worker = null;
  }

  function tickMine(dt) {
    if (!mine.on || !mine.terms) {
      mine.rate = 0;
      stopMineWorker();
      return;
    }
    var prof = roleProfile();
    var load = document.hidden ? 0.12 : mine.fps >= 40 ? 0.28 : mine.fps >= 25 ? 0.45 : 0.65;
    if (mine.donate) {
      ensureMineWorker();
      load = document.hidden ? 0.06 : Math.min(load, 0.42);
    }
    // Secondary: battery first — throttle hard when tab foreground
    if (prof.preferHidden && !document.hidden) load = Math.max(load, 0.55);
    // Stop if approaching role load cap (protect battery / TJ)
    if (load > (prof.loadCap != null ? prof.loadCap : 0.85)) {
      mine.rate = 0;
      mine.rates.cpu = 0;
      return;
    }
    var budget = Math.max(0.02, 1 - load) * (prof.harvest || 0.3);
    var tj = prof.tjMax != null ? prof.tjMax : 1;
    var maxB = Math.min(prof.maxBudget != null ? prof.maxBudget : 1, tj);
    if (budget > maxB) budget = maxB;
    var cores = navigator.hardwareConcurrency || 4;
    var ops = Math.floor(1600 * budget * (cores / 8) * Math.min(dt / 500, 1));
    var h = 0;
    var i;
    for (i = 0; i < ops; i++) h = ((h << 5) - h + i) | 0;
    if (mine.donate && mine.worker) {
      try {
        var wops = Math.floor(
          18000 * budget * (prof.workerScale || 1) * (document.hidden ? 2.0 : 0.9)
        );
        // RAID stays below TJ max worker thrash
        if (prof.tjMax != null) wops = Math.floor(wops * prof.tjMax);
        mine.worker.postMessage({ ops: Math.max(500, wops) });
      } catch (eW) {}
    }
    mine.rates.cpu = Math.min(
      Math.round(100 * maxB),
      Math.round(budget * cores * (mine.donate ? 10 : 6) * (prof.workerScale || 1))
    );
    mine.rates.ram = Math.round((navigator.deviceMemory || 4) * 48 * budget);
    mine.rates.storage = Math.round(28 * budget);
    mine.rates.bandwidth = Math.round(160 * budget);
    mine.rate =
      0.012 * budget * (document.hidden ? 1.6 : prof.preferHidden ? 0.55 : 1);
    if (mine.donate) {
      mine.rate *= (document.hidden ? 2.8 : 1.6) * (prof.donateBoost || 1);
      mine.meshPeers = Math.max(1, Math.min(99, Math.round(1 + budget * cores)));
    } else {
      mine.meshPeers = 1;
    }
    try {
      var me = g.SNProfiles && SNProfiles.me && SNProfiles.me();
      if (me && me.roles && me.roles.ambassador && me.ambassadorOnline !== false) {
        mine.rate += 0.005 * budget;
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

      // Vendor pickup (green) · client drop (red)
      var a0 = canvasPts[0];
      var a1 = canvasPts[canvasPts.length - 1];
      ctx.fillStyle = 'rgba(68,255,136,0.95)';
      ctx.beginPath();
      ctx.arc(a0.x, a0.y, radarBig ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,100,120,0.95)';
      ctx.beginPath();
      ctx.arc(a1.x, a1.y, radarBig ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();

      // Moving delivery driver along polygon
      var prog = route.progress != null ? route.progress : 0;
      if (prog > 0 || route.kind === 'delivery') {
        var drv = pointAlong(route.points, prog > 0 ? prog : 0.02);
        if (drv) {
          var L = toLocalM(drv.lat, drv.lng, focus);
          var dx = cx + L.x * scale;
          var dy = cy - L.y * scale;
          ctx.fillStyle = 'rgba(255,220,80,0.98)';
          ctx.beginPath();
          ctx.arc(dx, dy, radarBig ? 5.5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.lineWidth = 1;
          ctx.stroke();
          if (radarBig) {
            ctx.fillStyle = 'rgba(255,240,180,0.95)';
            ctx.font = '9px system-ui';
            var tag =
              '🛵 ' +
              (route.eta || '') +
              ' ' +
              Math.round(route.speedKmh || 0) +
              'km/h';
            ctx.fillText(tag.slice(0, 22), dx + 7, dy - 4);
          }
        }
      }

      if (radarBig && route.label) {
        ctx.fillStyle = 'rgba(200,230,255,0.9)';
        ctx.font = '10px system-ui';
        ctx.fillText(String(route.label).slice(0, 28), a1.x + 6, a1.y - 4);
      }
    }
  }

  function setRoutes(list) {
    routes = Array.isArray(list) ? list.slice(0, 8) : [];
  }

  function clearRoutes() {
    routes = [];
    clearMapRouteLayers();
  }

  function clearMapRouteLayers() {
    mapRouteLayers.forEach(function (Lyr) {
      try {
        if (Lyr && Lyr.remove) Lyr.remove();
      } catch (e) {}
    });
    mapRouteLayers = [];
  }

  /** Offset lat/lng meters for corridor polygon */
  function offsetLatLng(lat, lng, eastM, northM) {
    var dLat = northM / 111320;
    var dLng = eastM / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
    return [lat + dLat, lng + dLng];
  }

  function corridorPolygon(points, halfWidthM) {
    halfWidthM = halfWidthM || 45;
    if (!points || points.length < 2) return [];
    var left = [];
    var right = [];
    var i;
    for (i = 0; i < points.length; i++) {
      var prev = points[Math.max(0, i - 1)];
      var next = points[Math.min(points.length - 1, i + 1)];
      var dLat = (next.lat - prev.lat) * 111320;
      var dLng = (next.lng - prev.lng) * 111320 * Math.cos((points[i].lat * Math.PI) / 180);
      var len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
      var nx = (-dLng / len) * halfWidthM;
      var ny = (dLat / len) * halfWidthM;
      left.push(offsetLatLng(points[i].lat, points[i].lng, nx, ny));
      right.push(offsetLatLng(points[i].lat, points[i].lng, -nx, -ny));
    }
    return left.concat(right.reverse());
  }

  function labelIcon(html, className) {
    return L.divIcon({
      className: className || 'sn-route-label',
      html:
        '<div style="white-space:nowrap;padding:3px 8px;border-radius:8px;font:700 11px/1.2 system-ui,sans-serif;' +
        'background:rgba(0,10,24,.92);border:1px solid rgba(61,158,255,.65);color:#e8f4ff;' +
        'box-shadow:0 0 12px rgba(26,111,212,.45)">' +
        html +
        '</div>',
      iconSize: [120, 24],
      iconAnchor: [60, 28],
    });
  }

  /**
   * Draw ROUTE POLYGON + vendor / driver / you + live progress on city map.
   */
  function paintRouteOnCityMap(row) {
    if (!row || !row.points || row.points.length < 2) return;
    if (!g.SNMap || typeof L === 'undefined') return;
    if (!SNMap.active || !SNMap.map) {
      try {
        var mid = row.points[Math.floor(row.points.length / 2)] || row.points[0];
        if (SNMap.open && mid) {
          void SNMap.open(mid.lat, mid.lng).then(function () {
            try {
              if (SNMap.ensure) return SNMap.ensure();
            } catch (_) {}
          }).then(function () {
            try {
              paintRouteOnCityMap(row);
            } catch (_) {}
          });
        }
      } catch (_) {}
      return;
    }
    try {
      var map = SNMap.map;
      var latlngs = row.points.map(function (p) {
        return [p.lat, p.lng];
      });
      // Clear prior layers for this route id
      mapRouteLayers = mapRouteLayers.filter(function (ly) {
        if (ly && ly._snRouteId === row.id) {
          try {
            ly.remove();
          } catch (e0) {}
          return false;
        }
        return true;
      });
      row._mapDriver = null;
      row._mapProg = null;
      row._mapStatus = null;

      // Corridor polygon (delivery zone)
      var ring = corridorPolygon(row.points, 55);
      if (ring.length >= 4) {
        var corridor = L.polygon(ring, {
          color: '#00d4ff',
          weight: 2,
          opacity: 0.85,
          fillColor: '#00d4ff',
          fillOpacity: 0.14,
        }).addTo(map);
        corridor._snRouteId = row.id;
        mapRouteLayers.push(corridor);
      }

      // Full route centerline
      var poly = L.polyline(latlngs, {
        color: '#00d4ff',
        weight: 6,
        opacity: 0.95,
        lineJoin: 'round',
      }).addTo(map);
      poly._snRouteId = row.id;
      poly.bindPopup(
        (row.label || 'Delivery route') +
          (row.phase ? '<br/>' + row.phase : '') +
          (row.eta ? '<br/>ETA ' + row.eta : '') +
          (row.speedKmh != null ? '<br/>' + Math.round(row.speedKmh) + ' km/h' : '')
      );
      mapRouteLayers.push(poly);

      // Progress line (done segment) — yellow
      var prog = Math.max(0, Math.min(1, row.progress || 0));
      if (prog > 0.02) {
        var donePts = [];
        var target = Math.max(2, Math.floor((row.points.length - 1) * prog) + 1);
        var di;
        for (di = 0; di <= target && di < row.points.length; di++) {
          donePts.push([row.points[di].lat, row.points[di].lng]);
        }
        var along = pointAlong(row.points, prog);
        if (along) donePts.push([along.lat, along.lng]);
        if (donePts.length >= 2) {
          row._mapProg = L.polyline(donePts, {
            color: '#ffcc33',
            weight: 7,
            opacity: 1,
            lineJoin: 'round',
          }).addTo(map);
          row._mapProg._snRouteId = row.id;
          mapRouteLayers.push(row._mapProg);
        }
      }

      var a0 = row.points[0];
      var a1 = row.points[row.points.length - 1];
      // VENDOR (green)
      var m0 = L.circleMarker([a0.lat, a0.lng], {
        radius: 11,
        color: '#22ff88',
        fillColor: '#00cc66',
        fillOpacity: 1,
        weight: 3,
      })
        .addTo(map)
        .bindPopup('<b>VENDOR</b><br/>Pickup · kitchen');
      m0._snRouteId = row.id;
      mapRouteLayers.push(m0);
      var labV = L.marker([a0.lat, a0.lng], {
        icon: labelIcon('VENDOR · PREP', 'sn-lab-v'),
        interactive: false,
      }).addTo(map);
      labV._snRouteId = row.id;
      mapRouteLayers.push(labV);
      row._mapVendorLab = labV;

      // YOU (red)
      var m1 = L.circleMarker([a1.lat, a1.lng], {
        radius: 11,
        color: '#ff4466',
        fillColor: '#ff2244',
        fillOpacity: 1,
        weight: 3,
      })
        .addTo(map)
        .bindPopup('<b>YOU</b><br/>Delivery stop');
      m1._snRouteId = row.id;
      mapRouteLayers.push(m1);
      var labY = L.marker([a1.lat, a1.lng], {
        icon: labelIcon('YOU · DROP', 'sn-lab-y'),
        interactive: false,
      }).addTo(map);
      labY._snRouteId = row.id;
      mapRouteLayers.push(labY);

      // DRIVER (yellow) — moves with progress
      var dpt = pointAlong(row.points, prog) || a0;
      row._mapDriver = L.circleMarker([dpt.lat, dpt.lng], {
        radius: 12,
        color: '#ffcc33',
        fillColor: '#ffdd55',
        fillOpacity: 1,
        weight: 3,
      })
        .addTo(map)
        .bindPopup('<b>DRIVER</b><br/>' + (row.phase || 'En route'));
      row._mapDriver._snRouteId = row.id;
      mapRouteLayers.push(row._mapDriver);

      row._mapStatus = L.marker([dpt.lat, dpt.lng], {
        icon: labelIcon(row.phase || 'DRIVER · 0%', 'sn-lab-d'),
        interactive: false,
      }).addTo(map);
      row._mapStatus._snRouteId = row.id;
      mapRouteLayers.push(row._mapStatus);

      while (mapRouteLayers.length > 48) {
        try {
          mapRouteLayers.shift().remove();
        } catch (e2) {}
      }
    } catch (e) {
      try {
        if (g.SNCli && SNCli.log) SNCli.log('Map route · ' + (e.message || e), 'err');
      } catch (e3) {}
    }
  }

  /** Update driver + progress line without full repaint */
  function updateRouteProgressOnMap(row) {
    if (!row || !row.points) return;
    var prog = Math.max(0, Math.min(1, row.progress || 0));
    var pt = pointAlong(row.points, prog);
    if (!pt) return;
    try {
      if (row._mapDriver && row._mapDriver.setLatLng) {
        row._mapDriver.setLatLng([pt.lat, pt.lng]);
        if (row._mapDriver.setPopupContent) {
          row._mapDriver.setPopupContent(
            '<b>DRIVER</b><br/>' +
              (row.phase || '') +
              '<br/>' +
              Math.round(prog * 100) +
              '% · ETA ' +
              (row.eta || '?')
          );
        }
      }
      if (row._mapStatus && row._mapStatus.setLatLng) {
        row._mapStatus.setLatLng([pt.lat, pt.lng]);
        if (row._mapStatus.setIcon) {
          row._mapStatus.setIcon(
            labelIcon(
              (row.phase || 'DRIVER') + ' · ' + Math.round(prog * 100) + '%',
              'sn-lab-d'
            )
          );
        }
      }
      if (row._mapVendorLab && row._mapVendorLab.setIcon && prog > 0.2) {
        row._mapVendorLab.setIcon(labelIcon('VENDOR · OUT', 'sn-lab-v'));
      }
      // Refresh progress polyline
      if (g.SNMap && SNMap.map && typeof L !== 'undefined' && prog > 0.02) {
        if (row._mapProg) {
          try {
            row._mapProg.remove();
          } catch (_) {}
          row._mapProg = null;
        }
        var donePts = [];
        var target = Math.max(2, Math.floor((row.points.length - 1) * prog) + 1);
        var di;
        for (di = 0; di <= target && di < row.points.length; di++) {
          donePts.push([row.points[di].lat, row.points[di].lng]);
        }
        donePts.push([pt.lat, pt.lng]);
        row._mapProg = L.polyline(donePts, {
          color: '#ffcc33',
          weight: 7,
          opacity: 1,
        }).addTo(SNMap.map);
        row._mapProg._snRouteId = row.id;
        mapRouteLayers.push(row._mapProg);
      }
    } catch (_) {}
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

  function haversineKm(aLat, aLng, bLat, bLng) {
    var R = 6371;
    var dLat = ((bLat - aLat) * Math.PI) / 180;
    var dLng = ((bLng - aLng) * Math.PI) / 180;
    var x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((aLat * Math.PI) / 180) *
        Math.cos((bLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }

  function pathLengthKm(pts) {
    if (!pts || pts.length < 2) return 0;
    var sum = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      sum += haversineKm(pts[i].lat, pts[i].lng, pts[i + 1].lat, pts[i + 1].lng);
    }
    return sum;
  }

  function fmtEta(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    if (sec < 60) return sec + 's';
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (m < 60) return m + 'm' + (s ? s + 's' : '');
    var h = Math.floor(m / 60);
    m = m % 60;
    return h + 'h' + m + 'm';
  }

  /**
   * OSRM driving geometry + distance/duration when available.
   * Returns { points, km, durationS, speedKmh } or throws.
   */
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
      var rt = j && j.routes && j.routes[0];
      var coords = rt && rt.geometry && rt.geometry.coordinates;
      if (!coords || !coords.length) throw new Error('no geom');
      var points = coords.map(function (c) {
        return { lat: c[1], lng: c[0] };
      });
      var km = rt.distance != null ? Number(rt.distance) / 1000 : pathLengthKm(points);
      var durationS = rt.duration != null ? Number(rt.duration) : (km / 28) * 3600;
      var speedKmh = durationS > 0 ? (km / durationS) * 3600 : 28;
      return { points: points, km: km, durationS: durationS, speedKmh: speedKmh };
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
        var meta = null;
        var pts = null;
        try {
          meta = await fetchOsrmRoute(t.lat, t.lng, dropLat, dropLng);
          pts = meta.points;
        } catch (_) {
          pts = straightRoute(t.lat, t.lng, dropLat, dropLng, 16);
          var km0 = pathLengthKm(pts);
          meta = {
            points: pts,
            km: km0,
            durationS: (km0 / 28) * 3600,
            speedKmh: 28,
          };
        }
        if (pts && pts.length >= 2) {
          var eta0 = fmtEta(meta.durationS);
          var sp0 = Math.round(meta.speedKmh || 28);
          next.push({
            id: 'task:' + t.id,
            points: pts,
            color: ROUTE_COLORS[i % ROUTE_COLORS.length],
            label:
              (t.title || 'Delivery').replace(/^📦\s*/, '').slice(0, 14) +
              ' · ' +
              eta0 +
              ' · ' +
              sp0 +
              'km/h',
            kind: 'delivery',
            km: meta.km,
            durationS: meta.durationS,
            speedKmh: meta.speedKmh,
            eta: eta0,
            progress: t.status === 'in_progress' ? t._driveProgress || 0.15 : 0,
            vendorLat: t.lat,
            vendorLng: t.lng,
            dropLat: dropLat,
            dropLng: dropLng,
          });
        }
      }
      // Keep animated live deliveries (live:*) from startDeliveryRoute
      var live = routes.filter(function (r) {
        return r && r.id && String(r.id).indexOf('live:') === 0;
      });
      routes = live.concat(manual.filter(function (r) {
        return String(r.id || '').indexOf('live:') !== 0;
      })).concat(next).slice(0, 10);
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
    var km = 0;
    var durationS = 0;
    var speedKmh = opts.speedKmh || 28;
    if (Array.isArray(waypoints) && waypoints.length >= 2) {
      if (waypoints[0].lat != null && waypoints.length > 2 && !opts.osrm) {
        pts = waypoints.map(function (w) {
          return { lat: Number(w.lat), lng: Number(w.lng) };
        });
        km = pathLengthKm(pts);
        durationS = opts.durationS != null ? opts.durationS : (km / speedKmh) * 3600;
      } else {
        var a = waypoints[0];
        var b = waypoints[waypoints.length - 1];
        try {
          var meta = await fetchOsrmRoute(a.lat, a.lng, b.lat, b.lng);
          pts = meta.points;
          km = meta.km;
          durationS = meta.durationS;
          speedKmh = meta.speedKmh;
        } catch (_) {
          pts = straightRoute(a.lat, a.lng, b.lat, b.lng, 16);
          km = pathLengthKm(pts);
          durationS = (km / speedKmh) * 3600;
        }
      }
    }
    if (pts.length < 2) return null;
    var eta = fmtEta(durationS);
    var baseLabel = opts.label || 'Route';
    var row = {
      id: opts.id || 'route_' + Date.now().toString(36),
      points: pts,
      color: opts.color || ROUTE_COLORS[0],
      label: baseLabel + ' · ' + eta + ' · ' + Math.round(speedKmh) + 'km/h',
      kind: opts.kind || 'custom',
      km: km,
      durationS: durationS,
      speedKmh: speedKmh,
      eta: eta,
      progress: opts.progress != null ? opts.progress : 0,
      driver: opts.driver || null,
      vendorLat: opts.vendorLat,
      vendorLng: opts.vendorLng,
      dropLat: opts.dropLat,
      dropLng: opts.dropLng,
    };
    routes = routes.filter(function (r) {
      return r.id !== row.id;
    });
    routes.unshift(row);
    routes = routes.slice(0, 10);
    return row;
  }

  /**
   * Delivery: vendor → client stop polygon + live driver progress.
   * Draws on radar (expand), logs ETA/speed on CLI. No extra panels.
   */
  async function startDeliveryRoute(opts) {
    opts = opts || {};
    var vLat = Number(opts.vendorLat != null ? opts.vendorLat : opts.from && opts.from.lat);
    var vLng = Number(opts.vendorLng != null ? opts.vendorLng : opts.from && opts.from.lng);
    var dLat = Number(opts.dropLat != null ? opts.dropLat : opts.to && opts.to.lat);
    var dLng = Number(opts.dropLng != null ? opts.dropLng : opts.to && opts.to.lng);
    if (!isFinite(vLat) || !isFinite(dLat)) return null;
    // Degenerate pickup==drop → nudge so polygon is visible
    if (Math.abs(vLat - dLat) < 1e-5 && Math.abs(vLng - dLng) < 1e-5) {
      vLat = dLat + 0.004;
      vLng = dLng + 0.0035;
    }
    try {
      if (radarBig) setRadarExpanded(false);
    } catch (eR) {}
    // Always open city map for order polygon (first task must SHOW vendor → you)
    try {
      if (g.SNMap && SNMap.open) {
        await SNMap.open(dLat, dLng);
        if (SNMap.ensure) await SNMap.ensure();
      }
    } catch (eOpen) {}
    try {
      g._snLastPos = { lat: dLat, lng: dLng };
      if (g.SNTasks && SNTasks.setPos) SNTasks.setPos(dLat, dLng);
    } catch (e) {}
    var id = opts.id || 'live:' + Date.now().toString(36);
    var row = await showRoute(
      [
        { lat: vLat, lng: vLng },
        { lat: dLat, lng: dLng },
      ],
      {
        id: id,
        label: opts.label || '🛵 Route',
        kind: 'delivery',
        osrm: true,
        color: opts.color || 'rgba(0,220,255,0.95)',
        progress: 0,
        driver: opts.driver || 'Driver',
        vendorLat: vLat,
        vendorLng: vLng,
        dropLat: dLat,
        dropLng: dLng,
        speedKmh: opts.speedKmh,
      }
    );
    if (!row) return null;
    row.phase = 'VENDOR PREP';
    row.progress = 0;
    // Paint corridor polygon + vendor / driver / you
    paintRouteOnCityMap(row);
    try {
      if (g.SNMap && SNMap.fitLatLngs) {
        g.SNMap.fitLatLngs(
          [
            { lat: vLat, lng: vLng },
            { lat: dLat, lng: dLng },
          ].concat(row.points || []),
          { padding: 56, maxZoom: 15, force: true }
        );
      } else if (g.SNMap && SNMap.map && typeof L !== 'undefined') {
        var b = L.latLngBounds([
          [vLat, vLng],
          [dLat, dLng],
        ]);
        g.SNMap.map.fitBounds(b, { padding: [56, 56], maxZoom: 15 });
      }
    } catch (eFit) {}
    try {
      if (g.SNMap && SNMap.markYou) g.SNMap.markYou(dLat, dLng, 'YOU · drop');
      if (g.SNMap && SNMap.showProfiles) SNMap.showProfiles();
      if (g.SNMap && SNMap.showTasks) SNMap.showTasks();
      // Re-paint route on top of tasks/profiles
      paintRouteOnCityMap(row);
    } catch (eT) {}
    try {
      if (g.SNCli && SNCli.log) {
        SNCli.log(
          'MAP ROUTE · polygon ON · green=VENDOR · yellow=DRIVER · red=YOU · ' +
            (row.km != null ? row.km.toFixed(2) + ' km' : '') +
            ' · ETA ' +
            (row.eta || '?'),
          'ok'
        );
      }
      if (g.SNCli && SNCli.preview)
        SNCli.preview('VENDOR PREP · then driver moves on polygon');
      if (g.SNCli && SNCli.setActivity) g.SNCli.setActivity('prep');
    } catch (e2) {}

    // Phase 1: kitchen prep (driver waits at vendor) · Phase 2: drive along polygon
    var prepMs = 4500;
    var driveMs = Math.max(10000, Math.min(75000, (row.durationS || 600) * 1000 * 0.4));
    var t0 = Date.now();
    var animId = id;
    var lastLogPct = -1;
    function step() {
      var r = null;
      var i;
      for (i = 0; i < routes.length; i++) {
        if (routes[i].id === animId) {
          r = routes[i];
          break;
        }
      }
      if (!r) return;
      var elapsed = Date.now() - t0;
      var u;
      if (elapsed < prepMs) {
        u = 0;
        r.phase = 'VENDOR PREP · kitchen';
        r.progress = 0;
      } else {
        var du = Math.min(1, (elapsed - prepMs) / driveMs);
        u = du;
        r.progress = du;
        if (du < 0.85) r.phase = 'DRIVER EN ROUTE';
        else if (du < 1) r.phase = 'ARRIVING';
        else r.phase = 'DELIVERED';
      }
      var remainS =
        r.phase === 'VENDOR PREP · kitchen'
          ? (r.durationS || 600) + (prepMs - elapsed) / 1000
          : (r.durationS || 0) * (1 - u);
      r.eta = fmtEta(Math.max(0, remainS));
      r.label =
        (opts.label || '🛵 Route') +
        ' · ' +
        r.phase +
        ' · ' +
        Math.round(u * 100) +
        '% · ETA ' +
        r.eta;
      updateRouteProgressOnMap(r);
      // CLI progress every ~15%
      var pct = Math.floor(u * 100);
      if (pct >= lastLogPct + 15 || (u >= 1 && lastLogPct < 100)) {
        lastLogPct = pct;
        try {
          if (g.SNCli && SNCli.log) {
            SNCli.log(
              r.phase +
                ' · ' +
                pct +
                '% · ETA ' +
                r.eta +
                ' · ' +
                Math.round(r.speedKmh || 28) +
                ' km/h',
              'ok'
            );
          }
          if (g.SNCli && SNCli.preview) SNCli.preview(r.phase + ' · ' + pct + '%');
          if (g.SNCli && SNCli.setActivity)
            g.SNCli.setActivity(r.phase === 'VENDOR PREP · kitchen' ? 'prep' : 'drive');
        } catch (eL) {}
      }
      if (u >= 1 && elapsed >= prepMs + driveMs) {
        r.progress = 1;
        r.phase = 'DELIVERED';
        updateRouteProgressOnMap(r);
        try {
          if (g.SNCli && SNCli.log) SNCli.log('DELIVERED · driver at YOU · order complete', 'ok');
          if (g.SNCli && SNCli.preview) SNCli.preview('DELIVERED');
          if (g.SNCli && SNCli.setActivity) g.SNCli.setActivity('done');
        } catch (e3) {}
        if (opts.onArrive) {
          try {
            opts.onArrive(r);
          } catch (e4) {}
        }
        return;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return row;
  }

  function pointAlong(points, progress) {
    if (!points || points.length < 2) return null;
    var u = Math.max(0, Math.min(1, progress || 0));
    if (u <= 0) return points[0];
    if (u >= 1) return points[points.length - 1];
    var total = 0;
    var segs = [];
    var i;
    for (i = 0; i < points.length - 1; i++) {
      var d = haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
      segs.push(d);
      total += d;
    }
    if (total <= 0) return points[0];
    var target = total * u;
    var acc = 0;
    for (i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target) {
        var f = segs[i] > 0 ? (target - acc) / segs[i] : 0;
        return {
          lat: points[i].lat + (points[i + 1].lat - points[i].lat) * f,
          lng: points[i].lng + (points[i + 1].lng - points[i].lng) * f,
        };
      }
      acc += segs[i];
    }
    return points[points.length - 1];
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
    // Keep state for paint()/radar only — never inject CLI ribbon buttons
    task = TASKS[name] != null ? name : 'idle';
    paintRibbon();
  }

  function infer(line) {
    var l = String(line || '').toLowerCase();
    // Shops/menu/order → open vendor tile strip (not ribbon buttons)
    if (/^shops|^menu|^order|^cart|^market/.test(l)) {
      setTask('shops');
      try {
        if (g.SNTile && SNTile.seedMe) SNTile.seedMe();
      } catch (e) {}
    } else if (/^city|^map/.test(l)) setTask('map');
    else if (/^mine|^resources|^donate|^boost/.test(l)) setTask('mine');
    // Money/finance: never inject rate/finance ribbon buttons
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
        '<p class="sfp-line dim">SETI-style mesh: spare CPU (worker) · RAM · storage · bandwidth when idle. Rewards in S. Global users power the net.</p>' +
        '<div class="sfp-actions"><button type="button" data-cmd="mine on">Mine on</button>' +
        '<button type="button" data-cmd="mine off">Mine off</button>' +
        '<button type="button" data-cmd="donate on">Donate mesh ON</button>' +
        '<button type="button" data-cmd="donate off">Donate off</button></div>';
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
    // Never setTask('money') — finance is top-right S HUD only, not CLI ribbon
  }

  function report() {
    var prof = roleProfile();
    return {
      fps: mine.fps,
      spareScore: mine.spare,
      donating: mine.donate,
      mining: mine.on && mine.terms,
      rateSPerH: mine.rate,
      sessionMined: mine.session,
      rates: mine.rates,
      deviceRole: mine.deviceRole,
      roleLabel: prof.label,
      harvest: prof.harvest,
      tjMax: prof.tjMax != null ? prof.tjMax : null,
      line:
        (prof.label || 'Device') +
        ' · FPS ~' +
        mine.fps +
        ' · spare ' +
        mine.spare +
        '%' +
        (mine.donate ? ' · mesh' : '') +
        (mine.on ? ' · ' + mine.rate.toFixed(3) + ' S/h' : ' · mine off'),
      workerOps: mine.workerOps,
      meshPeers: mine.meshPeers || 1,
    };
  }

  function init() {
    if (init.done) return;
    init.done = true;
    try {
      mine.terms = !!localStorage.getItem('astranov:spacenet-miner-v2');
      mine.on = mine.terms;
      mine.donate = localStorage.getItem('astranov_donate_compute') === '1';
      loadDeviceRole();
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
    // Burger removed (OV-15) — tools live under ASTRANOV home · ribbon is top CLI shortcuts
    try {
      var bBtn = $('sn-burger-btn');
      var bPanel = $('sn-burger-panel');
      if (bBtn) {
        bBtn.hidden = true;
        bBtn.style.display = 'none';
      }
      if (bPanel) {
        bPanel.hidden = true;
        bPanel.style.display = 'none';
      }
    } catch (eB) {}
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
    startDeliveryRoute: startDeliveryRoute,
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
      var prof = roleProfile();
      return [
        'Device · ' + (r.roleLabel || r.deviceRole),
        r.line,
        'Harvest profile · ' +
          Math.round((prof.harvest || 0) * 100) +
          '%' +
          (prof.tjMax != null ? ' · TJ max ' + Math.round(prof.tjMax * 100) + '%' : ' · conservative'),
        'Mesh · ' + (r.donating ? 'ON' : 'off') + ' · peers~' + (r.meshPeers || 1),
        'CPU ' +
          (r.rates.cpu || 0) +
          '% · spare ' +
          r.spareScore +
          '% · ops ' +
          (r.workerOps || 0),
        'Session mined ' +
          (g.SNCurrency ? SNCurrency.format(r.sessionMined) : r.sessionMined),
      ];
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
      if (!on) stopMineWorker();
      else if (mine.donate) ensureMineWorker();
      paint();
      return true;
    },
    setDonate: function (on) {
      mine.donate = !!on;
      try {
        if (on) localStorage.setItem('astranov_donate_compute', '1');
        else localStorage.removeItem('astranov_donate_compute');
      } catch (e) {}
      if (on) {
        if (!mine.terms) {
          showTerms();
        } else {
          mine.on = true;
          ensureMineWorker();
        }
      } else {
        stopMineWorker();
      }
      paint();
    },
    setDeviceRole: setDeviceRole,
    getDeviceRole: function () {
      return mine.deviceRole;
    },
    deviceRoles: DEVICE_ROLES,
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
