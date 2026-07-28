/* SpaceNet CLI — street DNA complete surface */
(function (global) {
  'use strict';

  const hist = [];
  let histIdx = -1;

  function $(id) {
    return document.getElementById(id);
  }

  function log(text, cls) {
    const box = $('cli-log');
    if (!box) return;
    const line = document.createElement('div');
    line.className = 'cli-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    box.appendChild(line);
    while (box.children.length > 100) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }

  function preview(text) {
    const el = $('cli-preview');
    if (el) el.textContent = text || '';
    if (global.SNGlobe?.setHud) SNGlobe.setHud(text || '');
  }

  function help() {
    log('── Astranov SpaceNet (full chrome) ──', 'ok');
    log('MAP   locate · city · shops · globe', 'ok');
    log('SPACE go to mars|moon|jupiter|europa · thesis · vault · cosmos', 'ok');
    log('ZOOM  solar · global · national · regional · city', 'ok');
    log('GLOBE  single-tap dive · double-tap zoom out · no blue rings', 'dim');
    log('FIND  crawl <poi> · fly athens · fly rhodes', 'ok');
    log('TILE  me · vendors · cart · order', 'ok');
    log('FIRST list shop · menu add · order me · drive on · deliver me · first delivery', 'ok');
    log('DATA  usage · usage export · handoff', 'dim');
    log('FIELD radar · resources · mine on|off · donate on|off', 'ok');
    log('MONEY S · rate · wallet · finance  (primary; fiat/crypto secondary)', 'ok');
    log('WORK  job · date · deliver · task list', 'dim');
    log('SYS   login · clear · verify · help', 'dim');
    log('UI    task ribbon materialises buttons for current task only', 'dim');
    preview('locate · resources · rate · shops');
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
    const line = String(raw || '').trim();
    if (!line) return;
    hist.push(line);
    histIdx = hist.length;
    log('› ' + line, 'cmd');
    global.SNUi?.expandPanel?.(true);
    global.SNRibbon?.infer?.(line);

    const low = line.toLowerCase();
    const Tasks = global.SNTasks;
    const Globe = global.SNGlobe;

    try {
      if (low === 'help' || low === '?' || low === 'commands') {
        help();
        return;
      }
      if (low === 'clear') {
        const box = $('cli-log');
        if (box) box.innerHTML = '';
        return;
      }
      if (low === 'brain' || low === 'memory' || low === 'mind') {
        dumpBrain('summary');
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
      // First marketplace loop + usage (Astranov AI coaches the same path)
      if (
        low === 'first delivery' ||
        low === 'first loop' ||
        low === 'first order' ||
        low === 'πρώτη παράδοση'
      ) {
        log('First loop · vendor → menu → order → driver → you…', 'dim');
        preview('first delivery');
        if (global.SNMarket?.runFirstLoop) {
          const r = await global.SNMarket.runFirstLoop({});
          log(r?.ok ? 'First delivery DONE' : r?.error || r?.order?.error || 'partial — see AI lines', r?.ok ? 'ok' : 'err');
        } else log('Market module loading… hard refresh', 'err');
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
        log(r?.ok ? 'Delivered to you · first loop complete' : r?.error || 'fail', r?.ok ? 'ok' : 'err');
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
      if (low === 'me' || low === 'profile' || low === 'tile' || low === 'plus' || low === 'my tile') {
        global.SNTile?.openMe?.();
        log('Your tile · cover · avatar · tap roles: social dating vendor driver client work', 'ok');
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
        log('Toggle: role vendor · role dating · role driver', 'dim');
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
        const vendors = global.SNProfiles?.list?.({ role: 'vendor' }) || [];
        if (!vendors.length) {
          const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
          await global.SNCommerce?.ensureSector?.(p.lat, p.lng, { openMap: true });
        }
        const list = global.SNProfiles?.list?.({ role: 'vendor' }) || [];
        list.slice(0, 12).forEach((v) => {
          log('🏪 ' + (v.shopName || v.name) + ' · ' + (v.menu?.length || 0) + ' items', 'ok');
        });
        const first = list[0];
        if (first) {
          if (first.lat != null) await global.SNMap?.open?.(first.lat, first.lng);
          global.SNMap?.showProfiles?.();
          global.SNTile?.open?.(first, { tab: 'menu' });
        }
        preview((list.length || 0) + ' vendor tiles');
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
        global.SNRibbon?.setTask?.('money');
        return;
      }
      if (low === 'wallet' || low === 'balance') {
        const C = global.SNCurrency;
        const snap = C?.snapshot?.() || { balance: 0, mined: 0 };
        log('Wallet ' + (C?.format?.(snap.balance) || snap.balance + ' S'), 'ok');
        log('Mined lifetime ' + (C?.format?.(snap.mined) || snap.mined), 'dim');
        global.SNField?.paint?.();
        global.SNRibbon?.setTask?.('money');
        preview(snap.line || 'wallet');
        return;
      }
      if (low === 'finance' || low === 'field' || low === 'ledger') {
        global.SNField?.openFinance?.();
        log('Finance panel · Stats · Mining · Platform 3% · P2P · Reports', 'ok');
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
      if (low === 'donate on') {
        global.SNResources?.setDonate?.(true);
        return;
      }
      if (low === 'donate off') {
        global.SNResources?.setDonate?.(false);
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
      // Zoom tiers
      if (low === 'solar' || low === 'zoom solar' || low === 'galaxy') {
        Globe?.goToTier?.('solar');
        log('Zoom · SOLAR', 'ok');
        return;
      }
      if (low === 'global' || low === 'earth' || low === 'world' || low === 'zoom global' || low === 'zoom earth') {
        global.SNMap?.close?.();
        Globe?.goToTier?.('global');
        log('Zoom · GLOBAL Earth', 'ok');
        return;
      }
      if (low === 'national' || low === 'country' || low === 'zoom national') {
        global.SNMap?.close?.();
        Globe?.goToTier?.('national');
        log('Zoom · NATIONAL', 'ok');
        return;
      }
      if (low === 'regional' || low === 'region' || low === 'zoom regional') {
        global.SNMap?.close?.();
        Globe?.goToTier?.('regional');
        log('Zoom · REGIONAL', 'ok');
        return;
      }
      if (low === 'zoom city' || low === 'zoom street' || low === 'city zoom') {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        Globe?.goToTier?.('city');
        await global.SNMap?.open?.(p.lat, p.lng);
        log('Zoom · CITY / street map', 'ok');
        return;
      }
      if (low === 'login' || low === 'signin' || low === 'sign in') {
        await global.SNAuth?.toggle?.();
        return;
      }
      if (low === 'logout' || low === 'signout' || low === 'sign out') {
        if (global.SNAuth?.user) await global.SNAuth.signOut();
        log('Signed out', 'dim');
        return;
      }
      if (low === 'locate' || low === 'gps' || low === 'where am i') {
        preview('Locating…');
        const pos = await Globe?.locate?.();
        if (pos) {
          Tasks?.setPos?.(pos.lat, pos.lng);
          log(
            pos.fallback
              ? 'Default position (GPS off) · ' + pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4)
              : 'Located ' + pos.lat.toFixed(4) + ', ' + pos.lng.toFixed(4),
            'ok'
          );
          const r = await global.SNCommerce?.ensureSector?.(pos.lat, pos.lng, { openMap: false });
          if (r?.count) log(r.count + ' live shops near you · type shops', 'ok');
          preview(r?.count ? r.count + ' shops · Earth' : 'You · type shops');
        }
        return;
      }
      if (low === 'city' || low === 'map' || low === 'street' || low === 'city map') {
        const p = Tasks?.pos || global._snLastPos || (await Globe?.locate?.()) || { lat: 36.43, lng: 28.22 };
        if (p.lat) Tasks?.setPos?.(p.lat, p.lng);
        Globe?.goToTier?.('city');
        await global.SNMap?.open?.(p.lat, p.lng);
        return;
      }
      if (low === 'shops' || low === 'vendors' || low === 'stores') {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.4341, lng: 28.2176 };
        Globe?.goToTier?.('city');
        const r = await global.SNCommerce?.ensureSector?.(p.lat, p.lng, { openMap: true });
        const vendors = global.SNProfiles?.list?.({ role: 'vendor' }) || [];
        vendors.slice(0, 12).forEach((v) => {
          log(
            '🏪 ' +
              (v.shopName || v.name) +
              ' · ' +
              (v.menu?.length || 0) +
              ' menu' +
              (v.real ? ' · live' : ''),
            'ok'
          );
        });
        const n = vendors.length || r?.count || 0;
        log(
          n
            ? n + ' shop tiles · tap pin · Menu · + · Order (S) · source ' + (r?.source || 'live')
            : 'No shops · try fly another city · or crawl restaurants',
          n ? 'ok' : 'dim'
        );
        if (vendors[0]) global.SNTile?.open?.(vendors[0], { tab: 'menu' });
        preview(n + ' shops');
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
      // fly city on Earth (geocode + crawl)
      for (const [name, ll] of Object.entries(CITIES)) {
        if (new RegExp('^(fly\\s+)?' + name + '$', 'i').test(low) || low === 'fly ' + name) {
          if (Globe?.bodyId && Globe.bodyId !== 'earth') Globe.setBody?.('earth');
          Globe?.goToPlace?.(ll[0], ll[1], { tier: 'national', label: name, body: 'earth' });
          Tasks?.setPos?.(ll[0], ll[1]);
          log('Fly · ' + name + ' · crawling…', 'ok');
          preview(name);
          return;
        }
      }
      if (/^fly\s+/.test(low)) {
        const name = low.replace(/^fly\s+/, '').trim();
        const ll = CITIES[name.replace(/\s+/g, '')] || CITIES[name];
        if (ll) {
          if (Globe?.bodyId && Globe.bodyId !== 'earth') Globe.setBody?.('earth');
          Globe?.goToPlace?.(ll[0], ll[1], { tier: 'national', label: name, body: 'earth' });
          log('Fly · ' + name, 'ok');
        } else if (global.SNSearch?.geocode) {
          preview('Finding · ' + name);
          const places = await SNSearch.geocode(name);
          if (places?.[0]) {
            const p = places[0];
            if (Globe?.bodyId && Globe.bodyId !== 'earth') Globe.setBody?.('earth');
            Globe?.goToPlace?.(p.lat, p.lng, {
              tier: 'national',
              label: p.name,
              body: 'earth',
            });
            log('Fly · ' + String(p.name).slice(0, 60), 'ok');
          } else if (global.SNCosmos?.resolve?.(name)) {
            await global.SNCosmos.go(name);
          } else log('Unknown · fly athens · go to mars · go to jupiter', 'dim');
        } else log('Unknown place · try: fly athens · go to mars', 'dim');
        return;
      }
      if (/^task\s*list$|^list$|^tasks$/.test(low)) {
        const open = Tasks?.list?.() || [];
        if (!open.length) {
          log('No open tasks · job barman 3h · date coffee · deliver food', 'dim');
        } else {
          open.slice(0, 15).forEach((t) => {
            log((t.status || 'open') + ' · ' + t.kind + ' · ' + t.dur + ' · ' + t.title.slice(0, 42), 'ok');
            Globe?.pulse?.(t.lat, t.lng, (Tasks.KINDS[t.kind] || {}).color, t.title.slice(0, 16), 9000);
          });
          if (global.SNMap?.active) global.SNMap.showTasks?.();
          preview(open.length + ' open on globe');
        }
        return;
      }
      if (/^task\s*claim|^claim\b/.test(low)) {
        const tid = line.split(/\s+/).find((p) => p.startsWith('t_'));
        const r = Tasks?.claim?.(tid);
        if (r?.ok) {
          log('Claimed · ' + r.task.title, 'ok');
          preview('Claimed · ' + r.task.kind);
          if (global.SNMap?.active) global.SNMap.showTasks?.();
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
        const local = Tasks?.search?.(q) || { tasks: [], roles: [] };
        local.tasks.slice(0, 4).forEach((t) => log('task · ' + t.title.slice(0, 50), 'ok'));
        if (global.SNSearch?.crawl) {
          const crawled = await SNSearch.crawl(q, {
            pos: Tasks?.pos || global._snLastPos,
            openMap: true,
            all: true,
            fly: true,
          });
          SNSearch.report?.(crawled, log);
          if (!crawled.score) log('Empty · try: crawl pizza · find Greece · code three.js', 'dim');
        } else if (!local.tasks.length) {
          log('Search module loading… try again', 'dim');
        }
        preview('Almighty · ' + q.slice(0, 40));
        if (global.SNAi?.ask) {
          void SNAi.ask(
            'User almighty-crawled: ' + q + '. One short SpaceNet tip with a CLI next step.',
            { mode: 'chat' }
          ).then((tip) => {
            if (tip) log(tip, 'dim');
          });
        }
        return;
      }
      if (/^research\b/.test(low)) {
        const q = line.replace(/^research\s+/i, '').trim() || 'Astranov SpaceNet';
        preview('Research · ' + q);
        if (global.SNAi?.research) {
          const r = await SNAi.research(q);
          if (r?.text) log(r.text, 'ok');
        } else {
          await run('crawl ' + q);
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
      if (/^date\b|^dating\b|coffee\s*date|dinner\s*date/.test(low)) {
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
        const t = Tasks?.create?.(line);
        log('Job open · ' + t.title, 'ok');
        preview(t.title);
        if (global.SNMap?.active) global.SNMap.showTasks?.();
        return;
      }
      if (/^order\b|^market\b|^checkout\b/.test(low)) {
        const p = Tasks?.pos || global._snLastPos || { lat: 36.43, lng: 28.22 };
        await global.SNMap?.open?.(p.lat, p.lng);
        const r = await global.SNCommerce?.populateMap?.(p.lat, p.lng, { openMap: true });
        log(
          r?.count
            ? 'Market · ' + r.count + ' real shops · open a vendor tile · cart · order'
            : 'Market · no shops in sector · try fly rhodes · shops',
          r?.count ? 'ok' : 'dim'
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

      // Freeform → Astranov AI (must talk + act; coaches first shop/delivery)
      preview('Astranov AI…');
      global.SNUi?.expandPanel?.(true);
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
          preview(reply.replace(/^Astranov AI\s*[·:.-]\s*/i, '').slice(0, 80));
          return;
        }
      }
      log('Astranov AI loading… try: first delivery · locate · shops', 'dim');
      preview('AI loading…');
    } catch (e) {
      log('Error: ' + (e.message || e), 'err');
    }
  }

  let speechRec = null;
  let handsfreeOn = false;
  let hfRestartTimer = null;
  let hfLastHeard = 0;
  let hfMutedUntil = 0; // ignore mic while TTS / cooldown (kills feedback loop)
  let hfBusy = false; // one command at a time
  let hfRunTimes = []; // runaway guard
  /** TTS off by default — talking non-stop was a product emergency */
  let hfSpeakOut = false;

  function setHandsfreeUi(on, label) {
    const btn = $('btn-handsfree');
    if (btn) {
      btn.classList.toggle('on', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on
        ? 'Mic ON · tap to stop (voice reply off unless enabled)'
        : 'Hands-free mic → AI (no auto babble)';
    }
    if (label) preview(label);
  }

  function muteMic(ms) {
    hfMutedUntil = Date.now() + (ms || 2000);
  }

  /** Optional speak — OFF by default. Never auto-loop. */
  function speakAi(text, force) {
    if (!force && !hfSpeakOut) return;
    if (!handsfreeOn && !force) return;
    try {
      const synth = global.speechSynthesis;
      if (!synth || !global.SpeechSynthesisUtterance) return;
      const clean = String(text || '')
        .replace(/^Astranov AI\s*[·:.-]\s*/i, '')
        .replace(/[🎙➤⋮]/g, '')
        .trim()
        .slice(0, 180);
      if (!clean) return;
      synth.cancel();
      muteMic(Math.min(12000, 1500 + clean.length * 45));
      try {
        if (speechRec) speechRec.abort();
      } catch (_) {}
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = /^el/i.test(navigator.language || '') ? 'el-GR' : navigator.language || 'en-US';
      u.rate = 1.05;
      u.onend = () => {
        muteMic(900);
        if (handsfreeOn) scheduleListenRestart(1000);
      };
      u.onerror = () => {
        muteMic(500);
        if (handsfreeOn) scheduleListenRestart(800);
      };
      synth.speak(u);
    } catch (_) {}
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
        setHandsfreeUi(true, '🎙 listening…');
      } catch (_) {
        /* already started */
      }
    }, ms || 600);
  }

  function stopHandsfree(reason) {
    handsfreeOn = false;
    hfBusy = false;
    hfSpeakOut = false;
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
    if (low.length < 2) return true;
    // Echo of our own TTS / system noise
    if (/astranov\s*listening|say first delivery|tap (again|🎙)|hands-?free|mic live/i.test(low))
      return true;
    if (/^astranov(\s+ai)?[.!]?$/i.test(low)) return true;
    return false;
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
      stopHandsfree('Hands-free off');
      log('Hands-free off', 'dim');
      return;
    }
    if (!global.isSecureContext && location.hostname !== 'localhost') {
      log('Hands-free needs HTTPS · open https://astranov.eu', 'err');
      return;
    }
    if (!SR) {
      log('Hands-free needs Chrome/Edge speech · type to AI instead', 'err');
      preview('No speech API');
      return;
    }

    // Kill any stuck TTS from previous session
    try {
      global.speechSynthesis?.cancel?.();
    } catch (_) {}
    try {
      global.SNTile?.close?.();
    } catch (_) {}
    try {
      global.SNUi?.resetChrome?.();
      global.SNUi?.setSize?.('mid', true);
    } catch (_) {}

    speechRec = new SR();
    const nav = navigator.language || 'en-US';
    speechRec.lang = /^el/i.test(nav) ? 'el-GR' : nav;
    speechRec.interimResults = false; // finals only — less chatter
    speechRec.continuous = false; // push-to-session: one utterance, then re-arm carefully
    speechRec.maxAlternatives = 1;

    speechRec.onstart = () => {
      setHandsfreeUi(true, '🎙 listening…');
    };

    speechRec.onresult = (ev) => {
      try {
        if (Date.now() < hfMutedUntil) return;
        if (hfBusy) return;
        let finalText = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) finalText += ev.results[i][0]?.transcript || '';
        }
        const t = String(finalText || '').trim();
        if (!t || isEchoGarbage(t)) return;
        const now = Date.now();
        if (now - hfLastHeard < 1400) return;
        hfLastHeard = now;
        if (runawayTrip()) return;
        hfBusy = true;
        muteMic(8000);
        const input = $('cli-in');
        if (input) input.value = t;
        log('🎙 ' + t, 'cmd');
        preview('…');
        void (async () => {
          try {
            await run(t);
            // Text only if user enabled speak-out (default OFF)
            if (hfSpeakOut) {
              const hist = global.SNAi?.history;
              const last = hist && hist[hist.length - 1];
              if (last && last.role === 'assistant') speakAi(String(last.content).slice(0, 160));
            }
          } catch (e) {
            log('Voice · ' + (e.message || e), 'err');
          } finally {
            hfBusy = false;
            muteMic(1200);
            if (handsfreeOn) scheduleListenRestart(1400);
          }
        })();
      } catch (_) {
        hfBusy = false;
      }
    };

    speechRec.onerror = (ev) => {
      const code = (ev && ev.error) || 'error';
      if (code === 'aborted') return;
      if (code === 'no-speech') {
        if (handsfreeOn && !hfBusy) scheduleListenRestart(500);
        return;
      }
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        stopHandsfree('Mic blocked');
        log('Mic denied · allow microphone · then tap 🎙 once', 'err');
        return;
      }
      if (handsfreeOn && !hfBusy) scheduleListenRestart(900);
    };

    speechRec.onend = () => {
      if (handsfreeOn && !hfBusy && Date.now() >= hfMutedUntil) scheduleListenRestart(700);
    };

    handsfreeOn = true;
    hfSpeakOut = false;
    hfRunTimes = [];
    muteMic(400);
    setHandsfreeUi(true, '🎙 mic on (silent)');
    try {
      speechRec.start();
      try {
        if (global.SNUsage?.track) SNUsage.track('handsfree_on', { speakOut: false });
      } catch (_) {}
      log('🎙 Mic ON · speak a command · no auto-talk · tap 🎙 to stop', 'ok');
      log('Tip: type first delivery · tile stays under CLI · type close tile if stuck', 'dim');
    } catch (e) {
      stopHandsfree('Hands-free failed');
      log('Hands-free start failed · ' + (e.message || e), 'err');
    }
  }

  function init() {
    const form = $('cli-form');
    const input = $('cli-in');
    if (!form || !input || form._snBound) return;
    form._snBound = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = '';
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
        if (global.SNMap?.active) global.SNMap.backToGlobe?.() || global.SNMap.close?.();
        else global.SNMap?.close?.();
      }
    });
    $('btn-locate')?.addEventListener('click', () => void run('locate'));
    $('btn-help')?.addEventListener('click', () => void run('help'));
    $('btn-earth')?.addEventListener('click', () => void run('earth'));
    log('CLI ready · Astranov AI will greet you · ➤ send · 🎙 hands-free', 'dim');
    preview('Talk to Astranov AI…');
    // If AI already loaded (race), ensure presence
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
    toggleHandsfree,
    speakAi,
    stopHandsfree,
    get handsfreeOn() {
      return handsfreeOn;
    },
  };
})(window);
