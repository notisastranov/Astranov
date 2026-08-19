/** Same-origin mind proxy → Supabase aicycle. Kills Chrome 404 on /api/ai. */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, apikey, x-client-info');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      via: 'astranov-ai',
      usdInPerM: 3,
      usdOutPerM: 15,
      eurPerUsd: 0.92,
      model: 'grok-4.6',
      asof: '2026-08-19',
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }
  try {
    const r = await fetch(SB + '/functions/v1/aicycle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY,
        Authorization: req.headers.authorization || 'Bearer ' + KEY,
      },
      body: JSON.stringify(req.body || {}),
    });
    const j = await r.json().catch(function () {
      return { ok: false, error: 'bad json' };
    });
    res.status(r.status).json(j);
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
};
