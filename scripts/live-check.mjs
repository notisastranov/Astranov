#!/usr/bin/env node
/** Live probe — modular SpaceNet boot. Exit 1 if critical path is dead. */
const ORIGIN = process.argv[2] || 'https://astranov.eu';
const MUST = [
  [ORIGIN + '/', (t) =>
    t.includes('astranov-build') &&
    t.includes('js/spacenet/boot.js') &&
    t.includes('Astranov')
  ],
  [ORIGIN + '/js/spacenet/boot.js', (t) => t.includes('SNPerf') || t.includes('originsFor')],
  [ORIGIN + '/js/spacenet/globe.js', (t) => t.includes('velX') && t.includes('damp')],
  [ORIGIN + '/js/spacenet/cli.js', (t) => t.includes('SNCli')],
  [ORIGIN + '/js/spacenet/map.js', (t) => t.includes('SNMap') && (t.includes('_ensureP') || t.includes('async function ensure'))],
  [ORIGIN + '/js/spacenet/ui.js', (t) => t.includes('bindCliDrag') || t.includes('cli-drag')],
  [ORIGIN + '/js/spacenet/brain.js', (t) => t.includes('SNBrain') || t.includes('AstranovBrain')],
];

let dead = 0;
for (const [u, ok] of MUST) {
  try {
    const r = await fetch(u, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } });
    const t = await r.text();
    // map check: prefer new lock, accept old ensure during rollout
    const pass = r.status === 200 && (typeof ok === 'function' ? ok(t) : true) && t.length > 100;
    if (!pass) dead++;
    console.log(pass ? 'OK  ' : 'DEAD', r.status, String(t.length).padStart(8), u.replace(ORIGIN, '') || '/');
  } catch (e) {
    dead++;
    console.log('ERR ', u, e.message);
  }
}

const html = await (await fetch(ORIGIN + '/', { cache: 'no-store' })).text();
const build = html.match(/astranov-build" content="([^"]+)/)?.[1];
console.log('\nLIVE BUILD:', build || 'NONE');
console.log('BOOT:', html.includes('js/spacenet/boot.js') ? 'modular spacenet' : 'unknown');

if (dead) {
  console.error('\nLIVE CHECK FAILED — ' + dead + ' dead asset(s). DO NOT finish.');
  process.exit(1);
}
console.log('\nLIVE CHECK PASSED — modular SpaceNet boot reachable.');
process.exit(0);
