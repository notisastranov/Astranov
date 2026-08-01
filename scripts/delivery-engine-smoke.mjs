#!/usr/bin/env node
/** Headless smoke: modules load + readiness + optional live OSRM */
import { readFileSync } from 'fs';
import vm from 'vm';

const g = {
  localStorage: {
    _m: {},
    getItem(k) {
      return this._m[k] ?? null;
    },
    setItem(k, v) {
      this._m[k] = String(v);
    },
    removeItem(k) {
      delete this._m[k];
    },
  },
  Date,
  Math,
  JSON,
  console,
  setInterval: () => 0,
  fetch: globalThis.fetch,
  AbortController,
  setTimeout, clearTimeout, setInterval, clearInterval,
  performance: { now: () => Date.now() },
  SN_CONFIG: {
    routing: {
      osrmBase: '',
      useGateway: false,
      publicFallback: 'https://router.project-osrm.org',
      profile: 'driving',
      timeoutMs: 10000,
    },
  },
};
g.window = g;
g.globalThis = g;

function load(p) {
  vm.runInContext(readFileSync(p, 'utf8'), vm.createContext(g));
}
// load into same context properly
const ctx = vm.createContext(g);
function load2(p) {
  vm.runInContext(readFileSync(p, 'utf8'), ctx);
}
load2('js/spacenet/greeklish.js');
load2('js/spacenet/order-engine.js');
load2('js/spacenet/routing.js');

const R = g.SNOrderEngine.readiness();
console.log('readiness', R.score, R.checks.map((c) => c.id + ':' + c.ok).join(' '));

const rt = await g.SNRouting.selfTest();
console.log('osrm', rt);

if (!rt.ok) {
  console.error('OSRM smoke fail');
  process.exit(1);
}
console.log('PASS delivery-engine-smoke');
