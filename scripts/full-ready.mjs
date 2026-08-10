#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

const runs = [
  ['poly', 'node', ['/workspace/scripts/poly-regression.mjs']],
  ['mission', 'node', ['/workspace/scripts/mission-regression.mjs']],
];
const results = {};
let pass = true;
for (const [name, cmd, args] of runs) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 180000 });
  results[name] = { status: r.status, out: (r.stdout || '').slice(-800) };
  if (r.status !== 0) pass = false;
}
const report = {
  pass,
  at: new Date().toISOString(),
  results,
  product: 'Astranov SpaceNet Operating System',
  gates: ['poly-regression', 'mission-regression'],
};
writeFileSync('/workspace/screenshots/READY.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);
