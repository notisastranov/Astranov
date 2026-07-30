/* SpaceNet unified multi-role tile — cover · avatar · roles · menu · dating · driver
 * One surface for social / dating / vendor order / driver profiles (map + CLI).
 */
(function (global) {
  'use strict';

  const T = {
    open: false,
    profileId: null,
    tab: 'about', // about | menu | dating | drive | social | cart | task
    /** Visual scale of card (pinch / wheel) — 0.55–1.35 */
    scale: 0.78,
    /** SNTaskBoard enrich payload when showing a delivery task multi-tile */
    taskBoard: null,
    /** Feed dock: tiles are posts in #cli-log (social stream), not a strip */
    dock: 'feed',
    /** id → meta for reopen from feed post */
    tiles: Object.create(null),
    lastCardTap: 0,
    activeRow: null,
  };
  const SIZE_KEY = 'sn:tile-scale-v1';
  const MAX_FEED_TILES = 40;

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadScale() {
    try {
      const n = parseFloat(localStorage.getItem(SIZE_KEY) || '');
      if (n >= 0.55 && n <= 1.35) T.scale = n;
    } catch (_) {}
  }

  function saveScale() {
    try {
      localStorage.setItem(SIZE_KEY, String(T.scale));
    } catch (_) {}
  }

  function applyScale() {
    const card = document.querySelector('#sn-tile .sn-tile-card');
    if (!card) return;
    const s = Math.max(0.55, Math.min(1.35, T.scale || 0.78));
    T.scale = s;
    card.style.setProperty('--sn-tile-scale', String(s));
    const docked = T.dock !== 'overlay';
    if (docked) {
      card.style.width = '100%';
      card.style.maxHeight = 'min(' + Math.round(38 * s) + 'vh, ' + Math.round(360 * s) + 'px)';
    } else {
      card.style.width = 'min(' + Math.round(320 * s) + 'px, calc(100vw - 24px))';
      card.style.maxHeight = 'min(' + Math.round(42 * s) + 'vh, ' + Math.round(420 * s) + 'px)';
    }
    card.style.transform = 'scale(1)'; // size via width/height, not transform (keeps pinch natural)
    // Dim +/− at min/max so users know the limits
    const minus = $('sn-tile-smaller');
    const plus = $('sn-tile-bigger');
    if (minus) {
      minus.disabled = s <= 0.55 + 0.001;
      minus.setAttribute('aria-disabled', minus.disabled ? 'true' : 'false');
    }
    if (plus) {
      plus.disabled = s >= 1.35 - 0.001;
      plus.setAttribute('aria-disabled', plus.disabled ? 'true' : 'false');
    }
  }

  /** Click + / − to resize (also pinch / wheel still work) */
  function stepScale(dir) {
    const step = 0.1;
    const next = (T.scale || 0.78) + (dir < 0 ? -step : step);
    T.scale = Math.max(0.55, Math.min(1.35, Math.round(next * 100) / 100));
    applyScale();
    saveScale();
  }

  function bindSizeButtons() {
    const minus = $('sn-tile-smaller');
    const plus = $('sn-tile-bigger');
    if (minus && !minus._snBound) {
      minus._snBound = true;
      minus.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        stepScale(-1);
      });
    }
    if (plus && !plus._snBound) {
      plus._snBound = true;
      plus.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        stepScale(1);
      });
    }
  }

  function gripHtml() {
    return (
      '<div class="sn-tile-grip" id="sn-tile-grip" title="Resize tile">' +
      '<button type="button" class="sn-tile-size-btn" id="sn-tile-smaller" aria-label="Make tile smaller">−</button>' +
      '<span class="sn-tile-grip-label">pinch to resize</span>' +
      '<button type="button" class="sn-tile-size-btn" id="sn-tile-bigger" aria-label="Make tile larger">+</button>' +
      '</div>'
    );
  }

  /** Upgrade old grip bar if tile already in DOM without +/− */
  function ensureGripControls() {
    const grip = $('sn-tile-grip');
    if (!grip) return;
    if ($('sn-tile-smaller') && $('sn-tile-bigger')) {
      bindSizeButtons();
      return;
    }
    grip.outerHTML = gripHtml();
    bindSizeButtons();
  }

  function ensureCss() {
    // Bump id when layout law changes so old huge-tile CSS is replaced
    ['sn-tile-css', 'sn-tile-css-v2', 'sn-tile-css-v3', 'sn-tile-css-v4'].forEach((id) => {
      const old = document.getElementById(id);
      if (old) old.remove();
    });
    if (document.getElementById('sn-tile-css-v5')) return;
    const st = document.createElement('style');
    st.id = 'sn-tile-css-v5';
    st.textContent = [
      /* Default: docked inside CLI expand host (saves map/space) */
      '#sn-tile{position:relative;inset:auto;z-index:auto;display:none;align-items:stretch;justify-content:stretch;',
      'padding:0;background:transparent;pointer-events:auto;width:100%;height:100%;max-height:inherit;',
      'touch-action:pan-y}',
      '#sn-tile.open{display:flex}',
      /* Rare full-screen fallback */
      '#sn-tile.overlay-mode{position:fixed;inset:0;z-index:40;align-items:flex-end;justify-content:center;',
      'padding:8px 10px calc(148px + env(safe-area-inset-bottom));background:rgba(0,0,0,.32);touch-action:none}',
      '#sn-tile .sn-tile-card{',
      'width:100%;max-height:min(40vh,360px);overflow:auto;border-radius:0;',
      'background:rgba(0,8,20,.97);border:0;border-top:1px solid rgba(61,158,255,.35);box-shadow:none;',
      'color:#c8e4ff;display:flex;flex-direction:column;pointer-events:auto;',
      'touch-action:pan-y;transform-origin:top center;transition:max-height .12s ease}',
      '#sn-tile.overlay-mode .sn-tile-card{width:min(280px,calc(100vw - 24px));border-radius:14px;',
      'border:1px solid rgba(61,158,255,.45);box-shadow:0 10px 32px rgba(0,0,0,.6);touch-action:none}',
      '#sn-tile .sn-tile-grip{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;',
      'gap:8px;padding:8px 10px 4px;font:10px system-ui;color:#5a8aaa;user-select:none}',
      '#sn-tile .sn-tile-grip-label{flex:1;text-align:center;letter-spacing:.04em;pointer-events:none}',
      '#sn-tile .sn-tile-size-btn{flex-shrink:0;width:36px;height:32px;border-radius:10px;',
      'border:1px solid rgba(61,158,255,.55);background:rgba(26,111,212,.28);color:#e8f4ff;',
      'font:800 20px/1 system-ui,sans-serif;cursor:pointer;padding:0;',
      'box-shadow:0 0 10px rgba(26,111,212,.25);touch-action:manipulation}',
      '#sn-tile .sn-tile-size-btn:hover{border-color:#3d9eff;background:rgba(26,111,212,.45);color:#fff}',
      '#sn-tile .sn-tile-size-btn:active{transform:scale(0.96)}',
      '#sn-tile .sn-tile-size-btn:disabled{opacity:.35;cursor:default;box-shadow:none}',
      '#sn-tile .sn-tile-cover{position:relative;height:72px;background:#061428 center/cover no-repeat;flex-shrink:0}',
      '#sn-tile .sn-tile-x,#sn-tile .sn-tile-edit-cover{position:absolute;top:6px;border:0;border-radius:10px;',
      'background:rgba(0,0,0,.55);color:#fff;width:32px;height:32px;cursor:pointer;font-size:15px}',
      '#sn-tile .sn-tile-x{right:6px}#sn-tile .sn-tile-edit-cover{right:44px}',
      '#sn-tile .sn-tile-head{display:flex;gap:10px;padding:0 12px 8px;margin-top:-22px;align-items:flex-end}',
      '#sn-tile .sn-tile-av-wrap{position:relative;flex-shrink:0}',
      '#sn-tile .sn-tile-av{width:48px;height:48px;border-radius:50%;border:2px solid #1a6fd4;object-fit:cover;background:#0a1a30}',
      '#sn-tile .sn-tile-edit-av{position:absolute;right:-4px;bottom:-4px;width:22px;height:22px;border-radius:50%;',
      'border:0;background:#1a6fd4;color:#fff;cursor:pointer;font-weight:700;font-size:12px}',
      '#sn-tile .sn-tile-name{font:700 14px system-ui;color:#e8f4ff}',
      '#sn-tile .sn-tile-handle{font:11px ui-monospace,monospace;color:#5a8aaa}',
      '#sn-tile .sn-tile-bio{font:11px system-ui;color:#8a9bb0;margin-top:2px;max-height:2.6em;overflow:hidden}',
      '#sn-tile .sn-tile-roles,#sn-tile .sn-tile-tabs{display:flex;flex-wrap:wrap;gap:5px;padding:6px 12px}',
      '#sn-tile .sn-role,#sn-tile .sn-tab{border:1px solid rgba(61,158,255,.35);background:rgba(0,12,28,.8);',
      'color:#b8c4d4;border-radius:999px;padding:5px 9px;font:600 10px system-ui;cursor:pointer}',
      '#sn-tile .sn-role.on,#sn-tile .sn-tab.on{border-color:#3d9eff;color:#3d9eff;background:rgba(26,111,212,.2)}',
      '#sn-tile .sn-tile-body{padding:6px 12px 10px;flex:1;overflow:auto;font:12px/1.4 system-ui;',
      'touch-action:pan-y}',
      '#sn-tile .sn-tile-foot{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 12px;border-top:1px solid rgba(26,111,212,.25)}',
      '#sn-tile .sn-btn{border:1px solid rgba(61,158,255,.4);background:rgba(26,111,212,.25);color:#e8f4ff;',
      'border-radius:10px;padding:7px 10px;font:600 11px system-ui;cursor:pointer}',
      '#sn-tile .sn-btn.primary{background:rgba(0,221,136,.2);border-color:rgba(0,221,136,.45);color:#6dffb0}',
      '#sn-tile .sn-empty{color:#5a6a7e;font-size:11px;padding:6px 0}',
      '#sn-tile .sn-menu-head{font-weight:700;color:#3d9eff;margin-bottom:6px;font-size:12px}',
      '#sn-tile .sn-menu-item{display:flex;align-items:center;gap:8px;padding:6px 0;',
      'border-bottom:1px solid rgba(26,111,212,.15)}',
      '#sn-tile .sn-menu-item img{width:40px;height:40px;border-radius:8px;object-fit:cover;background:#0a1a30;flex-shrink:0}',
      '#sn-tile .sn-menu-meta{flex:1;min-width:0}',
      '#sn-tile .sn-menu-meta b{display:block;color:#e8f4ff;font-size:12px}',
      '#sn-tile .sn-menu-meta span{display:block;font-size:10px;color:#6a8aaa}',
      '#sn-tile .sn-menu-meta em{display:block;color:#6dffb0;font-style:normal;font-weight:700;margin-top:2px;font-size:12px}',
      '#sn-tile .sn-add{width:32px;height:32px;border-radius:8px;border:1px solid rgba(0,221,136,.45);',
      'background:rgba(0,221,136,.15);color:#6dffb0;font-weight:800;cursor:pointer;flex-shrink:0}',
      '#sn-tile .sn-total{margin-top:8px;font-weight:700;color:#6dffb0;font-size:12px}',
      '#sn-tile .sn-fee{font-size:10px;color:#6a8aaa;margin-top:3px}',
      '#sn-tile .sn-post{padding:6px 0;border-bottom:1px solid rgba(26,111,212,.15);font-size:12px}',
      '#sn-tile .sn-compose{display:flex;gap:6px;margin-bottom:8px}',
      '#sn-tile .sn-compose input{flex:1;border-radius:8px;border:1px solid rgba(61,158,255,.35);',
      'background:rgba(0,12,28,.8);color:#e8f4ff;padding:6px 8px;font-size:12px}',
      '#sn-tile .sn-compose button{border:0;border-radius:8px;background:#1a6fd4;color:#fff;padding:6px 10px;cursor:pointer;font-size:12px}',
      '#sn-tile .sn-big{font-size:15px;font-weight:700;margin-bottom:4px}',
      '#sn-tile .sn-tags span{display:inline-block;margin:2px 4px 2px 0;padding:2px 7px;border-radius:999px;',
      'background:rgba(26,111,212,.2);font-size:10px}',
      '.sn-target,.sn-pin{background:transparent!important;border:0!important}',
      '.sn-target-inner,.sn-pin-inner{width:36px;height:36px;border-radius:50%;border:2px solid #3d9eff;background:#061428;',
      'overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer}',
      '.sn-target-inner img,.sn-pin-inner img{width:100%;height:100%;object-fit:cover}',
      '.leaflet-marker-icon.sn-target,.leaflet-marker-icon.sn-pin{margin-left:-18px!important;margin-top:-18px!important}',
    ].join('');
    document.head.appendChild(st);
  }

  function dist(a, b) {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Pinch (2-finger) + Ctrl/wheel resize on the tile card */
  function bindResize(root) {
    if (!root || root._snResizeBound) return;
    root._snResizeBound = true;
    let pinching = false;
    let startDist = 0;
    let startScale = 1;

    root.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 2) {
          pinching = true;
          startDist = dist(e.touches[0], e.touches[1]);
          startScale = T.scale || 0.78;
          e.preventDefault();
        }
      },
      { passive: false }
    );

    root.addEventListener(
      'touchmove',
      (e) => {
        if (!pinching || e.touches.length !== 2) return;
        e.preventDefault();
        const d = dist(e.touches[0], e.touches[1]);
        if (startDist < 8) return;
        const ratio = d / startDist;
        T.scale = Math.max(0.55, Math.min(1.35, startScale * ratio));
        applyScale();
      },
      { passive: false }
    );

    root.addEventListener(
      'touchend',
      (e) => {
        if (e.touches.length < 2) {
          if (pinching) {
            pinching = false;
            saveScale();
          }
        }
      },
      { passive: true }
    );

    // Desktop: Ctrl+wheel or trackpad pinch often fires wheel
    root.addEventListener(
      'wheel',
      (e) => {
        if (!T.open) return;
        // pinch-zoom on trackpads often sets ctrlKey
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.04 : 0.04;
        T.scale = Math.max(0.55, Math.min(1.35, (T.scale || 0.78) + delta));
        applyScale();
        saveScale();
      },
      { passive: false }
    );
  }

  function killStripDom() {
    try {
      const s = $('cli-tile-strip');
      if (s) s.remove();
      const e = $('cli-tile-expand');
      if (e) e.remove();
    } catch (_) {}
  }

  function tileEmoji(meta) {
    if (meta.emoji) return meta.emoji;
    if (meta.kind === 'task') return '📦';
    if (meta.kind === 'me') return '👤';
    if (meta.roles && meta.roles.vendor) return '🏪';
    if (meta.roles && meta.roles.driver) return '🛵';
    if (meta.roles && meta.roles.dating) return '💜';
    return '▣';
  }

  function rememberTile(meta) {
    if (!meta || !meta.id) return;
    const id = String(meta.id);
    const prev = T.tiles[id] || {};
    T.tiles[id] = {
      id: id,
      title: meta.title || prev.title || id,
      emoji: meta.emoji || prev.emoji || '',
      avatar: meta.avatar || prev.avatar || '',
      kind: meta.kind || prev.kind || 'profile',
      roles: meta.roles || prev.roles || null,
      priceLabel: meta.priceLabel != null ? meta.priceLabel : prev.priceLabel,
      taskBoard: meta.taskBoard !== undefined ? meta.taskBoard : prev.taskBoard,
      profile: meta.profile !== undefined ? meta.profile : prev.profile,
    };
  }

  /** Append tile as a feed post in scroll order (after CLI text) */
  function postToFeed(meta, opts) {
    opts = opts || {};
    rememberTile(meta);
    killStripDom();
    let row = null;
    if (!opts.forceNew) {
      try {
        const sid = String(meta.id).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        row = document.querySelector('#cli-log .cli-tile-block[data-tile-id="' + sid + '"]');
      } catch (_) {
        row = null;
      }
    }
    if (!row && global.SNCli && SNCli.appendTilePost) {
      row = SNCli.appendTilePost({
        id: meta.id,
        title: meta.title,
        emoji: meta.emoji || tileEmoji(meta),
        kind: meta.kind,
        priceLabel: meta.priceLabel,
        extraSearch: meta.extraSearch || '',
      });
    }
    // Cap total tile blocks in feed
    try {
      const blocks = document.querySelectorAll('#cli-log .cli-tile-block');
      if (blocks.length > MAX_FEED_TILES) {
        for (let i = 0; i < blocks.length - MAX_FEED_TILES; i++) {
          if (blocks[i] && !blocks[i].classList.contains('expanded')) blocks[i].remove();
        }
      }
    } catch (_) {}
    return row;
  }

  function mountInFeedRow(row) {
    const root = $('sn-tile');
    if (!root || !row) return;
    const body = row.querySelector('.cli-tile-body');
    if (!body) return;
    // Collapse other expanded tiles
    document.querySelectorAll('#cli-log .cli-tile-block.expanded').forEach((el) => {
      if (el !== row) el.classList.remove('expanded');
    });
    if (root.parentElement !== body) body.appendChild(root);
    root.classList.remove('overlay-mode');
    root.classList.add('open', 'cli-docked');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'flex';
    row.classList.add('expanded');
    T.activeRow = row;
    T.dock = 'feed';
    try {
      const panel = $('panel');
      if (panel) {
        panel.classList.remove('collapsed');
        if (!panel.classList.contains('expanded') && !panel.classList.contains('mid')) {
          panel.classList.add('mid');
        }
      }
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (_) {}
  }

  function unmountExpand() {
    const root = $('sn-tile');
    if (root) {
      root.classList.remove('open', 'overlay-mode');
      root.setAttribute('aria-hidden', 'true');
      root.style.display = 'none';
      if (root.parentElement && root.parentElement !== document.body) {
        document.body.appendChild(root);
      }
    }
    if (T.activeRow) {
      T.activeRow.classList.remove('expanded');
      T.activeRow = null;
    }
    document.querySelectorAll('#cli-log .cli-tile-block.expanded').forEach((el) => {
      el.classList.remove('expanded');
    });
  }

  function bindCardDoubleTap(root) {
    if (!root || root._snDbl) return;
    root._snDbl = true;
    root.addEventListener(
      'click',
      (e) => {
        if (!T.open) return;
        if (e.target === root && root.classList.contains('overlay-mode')) {
          minimize();
          return;
        }
        const c = root.querySelector('.sn-tile-card');
        if (!c || !c.contains(e.target)) return;
        if (e.target.closest('button, a, input, select, textarea, label')) return;
        const now = Date.now();
        if (now - T.lastCardTap < 380) {
          T.lastCardTap = 0;
          minimize();
          return;
        }
        T.lastCardTap = now;
      },
      true
    );
  }

  function ensureOutsideMin() {
    if (document._snTileOutside) return;
    document._snTileOutside = true;
    document.addEventListener(
      'pointerdown',
      (e) => {
        if (!T.open) return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('#sn-tile') || t.closest('.cli-tile-block.expanded')) return;
        if (t.closest('#sn-task-ribbon') || t.closest('#cli-form') || t.closest('#cli-in')) return;
        // Tap another feed item / map / globe → collapse tile back into stream
        if (
          t.closest('#cli-log') ||
          t.closest('#globe') ||
          t.closest('#city-map') ||
          t.closest('#field-radar') ||
          t.closest('#field-balance-hud') ||
          t.closest('#btn-home')
        ) {
          // Allow tapping another tile head to switch without double minimize race
          if (t.closest('.cli-tile-head')) return;
          minimize();
        }
      },
      true
    );
  }

  function ensureDom() {
    ensureCss();
    loadScale();
    killStripDom();
    ensureOutsideMin();
    if ($('sn-tile')) {
      ensureGripControls();
      bindResize($('sn-tile'));
      bindCardDoubleTap($('sn-tile'));
      applyScale();
      return;
    }
    const el = document.createElement('div');
    el.id = 'sn-tile';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="sn-tile-card">' +
      gripHtml() +
      '  <div class="sn-tile-cover" id="sn-tile-cover">' +
      '    <button type="button" class="sn-tile-x" id="sn-tile-close" aria-label="Minimize">×</button>' +
      '    <button type="button" class="sn-tile-edit-cover" id="sn-tile-edit-cover" title="Cover">📷</button>' +
      '    <input type="file" id="sn-tile-cover-file" accept="image/*" hidden />' +
      '  </div>' +
      '  <div class="sn-tile-head">' +
      '    <div class="sn-tile-av-wrap">' +
      '      <img id="sn-tile-av" class="sn-tile-av" alt="" />' +
      '      <button type="button" class="sn-tile-edit-av" id="sn-tile-edit-av" title="Photo">+</button>' +
      '      <input type="file" id="sn-tile-av-file" accept="image/*" hidden />' +
      '    </div>' +
      '    <div class="sn-tile-id">' +
      '      <div id="sn-tile-name" class="sn-tile-name"></div>' +
      '      <div id="sn-tile-handle" class="sn-tile-handle"></div>' +
      '      <div id="sn-tile-bio" class="sn-tile-bio"></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="sn-tile-roles" id="sn-tile-roles"></div>' +
      '  <div class="sn-tile-tabs" id="sn-tile-tabs"></div>' +
      '  <div class="sn-tile-body" id="sn-tile-body"></div>' +
      '  <div class="sn-tile-foot" id="sn-tile-foot"></div>' +
      '</div>';
    document.body.appendChild(el);
    bindSizeButtons();
    $('sn-tile-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      minimize();
    });
    el.addEventListener('click', (e) => {
      if (e.target === el && el.classList.contains('overlay-mode')) minimize();
    });
    $('sn-tile-edit-cover')?.addEventListener('click', () => $('sn-tile-cover-file')?.click());
    $('sn-tile-edit-av')?.addEventListener('click', () => $('sn-tile-av-file')?.click());
    $('sn-tile-cover-file')?.addEventListener('change', (e) => onFile(e, 'cover'));
    $('sn-tile-av-file')?.addEventListener('change', (e) => onFile(e, 'avatar'));
    bindResize(el);
    bindCardDoubleTap(el);
    applyScale();
  }

  /** Expand tile from a feed post tap */
  function openFromFeed(id, rowEl) {
    const c = T.tiles[id];
    if (!c) {
      global.SNCli?.log?.('Tile not in feed · ' + id, 'dim');
      return;
    }
    if (T.open && T.profileId === id) {
      minimize();
      return;
    }
    if (c.kind === 'task' && c.taskBoard) {
      openTask(c.taskBoard, { fromFeed: true, row: rowEl });
      return;
    }
    const p =
      c.profile ||
      global.SNProfiles?.get?.(id) ||
      (id === (global.SNProfiles?.me?.() || {}).id ? global.SNProfiles.me() : null);
    if (p) open(p, { fromFeed: true, row: rowEl });
    else global.SNCli?.log?.('Tile gone · ' + id, 'dim');
  }

  function onFile(e, kind) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !T.profileId) return;
    const reader = new FileReader();
    reader.onload = () => {
      let url = String(reader.result || '');
      // Cap huge base64 for localStorage safety
      if (url.length > 400000) {
        global.SNCli?.log?.('Image large · using blob URL (session only)', 'dim');
        url = URL.createObjectURL(f);
      }
      global.SNProfiles?.setMedia?.(T.profileId, kind, url);
      render();
    };
    reader.readAsDataURL(f);
  }

  function isMe(p) {
    const me = global.SNProfiles?.me?.();
    return me && p && me.id === p.id;
  }

  function open(profileOrId, opts) {
    ensureDom();
    opts = opts || {};
    T.taskBoard = opts.taskBoard || null;
    const Prof = global.SNProfiles;
    if (!Prof && !T.taskBoard) {
      global.SNCli?.log?.('Profiles offline', 'err');
      return null;
    }
    let p =
      typeof profileOrId === 'string'
        ? Prof?.get?.(profileOrId)
        : profileOrId && profileOrId.id
          ? Prof?.get?.(profileOrId.id) || profileOrId
          : null;
    if (!p && T.taskBoard) {
      p = {
        id: 'task:' + T.taskBoard.task.id,
        name: T.taskBoard.task.title || 'Task',
        handle: '@task',
        bio: 'Delivery task',
        roles: { driver: true },
        lat: T.taskBoard.pickup && T.taskBoard.pickup.lat,
        lng: T.taskBoard.pickup && T.taskBoard.pickup.lng,
      };
    }
    if (!p) p = Prof?.me?.();
    if (!p || !p.id) {
      global.SNCli?.log?.('No tile profile', 'err');
      return null;
    }
    try {
      if (Prof?.upsert && profileOrId && typeof profileOrId === 'object' && !T.taskBoard)
        Prof.upsert(p);
    } catch (_) {}
    T.profileId = p.id;
    T.open = true;
    T.tab = T.taskBoard ? 'task' : opts.tab || defaultTab(p);
    T.dock = opts.overlay === true ? 'overlay' : 'feed';
    const meta = {
      id: p.id,
      title: p.name || p.id,
      avatar: p.avatar || '',
      kind: isMe(p) ? 'me' : 'profile',
      roles: p.roles,
      profile: p,
      emoji: tileEmoji({ kind: isMe(p) ? 'me' : 'profile', roles: p.roles }),
    };
    rememberTile(meta);
    const root = $('sn-tile');
    if (!root) return null;
    if (T.dock === 'overlay') {
      if (root.parentElement !== document.body) document.body.appendChild(root);
      root.classList.add('open', 'overlay-mode');
      root.classList.remove('cli-docked');
      root.setAttribute('aria-hidden', 'false');
      root.style.display = 'flex';
      unmountExpand();
    } else {
      const row = opts.row || postToFeed(meta, { forceNew: !opts.fromFeed });
      if (row) mountInFeedRow(row);
      else {
        // Fallback overlay if feed host missing
        root.classList.add('open', 'overlay-mode');
        root.style.display = 'flex';
      }
    }
    applyScale();
    render();
    if (!opts.fromFeed && !opts.quiet) {
      // Text already in stream via postToFeed — no strip noise
    }
    global.SNCli?.preview?.((p.name || 'Tile') + (T.taskBoard ? ' · task' : ' · expanded'));
    return p;
  }

  /** Delivery / work task multi-tile — price glow + vendor/client addresses */
  function openTask(enriched, opts) {
    opts = opts || {};
    if (!enriched || !enriched.task) {
      if (global.SNTaskBoard && SNTaskBoard.openTaskTile) return SNTaskBoard.openTaskTile(enriched);
      return null;
    }
    ensureDom();
    T.taskBoard = enriched;
    T.profileId = 'task:' + enriched.task.id;
    T.open = true;
    T.tab = 'task';
    T.dock = opts.overlay === true ? 'overlay' : 'feed';
    const priceLabel =
      enriched.price != null
        ? global.SNCurrency
          ? SNCurrency.format(enriched.price)
          : enriched.price + ' S'
        : '';
    const meta = {
      id: T.profileId,
      title: enriched.task.title || 'Task',
      emoji: '📦',
      kind: 'task',
      priceLabel: priceLabel,
      taskBoard: enriched,
    };
    rememberTile(meta);
    const root = $('sn-tile');
    if (!root) return null;
    if (T.dock === 'overlay') {
      if (root.parentElement !== document.body) document.body.appendChild(root);
      root.classList.add('open', 'overlay-mode');
      root.classList.remove('cli-docked');
      root.setAttribute('aria-hidden', 'false');
      root.style.display = 'flex';
      unmountExpand();
    } else {
      const row = opts.row || postToFeed(meta, { forceNew: !opts.fromFeed });
      if (row) mountInFeedRow(row);
      else {
        root.classList.add('open', 'overlay-mode');
        root.style.display = 'flex';
      }
    }
    applyScale();
    render();
    global.SNCli?.preview?.((priceLabel || 'Task') + ' · feed');
    return enriched;
  }

  function defaultTab(p) {
    if (p.roles?.vendor) return 'menu';
    if (p.roles?.dating) return 'dating';
    if (p.roles?.driver) return 'drive';
    if (p.roles?.social) return 'social';
    return 'about';
  }

  /** Collapse expanded tile — post stays in feed stream */
  function minimize() {
    T.open = false;
    unmountExpand();
    try {
      global.SNCli?.preview?.('Feed · scroll · /search · tap tile');
    } catch (_) {}
  }

  function close() {
    minimize();
    T.taskBoard = null;
  }

  function toggle(profileOrId) {
    const id = profileOrId && (profileOrId.id || profileOrId);
    if (T.open && (!id || T.profileId === id)) minimize();
    else open(profileOrId);
  }

  /** Put profile/task into feed stream (no expand unless opts.expand) */
  function offer(profileOrMeta, opts) {
    opts = opts || {};
    ensureDom();
    if (!profileOrMeta) return;
    if (profileOrMeta.task && profileOrMeta.task.id) {
      const en = profileOrMeta;
      const priceLabel =
        en.price != null
          ? global.SNCurrency
            ? SNCurrency.format(en.price)
            : en.price + ' S'
          : '';
      postToFeed({
        id: 'task:' + en.task.id,
        title: en.task.title || 'Task',
        emoji: '📦',
        kind: 'task',
        priceLabel: priceLabel,
        taskBoard: en,
      });
      if (opts.expand) openTask(en, { fromFeed: true });
      return;
    }
    const p =
      typeof profileOrMeta === 'string'
        ? global.SNProfiles?.get?.(profileOrMeta)
        : profileOrMeta;
    if (!p || !p.id) return;
    postToFeed({
      id: p.id,
      title: p.name || p.id,
      avatar: p.avatar || '',
      kind: isMe(p) ? 'me' : 'profile',
      roles: p.roles,
      profile: p,
      emoji: tileEmoji({ kind: isMe(p) ? 'me' : 'profile', roles: p.roles }),
    });
    if (opts.expand) open(p, { quiet: true, tab: opts.tab, fromFeed: true });
  }

  function seedMe() {
    try {
      const me = global.SNProfiles?.me?.();
      if (me) offer(me);
    } catch (_) {}
  }

  function offerMany(list) {
    (list || []).forEach((p) => offer(p));
  }

  function render() {
    const Prof = global.SNProfiles;
    // Task multi-tile (delivery board)
    if (T.tab === 'task' && T.taskBoard) {
      renderTaskBoard(T.taskBoard);
      return;
    }
    const p = Prof?.get?.(T.profileId) || Prof?.me?.();
    if (!p) return;
    T.profileId = p.id;

    const cover = $('sn-tile-cover');
    if (cover) {
      const u = String(p.cover || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      cover.style.backgroundImage = u ? 'url("' + u + '")' : '';
    }
    const av = $('sn-tile-av');
    if (av) {
      av.src = p.avatar || '';
      av.alt = p.name || '';
    }
    if ($('sn-tile-name')) $('sn-tile-name').textContent = p.name || '';
    if ($('sn-tile-handle')) $('sn-tile-handle').textContent = (p.handle || '') + (isMe(p) ? ' · you' : '');
    if ($('sn-tile-bio')) $('sn-tile-bio').textContent = p.bio || '';

    // Role chips
    const rolesEl = $('sn-tile-roles');
    if (rolesEl) {
      const mine = isMe(p);
      rolesEl.innerHTML = Object.keys(Prof.ROLES)
        .map((key) => {
          const meta = Prof.ROLES[key];
          const on = !!p.roles?.[key];
          return (
            '<button type="button" class="sn-role' +
            (on ? ' on' : '') +
            '" data-role="' +
            key +
            '" style="--rc:' +
            meta.color +
            '"' +
            (mine ? '' : ' disabled') +
            '>' +
            meta.emoji +
            ' ' +
            meta.label +
            '</button>'
          );
        })
        .join('');
      rolesEl.querySelectorAll('[data-role]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!isMe(p)) return;
          Prof.toggleRole(p.id, btn.dataset.role);
          render();
          global.SNMap?.showProfiles?.();
          global.SNCli?.log?.(
            'Role ' + btn.dataset.role + ' · ' + (Prof.get(p.id).roles[btn.dataset.role] ? 'ON' : 'off'),
            'ok'
          );
        });
      });
    }

    // Tabs
    const tabs = [];
    tabs.push(['about', 'About']);
    if (p.roles?.vendor) tabs.push(['menu', 'Menu']);
    if (p.roles?.dating) tabs.push(['dating', 'Dating']);
    if (p.roles?.driver) tabs.push(['drive', 'Drive']);
    if (p.roles?.social) tabs.push(['social', 'Social']);
    tabs.push(['cart', 'Cart']);
    if (!tabs.find((t) => t[0] === T.tab)) T.tab = tabs[0][0];

    const tabsEl = $('sn-tile-tabs');
    if (tabsEl) {
      tabsEl.innerHTML = tabs
        .map(
          ([id, label]) =>
            '<button type="button" class="sn-tab' +
            (T.tab === id ? ' on' : '') +
            '" data-tab="' +
            id +
            '">' +
            label +
            '</button>'
        )
        .join('');
      tabsEl.querySelectorAll('[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          T.tab = btn.dataset.tab;
          render();
        });
      });
    }

    const body = $('sn-tile-body');
    const foot = $('sn-tile-foot');
    if (!body || !foot) return;

    if (T.tab === 'about') {
      const hours = p.hours || p.opening_hours || '24/7';
      const sched = global.SNMarket?.verifySchedule?.(p);
      body.innerHTML =
        '<div class="sn-about">' +
        '<div>📍 ' +
        (p.lat != null ? p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) : 'no target yet') +
        '</div>' +
        '<div>Roles: ' +
        Object.keys(p.roles || [])
          .filter((k) => p.roles[k])
          .join(', ') +
        '</div>' +
        (p.shopName ? '<div>🏪 ' + esc(p.shopName) + ' · ' + esc(p.shopKind) + '</div>' : '') +
        '<div>🕒 ' +
        esc(sched?.label || hours) +
        '</div>' +
        (p.vehicle ? '<div>🛵 ' + esc(p.vehicle) + (p.driverOnline ? ' · ONLINE' : '') + '</div>' : '') +
        (p.roles?.worker
          ? '<div>🧰 Worker · ' + esc(p.jobTitle || p.workerRole || 'available') + '</div>'
          : '') +
        (p.lookingFor ? '<div>💕 ' + esc(p.lookingFor) + '</div>' : '') +
        '</div>';
      foot.innerHTML =
        '<button type="button" class="sn-btn" data-act="fly">Fly map</button>' +
        (isMe(p)
          ? '<button type="button" class="sn-btn primary" data-act="scan">Scan live shops</button>'
          : p.roles?.worker
            ? '<button type="button" class="sn-btn primary" data-act="hire">Send work offer</button>'
            : p.roles?.dating
              ? '<button type="button" class="sn-btn primary" data-act="date">Dating request</button>'
              : '<button type="button" class="sn-btn primary" data-act="message">Message</button>');
    } else if (T.tab === 'menu') {
      const menu = p.menu || [];
      const hours = p.hours || p.opening_hours || '24/7';
      const sched = global.SNMarket?.verifySchedule?.(p);
      body.innerHTML =
        '<div class="sn-menu-head">' +
        esc(p.shopName || p.name) +
        ' · menu</div>' +
        '<div class="sn-empty" style="margin-bottom:6px">🕒 ' +
        esc(sched?.label || hours) +
        '</div>' +
        (menu.length
          ? menu
              .map(
                (m) =>
                  '<div class="sn-menu-item" data-mid="' +
                  esc(m.id) +
                  '">' +
                  '<img src="' +
                  esc(m.photo) +
                  '" alt="" loading="lazy" />' +
                  '<div class="sn-menu-meta">' +
                  '<b>' +
                  esc(m.name) +
                  '</b>' +
                  '<span>' +
                  esc(m.desc) +
                  '</span>' +
                  '<em>' +
                  (window.SNCurrency ? SNCurrency.format(m.price) : Number(m.price).toFixed(2) + ' S') +
                  '</em>' +
                  '</div>' +
                  '<button type="button" class="sn-add" data-add="' +
                  esc(m.id) +
                  '">+</button>' +
                  '</div>'
              )
              .join('')
          : '<div class="sn-empty">No menu listed yet · vendor worker adds real items · or message them · S only</div>');
      foot.innerHTML =
        '<button type="button" class="sn-btn" data-act="cart">Cart ' +
        (window.SNCurrency ? SNCurrency.format(Prof.cartTotal?.() || 0) : (Prof.cartTotal?.() || 0).toFixed(2) + ' S') +
        '</button>' +
        '<button type="button" class="sn-btn primary" data-act="order">Order + deliver</button>';
      body.querySelectorAll('[data-add]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = (p.menu || []).find((x) => x.id === btn.dataset.add);
          if (!item) return;
          Prof.cartAdd(p.id, item, 1);
          global.SNCli?.log?.(
            'Cart + ' + item.name + ' ' + (window.SNCurrency ? SNCurrency.format(item.price) : item.price + ' S'),
            'ok'
          );
          render();
        });
      });
    } else if (T.tab === 'dating') {
      body.innerHTML =
        '<div class="sn-dating">' +
        '<div class="sn-big">' +
        esc(p.lookingFor || 'Open to meeting') +
        '</div>' +
        '<div class="sn-tags">' +
        (p.interests || [])
          .map((i) => '<span>' + esc(i) + '</span>')
          .join('') +
        '</div>' +
        '<p>Invite via city DNA — same tile, same claim flow.</p>' +
        '</div>';
      foot.innerHTML =
        '<button type="button" class="sn-btn primary" data-act="date">Invite date</button>' +
        '<button type="button" class="sn-btn" data-act="fly">Map</button>';
    } else if (T.tab === 'drive') {
      body.innerHTML =
        '<div class="sn-drive">' +
        '<div class="sn-big">' +
        (p.driverOnline ? '🟢 ONLINE' : '⚫ offline') +
        '</div>' +
        '<div>Vehicle · ' +
        esc(p.vehicle || '—') +
        '</div>' +
        '<div>Rating · ' +
        (p.rating != null ? p.rating : '—') +
        '★</div>' +
        '<p>Open deliveries appear as tasks. Claim from CLI or here.</p>' +
        '</div>';
      foot.innerHTML =
        (isMe(p)
          ? '<button type="button" class="sn-btn primary" data-act="online">' +
            (p.driverOnline ? 'Go offline' : 'Go online') +
            '</button>'
          : '') +
        '<button type="button" class="sn-btn" data-act="claim">Claim delivery</button>';
    } else if (T.tab === 'social') {
      const posts = p.posts || [];
      body.innerHTML =
        (isMe(p)
          ? '<div class="sn-compose"><input id="sn-post-in" placeholder="Post to city…" maxlength="280" /><button type="button" id="sn-post-go">Post</button></div>'
          : '') +
        (posts.length
          ? posts
              .map(
                (x) =>
                  '<div class="sn-post"><div class="sn-post-t">' +
                  esc(x.text) +
                  '</div><div class="sn-post-m">' +
                  new Date(x.t || Date.now()).toLocaleString() +
                  '</div></div>'
              )
              .join('')
          : '<div class="sn-empty">No posts yet</div>');
      foot.innerHTML = '<button type="button" class="sn-btn" data-act="fly">Show on map</button>';
      $('sn-post-go')?.addEventListener('click', () => {
        const v = $('sn-post-in')?.value?.trim();
        if (!v) return;
        Prof.addPost(p.id, v);
        render();
      });
    } else if (T.tab === 'cart') {
      const items = Prof.cart() || [];
      body.innerHTML = items.length
        ? items
            .map(
              (i) =>
                '<div class="sn-menu-item">' +
                '<img src="' +
                esc(i.photo) +
                '" alt="" />' +
                '<div class="sn-menu-meta"><b>' +
                esc(i.name) +
                '</b><span>' +
                esc(i.vendorName) +
                '</span><em>' +
                (window.SNCurrency ? SNCurrency.format(i.price) : Number(i.price).toFixed(2) + ' S') +
                ' ×' +
                (i.qty || 1) +
                '</em></div></div>'
            )
            .join('') +
          '<div class="sn-total">Total ' +
          (window.SNCurrency ? SNCurrency.format(Prof.cartTotal()) : Prof.cartTotal().toFixed(2) + ' S') +
          '</div>'
        : '<div class="sn-empty">Cart empty · open a vendor menu</div>';
      foot.innerHTML =
        '<button type="button" class="sn-btn" data-act="clear">Clear</button>' +
        '<button type="button" class="sn-btn primary" data-act="order">Order + deliver</button>';
    }

    foot.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => void act(btn.dataset.act, p));
    });
  }

  function renderTaskBoard(e) {
    if (!e || !e.task) return;
    const body = $('sn-tile-body');
    const foot = $('sn-tile-foot');
    const nameEl = $('sn-tile-name');
    const handle = $('sn-tile-handle');
    const roles = $('sn-tile-roles');
    if (nameEl) nameEl.textContent = e.task.title || 'Task';
    if (handle) handle.textContent = (e.task.status || 'open') + ' · ' + (e.task.kind || 'delivery');
    if (roles) roles.innerHTML = '<span class="sn-role on">TASK</span>';
    const priceBlock =
      global.SNTaskBoard && SNTaskBoard.priceHtml
        ? SNTaskBoard.priceHtml(e.price)
        : '<span class="sn-task-price">' +
          (e.price != null ? Number(e.price).toFixed(2) + ' S' : '— S') +
          '</span>';
    if (body) {
      body.innerHTML =
        priceBlock +
        '<div class="sn-task-party"><div class="lbl">Vendor</div><b>' +
        esc(e.vendorName) +
        '</b><span>' +
        esc(e.vendorAddress) +
        '</span></div>' +
        '<div class="sn-task-party"><div class="lbl">Client</div><b>' +
        esc(e.clientName) +
        '</b><span>' +
        esc(e.clientAddress) +
        '</span></div>' +
        '<p style="font-size:11px;color:#6a8aaa;margin:0">All your task routes stay on the map · arrange multi-stops</p>';
    }
    if (foot) {
      foot.innerHTML =
        '<div class="sn-task-actions">' +
        '<button type="button" class="sn-btn primary" data-tact="preview">Map routes</button>' +
        '<button type="button" class="sn-btn" data-tact="claim">Claim</button>' +
        '<button type="button" class="sn-btn" data-tact="close">Close</button>' +
        '</div>';
      foot.querySelectorAll('[data-tact]').forEach((btn) => {
        btn.onclick = (ev) => {
          ev?.preventDefault?.();
          const a = btn.getAttribute('data-tact');
          if (a === 'close') close();
          else if (a === 'preview') {
            void global.SNTaskBoard?.previewTaskOnMap?.(e.task, { fit: true, force: true });
          } else if (a === 'claim') {
            const r = global.SNTasks?.claim?.(e.task.id);
            if (r?.ok) {
              global.SNCli?.log?.('Claimed · ' + r.task.title, 'ok');
              T.taskBoard = global.SNTaskBoard?.enrich?.(r.task) || e;
              render();
              void global.SNTaskBoard?.previewTaskOnMap?.(r.task, { fit: true, force: true });
            }
          }
        };
      });
    }
  }

  async function act(name, p) {
    const Prof = global.SNProfiles;
    if (name === 'fly') {
      if (p.lat != null) {
        global.SNGlobe?.goToPlace?.(p.lat, p.lng, {
          tier: 'national',
          openMap: false,
          skipScan: true,
          label: p.name || p.shopName || 'Target',
        });
        await global.SNMap?.open?.(p.lat, p.lng);
        global.SNMap?.showProfiles?.();
      }
      return;
    }
    if (name === 'seed' || name === 'scan') {
      // SPECS P0-D: live DB + crawlers only — never seedCity NPCs
      global.SNCli?.log?.('Live sector scan · DB + Overpass + crawl…', 'dim');
      if (typeof window.snToast === 'function') window.snToast('Live scan…', 'info');
      const r =
        (global.SNCommerce?.ensureSector &&
          (await global.SNCommerce.ensureSector(p.lat, p.lng, { openMap: true }))) ||
        null;
      const n = r?.count || 0;
      global.SNCli?.log?.(
        n
          ? 'Sector live · ' + n + ' shop tiles · ' + (r.source || 'live')
          : 'Sector empty · long-press map to create tile · or fly elsewhere',
        n ? 'ok' : 'dim'
      );
      if (typeof window.snToast === 'function') {
        window.snToast(
          n ? 'Live: ' + n + ' vendors · ' + (r.source || 'scan') : 'Empty sector · create or fly',
          n ? 'ok' : 'err'
        );
      }
      render();
      return;
    }
    if (name === 'message') {
      global.SNCli?.log?.('Message · ' + p.name + ' · ' + (p.handle || ''), 'ok');
      global.SNCli?.log?.('Tip: date coffee · or order from their menu', 'dim');
      return;
    }
    if (name === 'date') {
      const t = global.SNTasks?.create?.({
        kind: 'dating',
        role: 'coffee',
        title: '💕 Date invite · ' + p.name,
        raw: 'date with ' + p.name,
        lat: p.lat,
        lng: p.lng,
        targetId: p.id,
      });
      global.SNCli?.log?.('Dating request · ' + (t?.title || p.name), 'ok');
      global.SNMap?.showTasks?.();
      return;
    }
    if (name === 'hire') {
      const role = p.workerRole || p.jobTitle || 'worker';
      const t = global.SNTasks?.create?.({
        kind: 'job',
        role: String(role).toLowerCase().slice(0, 24),
        title: '🧰 Work offer · ' + (p.name || role) + ' · 3h',
        dur: '3h',
        raw: 'hire ' + (p.name || role),
        lat: p.lat,
        lng: p.lng,
        targetId: p.id,
        targetName: p.name,
      });
      const sched = global.SNMarket?.verifySchedule?.(p);
      global.SNCli?.log?.(
        'Work offer → ' + (p.name || role) + ' · ' + (t?.title || '') + ' · ' + (sched?.label || '24/7'),
        'ok'
      );
      global.SNMap?.showTasks?.();
      return;
    }
    if (name === 'online') {
      p.driverOnline = !p.driverOnline;
      p.roles.driver = true;
      Prof.upsert(p);
      global.SNCli?.log?.(p.driverOnline ? 'Driver ONLINE on map' : 'Driver offline', 'ok');
      global.SNMap?.showProfiles?.();
      render();
      return;
    }
    if (name === 'claim') {
      const open = (global.SNTasks?.list?.({ kind: 'delivery' }) || []).filter(
        (t) => t.status === 'open'
      );
      const r = global.SNTasks?.claim?.(open[0]?.id);
      if (r?.ok) {
        global.SNCli?.log?.('Claimed · ' + r.task.title, 'ok');
        global.SNMap?.showTasks?.();
        render();
      } else {
        global.SNCli?.log?.(r?.error || 'No open deliveries · place an order first', 'dim');
      }
      return;
    }
    if (name === 'cart') {
      T.tab = 'cart';
      render();
      return;
    }
    if (name === 'clear') {
      Prof.cartClear();
      render();
      return;
    }
    if (name === 'order') {
      const r = Prof.placeOrder();
      if (!r.ok) {
        global.SNCli?.log?.(r.error || 'order failed', 'err');
        return;
      }
      const fmt = (n) =>
        window.SNCurrency ? SNCurrency.format(n) : Number(n).toFixed(2) + ' S';
      global.SNCli?.log?.('Order placed · ' + fmt(r.total) + ' · 24/7 marketplace', 'ok');
      global.SNCli?.log?.(
        'Fees · platform ' +
          fmt(r.platformFee || r.total * 0.03) +
          ' · driver ' +
          fmt(r.driverCut || r.total * 0.15),
        'dim'
      );
      global.SNCli?.log?.(
        r.task
          ? 'Delivery task ' + r.task.id + ' · drivers: claim from Drive tab or CLI task claim'
          : 'Delivery open',
        'ok'
      );
      global.SNField?.paint?.();
      if (p.lat != null) await global.SNMap?.open?.(p.lat, p.lng);
      global.SNMap?.showTasks?.();
      global.SNMap?.showProfiles?.();
      T.tab = 'cart';
      render();
      return;
    }
  }

  function openMe(tab) {
    open(global.SNProfiles?.me?.(), { tab: tab || 'about' });
  }

  /**
   * Multi-tile create — only via long-press on map or intentional + .
   * Never short-click.
   */
  function createAt(lat, lng, opts) {
    const Prof = global.SNProfiles;
    if (!Prof || lat == null || lng == null) return null;
    opts = opts || {};
    const id =
      'place_' +
      String(Number(lat).toFixed(4) + '_' + Number(lng).toFixed(4))
        .replace(/\./g, 'p')
        .replace(/-/g, 'm');
    const existing = Prof.get?.(id);
    if (existing) {
      return open(existing, { tab: opts.tab || 'about' });
    }
    const p = Prof.upsert({
      id,
      name: opts.name || 'Place ' + Number(lat).toFixed(3) + '°',
      handle: '@place',
      bio: 'Long-press created · set roles · menu · social',
      cover: '',
      avatar: '',
      lat: Number(lat),
      lng: Number(lng),
      roles: { social: true, client: true, vendor: false, driver: false, dating: false, worker: false },
      posts: [{ id: 'p0', text: 'New multi-tile on SpaceNet', t: Date.now() }],
      menu: [],
    });
    global._snLastPos = { lat: Number(lat), lng: Number(lng) };
    try {
      global.SNTasks?.setPos?.(Number(lat), Number(lng));
    } catch (_) {}
    const opened = open(p, { tab: opts.tab || 'about' });
    try {
      global.SNMap?.showProfiles?.();
    } catch (_) {}
    global.SNCli?.log?.(
      'Multi-tile created · ' + Number(lat).toFixed(4) + ', ' + Number(lng).toFixed(4),
      'ok'
    );
    return opened || p;
  }

  function init() {
    ensureDom();
    killStripDom();
    // Do not flood feed with vendors on boot — shops/offer push into stream when asked
    document.getElementById('btn-tile')?.addEventListener('click', () => openMe());
    const fab = document.getElementById('sn-plus');
    if (fab && !fab._snBound) {
      fab._snBound = true;
      fab.addEventListener('click', (e) => {
        e.preventDefault();
        const pos = global._snLastPos || global.SNTasks?.pos || { lat: 36.4341, lng: 28.2176 };
        if (global.SNMap?.active) createAt(pos.lat, pos.lng);
        else openMe();
      });
    }
  }

  global.SNTile = {
    init,
    open,
    openMe,
    openTask,
    openFromFeed,
    createAt,
    close,
    minimize,
    toggle,
    render,
    offer,
    offerMany,
    seedMe,
    postToFeed,
    get openId() {
      return T.profileId;
    },
    get isOpen() {
      return T.open;
    },
  };
})(window);
