/* SpaceNet unified multi-role tile — cover · avatar · roles · menu · dating · driver
 * One surface for social / dating / vendor order / driver profiles (map + CLI).
 */
(function (global) {
  'use strict';

  const T = {
    open: false,
    profileId: null,
    tab: 'about', // about | menu | dating | drive | social | cart
  };

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

  function ensureCss() {
    if (document.getElementById('sn-tile-css')) return;
    const st = document.createElement('style');
    st.id = 'sn-tile-css';
    st.textContent = [
      '#sn-tile{position:fixed;inset:0;z-index:55;display:none;align-items:flex-end;justify-content:center;',
      'padding:12px 12px calc(12px + env(safe-area-inset-bottom));background:rgba(0,0,0,.45);pointer-events:auto}',
      '#sn-tile.open{display:flex}',
      '#sn-tile .sn-tile-card{width:min(440px,100%);max-height:min(78vh,720px);overflow:auto;border-radius:16px;',
      'background:rgba(0,8,20,.96);border:1px solid rgba(61,158,255,.45);box-shadow:0 12px 40px rgba(0,0,0,.65);',
      'color:#c8e4ff;display:flex;flex-direction:column}',
      '#sn-tile .sn-tile-cover{position:relative;height:120px;background:#061428 center/cover no-repeat;flex-shrink:0}',
      '#sn-tile .sn-tile-x,#sn-tile .sn-tile-edit-cover{position:absolute;top:8px;border:0;border-radius:10px;',
      'background:rgba(0,0,0,.55);color:#fff;width:36px;height:36px;cursor:pointer;font-size:16px}',
      '#sn-tile .sn-tile-x{right:8px}#sn-tile .sn-tile-edit-cover{right:52px}',
      '#sn-tile .sn-tile-head{display:flex;gap:12px;padding:0 14px 10px;margin-top:-28px;align-items:flex-end}',
      '#sn-tile .sn-tile-av-wrap{position:relative;flex-shrink:0}',
      '#sn-tile .sn-tile-av{width:64px;height:64px;border-radius:50%;border:3px solid #1a6fd4;object-fit:cover;background:#0a1a30}',
      '#sn-tile .sn-tile-edit-av{position:absolute;right:-4px;bottom:-4px;width:24px;height:24px;border-radius:50%;',
      'border:0;background:#1a6fd4;color:#fff;cursor:pointer;font-weight:700}',
      '#sn-tile .sn-tile-name{font:700 16px system-ui;color:#e8f4ff}',
      '#sn-tile .sn-tile-handle{font:12px ui-monospace,monospace;color:#5a8aaa}',
      '#sn-tile .sn-tile-bio{font:12px system-ui;color:#8a9bb0;margin-top:4px}',
      '#sn-tile .sn-tile-roles,#sn-tile .sn-tile-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px}',
      '#sn-tile .sn-role,#sn-tile .sn-tab{border:1px solid rgba(61,158,255,.35);background:rgba(0,12,28,.8);',
      'color:#b8c4d4;border-radius:999px;padding:6px 10px;font:600 11px system-ui;cursor:pointer}',
      '#sn-tile .sn-role.on,#sn-tile .sn-tab.on{border-color:#3d9eff;color:#3d9eff;background:rgba(26,111,212,.2)}',
      '#sn-tile .sn-tile-body{padding:8px 14px 12px;flex:1;overflow:auto;font:13px/1.45 system-ui}',
      '#sn-tile .sn-tile-foot{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px 14px;border-top:1px solid rgba(26,111,212,.25)}',
      '#sn-tile .sn-btn{border:1px solid rgba(61,158,255,.4);background:rgba(26,111,212,.25);color:#e8f4ff;',
      'border-radius:10px;padding:8px 12px;font:600 12px system-ui;cursor:pointer}',
      '#sn-tile .sn-btn.primary{background:rgba(0,221,136,.2);border-color:rgba(0,221,136,.45);color:#6dffb0}',
      '#sn-tile .sn-empty{color:#5a6a7e;font-size:12px;padding:8px 0}',
      '#sn-tile .sn-menu-head{font-weight:700;color:#3d9eff;margin-bottom:8px}',
      '#sn-tile .sn-menu-item{display:flex;align-items:center;gap:10px;padding:8px 0;',
      'border-bottom:1px solid rgba(26,111,212,.15)}',
      '#sn-tile .sn-menu-item img{width:48px;height:48px;border-radius:10px;object-fit:cover;background:#0a1a30;flex-shrink:0}',
      '#sn-tile .sn-menu-meta{flex:1;min-width:0}',
      '#sn-tile .sn-menu-meta b{display:block;color:#e8f4ff}',
      '#sn-tile .sn-menu-meta span{display:block;font-size:11px;color:#6a8aaa}',
      '#sn-tile .sn-menu-meta em{display:block;color:#6dffb0;font-style:normal;font-weight:700;margin-top:2px}',
      '#sn-tile .sn-add{width:36px;height:36px;border-radius:10px;border:1px solid rgba(0,221,136,.45);',
      'background:rgba(0,221,136,.15);color:#6dffb0;font-weight:800;cursor:pointer;flex-shrink:0}',
      '#sn-tile .sn-total{margin-top:10px;font-weight:700;color:#6dffb0}',
      '#sn-tile .sn-fee{font-size:11px;color:#6a8aaa;margin-top:4px}',
      '#sn-tile .sn-post{padding:8px 0;border-bottom:1px solid rgba(26,111,212,.15)}',
      '#sn-tile .sn-compose{display:flex;gap:6px;margin-bottom:10px}',
      '#sn-tile .sn-compose input{flex:1;border-radius:10px;border:1px solid rgba(61,158,255,.35);',
      'background:rgba(0,12,28,.8);color:#e8f4ff;padding:8px}',
      '#sn-tile .sn-compose button{border:0;border-radius:10px;background:#1a6fd4;color:#fff;padding:8px 12px;cursor:pointer}',
      '#sn-tile .sn-big{font-size:18px;font-weight:700;margin-bottom:6px}',
      '#sn-tile .sn-tags span{display:inline-block;margin:2px 4px 2px 0;padding:3px 8px;border-radius:999px;',
      'background:rgba(26,111,212,.2);font-size:11px}',
      '.sn-pin{background:transparent!important;border:0!important}',
      '.sn-pin-inner{width:36px;height:36px;border-radius:50%;border:2px solid #3d9eff;background:#061428;',
      'overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer}',
      '.sn-pin-inner img{width:100%;height:100%;object-fit:cover}',
      '.leaflet-marker-icon.sn-pin{margin-left:-18px!important;margin-top:-18px!important}',
    ].join('');
    document.head.appendChild(st);
  }

  function ensureDom() {
    ensureCss();
    if ($('sn-tile')) return;
    const el = document.createElement('div');
    el.id = 'sn-tile';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="sn-tile-card">' +
      '  <div class="sn-tile-cover" id="sn-tile-cover">' +
      '    <button type="button" class="sn-tile-x" id="sn-tile-close" aria-label="Close">×</button>' +
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
    $('sn-tile-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    el.addEventListener('click', (e) => {
      if (e.target === el) close();
    });
    $('sn-tile-edit-cover')?.addEventListener('click', () => $('sn-tile-cover-file')?.click());
    $('sn-tile-edit-av')?.addEventListener('click', () => $('sn-tile-av-file')?.click());
    $('sn-tile-cover-file')?.addEventListener('change', (e) => onFile(e, 'cover'));
    $('sn-tile-av-file')?.addEventListener('change', (e) => onFile(e, 'avatar'));
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
    const Prof = global.SNProfiles;
    if (!Prof) {
      global.SNCli?.log?.('Profiles offline', 'err');
      return null;
    }
    let p =
      typeof profileOrId === 'string'
        ? Prof.get(profileOrId)
        : profileOrId && profileOrId.id
          ? Prof.get(profileOrId.id) || profileOrId
          : null;
    if (!p) p = Prof.me();
    if (!p || !p.id) {
      global.SNCli?.log?.('No tile profile', 'err');
      return null;
    }
    // Keep map registry in sync so re-open works
    try {
      if (Prof.upsert && profileOrId && typeof profileOrId === 'object') Prof.upsert(p);
    } catch (_) {}
    T.profileId = p.id;
    T.open = true;
    T.tab = (opts && opts.tab) || defaultTab(p);
    const root = $('sn-tile');
    if (!root) return null;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'flex';
    render();
    global.SNCli?.log?.('Tile · ' + (p.name || p.id), 'ok');
    global.SNCli?.preview?.((p.name || 'Tile') + ' open');
    global.SNUi?.expandPanel?.(false);
    return p;
  }

  function defaultTab(p) {
    if (p.roles?.vendor) return 'menu';
    if (p.roles?.dating) return 'dating';
    if (p.roles?.driver) return 'drive';
    if (p.roles?.social) return 'social';
    return 'about';
  }

  function close() {
    T.open = false;
    const root = $('sn-tile');
    if (root) {
      root.classList.remove('open');
      root.setAttribute('aria-hidden', 'true');
      root.style.display = 'none';
    }
  }

  function toggle(profileOrId) {
    if (T.open && (!profileOrId || T.profileId === (profileOrId.id || profileOrId))) close();
    else open(profileOrId);
  }

  function render() {
    const Prof = global.SNProfiles;
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
      body.innerHTML =
        '<div class="sn-about">' +
        '<div>📍 ' +
        (p.lat != null ? p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) : 'no pin yet') +
        '</div>' +
        '<div>Roles: ' +
        Object.keys(p.roles || [])
          .filter((k) => p.roles[k])
          .join(', ') +
        '</div>' +
        (p.shopName ? '<div>🏪 ' + esc(p.shopName) + ' · ' + esc(p.shopKind) + '</div>' : '') +
        (p.vehicle ? '<div>🛵 ' + esc(p.vehicle) + (p.driverOnline ? ' · ONLINE' : '') + '</div>' : '') +
        (p.lookingFor ? '<div>💕 ' + esc(p.lookingFor) + '</div>' : '') +
        '</div>';
      foot.innerHTML =
        '<button type="button" class="sn-btn" data-act="fly">Fly map</button>' +
        (isMe(p)
          ? '<button type="button" class="sn-btn primary" data-act="scan">Scan live shops</button>'
          : '<button type="button" class="sn-btn primary" data-act="message">Message</button>');
    } else if (T.tab === 'menu') {
      const menu = p.menu || [];
      body.innerHTML =
        '<div class="sn-menu-head">' +
        esc(p.shopName || p.name) +
        ' · menu</div>' +
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
          : '<div class="sn-empty">No menu listed yet · vendor adds real items · or message them · S only</div>');
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

  async function act(name, p) {
    const Prof = global.SNProfiles;
    if (name === 'fly') {
      if (p.lat != null) {
        await global.SNMap?.open?.(p.lat, p.lng);
        global.SNMap?.showProfiles?.();
        global.SNGlobe?.flyNear?.(p.lat, p.lng);
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
      });
      global.SNCli?.log?.('Date open · ' + t.title, 'ok');
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
    document.getElementById('btn-tile')?.addEventListener('click', () => openMe());
    // + → multi-tile at last pos or open me
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
    createAt,
    close,
    toggle,
    render,
    get openId() {
      return T.profileId;
    },
    get isOpen() {
      return T.open;
    },
  };
})(window);
