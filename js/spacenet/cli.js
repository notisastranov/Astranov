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
    log('MAP   rodos · city · fly <city> · global · shops · locate', 'ok');
    log('ADD   ribbon ➕ · pin · targets · video · vendor · social · emergency', 'ok');
    log('TOPO  measure · measure topo · clear targets · clear pin', 'dim');
    log('EARTH g_satellite · g_hybrid · g_terrain · google key in SN_CONFIG.layers', 'dim');
    log('SPACE go to mars|moon|jupiter|europa · thesis · vault · cosmos', 'ok');
    log('SPACENET  GLOBAL → NATIONAL → REGIONAL → CITY (tap globe to dive)', 'ok');
    log('ZOOM  solar · global · national · regional · city · spacenet', 'ok');
    log('GLOBE  single-tap dive · double-tap zoom out · no blue rings', 'dim');
    log('FIND  crawl <poi> · fly athens · fly rhodes', 'ok');
    log('TILE  me · vendors · cart · order', 'ok');
    log('FIRST list shop · menu add · order me · drive on · deliver me · first delivery', 'ok');
    log('DATA  usage · usage export · handoff', 'dim');
    log('FIELD radar · resources · mine on|off · donate on|off', 'ok');
    log('MONEY S · rate · wallet · finance  (primary; fiat/crypto secondary)', 'ok');
    log('WORK  job · date · deliver · task list', 'dim');
    log('SYS   login · clear · verify · help', 'dim');
    log('FREE  free mind · teach Q => A · free export  (own AI · no paid xAI)', 'ok');
    log('SIM   sim live · 33 agents Rhodes · all output on this CLI', 'ok');
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
      if (low === 'brain' || low === 'memory') {
        dumpBrain('summary');
        return;
      }
      // 33 SPECS agents swarm
      if (/^sim\b/.test(low)) {
        const Sim = global.SNSim33;
        if (!Sim) {
          log('Sim-33 loading · hard refresh', 'err');
          return;
        }
        if (low === 'sim' || low === 'sim status') {
          const st = Sim.status();
          log(
            'Sim-33 · RHODES · ' +
              (st.running ? 'LIVE' : 'stopped') +
              ' · ok ' +
              st.stats.ok +
              ' · fail ' +
              st.stats.fail +
              ' · taught ' +
              st.stats.taught +
              ' · t' +
              st.stats.ticks,
            st.running ? 'ok' : 'dim'
          );
          log('Focus: Rhodes Island, Greece · Old Town · Lindos · Faliraki…', 'dim');
          log('12 clients · 8 vendors · 8 drivers · 5 ambassadors', 'dim');
          if (st.stats.last) log('Last · ' + st.stats.last, 'dim');
          preview(st.running ? 'RHODES · SIM LIVE' : 'SIM OFF');
          if (Sim.showLive) Sim.showLive();
          return;
        }
        if (low === 'sim start' || low === 'sim on' || low === 'sim live') {
          try {
            localStorage.setItem('sn:sim-auto', '1');
            localStorage.setItem('sn:sim-watch', '1');
          } catch (_) {}
          if (Sim.showLive) Sim.showLive();
          else Sim.start({ ms: 5500 });
          // Super TX continues on CLI lines only — no floating deck
          return;
        }
        if (/^sim\s+speed/.test(low)) {
          const ms = parseInt(low.replace(/\D+/g, ''), 10) || 5500;
          if (Sim.setSpeed) Sim.setSpeed(ms);
          else log('Sim speed needs hard refresh', 'err');
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
        if (low === 'sim stop' || low === 'sim off') {
          try {
            localStorage.setItem('sn:sim-auto', '0');
          } catch (_) {}
          Sim.stop();
          return;
        }
        if (low === 'sim wipe') {
          Sim.wipe();
          return;
        }
        if (/^sim\s+burst/.test(low)) {
          const n = parseInt(low.replace(/\D+/g, ''), 10) || 33;
          await Sim.burst(n);
          return;
        }
        if (low === 'sim fast') {
          Sim.stop();
          Sim.start({ fast: true });
          return;
        }
        log('sim start|stop|status|wipe|burst 33|fast', 'dim');
        return;
      }
      // SpaceNet Free mind — own free AI (no paid xAI)
      if (
        low === 'free mind' ||
        low === 'free ai' ||
        low === 'spacenet free' ||
        low === 'mind status' ||
        low === 'mind'
      ) {
        const st = global.SNFreeMind?.status?.() || {};
        log('── SpaceNet Free (own AI) ──', 'ok');
        log(
          'Learned ' +
            (st.learned || 0) +
            ' · seeds ' +
            (st.seeds || 0) +
            ' · answers ' +
            (st.stats && st.stats.answers != null ? st.stats.answers : 0),
          'ok'
        );
        log('No paid xAI required · users grow me: teach FACT or teach Q => A', 'dim');
        log('Export trainset: free export · then open fine-tune later', 'dim');
        preview('SpaceNet Free · teach to grow');
        global.SNGlobe?.setHud?.('SPACENET FREE');
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
      // Food: listen → find → fly/zoom · open tile · next | show all (AI path)
      if (
        global.SNMarket?.parseFoodIntent?.(line) &&
        !/^(list\s+shop|menu\s+add|order\s+me|drive\s+on|first\s+delivery)/i.test(low)
      ) {
        if (global.SNAi?.ask) {
          const reply = await SNAi.ask(line);
          if (reply) {
            log(reply, 'ok');
            preview(String(reply).slice(0, 80));
            try {
              if (handsfreeOn && hfSpeakOut && reply) speakAi(reply);
            } catch (_) {}
          }
        } else {
          const fi = global.SNMarket.parseFoodIntent(line);
          const r = await global.SNMarket.fulfillFoodIntent(fi, { autoOrder: false, quiet: true });
          if (r?.reply) log(r.reply, r.ok ? 'ok' : 'err');
          else log(r?.error || 'food path failed', 'err');
        }
        return;
      }
      // First marketplace loop + usage (SpaceNet coaches the same path)
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
        speakAi('SpaceNet voice test.', 'test');
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
          global.SNField?.setRadarExpanded?.(true);
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
        Globe?.goToTier?.('global');
        log('SPACENET · GLOBAL Earth', 'ok');
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
        await global.SNAuth?.toggle?.();
        return;
      }
      if (low === 'logout' || low === 'signout' || low === 'sign out') {
        if (global.SNAuth?.user) await global.SNAuth.signOut();
        log('Signed out', 'dim');
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
      // View switches: training default = Rodos city map; CLI can leave anytime
      if (
        low === 'rodos' ||
        low === 'rhodes' ||
        low === 'rhodes city' ||
        low === 'rodos city' ||
        low === 'fly rhodes' ||
        low === 'fly rodos' ||
        low === 'view rhodes' ||
        low === 'view rodos'
      ) {
        const lat = 36.4341;
        const lng = 28.2176;
        Tasks?.setPos?.(lat, lng);
        global._snLastPos = { lat, lng };
        try {
          Globe?.setBody?.('earth');
          Globe?.goToPlace?.(lat, lng, { tier: 'city', body: 'earth', pulse: false, label: 'Rhodes' });
        } catch (_) {}
        await global.SNMap?.open?.(lat, lng);
        log('Surface · Rodos city map · switch: global · fly athens · fly london', 'ok');
        preview('Rodos city map');
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
        log('Surface · GLOBAL globe · type rodos or fly <city> for city map', 'ok');
        preview('GLOBAL Earth');
        return;
      }
      if (low === 'city' || low === 'map' || low === 'street' || low === 'city map') {
        // City map at last focus — default Rhodes when focus unset
        const p =
          Tasks?.pos ||
          global._snLastPos ||
          { lat: 36.4341, lng: 28.2176 };
        if (p.lat) Tasks?.setPos?.(p.lat, p.lng);
        try {
          Globe?.goToPlace?.(p.lat, p.lng, { tier: 'city', body: 'earth', pulse: false });
        } catch (_) {}
        await global.SNMap?.open?.(p.lat, p.lng);
        log(
          'City map · ' +
            Number(p.lat).toFixed(3) +
            ',' +
            Number(p.lng).toFixed(3) +
            ' · global to leave',
          'ok'
        );
        preview('City map');
        return;
      }
      if (low === 'shops' || low === 'vendors' || low === 'stores') {
        // AI presents first vendor on globe + tile; next / show all continue
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
        log(n ? n + ' shops · tap target' : 'No shops near focus', n ? 'ok' : 'dim');
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
      // fly <city> → open that city's street map (leave Rodos training surface)
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
        await global.SNMap?.open?.(lat, lng);
        log('City map · ' + label + ' · global for globe · rodos for Rhodes', 'ok');
        preview(label);
      }
      for (const [name, ll] of Object.entries(CITIES)) {
        if (new RegExp('^(fly\\s+)?' + name + '$', 'i').test(low) || low === 'fly ' + name) {
          await openCityAt(ll[0], ll[1], name);
          return;
        }
      }
      if (/^fly\s+/.test(low)) {
        const name = low.replace(/^fly\s+/, '').trim();
        if (/^rhodes$|^rodos$/.test(name)) {
          await openCityAt(36.4341, 28.2176, 'Rhodes');
          return;
        }
        const ll = CITIES[name.replace(/\s+/g, '')] || CITIES[name];
        if (ll) {
          await openCityAt(ll[0], ll[1], name);
        } else if (global.SNSearch?.geocode) {
          preview('Finding · ' + name);
          const places = await SNSearch.geocode(name);
          if (places?.[0]) {
            const p = places[0];
            await openCityAt(p.lat, p.lng, String(p.name || name).slice(0, 40));
          } else if (global.SNCosmos?.resolve?.(name)) {
            global.SNMap?.close?.();
            await global.SNCosmos.go(name);
          } else log('Unknown · fly athens · fly rodos · global', 'dim');
        } else log('Unknown place · fly athens · fly rodos · global', 'dim');
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

      // Freeform → SpaceNet (must talk + act; coaches first shop/delivery)
      preview('SpaceNet…');
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
          preview(reply.replace(/^SpaceNet\s*[·:.-]\s*/i, '').slice(0, 80));
          // Speak only if user enabled voice on (never unprompted)
          try {
            if (handsfreeOn && hfSpeakOut && reply) speakAi(reply);
          } catch (_) {}
          return;
        }
      }
      log('SpaceNet loading… try: first delivery · locate · shops', 'dim');
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
  /**
   * Speak-out is OFF by default. AI must not talk unprompted.
   * User enables with "voice on".
   */
  let hfSpeakOut = false;
  let voicesReady = false;
  const VOICE_KEY = 'sn:tts-speak-v1';

  try {
    // Never auto-resume babble from a previous session
    if (localStorage.getItem(VOICE_KEY) === '1') {
      /* user previously enabled — still default silent until hands-free */
      hfSpeakOut = false;
    }
  } catch (_) {}

  function setHandsfreeUi(on, label) {
    // Ribbon is the only hands-free control (bottom bar removed)
    const btns = [$('btn-handsfree'), $('sn-rib-hf')].filter(Boolean);
    btns.forEach((btn) => {
      btn.classList.toggle('on', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on ? 'SPACENET LISTENING · tap AI to stop' : 'AI · SPACENET LISTENING';
    });
    if (label) preview(label);
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
   * Speak SpaceNet text — ONLY when user enabled speak-out (voice on).
   * force='test' allows one-shot voice test / voice-on confirm.
   * Never speaks on boot or unprompted.
   */
  function speakAi(text, force) {
    // Only speak if user enabled voice, or this is an explicit voice test
    if (force !== 'test' && !hfSpeakOut) return;
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
        .replace(/[🎙➤⋮🏠🎯]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 280);
      if (!clean) return;
      synth.cancel();
      muteMic(Math.min(20000, 2200 + clean.length * 55));
      try {
        if (speechRec) speechRec.abort();
      } catch (_) {}
      const lang = /^el/i.test(navigator.language || '') ? 'el-GR' : navigator.language || 'en-US';
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang;
      u.rate = 0.96;
      u.pitch = 1.05; // slightly softer than default male robot
      u.volume = 0.92;
      const voice = pickVoice(lang);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang || lang;
      }
      u.onend = () => {
        muteMic(1400);
        if (handsfreeOn && !hfBusy) scheduleListenRestart(1400);
      };
      u.onerror = (ev) => {
        try {
          log('Voice error · ' + ((ev && ev.error) || 'speak failed'), 'dim');
        } catch (_) {}
        muteMic(600);
        if (handsfreeOn && !hfBusy) scheduleListenRestart(900);
      };
      setTimeout(function () {
        try {
          synth.resume();
          synth.speak(u);
        } catch (e) {
          log('Could not speak · ' + (e.message || e), 'err');
        }
      }, 80);
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
        setHandsfreeUi(true, 'SPACENET LISTENING');
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
      stopHandsfree('SPACENET OFF');
      try {
        if (global.SNAi && SNAi.listeningOff) SNAi.listeningOff();
        else {
          log('SPACENET OFF', 'dim');
          preview('SPACENET OFF');
          global.SNGlobe?.setHud?.('SPACENET OFF');
        }
      } catch (_) {
        log('SPACENET OFF', 'dim');
      }
      return;
    }
    // Always brief greet first — LISTEN priority (even if mic fails)
    try {
      if (global.SNAi && SNAi.listeningOn) SNAi.listeningOn();
      else {
        log('SPACENET LISTENING', 'ok');
        preview('SPACENET LISTENING');
        global.SNGlobe?.setHud?.('SPACENET LISTENING');
      }
    } catch (_) {
      log('SPACENET LISTENING', 'ok');
      preview('SPACENET LISTENING');
    }
    if (!global.isSecureContext && location.hostname !== 'localhost') {
      log('Mic needs HTTPS · type pizza · shops · next', 'dim');
      return;
    }
    if (!SR) {
      log('Type pizza · shops · next · show all', 'dim');
      preview('SPACENET LISTENING');
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
      setHandsfreeUi(true, 'SPACENET LISTENING');
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
            // Speak brief reply only if user turned voice on
            if (hfSpeakOut) {
              const hist = global.SNAi?.history;
              const last = hist && hist[hist.length - 1];
              if (last && last.role === 'assistant') {
                speakAi(String(last.content).slice(0, 120));
              }
            }
          } catch (e) {
            log('Voice · ' + (e.message || e), 'err');
          } finally {
            hfBusy = false;
            if (hfSpeakOut) muteMic(2500);
            else if (handsfreeOn) scheduleListenRestart(1000);
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
    // Keep speak-out OFF unless user already said "voice on"
    killSpeech();
    hfRunTimes = [];
    muteMic(800);
    setHandsfreeUi(true, 'SPACENET LISTENING');
    warmVoices();
    try {
      speechRec.start();
      try {
        if (global.SNUsage?.track) SNUsage.track('handsfree_on', { speakOut: !!hfSpeakOut });
      } catch (_) {}
      // Greeting already logged as SPACENET LISTENING
    } catch (e) {
      // Stay "listening" for typed CLI even if mic start fails
      log('Mic soft-fail · type pizza · next · show all', 'dim');
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
    // Edge buttons may be hidden — ribbon owns tools; keep aliases if present
    $('btn-locate')?.addEventListener('click', () => void run('locate'));
    $('btn-help')?.addEventListener('click', () => void run('help'));
    $('btn-earth')?.addEventListener('click', () => void run('earth'));
    // Home button → SNHome menu (not direct earth); earth via menu or CLI
    log('CLI ready · ribbon · 🎙 · Astranov SpaceNet menu for roles', 'dim');
    preview('Talk to SpaceNet…');
    warmVoices();
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
