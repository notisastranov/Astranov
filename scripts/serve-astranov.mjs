import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve('/workspace/astranov');
const HOST = '0.0.0.0';
const PORT = 8080;
const MARKUP = 3;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

function safeJoin(root, reqPath) {
  const decoded = decodeURIComponent((reqPath || '/').split('?')[0]);
  const clean = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(root, clean);
  if (!full.startsWith(root)) return null;
  return full;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/** Local free mind — no keys. Mirrors money-path intents. */
function freeMind(message) {
  const low = String(message || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!low) return { text: 'Astranov — power on · locate · marina · plans · help.', via: 'free-mind' };
  if (/\b(who are you|what are you|your name)\b/.test(low))
    return { text: "I'm Astranov — delivery OS on the live globe. Subscribe for Grok power · plans.", via: 'free-mind' };
  if (/^(help|plans|pricing)/.test(low) || /\bsubscribe\b/.test(low))
    return {
      text: 'Plans: €3 (1€ Grok) · €13 · €33 · €300 (100€ Grok). Markup 3×. Type subscribe 3. Owner = unlimited paid.',
      via: 'free-mind',
    };
  if (/\b(power on|market on|demo delivery|throw offers)\b/.test(low))
    return { text: 'Power ON path — task offers · Accept → polygon → 3× seal → pay · Rai.', via: 'free-mind' };
  if (/\blocate\b/.test(low)) return { text: 'Locating you on the map…', via: 'free-mind' };
  if (/\bmarina\b/.test(low)) return { text: 'Marina berth grid — free cells show Æ/night.', via: 'free-mind' };
  if (/\b(global|earth)\b/.test(low)) return { text: 'Back to 3D Earth.', via: 'free-mind' };
  return {
    text: 'I hear you — try power on · locate · plans · subscribe 3 · help. Free mind active; Grok when plan has API budget.',
    via: 'free-mind',
  };
}

async function callXai(message, system, force) {
  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!key) return null;
  const model = process.env.XAI_MODEL || process.env.GROK_MODEL || 'grok-4-1-fast-non-reasoning';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 18000);
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content:
              system ||
              'You are Astranov — the AI of astranov.eu. Never say you are Grok or SpaceNet. Be concise. Help with delivery, globe, and SpaceNet tasks.',
          },
          { role: 'user', content: String(message || '').slice(0, 4000) },
        ],
      }),
    });
    clearTimeout(timer);
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.warn('[api/ai] xai', r.status, t.slice(0, 200));
      return null;
    }
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content;
    if (!text) return null;
    const usage = j.usage || {};
    const inTok = Number(usage.prompt_tokens || 0);
    const outTok = Number(usage.completion_tokens || 0);
    const apiEur = Math.max(0.001, (inTok / 1e6) * 2 + (outTok / 1e6) * 6 || 0.004);
    return { text, via: 'xai/' + model, usage, api_eur: apiEur, paid: true };
  } catch (e) {
    console.warn('[api/ai] xai error', e && e.message);
    return null;
  }
}

async function handleAi(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    json(res, { error: 'POST only' }, 405);
    return;
  }
  let body = {};
  try {
    body = await readBody(req);
  } catch {
    json(res, { error: 'bad json' }, 400);
    return;
  }
  const message = String(body.message || body.prompt || body.text || '').trim();
  const sub = body.subscription || {};
  const isOwner = body.owner === true || body.force_paid === true;
  const allowPaid = body.allow_paid === true || isOwner;
  const remaining = Number(sub.remainingApiEur);
  const hasBudget = isOwner || (allowPaid && sub.active && isFinite(remaining) && remaining > 0);

  // Owner / paid budget → try real Grok (server key only)
  if (hasBudget) {
    const paid = await callXai(message, body.system, isOwner);
    if (paid) {
      json(res, {
        response: paid.text,
        text: paid.text,
        provider: 'astranov',
        via: paid.via,
        paid: true,
        paid_fallback: true,
        paid_notice: isOwner
          ? 'Architect · paid Grok'
          : 'Paid Grok · metered (3× markup plan)',
        usage: paid.usage,
        meter: { api_eur: paid.api_eur, markup: MARKUP },
      });
      return;
    }
  }

  // Proxy to live Supabase aicycle (secrets live there)
  try {
    const aicycle = 'https://lkoatrkhuigdolnjsbie.supabase.co/functions/v1/aicycle';
    const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';
    const headers = {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: (req.headers && req.headers.authorization) || ('Bearer ' + anon),
    };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 22000);
    const rr = await fetch(aicycle, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        mode: body.mode || 'chat',
        allow_paid: allowPaid,
        force_paid: isOwner,
        owner: isOwner,
        subscription: sub,
        history: body.history || [],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (rr.ok) {
      const j = await rr.json();
      const text = String(j.text || j.response || '').trim();
      if (text) {
        json(res, {
          response: text,
          text,
          provider: j.provider || 'astranov',
          via: (j.via || 'aicycle') + '/proxy',
          paid: !!(j.paid || j.paid_fallback),
          paid_fallback: !!(j.paid || j.paid_fallback),
          paid_notice: j.paid_notice || j.notify,
          meter: j.meter,
          subscription: j.subscription,
        });
        return;
      }
    }
  } catch (e) {
    console.warn('[api/ai] aicycle proxy', e && e.message);
  }

  // Free mind fallback
  const free = freeMind(message);
  json(res, {
    response: free.text,
    text: free.text,
    provider: 'astranov',
    via: free.via,
    paid: false,
    paid_fallback: false,
    offline: !process.env.XAI_API_KEY,
    subscription: { active: !!sub.active, owner: isOwner },
    notice: hasBudget
      ? 'Paid key unavailable — free mind'
      : 'Subscribe €3+ for Grok · type plans',
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || '/';
    const pathOnly = url.split('?')[0];

    if (pathOnly === '/api/ai' || pathOnly === '/api/ai/') {
      await handleAi(req, res);
      return;
    }
    if (pathOnly === '/api/health') {
      json(res, {
        ok: true,
        service: 'astranov',
        xai: !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
        markup: MARKUP,
      });
      return;
    }

    // Owner wish inbox — CLI/AI desires land here for review
    if (pathOnly === '/api/wish' || pathOnly === '/api/wish/') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
      }
      const wishFile = path.join(ROOT, 'support', 'wish-inbox.jsonl');
      try {
        fs.mkdirSync(path.dirname(wishFile), { recursive: true });
      } catch (_) {}
      if (req.method === 'GET') {
        let lines = [];
        try {
          if (fs.existsSync(wishFile)) {
            lines = fs
              .readFileSync(wishFile, 'utf8')
              .split('\n')
              .filter(Boolean)
              .slice(-40)
              .map((l) => {
                try {
                  return JSON.parse(l);
                } catch (_) {
                  return null;
                }
              })
              .filter(Boolean);
          }
        } catch (_) {}
        json(res, { ok: true, count: lines.length, wishes: lines.reverse() });
        return;
      }
      if (req.method === 'POST') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        let body = {};
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        } catch (_) {
          body = {};
        }
        const row = Object.assign(
          { at: Date.now(), source: 'client' },
          body,
          { receivedAt: new Date().toISOString() }
        );
        try {
          fs.appendFileSync(wishFile, JSON.stringify(row) + '\n');
        } catch (e) {
          json(res, { ok: false, error: String(e && e.message ? e.message : e) }, 500);
          return;
        }
        console.log('[wish]', (row.scope || '?') + ' · ' + String(row.text || '').slice(0, 100));
        json(res, { ok: true, id: row.id || null });
        return;
      }
      res.writeHead(405);
      res.end('Method not allowed');
      return;
    }

    let fp = safeJoin(ROOT, url);
    if (!fp) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
      fp = path.join(fp, 'index.html');
    }
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      const ext = path.extname(fp);
      if (!ext || ext === '.html') {
        fp = path.join(ROOT, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
    }
    const ext = path.extname(fp).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const body = fs.readFileSync(fp);
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500);
    res.end(String(e && e.message ? e.message : e));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[astranov] http://${HOST}:${PORT} → ${ROOT} · /api/ai ready`);
});
