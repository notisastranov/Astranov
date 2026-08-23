/** Google Map Tiles API session + optional tile proxy.
 * Official Earth imagery for SNGlobe (planet / country / city / ocean).
 * Key stays on the host: set Vercel env GOOGLE_MAPS_KEY
 *   (Map Tiles API enabled + billing). Never commit the key.
 *
 * GET /api/gtiles            → { ok, session, template } or { needsKey: true }
 * GET /api/gtiles?z=&x=&y=   → proxy one satellite JPEG (key never in the page)
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Cache-Control', 'no-store');
}

function key() {
  return (
    process.env.GOOGLE_MAPS_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.MAPS_API_KEY ||
    ''
  ).trim();
}

var cache = { session: '', expiry: 0, key: '' };

async function createSession(k) {
  var now = Date.now() / 1000;
  if (cache.session && cache.key === k && now < cache.expiry - 120) return cache;
  var r = await fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(k), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mapType: 'satellite',
      language: 'en-US',
      region: 'GR',
      imageFormat: 'jpeg',
    }),
  });
  var j = await r.json().catch(function () {
    return {};
  });
  if (!r.ok || !j.session) {
    var msg =
      (j.error && (j.error.message || j.error.status)) ||
      ('google session ' + r.status);
    var err = new Error(msg);
    err.status = r.status;
    err.body = j;
    throw err;
  }
  cache = {
    session: j.session,
    expiry: Number(j.expiry) || now + 3600,
    key: k,
    tileWidth: j.tileWidth || 256,
  };
  return cache;
}

function googleTileUrl(k, session, z, x, y) {
  return (
    'https://tile.googleapis.com/v1/2dtiles/' +
    z +
    '/' +
    x +
    '/' +
    y +
    '?session=' +
    encodeURIComponent(session) +
    '&key=' +
    encodeURIComponent(k)
  );
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  var k = key();
  if (!k) {
    res.status(200).json({
      ok: false,
      needsKey: true,
      hint: 'Vercel env GOOGLE_MAPS_KEY · enable Map Tiles API + billing · restrict to astranov.eu',
    });
    return;
  }
  var q = req.query || {};
  var z = q.z != null ? q.z : q.Z;
  var x = q.x != null ? q.x : q.X;
  var y = q.y != null ? q.y : q.Y;
  try {
    var s = await createSession(k);
    if (z != null && x != null && y != null) {
      var url = googleTileUrl(k, s.session, z, x, y);
      var img = await fetch(url);
      if (!img.ok) {
        res.status(img.status).json({ ok: false, error: 'tile ' + img.status });
        return;
      }
      var buf = Buffer.from(await img.arrayBuffer());
      res.setHeader('Content-Type', img.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(200).send(buf);
      return;
    }
    res.status(200).json({
      ok: true,
      engine: 'google-map-tiles',
      session: true,
      expiry: s.expiry,
      tileWidth: s.tileWidth,
      attribution: '© Google',
      proxy: '/api/gtiles?z={z}&x={x}&y={y}',
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      error: e && e.message ? e.message : String(e),
      hint: 'Enable Map Tiles API on this key. Photorealistic 3D Tiles are city-only — this session is 2D satellite for the whole globe.',
    });
  }
};
