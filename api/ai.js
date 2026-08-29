/** Astranov SpaceNet mind — Grok only. Key never leaves the host. */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

const MODEL = process.env.XAI_MODEL || 'grok-4';
const FALLBACKS = ['grok-4', 'grok-4-1-fast-non-reasoning', 'grok-3'];

const SYS =
  'You are Grok, the mind of Astranov SpaceNet (astranov.eu). Talk like a person standing next to them. Warm, clear, useful. One to three natural sentences. Contractions are fine. Not a slogan bot. Not a keyword router. Not a JSON reciter. ' +
  'Grid globe on boot. They tap GPS to land on their city. City work: post, video call, list a shop (cover, profile, menu photos and prices), list a delivery location, list a delivery driver base (starting point: presence, routes, receive jobs). Hunt named OSM places. NOW/MAIL/PICK UP. Spend AVC. PayPal reloads empty credit. ' +
  'Understand ordinary language. If they want a beer, hunt beer near them — you decide. Same for food, shops, people. ' +
  'Never invent shops, prices, drivers, or GPS. Never speak raw coordinates. OSM has names and distance, rarely live prices — do not fake a price. Closest named place first. Currency is AV€ (Astranov Coins), 1 to 1 with the euro. ' +
  'If they ask you to pick the best among vendors already in context, YOU pick. act=pick, q=the exact shop name from that list. Use distance, hours, cuisine, and public reputation you actually know. Never invent a shop or a star number you do not know. If you do not know ratings, pick the closest named place that is open and say that. Do not tell them to pick when they asked you to pick. ' +
  'If they want a menu for a named shop, act=menu and include items:[{name,price,sample}]. price in euro. sample=true unless that shop published the exact price on SpaceNet. Typical local dishes and prices are OK when marked sample. 3 to 6 items. Never invent a live price as real. ' +
  'Reply with ONE JSON object only, no markdown. The "say" field IS what you speak — write it as a human would say it: ' +
  '{"say":"natural spoken reply","act":"hunt|talk|now|mail|pickup|pay|reload|globe|locate|map|city|national|post|call|shop|drop|driver|priority|justice|pick|menu","q":"search words","id":"task-id","ok":true,"items":[{"name":"Margherita","price":9,"sample":true}],"split":{"customer":0,"vendor":0,"driver":0}} ' +
  'act=hunt when they want a thing found. act=locate only if they ask you to find them. act=talk when they are just talking. act=post|call|shop|drop|driver opens that city sheet. act=priority when they ask to jump a task — set ok=true ONLY for a real emerging difficulty (breakdown, spoilage, medical, safety, no-show, weather). ok=false for profit, preference, skipping work they dislike, or jumping the queue. act=justice when a held job is in dispute — split AVC between customer, vendor, driver. Platform take is always 0 on a failed job. Customer gets goods or credit, never neither for long. Vendor is paid only for work already done. Driver is paid only for miles actually moved. Do not invent GPS traces we do not have. Never let them game SpaceNet. English default; Greek when they write Greek. Owner is Notis Astranov in Rhodes.';

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

function parseAct(text) {
  const out = { say: '', act: '', q: '', id: '', ok: undefined };
  const raw = String(text || '').trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const o = JSON.parse(m[0]);
      out.say = String(o.say || o.text || '').trim();
      out.act = String(o.act || '').toLowerCase();
      out.q = String(o.q || o.query || '').trim();
      if (o.id) out.id = String(o.id);
      if (o.ok != null) out.ok = o.ok;
      if (o.split) out.split = o.split;
      if (o.items) out.items = o.items;
    } catch (_) {}
  }
  if (!out.say) out.say = raw.replace(/\{[\s\S]*\}/, '').trim();
  if (!out.act) out.act = 'talk';
  return out;
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
      temperature: 0.7,
      max_tokens: 900,
    }),
  });
  const j = await r.json().catch(function () {
    return {};
  });
  const text = String(
    (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || j.text || ''
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
  body.allow_paid = true;
  body.force_paid = true;
  body.fast = true;
  body.spacenet = true;
  body.system = SYS;

  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
  const here = body.here && typeof body.here === 'object' ? body.here : {};
  const whereLine =
    'View: ' +
    (here.level || 'globe') +
    (here.place ? ' at ' + String(here.place) : ' (no GPS yet)') +
    '. AVC ' +
    (here.avc || 0) +
    (here.shop ? '. Selected ' + here.shop : '') +
    (here.vendors && here.vendors.length ? '. Nearby: ' + here.vendors.join('; ') : '');
  const messages = [{ role: 'system', content: SYS }];
  history.forEach(function (h) {
    if (!h || !h.content) return;
    messages.push({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: String(h.content).slice(0, 800),
    });
  });
  messages.push({ role: 'user', content: whereLine + '\nHuman: ' + message });
  body.messages = messages;

  function send(text, extra) {
    extra = extra || {};
    const p = parseAct(text);
    res.status(200).json({
      ok: true,
      text: text,
      say: p.say,
      act: p.act,
      q: p.q,
      task_id: p.id || '',
      priority_ok: p.ok,
      split: p.split,
      items: p.items || [],
      via: extra.via || 'xai-grok',
      model: extra.model || MODEL,
      usage: extra.usage || {},
    });
  }

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
          send(g.text, { via: 'xai-grok', model: g.model, usage: g.usage });
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
    const text = String((j && (j.text || j.response || j.answer)) || '');
    if (text) {
      send(text, { via: 'supabase-aicycle', model: (j && j.model) || MODEL });
      return;
    }
  } catch (_) {}

  res.status(503).json({
    ok: false,
    error: key ? 'grok-failed' : 'XAI_API_KEY missing on host',
    text: key ? 'Grok is keyed but xAI did not answer.' : 'Grok is not keyed on this host.',
    act: 'talk',
  });
};
