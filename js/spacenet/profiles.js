/* SpaceNet multi-role profiles — same DNA for user/social/dating/vendor/driver
 * Cover + avatar + roles + vendor menus (photo/price) · local-first juice
 */
(function (global) {
  'use strict';

  const KEY = 'sn:profiles-v1';
  const ME_KEY = 'sn:me-profile-id';
  const CART_KEY = 'sn:cart-v1';

  const ROLES = {
    social: { label: 'Social', color: '#6dffb0', emoji: '✨' },
    dating: { label: 'Dating', color: '#ff6699', emoji: '💕' },
    vendor: { label: 'Vendor worker', color: '#3d9eff', emoji: '🏪' },
    driver: { label: 'Driver', color: '#44ffaa', emoji: '🛵' },
    client: { label: 'Client', color: '#ffcc66', emoji: '🛒' },
    worker: { label: 'Work', color: '#66aaff', emoji: '💼' },
    ambassador: {
      label: 'Ambassador',
      color: '#c9a0ff',
      emoji: '🎓',
    },
  };

  const P = {
    profiles: new Map(),
    meId: null,
    cart: [],
  };

  function uid(prefix) {
    return (prefix || 'p') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Offline-safe media — no broken external dummy hosts */
  function pic(seed, w, h) {
    w = w || 400;
    h = h || 200;
    const label = encodeURIComponent(String(seed || 'SN').slice(0, 12));
    const c1 = '0a1a30';
    const c2 = '1a6fd4';
    return (
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
          w +
          '" height="' +
          h +
          '"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#' +
          c1 +
          '"/><stop offset="1" stop-color="#' +
          c2 +
          '"/></linearGradient></defs><rect fill="url(#g)" width="100%" height="100%"/><text x="50%" y="54%" fill="#9ec8ff" font-size="22" font-family="system-ui" text-anchor="middle">' +
          label +
          '</text></svg>'
      )
    );
  }

  function avatar(seed) {
    return pic(seed || 'av', 150, 150);
  }

  function isDemoJunk(p) {
    if (!p || !p.id) return true;
    const id = String(p.id);
    if (id.startsWith('demo-') || id.startsWith('npc-') || id.startsWith('seed-')) return true;
    if (p.demo === true || p.npc === true || p.fake === true) return true;
    return false;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        let purged = false;
        JSON.parse(raw).forEach((p) => {
          if (!p?.id) return;
          if (isDemoJunk(p)) {
            purged = true;
            return;
          }
          P.profiles.set(p.id, p);
        });
        if (purged) save();
      }
      P.meId = localStorage.getItem(ME_KEY) || null;
      const cart = localStorage.getItem(CART_KEY);
      if (cart) P.cart = JSON.parse(cart) || [];
    } catch (_) {}
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify([...P.profiles.values()].slice(-60)));
      if (P.meId) localStorage.setItem(ME_KEY, P.meId);
      localStorage.setItem(CART_KEY, JSON.stringify(P.cart.slice(-40)));
    } catch (_) {}
  }

  function normalize(input) {
    const p = input || {};
    const roles = p.roles || { social: true };
    return {
      id: p.id || uid('p'),
      name: p.name || 'Astranov User',
      handle: p.handle || '@user',
      bio: p.bio || '',
      cover: p.cover || pic(p.id || p.name || 'cover', 900, 360),
      avatar: p.avatar || avatar(p.id || p.name || 'av'),
      roles: {
        social: !!roles.social,
        dating: !!roles.dating,
        vendor: !!roles.vendor,
        driver: !!roles.driver,
        client: !!roles.client,
        worker: !!roles.worker,
        ambassador: !!roles.ambassador,
      },
      lat: p.lat != null ? p.lat : null,
      lng: p.lng != null ? p.lng : null,
      // dating
      lookingFor: p.lookingFor || '',
      interests: p.interests || [],
      // vendor / Google Business-style fields
      shopName: p.shopName || '',
      shopKind: p.shopKind || 'shop',
      menu: Array.isArray(p.menu) ? p.menu : [],
      hours: p.hours || p.opening_hours || '',
      opening_hours: p.opening_hours || p.hours || '',
      phone: p.phone || p.tel || '',
      website: p.website || p.url || '',
      address: p.address || p.vicinity || '',
      photos: Array.isArray(p.photos) ? p.photos : [],
      googlePlaceId: p.googlePlaceId || p.place_id || '',
      googleMapsUrl: p.googleMapsUrl || p.googleUrl || p.url || '',
      priceLevel: p.priceLevel != null ? p.priceLevel : p.price_level,
      priceBand: p.priceBand || '',
      ratingCount: p.ratingCount != null ? p.ratingCount : p.user_ratings_total,
      openNow: p.openNow != null ? p.openNow : p.open_now,
      googleEnrichedAt: p.googleEnrichedAt || null,
      source: p.source || '',
      real: p.real === true,
      // driver
      driverOnline: !!p.driverOnline,
      vehicle: p.vehicle || '',
      rating: p.rating != null ? p.rating : null,
      // ambassador (support → mine S)
      ambassadorOnline: !!p.ambassadorOnline,
      supportHelps: p.supportHelps != null ? p.supportHelps : 0,
      // social
      posts: Array.isArray(p.posts) ? p.posts : [],
      // meta
      created: p.created || Date.now(),
      updated: Date.now(),
    };
  }

  function upsert(spec) {
    const next = normalize(spec);
    const prev = P.profiles.get(next.id);
    if (prev) {
      Object.assign(prev, next, { created: prev.created });
      P.profiles.set(prev.id, prev);
      save();
      return prev;
    }
    P.profiles.set(next.id, next);
    save();
    return next;
  }

  function get(id) {
    return P.profiles.get(id) || null;
  }

  function list(filter) {
    let arr = [...P.profiles.values()];
    if (filter?.role) arr = arr.filter((p) => p.roles?.[filter.role]);
    if (filter?.near && filter.lat != null) {
      const R = filter.radius || 0.08;
      arr = arr.filter(
        (p) => p.lat != null && Math.abs(p.lat - filter.lat) < R && Math.abs(p.lng - filter.lng) < R
      );
    }
    return arr.sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }

  function me() {
    if (P.meId && P.profiles.has(P.meId)) return P.profiles.get(P.meId);
    const pos = global.SNTasks?.pos || global._snLastPos || { lat: 36.4341, lng: 28.2176 };
    const self = upsert({
      id: P.meId || uid('me'),
      name: global.SNAuth?.user?.user_metadata?.full_name || global.SNAuth?.user?.email?.split('@')[0] || 'You',
      handle: '@' + (global.SNAuth?.user?.email?.split('@')[0] || 'astranov'),
      bio: 'SpaceNet citizen · client · marketplace 24/7 in S',
      cover: pic('me-cover', 900, 360),
      avatar: global.SNAuth?.user?.user_metadata?.avatar_url || avatar('me-av'),
      roles: { social: true, client: true, dating: false, vendor: false, driver: false, worker: false },
      lat: pos.lat,
      lng: pos.lng,
      posts: [{ id: uid('post'), text: 'Joined Astranov SpaceNet 🌍', t: Date.now() }],
    });
    P.meId = self.id;
    save();
    // Welcome S so marketplace is usable immediately
    try {
      if (global.SNCurrency && SNCurrency.balance() < 1) {
        SNCurrency.credit(100, 'welcome SpaceNet');
      }
    } catch (_) {}
    return self;
  }

  function setMe(id) {
    if (P.profiles.has(id)) {
      P.meId = id;
      save();
      return get(id);
    }
    return null;
  }

  function toggleRole(profileId, role, on) {
    const p = get(profileId) || me();
    if (!ROLES[role]) return p;
    p.roles[role] = on != null ? !!on : !p.roles[role];
    // sensible defaults when enabling
    if (p.roles.vendor && !p.shopName) {
      p.shopName = p.name + "'s shop";
      if (!Array.isArray(p.menu)) p.menu = [];
    }
    if (p.roles.driver && !p.vehicle) p.vehicle = 'Scooter';
    if (p.roles.dating && !p.lookingFor) p.lookingFor = 'Coffee · walk · real talk';
    if (p.roles.ambassador) p.ambassadorOnline = true;
    else p.ambassadorOnline = false;
    p.updated = Date.now();
    P.profiles.set(p.id, p);
    save();
    return p;
  }

  /** Honest empty menu — never invent Margherita/Espresso NPCs (SPECS P0-D) */
  function defaultMenu(_kind) {
    return [];
  }

  function parseMenuItems(items) {
    let raw = items;
    if (raw == null) return [];
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (_) {
        return [];
      }
    }
    if (!Array.isArray(raw)) return [];
    return raw
      .map((it, i) => ({
        id: it.id || 'm_' + i,
        name: String(it.name || it.title || 'Item').slice(0, 80),
        price: Number(it.price != null ? it.price : it.amount) || 0,
        photo: it.photo || it.image || pic(String(it.name || i), 200, 200),
        desc: String(it.desc || it.description || '').slice(0, 120),
      }))
      .filter((m) => m.name);
  }

  /** Real DB vendor → usable multi-tile vendor profile (coords required; no invented menu) */
  function fromVendor(v, pos) {
    if (!v) return null;
    if (v.lat == null || v.lng == null) return null;
    if (String(v.id || '').startsWith('demo-')) return null;
    const id = 'v_' + String(v.id || v.osm_id || v.name || uid('v'))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_')
      .slice(0, 40);
    const kind = String(v.category || v.kind || 'shop').toLowerCase();
    const prev = get(id);
    const menu = parseMenuItems(v.items);
    return upsert({
      id,
      name: v.name || prev?.name || 'Shop',
      handle: '@' + id.slice(0, 18),
      bio: (v.emoji || '🏪') + ' ' + kind + ' · SpaceNet marketplace · 24/7',
      cover: prev?.cover || pic(id + 'c', 900, 360),
      avatar: prev?.avatar || pic(id + 'a', 150, 150),
      roles: { social: true, vendor: true, client: false, dating: false, driver: false, worker: false },
      lat: Number(v.lat),
      lng: Number(v.lng),
      shopName: v.name || 'Shop',
      shopKind: kind,
      menu: menu.length ? menu : prev?.menu || [],
      hours: v.hours || v.opening_hours || prev?.hours || '24/7',
      real: true,
      source: v.source || 'db',
      delivery_enabled: v.delivery_enabled !== false,
      posts: prev?.posts || [{ id: uid('post'), text: 'Open on SpaceNet · order in S', t: Date.now() }],
    });
  }

  function setMenuItem(profileId, item) {
    const p = get(profileId);
    if (!p) return null;
    p.menu = p.menu || [];
    const idx = p.menu.findIndex((m) => m.id === item.id);
    const row = {
      id: item.id || uid('m'),
      name: item.name || 'Item',
      price: Number(item.price) || 0,
      photo: item.photo || pic(item.name || 'm', 200, 200),
      desc: item.desc || '',
    };
    if (idx >= 0) p.menu[idx] = row;
    else p.menu.push(row);
    p.updated = Date.now();
    save();
    return p;
  }

  function setMedia(profileId, kind, dataUrl) {
    const p = get(profileId) || me();
    if (kind === 'cover') p.cover = dataUrl;
    else if (kind === 'avatar') p.avatar = dataUrl;
    p.updated = Date.now();
    P.profiles.set(p.id, p);
    save();
    return p;
  }

  function addPost(profileId, text) {
    const p = get(profileId) || me();
    p.posts = p.posts || [];
    p.posts.unshift({ id: uid('post'), text: String(text || '').slice(0, 280), t: Date.now() });
    p.posts = p.posts.slice(0, 20);
    p.updated = Date.now();
    save();
    return p;
  }

  // Cart
  function cart() {
    return P.cart.slice();
  }

  function cartAdd(vendorId, menuItem, qty) {
    const v = get(vendorId);
    const item = {
      id: uid('c'),
      vendorId,
      vendorName: v?.shopName || v?.name || 'Shop',
      menuId: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price) || 0,
      photo: menuItem.photo,
      qty: qty || 1,
    };
    P.cart.push(item);
    save();
    return item;
  }

  function cartClear() {
    P.cart = [];
    save();
  }

  function cartTotal() {
    return P.cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  }

  function placeOrder() {
    // SPECS: 24/7/365 · platform 3% vault · driver 15% · vendor rest · all in S
    if (!P.cart.length) return { ok: false, error: 'cart empty' };
    const vendorId = P.cart[0].vendorId;
    const vendor = get(vendorId);
    const total = cartTotal();
    const items = cart();
    if (!(total > 0)) return { ok: false, error: 'cart total is 0 S' };
    let platformFee = Math.round(total * 0.03 * 100) / 100;
    if (total > 0 && platformFee < 0.01) platformFee = 0.01;
    const driverCut = Math.round(total * 0.15 * 100) / 100;
    let vendorCut = Math.round((total - platformFee - driverCut) * 100) / 100;
    if (vendorCut < 0) vendorCut = 0;
    const client = me();
    // Pay in S — top-up only enough for this order (money machine must not free-float forever)
    try {
      if (global.SNCurrency && typeof SNCurrency.balance === 'function') {
        const bal = SNCurrency.balance();
        if (bal < total) {
          const need = Math.ceil((total - bal + 0.001) * 100) / 100;
          SNCurrency.credit(need, 'order top-up');
          global.SNCli?.log?.(
            'Wallet top-up · ' +
              (SNCurrency.format ? SNCurrency.format(need) : need + ' S') +
              ' to cover order',
            'dim'
          );
        }
        const pay = SNCurrency.debit(total);
        if (!pay.ok) return { ok: false, error: 'insufficient S · top up wallet' };
        // Architect 3% vault (from gross)
        const why =
          'order · ' + (vendor?.shopName || vendor?.name || vendorId || 'shop');
        let feeRes = null;
        if (typeof SNCurrency.takePlatformFeeFrom === 'function') {
          feeRes = SNCurrency.takePlatformFeeFrom(total, why);
        } else if (typeof SNCurrency.notePlatformFee === 'function') {
          feeRes = SNCurrency.notePlatformFee(platformFee, { why: why });
        }
        try {
          if (global.SNSuper && SNSuper.pushTx) {
            SNSuper.pushTx({
              kind: 'order',
              total: total,
              fee: (feeRes && feeRes.fee) || platformFee,
              driver: driverCut,
              vendor: vendorCut,
              who: client?.name || client?.id,
              why: why,
            });
          }
        } catch (_) {}
        try {
          if (global.SNCli && SNCli.log) {
            SNCli.log(
              'Paid ' +
                (SNCurrency.format ? SNCurrency.format(total) : total + ' S') +
                ' · 3% vault · 15% driver · ' +
                vendorCut.toFixed(2) +
                ' S vendor on deliver',
              'ok'
            );
          }
        } catch (_) {}
      }
    } catch (ePay) {
      return { ok: false, error: (ePay && ePay.message) || 'payment failed' };
    }

    cartClear();
    const drop = global._snLastPos || global.SNTasks?.pos || {
      lat: client.lat,
      lng: client.lng,
    };
    const t = global.SNTasks?.create?.({
      kind: 'delivery',
      role: 'driver',
      title:
        '📦 Order · ' +
        items.map((i) => i.name).slice(0, 2).join(', ') +
        ' · ' +
        (global.SNCurrency ? SNCurrency.format(total) : total.toFixed(2) + ' S'),
      dur: '45m',
      raw: 'delivery order ' + total,
      lat: vendor?.lat != null ? vendor.lat : drop.lat,
      lng: vendor?.lng != null ? vendor.lng : drop.lng,
      always_on: true,
      vendorId,
      clientId: client.id,
      vendorName: vendor?.shopName || vendor?.name || null,
      clientName: client?.name || null,
      vendorAddress:
        vendor?.address ||
        vendor?.shopAddress ||
        (vendor?.lat != null
          ? Number(vendor.lat).toFixed(4) + '°, ' + Number(vendor.lng).toFixed(4) + '°'
          : null),
      clientAddress:
        client?.address ||
        (drop.lat != null
          ? Number(drop.lat).toFixed(4) + '°, ' + Number(drop.lng).toFixed(4) + '°'
          : null),
      items,
      total_s: total,
      platform_fee_s: platformFee,
      driver_s: driverCut,
      vendor_s: vendorCut,
      settled: false,
      drop_lat: drop.lat,
      drop_lng: drop.lng,
    });
    list({ role: 'driver' }).forEach((d) => {
      if (d.driverOnline && global.SNGlobe?.pulse) {
        SNGlobe.pulse(d.lat, d.lng, 0x44ffaa, 'Order!', 8000);
      }
    });
    if (vendor?.lat != null && global.SNGlobe?.pulse) {
      SNGlobe.pulse(vendor.lat, vendor.lng, 0x3d9eff, 'Pickup', 12000);
    }
    try {
      if (global.SNUsage && SNUsage.track) {
        SNUsage.track('place_order', {
          total: total,
          vendorId: vendorId,
          taskId: t && t.id,
          platformFee: platformFee,
          driverCut: driverCut,
          vendorCut: vendorCut,
        });
      }
    } catch (_) {}
    try {
      if (global.SNField && SNField.startDeliveryRoute && vendor && t) {
        void SNField.startDeliveryRoute({
          id: 'live:' + t.id,
          vendorLat: vendor.lat != null ? vendor.lat : t.lat,
          vendorLng: vendor.lng != null ? vendor.lng : t.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
          label: '🛵 ' + String(vendor.shopName || vendor.name || 'Shop').slice(0, 12),
          driver: 'Driver',
          color: 'rgba(0,220,255,0.95)',
        });
      }
    } catch (_) {}
    const result = {
      ok: true,
      task: t,
      total,
      platformFee,
      driverCut,
      vendorCut,
      items,
      vendorId,
      drop: drop,
      vendor: vendor
        ? {
            id: vendor.id,
            lat: vendor.lat,
            lng: vendor.lng,
            name: vendor.shopName || vendor.name,
          }
        : null,
      marketplace: { alwaysOn: true, hours: '24/7', days: 365 },
      fees: { platformPct: 3, driverPct: 15, vendorPct: Math.round((vendorCut / total) * 100) },
    };
    // Production mesh: broadcast + best-effort network intake (non-blocking)
    try {
      if (global.SNMeshOrders && SNMeshOrders.afterLocalOrder) {
        void SNMeshOrders.afterLocalOrder(result, { vendor: vendor, drop: drop });
      }
    } catch (_) {}
    return result;
  }

  /**
   * Settle delivery task on complete — pay driver 15% + vendor remainder (idempotent).
   * Client already debited full total at placeOrder; platform 3% already vaulted.
   */
  function settleOrder(task) {
    if (!task) return { ok: false, error: 'no task' };
    if (task.settled) {
      return {
        ok: true,
        already: true,
        driverPaid: 0,
        vendorPaid: 0,
        task: task,
      };
    }
    const total = Number(task.total_s) || 0;
    let platformFee = Number(task.platform_fee_s);
    if (!isFinite(platformFee) && total > 0) platformFee = Math.round(total * 0.03 * 100) / 100;
    let driverPay = Number(task.driver_s);
    if (!isFinite(driverPay) && total > 0) driverPay = Math.round(total * 0.15 * 100) / 100;
    let vendorPay = Number(task.vendor_s);
    if (!isFinite(vendorPay) && total > 0) {
      vendorPay = Math.round((total - (platformFee || 0) - (driverPay || 0)) * 100) / 100;
    }
    if (!(driverPay > 0)) driverPay = 0;
    if (!(vendorPay > 0)) vendorPay = 0;

    let driverPaid = 0;
    let vendorPaid = 0;
    try {
      if (global.SNCurrency && SNCurrency.credit) {
        if (driverPay > 0) {
          SNCurrency.credit(driverPay, 'driver delivery');
          driverPaid = driverPay;
        }
        if (vendorPay > 0) {
          SNCurrency.credit(vendorPay, 'vendor order');
          vendorPaid = vendorPay;
        }
      }
    } catch (e) {
      return { ok: false, error: (e && e.message) || 'credit failed' };
    }

    task.settled = true;
    task.settledAt = Date.now();
    task.driverPaid_s = driverPaid;
    task.vendorPaid_s = vendorPaid;
    try {
      if (global.SNTasks && SNTasks.get && task.id) {
        const live = SNTasks.get(task.id);
        if (live) {
          live.settled = true;
          live.settledAt = task.settledAt;
          live.driverPaid_s = driverPaid;
          live.vendorPaid_s = vendorPaid;
          // tasks Map is same object if get returns ref
        }
      }
    } catch (_) {}
    try {
      if (global.SNUsage && SNUsage.track) {
        SNUsage.track('order_settle', {
          taskId: task.id,
          driver: driverPaid,
          vendor: vendorPaid,
          total: total,
        });
      }
    } catch (_) {}
    try {
      if (global.SNSuper && SNSuper.pushTx) {
        SNSuper.pushTx({
          kind: 'settle',
          taskId: task.id,
          driver: driverPaid,
          vendor: vendorPaid,
          total: total,
        });
      }
    } catch (_) {}
    return {
      ok: true,
      driverPaid: driverPaid,
      vendorPaid: vendorPaid,
      platformFee: platformFee || 0,
      total: total,
      task: task,
    };
  }

  function fromCrawlPlace(place, pos) {
    if (!place || place.lat == null || place.lng == null) return null;
    if (place && (place.id || place.items != null)) {
      return fromVendor(
        {
          id: place.id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          category: place.kind || place.category,
          items: place.items,
          emoji: place.emoji,
          real: true,
          source: place.source || 'crawl',
          delivery_enabled: place.delivery_enabled,
        },
        pos
      );
    }
    const id =
      'poi_' +
      String(place.name || place.lat + '_' + place.lng)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 24);
    const kind = String(place.kind || 'shop').toLowerCase();
    if (P.profiles.has(id)) {
      const prev = get(id);
      prev.lat = place.lat;
      prev.lng = place.lng;
      prev.real = true;
      prev.source = place.source || prev.source || 'crawl';
      prev.roles = prev.roles || {};
      prev.roles.vendor = true;
      prev.shopName = prev.shopName || place.name || prev.name || 'Shop';
      if (place.kind) prev.shopKind = String(place.kind).toLowerCase();
      if (place.hours || place.opening_hours) {
        prev.hours = place.hours || place.opening_hours;
        prev.opening_hours = prev.hours;
      }
      if (place.phone) prev.phone = place.phone;
      if (place.website) prev.website = place.website;
      if (place.address) prev.address = place.address;
      if (place.rating != null) prev.rating = place.rating;
      if (place.photos && place.photos.length) {
        prev.photos = place.photos;
        if (place.photos[0]) prev.cover = place.photos[0];
        if (place.photos[1] || place.photos[0]) prev.avatar = place.photos[1] || place.photos[0];
      }
      if (place.googlePlaceId) prev.googlePlaceId = place.googlePlaceId;
      if (place.cover) prev.cover = place.cover;
      if (place.menu && place.menu.length && !(prev.menu && prev.menu.length)) {
        prev.menu = parseMenuItems(place.menu);
      }
      prev.updated = Date.now();
      P.profiles.set(prev.id, prev);
      save();
      return prev;
    }
    const photos = Array.isArray(place.photos) ? place.photos : [];
    return upsert({
      id,
      name: place.name || 'Place',
      handle: '@' + id.slice(0, 16),
      bio:
        (place.address || place.kind || 'vendor') +
        (place.rating != null ? ' · ★' + place.rating : '') +
        (place.phone ? ' · ' + place.phone : ''),
      cover: place.cover || photos[0] || pic(id + '-c', 900, 360),
      avatar: place.avatar || photos[1] || photos[0] || pic(id + '-a', 150, 150),
      photos: photos,
      roles: { social: true, vendor: true, client: false, dating: false, driver: false, worker: false },
      lat: place.lat,
      lng: place.lng,
      shopName: place.name || 'Shop',
      shopKind: kind,
      menu: parseMenuItems(place.items || place.menu),
      hours: place.hours || place.opening_hours || '',
      opening_hours: place.hours || place.opening_hours || '',
      phone: place.phone || '',
      website: place.website || '',
      address: place.address || '',
      rating: place.rating != null ? place.rating : null,
      googlePlaceId: place.googlePlaceId || '',
      googleMapsUrl: place.googleMapsUrl || place.url || '',
      real: true,
      source: place.source || 'crawl',
      posts: [
        {
          id: uid('post'),
          text: place.phone
            ? 'Call ' + place.phone + (place.website ? ' · ' + place.website : '')
            : 'Live shop · open menu · pay in S',
          t: Date.now(),
        },
      ],
    });
  }

  /**
   * @deprecated Never invent NPCs. Forwards to SNCommerce.ensureSector only.
   */
  function seedCity(lat, lng) {
    me();
    global.SNCli?.log?.(
      'seed disabled · real path: shops / scan (DB + Overpass + crawl)',
      'dim'
    );
    if (global.SNCommerce?.ensureSector) {
      return global.SNCommerce.ensureSector(lat, lng, { openMap: true });
    }
    return Promise.resolve({ ok: false, count: 0, source: 'none', error: 'commerce offline' });
  }

  function primaryRole(p) {
    if (p.roles?.ambassador) return 'ambassador';
    if (p.roles?.vendor) return 'vendor';
    if (p.roles?.driver && p.driverOnline) return 'driver';
    if (p.roles?.dating) return 'dating';
    if (p.roles?.worker) return 'worker';
    if (p.roles?.social) return 'social';
    return 'client';
  }

  function pinColor(p) {
    const r = primaryRole(p);
    return (ROLES[r] || ROLES.social).color;
  }

  load();

  global.SNProfiles = {
    ROLES,
    load,
    save,
    get,
    list,
    me,
    setMe,
    upsert,
    toggleRole,
    setMenuItem,
    setMedia,
    addPost,
    fromVendor,
    parseMenuItems,
    defaultMenu,
    fromCrawlPlace,
    seedCity,
    primaryRole,
    pinColor,
    targetColor: pinColor,
    cart,
    cartAdd,
    cartClear,
    cartTotal,
    placeOrder,
    settleOrder,
  };
})(window);
