module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  const q = String((req.query && req.query.q) || '').trim().slice(0, 120);
  if (!q) {
    res.status(400).json({ ok: false, error: 'empty' });
    return;
  }
  const url =
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&sp=EgIQAQ%3D%3D';
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.8',
      },
    });
    const html = await r.text();
    const seen = {};
    const items = [];
    const re = /"videoId":"([A-Za-z0-9_-]{11})".{0,480}?"text":"([^"\\]{2,160})"/g;
    let m;
    while ((m = re.exec(html)) && items.length < 8) {
      if (seen[m[1]]) continue;
      seen[m[1]] = 1;
      items.push({
        id: m[1],
        title: m[2].replace(/\\u0026/g, '&').replace(/\\"/g, '"'),
        channel: 'YouTube',
        duration: 0,
      });
    }
    if (!items.length) {
      const re2 = /\/watch\?v=([A-Za-z0-9_-]{11})/g;
      while ((m = re2.exec(html)) && items.length < 8) {
        if (seen[m[1]]) continue;
        seen[m[1]] = 1;
        items.push({ id: m[1], title: q, channel: '', duration: 0 });
      }
    }
    res.status(200).json({ ok: items.length > 0, items, q });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e && e.message ? e.message : e) });
  }
};
