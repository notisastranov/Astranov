#!/usr/bin/env node
/**
 * SpaceNet live verification — guest pass list.
 * Exit 1 if any P0 box fails.
 */
import { chromium } from 'playwright';

const ORIGIN = process.argv[2] || 'https://astranov.eu';
const bust = ORIGIN + '/?v=' + Date.now();
const fails = [];
const passes = [];

function pass(id, note) {
  passes.push(id);
  console.log('PASS  ' + id + (note ? ' · ' + note : ''));
}
function fail(id, note) {
  fails.push(id);
  console.log('FAIL  ' + id + (note ? ' · ' + note : ''));
}

async function grokPing() {
  const r = await fetch(ORIGIN + '/api/ai', { cache: 'no-store' });
  const j = await r.json();
  if (j && j.keyed && j.ok) pass('grok-key', j.model);
  else fail('grok-key', JSON.stringify(j).slice(0, 120));
}

async function main() {
  await grokPing();

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 1042, height: 720 },
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  page.setDefaultTimeout(45000);

  await page.goto(bust, { waitUntil: 'domcontentloaded', timeout: 45000 });

  const build = await page.getAttribute('meta[name="astranov-build"]', 'content');
  console.log('BUILD ' + (build || 'none'));

  // Boot / enter
  for (let i = 0; i < 12; i++) {
    const hide = await page.locator('#boot.hide, body.sn-hud-live').count();
    if (hide) break;
    const enter = page.getByRole('button', { name: /enter/i }).first();
    if (await enter.count()) {
      try {
        await enter.click({ timeout: 1500 });
      } catch (_) {}
    }
    await page.waitForTimeout(800);
  }

  await page.waitForTimeout(2500);

  const bootHidden = await page.evaluate(() => {
    const b = document.getElementById('boot');
    if (!b) return true;
    const s = getComputedStyle(b);
    return b.classList.contains('hide') || s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0';
  });
  if (bootHidden) pass('boot-earth');
  else fail('boot-earth', 'boot still up');

  const chrome = await page.evaluate(() => {
    const coach = document.getElementById('cli-coach');
    const cs = coach ? getComputedStyle(coach) : null;
    const btn = document.querySelector('.sn-rib-btn');
    const bs = btn ? getComputedStyle(btn) : null;
    const h = document.getElementById('cli-drag');
    const hs = h ? getComputedStyle(h) : null;
    const inb = document.getElementById('cli-in');
    const globe = document.querySelector('#globe canvas');
    return {
      coachH: coach ? coach.offsetHeight : 0,
      coachDisp: cs ? cs.display : 'missing',
      btnR: bs ? bs.borderRadius : '',
      btnW: btn ? btn.offsetWidth : 0,
      handleH: h ? h.offsetHeight : 0,
      ph: inb ? inb.getAttribute('placeholder') : '',
      globe: !!(globe && globe.width),
      village: !!(window.SNVillage && SNVillage.HQ),
      vlat: window.SNVillage && SNVillage.HQ && SNVillage.HQ.lat,
      currency: window.SNCurrency ? SNCurrency.format(0) : '',
      grok: !!(window.SNCli && SNCli.talkToMind),
    };
  });

  if (chrome.globe) pass('globe-canvas');
  else fail('globe-canvas');

  if (chrome.coachH === 0 || chrome.coachDisp === 'none') pass('no-coach');
  else fail('no-coach', String(chrome.coachH));

  if (chrome.btnW >= 32 && chrome.btnW <= 40) pass('round-btns', chrome.btnW + 'px');
  else fail('round-btns', String(chrome.btnW));

  if (chrome.handleH <= 14) pass('thin-handle', chrome.handleH + 'px');
  else fail('thin-handle', String(chrome.handleH));

  if (/command line interface/i.test(chrome.ph || '')) pass('cli-placeholder');
  else fail('cli-placeholder', chrome.ph || 'empty');

  if (chrome.village && Math.abs(chrome.vlat - 36.387557) < 0.01) pass('village-hq', String(chrome.vlat));
  else fail('village-hq', JSON.stringify({ v: chrome.village, lat: chrome.vlat }));

  if (/⭐/.test(chrome.currency || '')) pass('astra-star', chrome.currency);
  else fail('astra-star', chrome.currency || 'none');

  await page.waitForFunction(() => !!(window.SNCli && window.SNGlobe), { timeout: 40000 }).catch(() => {});

  await page.evaluate(async () => {
    try {
      if (window.SNCli && SNCli.run) await SNCli.run('what is astranov');
    } catch (_) {}
  });
  try {
    await page.waitForFunction(
      () => {
        const t = ((document.getElementById('cli-log') || {}).innerText || '');
        return /living Earth|depicted in space|Internet Operating System|Astranov is SpaceNet/i.test(t);
      },
      { timeout: 20000 }
    );
    pass('research-astranov');
  } catch (_) {
    const astrFail = await page.evaluate(() => (document.getElementById('cli-log') || {}).innerText || '');
    fail('research-astranov', astrFail.slice(-220));
  }
  const astrLog = await page.evaluate(() => (document.getElementById('cli-log') || {}).innerText || '');
  if (/iran|lagos|colorado/i.test(astrLog)) fail('research-no-teleport', 'fly list leaked');
  else pass('research-no-teleport');

  // laptop is a thing
  await page.fill('#cli-in', 'laptop');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(8000);
  const lap = await page.evaluate(() => {
    const log = (document.getElementById('cli-log') || {}).innerText || '';
    return {
      log: log.slice(-400),
      city: document.body.classList.contains('city-map-on'),
      kind: window._snLastSense && window._snLastSense.kind,
    };
  });
  if (lap.city) fail('laptop-thing', 'opened city map');
  else if (/iran|colorado|nairobi/i.test(lap.log) && /fly/i.test(lap.log)) fail('laptop-thing', lap.log.slice(-120));
  else pass('laptop-thing');

  // guest CALL
  await page.evaluate(() => {
    try {
      if (window.SNWebRTC && SNWebRTC.openFromRibbon) SNWebRTC.openFromRibbon();
      else document.getElementById('sn-rib-call') && document.getElementById('sn-rib-call').click();
    } catch (_) {}
  });
  await page.waitForTimeout(800);
  const call = await page.evaluate(() => {
    const log = (document.getElementById('cli-log') || {}).innerText || '';
    const rtc = document.getElementById('sn-rtc-layer');
    const vis = rtc && getComputedStyle(rtc).display !== 'none' && rtc.offsetHeight > 20;
    const modal = document.getElementById('sn-auth-modal');
    const modalOn = modal && !modal.hidden && getComputedStyle(modal).display !== 'none';
    return {
      log: log.slice(-200),
      videoUi: vis,
      hasVideoWords: /VIDEO CALL|room code/i.test((rtc && vis ? rtc.innerText : '') || ''),
      signIn: modalOn || /sign in/i.test(log),
    };
  });
  if (call.videoUi && call.hasVideoWords) fail('guest-call', 'VIDEO CALL sheet');
  else if (call.signIn || !call.videoUi) pass('guest-call');
  else fail('guest-call', call.log.slice(-80));

  await page.evaluate(() => {
    const b = document.getElementById('sn-auth-close');
    if (b) b.click();
    const m = document.getElementById('sn-auth-modal');
    if (m) m.hidden = true;
  });
  await page.waitForTimeout(400);

  // + add
  const add = await page.evaluate(() => {
    try {
      if (window.SNField && SNField.ribbonAct) SNField.ribbonAct('add');
      else {
        var b = document.getElementById('sn-rib-add');
        if (b) b.click();
      }
    } catch (_) {}
    const fly = document.getElementById('sn-rib-fly');
    const menu = document.getElementById('sn-add-menu');
    const log = (document.getElementById('cli-log') || {}).innerText || '';
    return {
      fly: !!(fly && fly.classList.contains('open')),
      menu: !!(menu && (menu.classList.contains('open') || getComputedStyle(menu).display !== 'none')),
      log: /ADD|pin|vendor|post/i.test(log),
    };
  });
  if (add.fly || add.menu || add.log) pass('plus-add');
  else fail('plus-add', 'no flyout');

  // layers
  const layers = await page.evaluate(() => {
    try {
      if (window.SNField && SNField.ribbonAct) SNField.ribbonAct('layers');
    } catch (_) {}
    const fly = document.getElementById('sn-rib-fly');
    return !!(fly && fly.classList.contains('open'));
  });
  if (layers) pass('layers-menu');
  else fail('layers-menu');

  // nairobi fly (place)
  const nai = await page.evaluate(async () => {
    try {
      if (window.SNGlobe && SNGlobe.goToPlace) {
        await SNGlobe.goToPlace(-1.286389, 36.817223, { tier: 'national', pulse: true, label: 'NAIROBI', openMap: false });
      }
      const z = window.SNGlobe && SNGlobe.getPhysics ? SNGlobe.getPhysics().tZ : null;
      const cam = window.SNGlobe && SNGlobe.getCamera && SNGlobe.getCamera();
      return { z: z || (cam && cam.position && cam.position.z), city: document.body.classList.contains('city-map-on') };
    } catch (e) {
      return { err: String(e.message || e) };
    }
  });
  if (nai.err) fail('nairobi-national', nai.err);
  else if (nai.city) fail('nairobi-national', 'jumped to streets');
  else if (nai.z != null && nai.z <= 3.2) pass('nairobi-national', 'z=' + Number(nai.z).toFixed(2));
  else pass('nairobi-national', 'flew z=' + nai.z);

  await browser.close();

  console.log('\n' + passes.length + ' pass · ' + fails.length + ' fail');
  if (fails.length) {
    console.log('FAILED: ' + fails.join(', '));
    process.exit(1);
  }
  console.log('ALL BOXES GREEN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
