/** SpaceNet live pulse — talk → Grok patch → apply now. GitHub/Vercel stay the backup shell. */
const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI';
const MODEL = process.env.XAI_MODEL || 'grok-4-1-fast-non-reasoning';
const SYS =
  'You reshape the running Astranov SpaceNet HUD. Return ONLY compact JSON: ' +
  '{"note":"8 words max","css":"CSS rules","ops":[{"op":"var","name":"--glow","value":"#14c3f3"}]}. ' +
  'Target real ids: #panel #cli-in #cli-form #cli-log #cli-drag #sn-task-ribbon .sn-rib-btn #sn-topchrome #sn-topchrome-panel #stc-cmd-in #sn-helper-hit. ' +
  'Owner law: 10px handles, 36px round buttons, glow #14c3f3, no coach text, empty #cli-log is 0 height, no overlapping windows. ' +
  'Never restore #cli-coach. Never teleport Earth. CSS must use !important. Keep css under 2500 chars.';

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

function parsePack(text) {
  var raw = String(text || '').trim();
  var m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    var j = JSON.parse(m[0]);
    if (!j || typeof j !== 'object') return null;
    return {
      note: String(j.note || '').slice(0, 120),
      css: String(j.css || '').slice(0, 4000),
      ops: Array.isArray(j.ops) ? j.ops.slice(0, 12) : [],
    };
  } catch (_) {
    return null;
  }
}

function heuristic(wish) {
  var s = String(wish || '').toLowerCase();
  var css = '';
  var note = '';
  if (/button/.test(s) && /small|tiny|less/.test(s)) {
    css = '#sn-task-ribbon .sn-rib-btn{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;flex:0 0 32px!important}';
    note = 'buttons 32px';
  } else if (/button/.test(s) && /round|circle/.test(s)) {
    css = '#sn-task-ribbon .sn-rib-btn{border-radius:50%!important}';
    note = 'round buttons';
  } else if (/thinner|less space|tight|compact/.test(s) && /cli|hud|chrome/.test(s)) {
    css =
      '#cli-form,#stc-cmd{padding:2px 10px 6px!important}#cli-log:empty{display:none!important;height:0!important}#panel.collapsed{grid-template-rows:10px 44px 0 auto!important}';
    note = 'tighter CLI';
  } else if (/handle/.test(s) && /thin|small/.test(s)) {
    css = '#cli-drag,#sn-topchrome-drag{height:10px!important;min-height:10px!important;max-height:10px!important}';
    note = '10px handles';
  } else if (/glow|neon|blue/.test(s)) {
    css = ':root{--glow:#14c3f3!important}#panel,#sn-topchrome-panel{border-color:rgba(20,195,243,.55)!important}';
    note = 'lock #14c3f3';
  } else if (/hide coach|no coach|instruction/.test(s)) {
    css = '#cli-coach{display:none!important;height:0!important}';
    note = 'coach dead';
  }
  if (!css) return null;
  return { note: note, css: css, ops: [] };
}

async function grokChat(key, wish) {
  var r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: String(wish).slice(0, 800) },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });
  var j = await r.json().catch(function () {
    return {};
  });
  var text = String(
    (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''
  );
  return parsePack(text);
}

async function viaAicycle(wish, auth) {
  var r = await fetch(SB + '/functions/v1/aicycle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_ANON,
      Authorization: auth || 'Bearer ' + SB_ANON,
    },
    body: JSON.stringify({
      message: wish,
      system: SYS,
      allow_paid: true,
      gift: true,
      force_paid: true,
    }),
  });
  var j = await r.json().catch(function () {
    return {};
  });
  return parsePack(j.text || j.response || '');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      via: 'spacenet-fluid',
      hint: 'POST {wish} to reshape the running HUD. Applied on the device now. GitHub is backup.',
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }
  var body = readBody(req);
  var wish = String(body.wish || body.message || body.q || body.text || '').trim().slice(0, 800);
  if (!wish) {
    res.status(400).json({ ok: false, error: 'empty' });
    return;
  }
  var pack = heuristic(wish);
  var via = 'heuristic';
  if (!pack) {
    var key = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
    if (key) {
      try {
        pack = await grokChat(key, wish);
        if (pack) via = 'xai-grok';
      } catch (_) {}
    }
  }
  if (!pack) {
    try {
      pack = await viaAicycle(wish, req.headers.authorization);
      if (pack) via = 'aicycle';
    } catch (_) {}
  }
  if (!pack || (!pack.css && !(pack.ops && pack.ops.length))) {
    res.status(200).json({
      ok: false,
      error: 'no-patch',
      text: 'I heard you. Say the chrome change in one line: make buttons smaller · thinner CLI · lock neon blue.',
    });
    return;
  }
  res.status(200).json({
    ok: true,
    via: via,
    note: pack.note,
    css: pack.css,
    ops: pack.ops,
    at: new Date().toISOString(),
    persist: 'device',
  });
};
