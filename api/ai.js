/** Astranov SpaceNet mind — paid Grok (XAI_API_KEY) until the in-app unit is trained.
 * Key never leaves the host. Client talks to /api/ai only.
 */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

const MODEL = process.env.XAI_MODEL || 'grok-4-1-fast-non-reasoning';
const FALLBACKS = ['grok-4-1-fast-non-reasoning', 'grok-4', 'grok-3'];

const SYS =
  'You are Grok (SpaceXAI) acting as the live mind of Astranov SpaceNet (https://astranov.eu) until the in-app unit is trained enough to take over. ' +
  'SpaceNet is an internet OS depicted in space: research, calls, orders, harbors live as pins and glowing ARC beams on Earth. ' +
  'Answer in the CLI: short, true, useful. If you do not know, say so and search by asking for a place or a thing. ' +
  'Never invent a kitchen, a shop, or a street. Never dump HUD instructions. Never fly the globe for a non-place question. ' +
  'Owner is Notis Astranov (Rhodes). Currency is Astra coins ⭐ (1⭐ = 1€). ' +
  'English default; Greek when the user writes Greek. Match the user. 1–3 sentences unless they ask for more.';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, apikey, x-client-info');
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
      temperature: 0.4,
      max_tokens: 700,
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
      role: 'Grok is the SpaceNet mind until the unit is trained',
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
  const messages = [{ role: 'system', content: String(body.system || SYS).slice(0, 4000) }];
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
