/** SpaceNet pay-now. Customer AV€ pays vendor + driver immediately. */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Cache-Control', 'no-store');
}
function architect() {
  return String(process.env.ARCHITECT_EMAIL || 'notisastranov@gmail.com').toLowerCase();
}
function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}
function bearer(req) {
  var h = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
  var m = h.match(/^Bearer\s+(\S+)/i);
  return m ? m[1] : '';
}
async function userOf(req) {
  var t = bearer(req);
  if (!t || t.length < 20) return null;
  try {
    var r = await fetch(SB + '/auth/v1/user', { headers: { apikey: SB_ANON, Authorization: 'Bearer ' + t } });
    if (!r.ok) return null;
    var u = await r.json().catch(function () { return null; });
    return u && u.email ? u : null;
  } catch (_) {
    return null;
  }
}
async function sb(path, opt) {
  const headers = Object.assign(
    { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' },
    (opt && opt.headers) || {}
  );
  const r = await fetch(SB + '/rest/v1/' + path, Object.assign({}, opt, { headers }));
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  return { ok: r.ok, status: r.status, json: json, text: text };
}
function walletId(email) {
  return ('w-' + String(email || '').toLowerCase().replace(/[^a-z0-9@._-]/g, '').slice(0, 48)).slice(0, 64);
}
function money(n) {
  n = Math.round(Number(n || 0) * 100) / 100;
  return n > 0 ? n : 0;
}
async function getWallet(email) {
  email = String(email || '').toLowerCase();
  if (!email || email.indexOf('@') < 0) return null;
  const id = walletId(email);
  const got = await sb('sn_listings?id=eq.' + encodeURIComponent(id) + '&select=id,body');
  const row = got.json && got.json[0];
  const body = (row && row.body) || { kind: 'wallet', email: email, avc: 0, ledger: [] };
  body.kind = 'wallet';
  body.email = email;
  body.avc = money(body.avc);
  body.ledger = Array.isArray(body.ledger) ? body.ledger.slice(-40) : [];
  return { id: id, body: body };
}
async function putWallet(w) {
  if (!w) return;
  w.body.t = Date.now();
  await sb('sn_listings?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: w.id, kind: 'wallet', lat: 0, lng: 0, body: w.body, updated_at: new Date().toISOString(),
    }),
  });
}
function line(kind, n, note, orderId) {
  return { kind: kind, avc: n, note: String(note || '').slice(0, 160), orderId: String(orderId || '').slice(0, 64), t: Date.now() };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const user = await userOf(req);
  const email = user ? String(user.email).toLowerCase() : '';
  if (!email) { res.status(401).json({ ok: false, need: 'login' }); return; }

  if (req.method === 'GET') {
    const w = await getWallet(email);
    res.status(200).json({ ok: true, email: email, avc: w ? w.body.avc : 0, ledger: w ? w.body.ledger : [] });
    return;
  }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const body = readBody(req);

  if (body.action === 'reload') {
    const n = money(body.avc || body.eur);
    if (!n) { res.status(400).json({ ok: false, error: 'amount' }); return; }
    const w = await getWallet(email);
    w.body.avc = money(w.body.avc + n);
    w.body.ledger.push(line('reload', n, 'PayPal to SpaceNet AV€', body.orderId));
    await putWallet(w);
    res.status(200).json({ ok: true, avc: w.body.avc });
    return;
  }

  if (body.action !== 'settle') { res.status(400).json({ ok: false, error: 'action' }); return; }
  const goods = money(body.goods);
  const ride = money(body.ride);
  const fee = money(body.fee != null ? body.fee : Math.round((goods + ride) * 0.03 * 100) / 100);
  const total = money(goods + ride + fee);
  if (!total) { res.status(400).json({ ok: false, error: 'zero' }); return; }
  const vendorEmail = String(body.vendorEmail || '').toLowerCase();
  const driverEmail = String(body.driverEmail || '').toLowerCase();
  const orderId = String(body.orderId || ('p' + Date.now().toString(36))).slice(0, 64);

  const cust = await getWallet(email);
  if (cust.body.avc < total) cust.body.avc = 0;
  else cust.body.avc = money(cust.body.avc - total);
  cust.body.ledger.push(line('pay', -total, 'Order ' + orderId + ' shop ' + goods + ' ride ' + ride, orderId));
  await putWallet(cust);

  let vendorAvc = 0;
  if (vendorEmail && goods) {
    const vw = await getWallet(vendorEmail);
    vw.body.avc = money(vw.body.avc + goods);
    vw.body.ledger.push(line('goods', goods, 'Paid now from customer SpaceNet AV€', orderId));
    await putWallet(vw);
    vendorAvc = vw.body.avc;
  }
  let driverAvc = 0;
  if (driverEmail && ride) {
    const dw = await getWallet(driverEmail);
    dw.body.avc = money(dw.body.avc + ride);
    dw.body.ledger.push(line('ride', ride, 'Paid now from customer SpaceNet AV€', orderId));
    await putWallet(dw);
    driverAvc = dw.body.avc;
  }
  if (fee) {
    const ow = await getWallet(architect());
    ow.body.avc = money(ow.body.avc + fee);
    ow.body.platform = money((ow.body.platform || 0) + fee);
    ow.body.ledger.push(line('fee', fee, 'SpaceNet 3%', orderId));
    await putWallet(ow);
  }

  res.status(200).json({ ok: true, instant: true, orderId: orderId, goods: goods, ride: ride, fee: fee, customerAvc: cust.body.avc, vendorAvc: vendorAvc, driverAvc: driverAvc });
};
