#!/usr/bin/env node
/**
 * Pioneer user burn — act like untrained customer on live astranov.eu
 * No UI redesign. Collect failures for mission fixes.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const URL = process.env.SN_URL || 'https://astranov.eu/';
const OUT = '/workspace/astranov/screenshots';
mkdirSync(OUT, { recursive: true });

const report = { url: URL, t: new Date().toISOString(), steps: [], fails: [], ok: [] };

function note(step, data) {
  report.steps.push({ step, ...data, at: Date.now() });
  const tag = data.fail ? 'FAIL' : 'OK';
  console.log(tag, step, data.msg || data.error || '');
  if (data.fail) report.fails.push({ step, ...data });
  else report.ok.push(step);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'el-GR',
  geolocation: { latitude: 36.4341, longitude: 28.2176 }, // Rhodes
  permissions: ['geolocation'],
  userAgent:
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 AstranovPioneer/1.0',
});
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
});
page.on('pageerror', (e) => consoleErrors.push('PAGE: ' + String(e.message).slice(0, 200)));

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  // dismiss coach if present
  try {
    const coach = page.locator('#coach-ok');
    if (await coach.isVisible({ timeout: 2000 })) await coach.click();
  } catch (_) {}
  await page.waitForTimeout(2000);

  const boot = await page.evaluate(() => ({
    title: document.title,
    panel: !!document.getElementById('panel'),
    cliIn: !!document.getElementById('cli-in'),
    SNCli: !!window.SNCli,
    SNAi: !!window.SNAi,
    SNMarket: !!window.SNMarket,
    SNSpartan: !!window.SNSpartan,
    SNGreeklish: !!window.SNGreeklish,
    SNVendorCrawl: !!window.SNVendorCrawl,
    SNTaskRunner: !!window.SNTaskRunner,
    SNMap: !!window.SNMap,
    SNGlobe: !!window.SNGlobe,
    build: document.querySelector('meta[name="astranov-build"]')?.content || '',
  }));
  note('boot', {
    fail: !boot.panel || !boot.cliIn,
    msg: JSON.stringify(boot),
  });
  if (!boot.SNCli) {
    // wait longer for boot waves
    await page.waitForTimeout(8000);
    const boot2 = await page.evaluate(() => ({
      SNCli: !!window.SNCli,
      SNAi: !!window.SNAi,
      SNMarket: !!window.SNMarket,
      SNGreeklish: !!window.SNGreeklish,
      SNSpartan: !!window.SNSpartan,
      err: window.__snBootErr || null,
    }));
    note('boot-retry', { fail: !boot2.SNCli, msg: JSON.stringify(boot2) });
  }

  async function typeCmd(cmd) {
    const input = page.locator('#cli-in');
    await input.click({ timeout: 5000 });
    await input.fill(cmd);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3500);
  }

  async function logTail() {
    return page.evaluate(() => {
      const log = document.getElementById('cli-log');
      if (!log) return '';
      return (log.innerText || log.textContent || '').slice(-800);
    });
  }

  // Customer scenarios
  const cmds = [
    'hello',
    'pou eimai',
    'πιτσα',
    'thelo pizza',
    'magazia',
    'spartan',
    'ready score',
    'cancel',
  ];

  for (const c of cmds) {
    try {
      await typeCmd(c);
      const tail = await logTail();
      const dead =
        !tail ||
        /undefined is not|is not a function|TypeError|failed to fetch module|MIME type/i.test(tail);
      note('cmd:' + c, {
        fail: dead && c !== 'hello',
        msg: tail.slice(-280).replace(/\s+/g, ' '),
      });
    } catch (e) {
      note('cmd:' + c, { fail: true, error: String(e.message || e) });
    }
  }

  // Module API probes (customer intent via AI)
  const api = await page.evaluate(async () => {
    const out = {};
    try {
      out.greeklish = window.SNGreeklish?.toEnglishCommand?.('θέλω πίτσα');
    } catch (e) {
      out.greeklishErr = String(e.message || e);
    }
    try {
      out.spartan = window.SNSpartan?.expand?.('pizza');
    } catch (e) {
      out.spartanErr = String(e.message || e);
    }
    try {
      if (window.SNAi?.ask) {
        out.aiPizza = String(await window.SNAi.ask('pizza')).slice(0, 160);
      } else out.aiPizza = null;
    } catch (e) {
      out.aiErr = String(e.message || e);
    }
    try {
      if (window.SNMarket?.parseFoodIntent) {
        out.foodIntent = window.SNMarket.parseFoodIntent('πιτσα');
      }
    } catch (e) {
      out.foodErr = String(e.message || e);
    }
    try {
      out.pos = window._snLastPos || null;
    } catch (_) {}
    return out;
  });
  note('api-probe', {
    fail: !api.greeklish || !String(api.greeklish).includes('pizza'),
    msg: JSON.stringify(api).slice(0, 500),
  });

  await page.screenshot({ path: OUT + '/pioneer-burn-mobile.png', fullPage: false });
  note('screenshot', { fail: false, msg: OUT + '/pioneer-burn-mobile.png' });
} catch (e) {
  note('fatal', { fail: true, error: String(e.message || e) });
  try {
    await page.screenshot({ path: OUT + '/pioneer-burn-fail.png' });
  } catch (_) {}
}

report.consoleErrors = consoleErrors.slice(0, 40);
report.summary = {
  fails: report.fails.length,
  oks: report.ok.length,
};

writeFileSync('/workspace/astranov/support/PIONEER-BURN-REPORT.json', JSON.stringify(report, null, 2));
console.log('\nSUMMARY fails', report.fails.length, 'oks', report.ok.length);
console.log('console errors', consoleErrors.length);
await browser.close();
process.exit(report.fails.length ? 2 : 0);
