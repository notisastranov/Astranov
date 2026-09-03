/** SpaceNet vendor + menu fill. OSM/web for names. Leaflet photo for dishes. Never invent a shop. */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';
const UA = 'AstranovSpaceNet/1 (+https://astranov.eu)';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Cache-Control', 'no-store');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

function slimShop(row) {
  if (!row || !row.name || !isFinite(Number(row.lat))) return null;
  const out = {
    id: String(row.id || '').slice(0, 64),
    kind: 'shop',
    name: String(row.name).slice(0, 80),
    lat: Number(row.lat),
    lng: Number(row.lng),
    raw: String(row.raw || row.note || '').slice(0, 200),
    phone: String(row.phone || '').slice(0, 32),
    hours: String(row.hours || '').slice(0, 160),
    note: String(row.note || '').slice(0, 240),
    web: String(row.web || '').slice(0, 240),
    email: String(row.email || '').slice(0, 80),
    open: String(row.open || ''),
    source: String(row.source || 'crawler').slice(0, 24),
    flag: String(row.flag || 'crawled').slice(0, 24),
    peer: 'spacenet',
    auto: 1,
    t: Date.now(),
  };
  if (row.cover && /^https?:\/\//i.test(row.cover)) out.cover = String(row.cover).slice(0, 400);
  if (row.cover && String(row.cover).indexOf('data:image') === 0 && row.cover.length < 180000) out.cover = row.cover;
  if (Array.isArray(row.dishes) && row.dishes.length) {
    out.dishes = row.dishes.slice(0, 24).map(function (d) {
      return {
        name: String((d && (d.name || d.desc)) || '').slice(0, 80),
        price: Number(d && d.price) || 0,
        hours: String((d && d.hours) || out.hours || '').slice(0, 40),
        stock0: Number(d && (d.stock0 != null ? d.stock0 : d.stock)) || 20,
        stock: Number(d && d.stock) || 20,
        photo: typeof (d && d.photo) === 'string' && d.photo.length < 180000 ? d.photo : '',
        sample: !!(d && d.sample),
      };
    }).filter(function (d) { return d.name; });
    out.menu = out.dishes.map(function (d) { return d.name + ' — ' + d.price; }).join('\n');
  }
  if (!out.id) {
    const slug = out.name.toLowerCase().replace(/[^a-z0-9\u0370-\u03ff]+/g, '').slice(0, 18);
    out.id = 'c' + slug + out.lat.toFixed(4) + out.lng.toFixed(4);
  }
  return out;
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

async function putListing(row) {
  const shop = slimShop(row);
  if (!shop) return { ok: false };
  const put = await sb('sn_listings?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: shop.id,
      kind: 'shop',
      lat: shop.lat,
      lng: shop.lng,
      body: shop,
      updated_at: new Date().toISOString(),
    }),
  });
  return { ok: put.ok, status: put.status, shop: shop };
}

async function grab(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(function () { ctl.abort(); }, ms || 8000);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json,text/html' }, signal: ctl.signal });
    return await r.text();
  } catch (_) {
    return '';
  } finally {
    clearTimeout(t);
  }
}

async function findNear(lat, lng, q) {
  const places = [];
  const seen = {};
  function add(list) {
    (list || []).forEach(function (p) {
      if (!p || !p.name || !isFinite(+p.lat)) return;
      const k = (+p.lat).toFixed(4) + '|' + (+p.lng).toFixed(4);
      if (seen[k]) return;
      seen[k] = 1;
      places.push(p);
    });
  }
  const around =
    '[out:json][timeout:12];(' +
    'nwr(around:5000,' + lat + ',' + lng + ')["name"]["amenity"~"restaurant|fast_food|cafe|bar|pub|pharmacy"];' +
    'nwr(around:5000,' + lat + ',' + lng + ')["name"]["shop"~"supermarket|convenience|bakery"];' +
    ');out center tags 24;';
  try {
    const txt = await grab('https://overpass.kumi.systems/api/interpreter?data=' + encodeURIComponent(around), 14000);
    const j = JSON.parse(txt || '{}');
    add((j.elements || []).map(function (e) {
      const c = e.center || e;
      const t = e.tags || {};
      return {
        name: t.name,
        lat: Number(c.lat),
        lng: Number(c.lon || c.lng),
        raw: [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(' '),
        phone: t.phone || t['contact:phone'] || '',
        hours: t.opening_hours || '',
        web: t.website || t['contact:website'] || '',
        cover: t.image || '',
      };
    }));
  } catch (_) {}
  if (q) {
    try {
      const txt = await grab(
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&extratags=1&q=' +
          encodeURIComponent(q),
        8000
      );
      add((JSON.parse(txt || '[]') || []).map(function (r) {
        const x = r.extratags || {};
        return {
          name: r.name || String(r.display_name || '').split(',')[0],
          lat: Number(r.lat),
          lng: Number(r.lon),
          raw: r.display_name || '',
          phone: x.phone || x['contact:phone'] || '',
          hours: x.opening_hours || '',
          web: x.website || '',
        };
      }));
    } catch (_) {}
  }
  return places.slice(0, 8);
}

async function enrichOne(req, p) {
  try {
    const host = req.headers.host || 'astranov.eu';
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const r = await fetch(proto + '://' + host + '/api/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: p.name, place: p.raw, lat: p.lat, lng: p.lng, website: p.web || '' }),
    });
    const j = await r.json().catch(function () { return {}; });
    const dishes = (j.items || j.dishes || []).map(function (d) {
      return { name: d.name, price: d.price, sample: !!d.sample, photo: d.photo || '' };
    });
    return {
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      raw: p.raw || j.note || '',
      phone: j.phone || p.phone || '',
      hours: j.hours || p.hours || '',
      web: j.web || p.web || '',
      email: j.email || '',
      cover: j.cover || p.cover || '',
      dishes: dishes,
      source: 'crawler',
      flag: 'crawled',
    };
  } catch (_) {
    return Object.assign({ source: 'crawler', flag: 'crawled', dishes: [] }, p);
  }
}

function parseJsonBlock(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (_) { return null; }
}

async function readLeaflet(image, hint) {
  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!key) return { ok: false, error: 'no-key' };
  const sys =
    'You read a printed restaurant or shop leaflet / menu photo for Astranov SpaceNet. ' +
    'Return ONE JSON object only. Never invent a price that is not visible. ' +
    'If a price is unreadable, omit that dish or set sample=true. ' +
    '{"name":"shop name if printed","phone":"","hours":"","note":"address if printed","dishes":[{"name":"","price":0,"sample":false}]}';
  const body = {
    model: process.env.XAI_MODEL || 'grok-4',
    temperature: 0.1,
    max_tokens: 1400,
    messages: [
      { role: 'system', content: sys },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Read this leaflet. Hint: ' + String(hint || 'shop menu') + '.' },
          { type: 'image_url', image_url: { url: image } },
        ],
      },
    ],
  };
  const r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(function () { return {}; });
  const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  const parsed = parseJsonBlock(text);
  if (!parsed) return { ok: false, error: 'unreadable', raw: String(text).slice(0, 200) };
  const dishes = (parsed.dishes || parsed.items || []).map(function (d) {
    return {
      name: String((d && d.name) || '').slice(0, 80),
      price: Number(d && d.price) || 0,
      sample: !!(d && d.sample) || !(Number(d && d.price) > 0),
      hours: String((d && d.hours) || parsed.hours || ''),
      stock: 20,
      stock0: 20,
    };
  }).filter(function (d) { return d.name; }).slice(0, 24);
  return {
    ok: true,
    name: String(parsed.name || '').slice(0, 80),
    phone: String(parsed.phone || '').slice(0, 32),
    hours: String(parsed.hours || '').slice(0, 160),
    note: String(parsed.note || '').slice(0, 240),
    dishes: dishes,
    source: 'leaflet',
    flag: 'leaflet',
  };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method === 'GET') {
    const q = req.query || {};
    const lat = Number(q.lat);
    const lng = Number(q.lng);
    if (!isFinite(lat) || !isFinite(lng)) {
      res.status(400).json({ ok: false, error: 'lat lng' });
      return;
    }
    req.body = { lat: lat, lng: lng, q: q.q || '' };
  } else if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const b = readBody(req);
  const leaflet = typeof b.leaflet === 'string' && b.leaflet.indexOf('data:image') === 0 ? b.leaflet : '';
  if (leaflet) {
    if (leaflet.length > 900000) {
      res.status(413).json({ ok: false, error: 'leaflet too large' });
      return;
    }
    const read = await readLeaflet(leaflet, [b.name, b.place].filter(Boolean).join(' '));
    if (!read.ok) {
      res.status(200).json({ ok: false, error: read.error || 'unreadable' });
      return;
    }
    const shop = {
      id: String(b.id || ''),
      name: read.name || b.name || 'Shop',
      lat: Number(b.lat),
      lng: Number(b.lng),
      raw: b.place || read.note || '',
      phone: read.phone || '',
      hours: read.hours || '',
      note: read.note || '',
      dishes: read.dishes,
      cover: leaflet.length < 180000 ? leaflet : '',
      source: 'leaflet',
      flag: 'leaflet',
    };
    if (!isFinite(shop.lat) || !isFinite(shop.lng)) {
      res.status(200).json({ ok: true, local: true, shop: read, dishes: read.dishes.length });
      return;
    }
    const put = await putListing(shop);
    res.status(200).json({ ok: true, via: 'leaflet', saved: put.ok, shop: put.shop || slimShop(shop), dishes: read.dishes.length });
    return;
  }

  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const q = String(b.q || b.name || '').slice(0, 80);
  if (!isFinite(lat) || !isFinite(lng)) {
    res.status(400).json({ ok: false, error: 'lat lng or leaflet' });
    return;
  }

  const found = await findNear(lat, lng, q);
  const out = [];
  const cap = Math.min(found.length, 6);
  for (let i = 0; i < cap; i++) {
    const row = await enrichOne(req, found[i]);
    const put = await putListing(row);
    if (put.shop) out.push(put.shop);
  }
  res.status(200).json({ ok: true, via: 'crawler', count: out.length, shops: out });
};
