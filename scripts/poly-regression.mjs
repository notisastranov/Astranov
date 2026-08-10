#!/usr/bin/env node
/**
 * Polygon delivery marketplace regression — run anytime.
 * Exit 0 only if multi-tour + 3× seal + power path pass.
 */
import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://127.0.0.1:8080/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message || e)));

await page.goto(URL + '?v=poly-reg', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 50; i++) {
  await page.waitForTimeout(400);
  const ok = await page.evaluate(
    () => !document.getElementById('boot') && !!window.SNPolyScheduler && !!window.SNPolyEngine
  );
  if (ok) break;
}
await page.waitForTimeout(800);

const R = await page.evaluate(async () => {
  const S = SNPolyScheduler;
  const E = SNPolyEngine;
  const D = SNDeliveryRules;
  const out = { checks: {}, detail: {} };

  out.detail.price3 = D.distanceFee(3);
  out.detail.price4 = D.distanceFee(4.2);
  out.checks.pricing = out.detail.price3 === 3 && out.detail.price4 === 6;

  S.clear();
  S.activate({ offers: 0 });
  const a = S.makeOffer({ vendor: 'A', client: 'C1', nature: 'hot_food', km: 2 });
  const b = S.makeOffer({ vendor: 'B', client: 'C2', nature: 'documents', km: 1.2 });
  S.pushOffer(a);
  S.pushOffer(b);
  S.runAct(a.id, 'accept');
  S.promoteQueue();
  S.runAct(b.id, 'accept');
  const claimed = S.list().filter((x) => x.phase === 'claimed').length;
  const tour = E.syncTourFromStack(S.list());
  out.detail.multi = { claimed, orders: tour && tour.orders.length, stops: tour && tour.stops.length };
  out.checks.multiTour = claimed >= 2 && tour && tour.orders.length >= 2 && tour.stops.length >= 4;

  S.clear();
  const o = S.makeOffer({ vendorName: 'Seal', clientName: 'Buyer', km: 2.5, nature: 'hot' });
  S.pushOffer(o);
  S.runAct(o.id, 'accept');
  S.runAct(o.id, 'start');
  S.runAct(o.id, 'arrive');
  S.setConfirm(o.id, 'client');
  S.setConfirm(o.id, 'vendor');
  S.setConfirm(o.id, 'driver');
  const left = S.list().find((x) => x.id === o.id);
  out.detail.seal = left ? left.phase : 'gone';
  out.checks.tripleSeal = out.detail.seal === 'done' || out.detail.seal === 'gone';
  out.checks.archive = (S.archive() || []).length >= 1;

  S.deactivate({ reason: 'reg' });
  out.checks.restClear = S.list().length === 0;

  S.activate({ offers: 1 });
  await new Promise((r) => setTimeout(r, 1000));
  out.checks.powerOffer = S.list().some((x) => x.phase === 'offered') || document.querySelectorAll('.sn-pt').length >= 1;
  out.checks.tileNames = /VENDOR|CLIENT|pickup|drop/i.test(document.querySelector('.sn-pt')?.innerText || '');

  // Drive progress advances while underway
  S.clear();
  await new Promise((r) => setTimeout(r, 200));
  const d = S.makeOffer({ vendorName: 'Drive', clientName: 'You', km: 2, nature: 'hot' });
  S.pushOffer(d);
  S.runAct(d.id, 'accept');
  S.runAct(d.id, 'start');
  const p0 = (S.list().find((x) => x.id === d.id) || {}).progress || 0;
  await new Promise((r) => setTimeout(r, 2000));
  const p1 = (S.list().find((x) => x.id === d.id) || {}).progress || 0;
  out.detail.drive = { p0, p1 };
  out.checks.driveProgress = p1 > p0;

  // Private ice cream cannot combine with pizza
  const ice = D.capacityCheck([{ nature: 'hot', title: 'pizza' }], {
    nature: 'ice cream',
    title: 'ice cream',
    private: true,
  });
  out.detail.privateExclusive = ice;
  out.checks.privateExclusive = ice && ice.ok === false;

  return out;
});

await page.screenshot({ path: '/workspace/screenshots/poly-regression.png' });
await browser.close();

const pass = Object.values(R.checks).every(Boolean) && errs.length === 0;
console.log(JSON.stringify({ R, errs, pass }, null, 2));
process.exit(pass ? 0 : 1);
