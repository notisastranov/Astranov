import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('js/spacenet/app.js', 'utf8');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Element {
  constructor(id = '') {
    this.id = id;
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.clientWidth = 390;
    this.classList = {
      values: new Set(),
      add: (...v) => v.forEach((x) => this.classList.values.add(x)),
      remove: (...v) => v.forEach((x) => this.classList.values.delete(x)),
      contains: (v) => this.classList.values.has(v),
    };
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute() {}
  setPointerCapture() {}
  remove() { this.removed = true; }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html || ''; }
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeApp({ returning = false } = {}) {
  const elements = Object.fromEntries(['g', 'city', 'line', 'in', 'f', 'sn-live', 'go', 'plus'].map((id) => [id, new Element(id)]));
  const ctx2d = {
    beginPath() {}, arc() {}, clip() {}, save() {}, restore() {}, fill() {}, stroke() {}, fillRect() {},
    drawImage() {}, fillText() {},
    createRadialGradient() { return { addColorStop() {} }; },
  };
  elements.g.width = 0;
  elements.g.height = 0;
  elements.g.getContext = () => ctx2d;

  let micAsked = 0;
  let gpsAsked = 0;
  const store = new Map();
  if (returning) {
    store.set('sn:paypal-job', JSON.stringify({
      kind: 'find', query: 'pizza', status: 'chosen', how: 'now',
      shop: { name: 'King Pizza', lat: 36.45, lng: 28.22 },
      carrier: { id: 'ours', name: 'Astranov', how: 'now', own: true, eta: 12 },
    }));
  }

  const document = {
    head: new Element('head'),
    body: new Element('body'),
    getElementById: (id) => elements[id] || null,
    createElement: () => new Element(),
    querySelector: () => null,
    addEventListener() {},
  };

  const location = {
    origin: 'https://astranov.eu',
    href: returning ? 'https://astranov.eu/?paypal=success&token=ORDER-12345' : 'https://astranov.eu/',
    search: returning ? '?paypal=success&token=ORDER-12345' : '',
  };

  const fetch = async (url) => {
    const text = decodeURIComponent(String(url));
    if (text.includes('/api/paypal/capture-order')) return response(200, { ok: true, status: 'COMPLETED', avc: 10 });
    if (text.includes('/api/paypal/create-order')) return response(503, { error: 'paypal_not_configured' });
    if (text.includes('/reverse?')) return response(200, { address: { country_code: 'gr' } });
    if (text.includes('nominatim.openstreetmap.org/search')) return response(200, []);
    if (text.includes('office') && text.includes('courier')) {
      return response(200, { elements: [{ type: 'node', id: 9, lat: 36.44, lon: 28.21, tags: { name: 'Rhodes Courier', office: 'courier' } }] });
    }
    if (text.includes('overpass')) {
      return response(200, { elements: [{ type: 'node', id: 1, lat: 36.45, lon: 28.22, tags: { name: 'King Pizza', amenity: 'fast_food', cuisine: 'pizza' } }] });
    }
    if (text.includes('router.project-osrm.org')) return response(200, { routes: [{ duration: 600, geometry: { type: 'LineString', coordinates: [] } }] });
    return response(404, {});
  };

  class FakeImage {
    set src(v) { this._src = v; queueMicrotask(() => this.onload?.()); }
    get src() { return this._src; }
    get width() { return 1024; }
    get height() { return 512; }
  }

  const sandbox = {
    window: null, document, navigator: {
      language: 'en-US',
      vibrate() {},
      mediaDevices: { getUserMedia: async () => { micAsked += 1; return { getTracks: () => [{ stop() {} }] }; } },
      geolocation: { getCurrentPosition: (ok) => { gpsAsked += 1; ok({ coords: { latitude: 36.435, longitude: 28.217 } }); } },
    },
    location, history: { replaceState() {} }, sessionStorage: {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    fetch, Image: FakeImage, URL, URLSearchParams, AbortController,
    Promise, Math, Date, JSON, String, Number, RegExp, Error,
    setTimeout, clearTimeout, queueMicrotask,
    requestAnimationFrame: () => 0,
    addEventListener() {},
    innerWidth: 390, innerHeight: 844, devicePixelRatio: 1,
    isFinite,
  };
  sandbox.window = sandbox;
  vm.runInContext(source, vm.createContext(sandbox));
  return { sandbox, elements, asked: () => ({ micAsked, gpsAsked }) };
}

{
  const app = makeApp();
  await wait(260);
  assert.deepEqual(app.asked(), { micAsked: 1, gpsAsked: 1 }, 'boot asks microphone and GPS');

  await app.sandbox.SN.hunt('pizza');
  await wait(25);
  assert.equal(app.sandbox.SN.state().vendors[0].name, 'King Pizza');
  assert.match(app.elements.line.textContent, /real named places/i);

  app.elements['sn-live'].children[0].onclick();
  assert.deepEqual(app.elements['sn-live'].children.map((b) => b.textContent), ['NOW', 'MAIL', 'PICK UP']);

  app.elements['sn-live'].children[0].onclick();
  await wait(25);
  assert.equal(app.elements['sn-live'].children[0].textContent.startsWith('ASTRANOV'), true);
  assert.equal(app.elements['sn-live'].children.some((b) => /RHODES COURIER/.test(b.textContent)), true);
  assert.equal(app.elements['sn-live'].children.some((b) => /DOORDASH|INSTACART|WALMART/.test(b.textContent)), false);

  app.elements['sn-live'].children[0].onclick();
  assert.deepEqual(app.elements['sn-live'].children.map((b) => b.textContent), ['PAY']);
  app.elements['sn-live'].children[0].onclick();
  await wait(20);
  assert.notEqual(app.sandbox.SN.state().job.status, 'paid', 'failed payment cannot advance order');
  assert.match(app.elements.line.textContent, /not connected/i);
}

{
  const app = makeApp({ returning: true });
  await wait(280);
  assert.equal(app.sandbox.SN.state().job.status, 'paid');
  assert.match(app.elements.line.textContent, /stage: paid/i);
  await wait(50);
  assert.equal(app.sandbox.SN.state().job.status, 'paid', 'stage does not advance without a real update');
}

console.log('PASS SpaceNet V1 boot → real place → fulfill → verified pay state');
