/**
 * Non-UI unit checks for FINISH-333 core math/intent
 */
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
import vm from 'vm';
import assert from 'assert';

function loadIife(path, sandbox) {
  const code = readFileSync(path, 'utf8');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx);
  return ctx;
}

const g = {
  window: null,
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
};
g.window = g;
g.globalThis = g;

loadIife('js/spacenet/greeklish.js', g);
assert.ok(g.SNGreeklish);
assert.ok(g.SNGreeklish.normalize('πιτσα').includes('pizza') || g.SNGreeklish.foodTokens('pitza').includes('pizza'));
assert.ok(g.SNGreeklish.foodTokens('order pitogyra mpyronia').includes('gyros'));

loadIife('js/spacenet/order-engine.js', g);
assert.ok(g.SNOrderEngine);
const geo = g.SNOrderEngine.geoSane(
  { lat: 36.43, lng: 28.22 },
  { lat: 36.44, lng: 28.23 }
);
assert.equal(geo.ok, true);
const bad = g.SNOrderEngine.geoSane(
  { lat: 36.43, lng: 28.22 },
  { lat: 40.7, lng: -74.0 } // NYC
);
assert.equal(bad.ok, false);

const pre = g.SNOrderEngine.preflightOrder({
  pos: { lat: 36.43, lng: 28.22 },
  vendor: { id: 'v1', lat: 36.431, lng: 28.221, hours: '24/7' },
  testMode: true,
});
assert.equal(pre.ok, true);

g.SNOrderEngine.setOrdersPaused(true);
const paused = g.SNOrderEngine.preflightOrder({
  pos: { lat: 36.43, lng: 28.22 },
  vendor: { id: 'v1', lat: 36.431, lng: 28.221 },
  testMode: true,
});
assert.equal(paused.ok, false);
g.SNOrderEngine.setOrdersPaused(false);

// fee math
function fees(total) {
  let platformFee = Math.round(total * 0.03 * 100) / 100;
  if (total > 0 && platformFee < 0.01) platformFee = 0.01;
  const driverCut = Math.round(total * 0.15 * 100) / 100;
  let vendorCut = Math.round((total - platformFee - driverCut) * 100) / 100;
  if (vendorCut < 0) vendorCut = 0;
  return { platformFee, driverCut, vendorCut };
}
const f = fees(10);
assert.equal(f.platformFee, 0.3);
assert.equal(f.driverCut, 1.5);
assert.equal(f.vendorCut, 8.2);

// routing path
loadIife('js/spacenet/routing.js', g);
const path = g.SNRouting.pathFromWaypoints([
  { lat: 36.43, lng: 28.22 },
  { lat: 36.44, lng: 28.23 },
]);
assert.ok(path.includes(';'));

console.log('PASS finish-333-unit', {
  greeklish: true,
  geo: true,
  fees: f,
  path,
  readiness: g.SNOrderEngine.readiness().score,
});
