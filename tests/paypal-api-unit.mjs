import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const createOrder = require('../api/paypal/create-order.js');
const captureOrder = require('../api/paypal/capture-order.js');

function res() {
  return {
    code: 0, body: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(n) { this.code = n; return this; },
    json(v) { this.body = v; return this; },
    end() { return this; },
  };
}

function reply(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

process.env.PAYPAL_CLIENT_ID = 'client';
process.env.PAYPAL_CLIENT_SECRET = 'secret';
process.env.PAYPAL_MODE = 'sandbox';

{
  let sent;
  global.fetch = async (url, init = {}) => {
    if (String(url).endsWith('/v1/oauth2/token')) return reply(200, { access_token: 'token' });
    sent = JSON.parse(init.body);
    return reply(201, { id: 'ORDER12345', links: [{ rel: 'approve', href: 'https://paypal.test/approve' }] });
  };
  const out = res();
  await createOrder({ method: 'POST', body: { amount: 10, origin: 'https://evil.example', reference: 'King Pizza' } }, out);
  assert.equal(out.code, 200);
  assert.equal(out.body.ok, true);
  assert.equal(sent.application_context.return_url, 'https://astranov.eu/?paypal=success');
  assert.equal(sent.purchase_units[0].amount.currency_code, 'EUR');
}

{
  global.fetch = async (url) => {
    if (String(url).endsWith('/v1/oauth2/token')) return reply(200, { access_token: 'token' });
    return reply(201, {
      id: 'ORDER12345',
      purchase_units: [{ payments: { captures: [{ id: 'CAP1', status: 'COMPLETED', amount: { value: '10.00', currency_code: 'EUR' } }] } }],
    });
  };
  const out = res();
  await captureOrder({ method: 'POST', body: { orderId: 'ORDER12345' } }, out);
  assert.equal(out.code, 200);
  assert.deepEqual({ ok: out.body.ok, eur: out.body.eur, avc: out.body.avc, status: out.body.status }, { ok: true, eur: 10, avc: 10, status: 'COMPLETED' });
}

{
  let calls = 0;
  global.fetch = async (url) => {
    if (String(url).endsWith('/v1/oauth2/token')) return reply(200, { access_token: 'token' });
    calls += 1;
    if (calls === 1) return reply(422, { name: 'UNPROCESSABLE_ENTITY' });
    return reply(200, {
      id: 'ORDER12345',
      purchase_units: [{ payments: { captures: [{ id: 'CAP1', status: 'COMPLETED', amount: { value: '10.00', currency_code: 'EUR' } }] } }],
    });
  };
  const out = res();
  await captureOrder({ method: 'POST', body: { orderId: 'ORDER12345' } }, out);
  assert.equal(out.code, 200, 'capture retry reads an already captured order');
  assert.equal(out.body.status, 'COMPLETED');
}

console.log('PASS PayPal create, safe return, capture, and idempotent recovery');
