/** SpaceNet driver applications. Only the architect approves. */
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
function slimApp(row, email) {
  const name = String((row && row.name) || '').slice(0, 80);
  const phone = String((row && row.phone) || '').slice(0, 32);
  const lat = Number(row && row.lat);
  const lng = Number(row && row.lng);
  if (!name || !phone || !isFinite(lat)) return null;
  const id = String((row && row.id) || ('drv-' + Date.now().toString(36))).slice(0, 64);
  return {
    id: id, kind: 'driver', name: name, lat: lat, lng: isFinite(lng) ? lng : 0,
    phone: phone, email: String(email || (row && row.email) || '').slice(0, 80),
    routes: String((row && row.routes) || '').slice(0, 200),
    vehicles: String((row && row.vehicles) || '').slice(0, 120),
    hours: String((row && row.hours) || '').slice(0, 120),
    range: String((row && row.range) || '').slice(0, 40),
    carry: String((row && row.carry) || '').slice(0, 120),
    pref: String((row && row.pref) || '').slice(0, 160),
    peer: String((row && row.peer) || '').slice(0, 40),
    place: String((row && (row.place || row.raw)) || '').slice(0, 160),
    presence: 'pending', approved: false, flag: 'driver-apply', t: Date.now(),
  };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const user = await userOf(req);
  const email = user ? String(user.email).toLowerCase() : '';
  const isOwner = email && email === architect();

  if (req.method === 'GET') {
    const q = req.query || {};
    if (q.me) {
      if (!email) { res.status(401).json({ ok: false, need: 'login' }); return; }
      if (isOwner) { res.status(200).json({ ok: true, owner: true, approved: true, canSeeTasks: true }); return; }
      const got = await sb('sn_listings?kind=eq.driver&select=id,body,updated_at&order=updated_at.desc&limit=80');
      let approved = false, pending = false;
      (got.json || []).forEach(function (row) {
        const b = row.body || {};
        if (String(b.email || '').toLowerCase() === email || String(b.peer || '') === String(q.peer || '')) {
          if (b.approved === true || b.approved === 1 || b.approved === '1') approved = true;
          else pending = true;
        }
      });
      res.status(200).json({ ok: true, owner: false, approved: approved, pending: pending, canSeeTasks: approved });
      return;
    }
    if (!isOwner) { res.status(403).json({ ok: false, error: 'owner' }); return; }
    const got = await sb('sn_listings?kind=eq.driver&select=id,lat,lng,body,updated_at&order=updated_at.desc&limit=80');
    const apps = (got.json || []).map(function (row) {
      const b = row.body || {};
      return {
        id: b.id || row.id, name: b.name, phone: b.phone, email: b.email,
        vehicles: b.vehicles, hours: b.hours, routes: b.routes, place: b.place,
        lat: row.lat, lng: row.lng,
        approved: !!(b.approved === true || b.approved === 1 || b.approved === '1'),
        presence: b.presence || 'pending', t: b.t,
      };
    });
    res.status(200).json({ ok: true, apps: apps });
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const body = readBody(req);

  if (body.decide) {
    if (!isOwner) { res.status(403).json({ ok: false, error: 'owner' }); return; }
    const id = String(body.id || '').slice(0, 64);
    if (!id) { res.status(400).json({ ok: false, error: 'id' }); return; }
    const got = await sb('sn_listings?id=eq.' + encodeURIComponent(id) + '&select=id,kind,lat,lng,body');
    const row = (got.json && got.json[0]) || null;
    if (!row) { res.status(404).json({ ok: false, error: 'missing' }); return; }
    const next = Object.assign({}, row.body || {});
    next.approved = !!body.yes;
    next.presence = body.yes ? 'present' : 'off';
    next.flag = body.yes ? 'driver-ok' : 'driver-no';
    await sb('sn_listings?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: id, kind: 'driver', lat: Number(row.lat), lng: Number(row.lng), body: next, updated_at: new Date().toISOString() }),
    });
    res.status(200).json({ ok: true, approved: !!body.yes, id: id, name: next.name, phone: next.phone, email: next.email });
    return;
  }

  if (!email) { res.status(401).json({ ok: false, need: 'login', error: 'Sign in with Google first.' }); return; }
  const app = slimApp(body.row || body, email);
  if (!app) { res.status(400).json({ ok: false, error: 'Need name, telephone, and a pin.' }); return; }
  app.approved = false;
  app.presence = 'pending';
  const put = await sb('sn_listings?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: app.id, kind: 'driver', lat: app.lat, lng: app.lng, body: app, updated_at: new Date().toISOString() }),
  });
  res.status(200).json({ ok: put.ok, pending: true, id: app.id, notice: 'Application is with Notis. You work after he signs the contract.' });
};
