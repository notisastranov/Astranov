/** Google Map Tiles — proxies the Supabase gtiles function.
 * Key lives in Supabase Edge secrets (GOOGLE_MAPS_API_KEY). Not Vercel.
 */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  var q = req.query || {};
  var u = new URL(SB + '/functions/v1/gtiles');
  if (q.z != null) u.searchParams.set('z', String(q.z));
  if (q.x != null) u.searchParams.set('x', String(q.x));
  if (q.y != null) u.searchParams.set('y', String(q.y));
  try {
    var r = await fetch(u.toString(), {
      headers: { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON },
    });
    var ct = r.headers.get('content-type') || '';
    if (ct.indexOf('image/') === 0) {
      var buf = Buffer.from(await r.arrayBuffer());
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.status(r.status).send(buf);
      return;
    }
    var j = await r.json().catch(function () {
      return { ok: false, error: 'gtiles ' + r.status };
    });
    res.status(200).json(j);
  } catch (e) {
    res.status(200).json({
      ok: false,
      where: 'supabase-secret',
      error: e && e.message ? e.message : String(e),
    });
  }
};
