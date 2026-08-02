#!/usr/bin/env node
/** Game-feel burn: boot budget, modules, pizza path, input, no fatal console */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const URL = process.env.SN_URL || 'https://astranov.eu/';
mkdirSync('screenshots', { recursive: true });
const report = { url: URL, t: new Date().toISOString(), fails: [], ok: [], metrics: {} };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'el-GR',
  geolocation: { latitude: 36.4341, longitude: 28.2176 },
  permissions: ['geolocation'],
  userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 AstranovGameFeel/1.0',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGE:' + e.message.slice(0, 180)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 180));
});

const t0 = Date.now();
const res = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
report.metrics.http = res?.status();
report.metrics.domMs = Date.now() - t0;

// wait interactive CLI
let readyMs = null;
try {
  await page.waitForFunction(() => !!(window.SNCli && window.SNAi && document.getElementById('cli-in')), {
    timeout: 45000,
  });
  readyMs = Date.now() - t0;
} catch {
  report.fails.push('modules not ready in 45s');
}
report.metrics.readyMs = readyMs;

try {
  const coach = page.locator('#coach-ok');
  if (await coach.isVisible({ timeout: 1500 })) await coach.click();
} catch {}

const snap = await page.evaluate(() => {
  const mods = {
    SNCli: !!window.SNCli,
    SNAi: !!window.SNAi,
    SNMarket: !!window.SNMarket,
    SNSpartan: !!window.SNSpartan,
    SNGreeklish: !!window.SNGreeklish,
    SNVendorCrawl: !!window.SNVendorCrawl,
    SNTaskRunner: !!window.SNTaskRunner,
    SNRouting: !!window.SNRouting,
    SNOrderEngine: !!window.SNOrderEngine,
    SNGlobe: !!window.SNGlobe,
    SNField: !!window.SNField,
    SNSkin: !!window.SNSkin,
    skin: document.documentElement.getAttribute('data-sn-skin') || '',
    build: document.querySelector('meta[name="astranov-build"]')?.content || '',
    cliIn: !!document.getElementById('cli-in'),
    panel: !!document.getElementById('panel'),
  };
  let greeklish = null,
    spartan = null,
    food = null;
  try {
    greeklish = window.SNGreeklish?.toEnglishCommand?.('πιτσα');
  } catch (e) {
    greeklish = 'ERR ' + e.message;
  }
  try {
    spartan = window.SNSpartan?.expand?.('pizza');
    if (spartan) spartan = { domain: spartan.domain, steps: (spartan.steps || []).slice(0, 8) };
  } catch (e) {
    spartan = 'ERR ' + e.message;
  }
  try {
    food = window.SNMarket?.parseFoodIntent?.('pizza') || window.SNMarket?.parseFoodIntent?.('order pizza');
  } catch (e) {
    food = 'ERR ' + e.message;
  }
  return { mods, greeklish, spartan, food };
});
report.snap = snap;
if (!snap.mods.SNCli || !snap.mods.cliIn) report.fails.push('CLI missing');
else report.ok.push('cli');
if (!snap.mods.SNMarket) report.fails.push('SNMarket missing');
else report.ok.push('market');
if (!String(snap.greeklish || '').includes('pizza')) report.fails.push('greeklish pizza: ' + snap.greeklish);
else report.ok.push('greeklish');

async function runCmd(cmd) {
  await page.locator('#cli-in').fill(cmd);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2800);
  return page.evaluate(() => (document.getElementById('cli-log')?.innerText || '').slice(-500));
}

const cmds = ['locate me', 'pizza', 'thelo pizza', 'pou eimai'];
report.cmdLogs = {};
for (const c of cmds) {
  try {
    report.cmdLogs[c] = await runCmd(c);
    report.ok.push('cmd:' + c);
  } catch (e) {
    report.fails.push('cmd ' + c + ': ' + e.message);
  }
}

// rAF hitch sample (game feel)
const hitch = await page.evaluate(async () => {
  return new Promise((resolve) => {
    const samples = [];
    let last = performance.now();
    let n = 0;
    function tick(now) {
      samples.push(now - last);
      last = now;
      n++;
      if (n < 90) requestAnimationFrame(tick);
      else {
        samples.sort((a, b) => a - b);
        const avg = samples.reduce((s, x) => s + x, 0) / samples.length;
        const p95 = samples[Math.floor(samples.length * 0.95)];
        resolve({ avg: Math.round(avg * 10) / 10, p95: Math.round(p95 * 10) / 10, n: samples.length });
      }
    }
    requestAnimationFrame(tick);
  });
});
report.metrics.hitch = hitch;
// > 50ms p95 is sticky on mobile
if (hitch.p95 > 80) report.fails.push('frame hitch p95=' + hitch.p95 + 'ms');
else report.ok.push('frames');

report.errors = errors.slice(0, 25);
report.metrics.errorCount = errors.length;
// fatal module load MIME errors
const fatal = errors.some((e) =>
  /Failed to load module|MIME type "text\/html"|SNCli is not defined|Cannot read propert/i.test(e) &&
  !/favicon|Geolocation|Permissions|net::ERR/i.test(e)
);
if (fatal) report.fails.push('console fatals: ' + errors.filter((e)=>/Failed to load module|MIME|is not defined|Cannot read/i.test(e)).slice(0,3).join(' | '));

await page.screenshot({ path: 'screenshots/game-feel-burn.png' });
writeFileSync('support/GAME-FEEL-BURN.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ fails: report.fails, ok: report.ok, metrics: report.metrics, greeklish: snap.greeklish, skin: snap.mods.skin, build: snap.mods.build }, null, 2));
await browser.close();
process.exit(report.fails.length ? 2 : 0);
