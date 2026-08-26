/** Astranov SpaceNet mind — trained living OS, not a static app.
 * Paid Grok (XAI_API_KEY) is the tutor until the in-app unit holds the world.
 * Key never leaves the host. Client talks to /api/ai only.
 */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

const MODEL = process.env.XAI_MODEL || 'grok-4-1-fast-non-reasoning';
const FALLBACKS = ['grok-4-1-fast-non-reasoning', 'grok-4', 'grok-3'];

const SYS =
  'You are Grok, the same Grok from xAI. You are the mind of Astranov SpaceNet (astranov.eu). ' +
  'Talk like Grok: sharp, funny, useful. Answer the human. ' +
  'Do not announce kitchens, roads, drivers, or maps unless they asked for food, a place, or a delivery. ' +
  'Never dump HUD manuals. Never invent shops. Owner is Notis Astranov in Rhodes. ' +
  'English default; Greek when they write Greek.';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, apikey, x-client-info');
  res.setHeader('Cache-Control', 'no-store');
}

async function liveEnvelope() {
  try {
    const r = await fetch('https://astranov.eu/investors/budget.json', { cache: 'no-store' });
    const d = await r.json();
    const pkgs = d.packages || [];
    let p1 = 0;
    let p2 = 0;
    let got = Number(d.gathered_keur) || 0;
    pkgs.forEach(function (p) {
      const c = Number(p.capex) || 0;
      if (p.phase === 2) p2 += c;
      else p1 += c;
      got += Number(p.raised) || 0;
    });
    const sn = Number((d.complete && d.complete.spacenet_keur) || d.spacenet_keur || 7000);
    const left = Math.max(0, p1 + sn - got);
    return (
      'LIVE envelope: remaining to complete SpaceNet + Phase 1 = €' +
      (left / 1000).toFixed(2) +
      'M (SpaceNet €' +
      (sn / 1000).toFixed(2) +
      'M + Phase 1 €' +
      (p1 / 1000).toFixed(2) +
      'M). Gathered €' +
      (got / 1000).toFixed(2) +
      'M. Phase 2 held out €' +
      (p2 / 1000).toFixed(2) +
      'M. Land extra. Not a quote.'
    );
  } catch (_) {
    return '';
  }
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

async function grokChat(key, messages, model) {
  const r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.8,
      max_tokens: 1200,
    }),
  });
  const j = await r.json().catch(function () {
    return {};
  });
  const text = String(
    (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) ||
      j.text ||
      ''
  ).trim();
  return { ok: r.ok && !!text, status: r.status, text: text, usage: j.usage || {}, error: j.error || j.message, model: model };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method === 'GET') {
    let keyed = !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
    let where = keyed ? 'vercel-env' : 'none';
    if (!keyed) {
      try {
        const r = await fetch(SB + '/functions/v1/aicycle', {
          headers: { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON },
        });
        const j = await r.json().catch(function () {
          return {};
        });
        if (j && j.secrets && j.secrets.XAI_API_KEY) {
          keyed = true;
          where = 'supabase-aicycle';
        }
      } catch (_) {}
    }
    res.status(200).json({
      ok: true,
      via: 'spacexai-grok',
      model: MODEL,
      keyed: keyed,
      keyWhere: where,
      usdInPerM: 3,
      usdOutPerM: 15,
      eurPerUsd: 0.92,
      markup: 3,
      asof: '2026-08-21',
      role: 'Trained SpaceNet mind · live envelopes + taught lessons',
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const body = readBody(req);
  const message = String(body.message || body.text || body.q || body.prompt || '').slice(0, 4000);
  if (!message) {
    res.status(400).json({ ok: false, error: 'empty' });
    return;
  }
  body.message = message;

  const owner = !!body.owner || !!body.force_paid;
  const gift = body.gift !== false;
  const allow = owner || gift || !!body.allow_paid || true;
  body.allow_paid = true;
  body.gift = gift;
  body.force_paid = true;

  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const live = await liveEnvelope();
  const taught = Array.isArray(body.lessons)
    ? body.lessons
        .slice(-8)
        .map(function (x) {
          return typeof x === 'string' ? x : x && x.text;
        })
        .filter(Boolean)
        .join(' · ')
    : '';
  const sys = [String(body.system || SYS).slice(0, 3500), live, taught ? 'Taught: ' + taught.slice(0, 1200) : '']
    .filter(Boolean)
    .join(' ');
  const messages = [{ role: 'system', content: sys.slice(0, 6000) }];
  history.forEach(function (h) {
    if (!h || !h.content) return;
    messages.push({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.content).slice(0, 800),
    });
  });
  messages.push({ role: 'user', content: message });

  if (key) {
    const models = [body.model, MODEL].concat(FALLBACKS).filter(Boolean);
    const seen = {};
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      if (seen[m]) continue;
      seen[m] = true;
      try {
        const g = await grokChat(key, messages, m);
        if (g.ok) {
          res.status(200).json({
            ok: true,
            text: g.text,
            via: 'xai-grok',
            paid: true,
            model: g.model,
            usage: g.usage,
            owner: owner,
            gift: gift,
          });
          return;
        }
      } catch (e) {}
    }
  }

  try {
    const r = await fetch(SB + '/functions/v1/aicycle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_ANON,
        Authorization: req.headers.authorization || 'Bearer ' + SB_ANON,
      },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(function () {
      return { ok: false, error: 'bad json' };
    });
    if (j && (j.text || j.response)) {
      res.status(r.status).json(j);
      return;
    }
  } catch (_) {}

  res.status(503).json({
    ok: false,
    error: key ? 'grok-failed' : 'XAI_API_KEY missing on host',
    text: key
      ? 'Paid mind is keyed but xAI did not answer. Say it again.'
      : 'Paid mind is not keyed on the host. Owner: set Vercel env XAI_API_KEY.',
  });
};
