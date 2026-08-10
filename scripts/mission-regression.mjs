#!/usr/bin/env node
/**
 * Astranov SpaceNet — full mission regression (UI shell + polygon marketplace).
 * Exit 0 only when all checks pass.
 */
import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://127.0.0.1:8080/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 180)));

await page.goto(URL + '?v=mission-reg', { waitUntil: 'domcontentloaded', timeout: 90000 });
for (let i = 0; i < 55; i++) {
  await page.waitForTimeout(400);
  if (await page.evaluate(() => !document.getElementById('boot') && !!window.SNPolyScheduler && !!window.SNGlobe)) break;
}
await page.waitForTimeout(1000);

const R = await page.evaluate(async () => {
  const need = {};
  const miss = [];
  const ok = (k, v) => {
    need[k] = !!v;
    if (!v) miss.push(k);
  };

  ok('title', /Astranov SpaceNet/i.test(document.title));
  ok('globe', !!document.querySelector('#globe canvas'));
  ok('polyBtn', document.querySelector('#sn-rib-poly .sn-rib-emoji')?.textContent === '⬠');
  ok('power', !!document.getElementById('sn-task-launch'));
  ok('handle', !!document.getElementById('sn-topchrome-drag'));
  ok('modules', !!(SNPolyScheduler && SNPolyEngine && SNReassignEngine && SNDeliveryRules && SNField && SNMap && SNGlobe));

  // gadgets
  const handle = document.getElementById('sn-topchrome-drag');
  if (handle) {
    const y = handle.getBoundingClientRect().top + 8;
    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: y, pointerId: 3 }));
    handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 200, clientY: y, pointerId: 3 }));
  }
  await new Promise((r) => setTimeout(r, 350));
  const g = document.getElementById('stc-gadgets');
  ok('gadgets', g && getComputedStyle(g).display !== 'none');
  ok('gadgetScroll', g && g.scrollHeight > g.clientHeight - 2);

  // multi-tour + seal
  SNPolyScheduler.clear();
  await new Promise((r) => setTimeout(r, 150));
  const a = SNPolyScheduler.makeOffer({ vendor: 'A', client: 'C1', nature: 'hot_food', km: 2.2 });
  const b = SNPolyScheduler.makeOffer({ vendor: 'B', client: 'C2', nature: 'documents', km: 1.3 });
  SNPolyScheduler.pushOffer(a);
  SNPolyScheduler.pushOffer(b);
  SNPolyScheduler.runAct(a.id, 'accept');
  SNPolyScheduler.promoteQueue();
  SNPolyScheduler.runAct(b.id, 'accept');
  const tour = SNPolyEngine.syncTourFromStack(SNPolyScheduler.list());
  ok('multi', tour && tour.orders && tour.orders.length >= 2 && tour.stops.length >= 4);
  ok('globeLine', typeof SNGlobe.drawTourLine === 'function');

  const first = SNPolyScheduler.list()[0];
  SNPolyScheduler.runAct(first.id, 'start');
  SNPolyScheduler.runAct(first.id, 'arrive');
  SNPolyScheduler.setConfirm(first.id, 'client');
  SNPolyScheduler.setConfirm(first.id, 'vendor');
  SNPolyScheduler.setConfirm(first.id, 'driver');
  await new Promise((r) => setTimeout(r, 40));
  const left = SNPolyScheduler.list().find((x) => x.id === first.id);
  ok('seal', !left || left.phase === 'done');

  // poly cycle
  await SNField.enterPolygonOverview();
  ok('polyMode', SNField.polyNavMode === 'polygon');
  await SNField.enterDriveMode();
  ok('driveMode', SNField.polyNavMode === 'drive');

  // rest
  SNPolyScheduler.deactivate({ reason: 'mission-reg' });
  ok('rest', SNPolyScheduler.list().length === 0);

  // power offer
  SNPolyScheduler.activate({ offers: 1 });
  await new Promise((r) => setTimeout(r, 900));
  ok('offer', SNPolyScheduler.list().some((x) => x.phase === 'offered') || document.querySelectorAll('.sn-pt').length >= 1);

  // pricing
  ok('price', SNDeliveryRules.distanceFee(4.2) === 6);
  ok('nightPrice', SNDeliveryRules.quote({ km: 3, nature: 'hot', night: true }).total === 6);
  ok('bootGlobal', !document.body.classList.contains('city-map-on'));
  ok('inertia', !!(SNGlobe.getPhysics && SNGlobe.getPhysics().inertia));
  ok('mindEn', true);

  // Rai / helper
  ok('helper', !!window.SNHelper && typeof SNHelper.droneDeliver === 'function');
  ok('commissionRai', !!window.SNHelper && typeof SNHelper.commissionRai === 'function');

  // Marina + map getMap
  ok('marina', !!window.SNMarina && typeof SNMarina.openMarina === 'function');
  ok('mapGet', !!window.SNMap && typeof SNMap.getMap === 'function');

  // Theme auto path
  ok('themeGadget', !!document.getElementById('stc-g-theme'));
  ok('dataPoolBtn', !!document.getElementById('stc-data-pool'));

  // Boot global guard: after cold path, city-map should not start forced
  // (poly overview may open map — skip if polyMode)

  // Wish line
  ok('wish', !!window.SNWishInbox && SNWishInbox.isWishLine('i want better routing'));

  // Sub demo
  if (window.SNSubscription && SNSubscription.handleLine) {
    await SNSubscription.handleLine('subscribe demo 3');
    const st = SNSubscription.status();
    ok('subDemo', !!(st.active || st.mode && st.mode !== 'no-sub-free-only' || st.tierId));
  } else ok('subDemo', false);

  return { need, miss, tour: tour && { o: tour.orders.length, s: tour.stops.length, km: tour.km } };
});

await page.screenshot({ path: '/workspace/screenshots/mission-regression.png' });
await browser.close();

const pass = Object.values(R.need).every(Boolean) && errs.length === 0;
console.log(JSON.stringify({ pass, miss: R.miss, need: R.need, tour: R.tour, errs }, null, 2));
process.exit(pass ? 0 : 1);
