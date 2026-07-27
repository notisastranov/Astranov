#!/usr/bin/env node
/**
 * FAIL-CLOSED live probe for SpaceNet clean stack.
 * Exit 0 only if index + critical /js/spacenet/* are real JS (not SPA HTML).
 * Run before every ship: node scripts/probe-spacenet-boot.mjs
 */
const BASE = process.argv[2] || 'https://astranov.eu';
const CRITICAL = [
  'boot.js',
  'config.js',
  'brain.js',
  'globe.js',
  'tasks.js',
  'profiles.js',
  'currency.js',
  'field.js',
  'commerce.js',
  'spatial.js',
  'cli.js',
  'ui.js',
  'tile.js',
  'map.js',
];

function isHtml(t) {
  const h = (t || '').trimStart().slice(0, 64);
  return h.startsWith('<!') || h.includes('data-dpl-id') || /<!DOCTYPE\s+html/i.test(h);
}

async function get(path) {
  const u = BASE.replace(/\/$/, '') + path;
  const r = await fetch(u, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  const t = await r.text();
  return { u, status: r.status, t, ct: r.headers.get('content-type') || '' };
}

let dead = 0;
const html = await get('/');
const build = html.t.match(/astranov-build" content="([^"]+)/)?.[1] || '?';
console.log('BUILD', build);
if (html.status !== 200 || !html.t.includes('/js/spacenet/boot.js')) {
  console.log('DEAD index missing boot.js');
  dead++;
} else {
  console.log('OK   index → boot.js');
}

for (const name of CRITICAL) {
  const path = `/js/spacenet/${name}?v=${encodeURIComponent(build)}`;
  try {
    const { status, t, ct } = await get(path);
    const htmlish = isHtml(t);
    const jsish =
      !htmlish &&
      status === 200 &&
      t.length > 80 &&
      (ct.includes('javascript') || ct.includes('text/plain') || /function|const |var /.test(t.slice(0, 200)));
    if (!jsish) {
      dead++;
      console.log('DEAD', status, String(t.length).padStart(7), name, htmlish ? 'HTML!' : ct);
    } else {
      console.log('OK  ', status, String(t.length).padStart(7), name);
    }
  } catch (e) {
    dead++;
    console.log('ERR ', name, e.message);
  }
}

// three not required from same origin
if (dead) {
  console.error('\nPROBE FAIL — ' + dead + ' dead. DO NOT SHIP.');
  process.exit(1);
}
console.log('\nPROBE PASS — critical spacenet modules are JS.');
process.exit(0);
