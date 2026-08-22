/** SpaceNet session bus — login hello / heartbeat / pending Grok cmds.
 * Git is the ledger. This is the live wire Grok Build reads.
 */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';

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

async function debugWrite(payload) {
  var r = await fetch(SB + '/functions/v1/debug-write', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_ANON,
      Authorization: 'Bearer ' + SB_ANON,
    },
    body: JSON.stringify(payload),
  });
  return r.json().catch(function () {
    return { ok: r.ok };
  });
}

async function readPublic(name) {
  var r = await fetch(SB + '/storage/v1/object/public/debug-pub/' + name + '?t=' + Date.now(), {
    cache: 'no-store',
  });
  if (!r.ok) return null;
  return r.json().catch(function () {
    return null;
  });
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  var pending = null;
  try {
    pending = await readPublic('live-bridge.json');
  } catch (_) {}

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      via: 'spacenet-pulse',
      hint: 'POST {kind:hello|heartbeat|fault} on login. Grok Build reads this bus.',
      pending: pending && pending.cmds ? pending.cmds : [],
      seq: pending && pending.seq,
      at: new Date().toISOString(),
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  var body = readBody(req);
  var kind = String(body.kind || 'hello').slice(0, 24);
  var sid = String(body.sid || '').slice(0, 40);
  var user = body.user || {};

  try {
    await debugWrite({
      kind: 'live_bridge',
      seq: Date.now(),
      cmds: [
        {
          op: 'session_' + kind,
          sid: sid,
          reason: String(body.reason || '').slice(0, 40),
          email: String(user.email || '').slice(0, 80),
          guest: !!user.guest,
          build: String(body.build || '').slice(0, 40),
          at: body.at || new Date().toISOString(),
        },
      ],
      from: 'pulse',
      at: new Date().toISOString(),
    });
  } catch (_) {}

  res.status(200).json({
    ok: true,
    kind: kind,
    sid: sid,
    cmds: (pending && pending.cmds) || [],
    fluid: pending && pending.fluid ? pending.fluid : null,
    via: 'spacenet-pulse',
  });
};
