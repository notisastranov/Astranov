/** SpaceNet to PayPal payout. Customer / vendor / driver cash out AV€. Universal 3%. */
const { cors, keyed, token, base } = require("./_lib");

const SB = "https://lkoatrkhuigdolnjsbie.supabase.co";
const SB_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI";
const FEE_RATE = 0.03;

function architect() {
  return String(process.env.ARCHITECT_EMAIL || "notisastranov@gmail.com").toLowerCase();
}
function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}
function bearer(req) {
  var h = String((req.headers && (req.headers.authorization || req.headers.Authorization)) || "");
  var m = h.match(/^Bearer\s+(\S+)/i);
  return m ? m[1] : "";
}
async function userOf(req) {
  var t = bearer(req);
  if (!t || t.length < 20) return null;
  try {
    var r = await fetch(SB + "/auth/v1/user", { headers: { apikey: SB_ANON, Authorization: "Bearer " + t } });
    if (!r.ok) return null;
    var u = await r.json().catch(function () { return null; });
    return u && u.email ? u : null;
  } catch (_) {
    return null;
  }
}
async function sb(path, opt) {
  const headers = Object.assign(
    { apikey: SB_ANON, Authorization: "Bearer " + SB_ANON, "Content-Type": "application/json" },
    (opt && opt.headers) || {}
  );
  const r = await fetch(SB + "/rest/v1/" + path, Object.assign({}, opt, { headers }));
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  return { ok: r.ok, status: r.status, json: json, text: text };
}
function money(n) {
  n = Math.round(Number(n || 0) * 100) / 100;
  return n > 0 ? n : 0;
}
function walletId(email) {
  return ("w-" + String(email || "").toLowerCase().replace(/[^a-z0-9@._-]/g, "").slice(0, 48)).slice(0, 64);
}
async function getWallet(email) {
  email = String(email || "").toLowerCase();
  const id = walletId(email);
  const got = await sb("sn_listings?id=eq." + encodeURIComponent(id) + "&select=id,body");
  const row = got.json && got.json[0];
  const body = (row && row.body) || { kind: "wallet", email: email, avc: 0, ledger: [] };
  body.kind = "wallet";
  body.email = email;
  body.avc = money(body.avc);
  body.ledger = Array.isArray(body.ledger) ? body.ledger.slice(-40) : [];
  return { id: id, body: body };
}
async function putWallet(w) {
  if (!w) return;
  w.body.t = Date.now();
  await sb("sn_listings?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: w.id, kind: "wallet", lat: 0, lng: 0, body: w.body, updated_at: new Date().toISOString(),
    }),
  });
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST" }); return; }
  if (!keyed()) { res.status(503).json({ ok: false, error: "paypal_not_configured" }); return; }

  const user = await userOf(req);
  const email = user ? String(user.email).toLowerCase() : "";
  if (!email) { res.status(401).json({ ok: false, need: "login" }); return; }

  const body = readBody(req);
  const amount = money(body.amount || body.eur || body.avc);
  if (amount < 10) { res.status(400).json({ ok: false, error: "min_10" }); return; }
  if (amount > 2000) { res.status(400).json({ ok: false, error: "max_2000" }); return; }

  var fee = money(amount * FEE_RATE);
  var net = money(amount - fee);
  if (net < 1) { res.status(400).json({ ok: false, error: "net_too_small" }); return; }

  var paypal = String(body.paypal || body.receiver || email).toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal)) {
    res.status(400).json({ ok: false, error: "paypal_email" });
    return;
  }

  const w = await getWallet(email);
  if (w.body.avc < amount) {
    res.status(400).json({ ok: false, error: "insufficient", avc: w.body.avc });
    return;
  }

  w.body.avc = money(w.body.avc - amount);
  var batchId = ("sn-out-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)).slice(0, 30);
  w.body.ledger.push({
    kind: "withdraw",
    avc: -amount,
    fee: fee,
    net: net,
    note: "PayPal " + paypal + " net " + net.toFixed(2) + " fee 3% " + fee.toFixed(2),
    orderId: batchId,
    t: Date.now(),
  });
  await putWallet(w);

  try {
    var t = await token();
    var r = await fetch(base() + "/v1/payments/payouts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + t,
        "Content-Type": "application/json",
        "PayPal-Request-Id": batchId,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "SpaceNet AV€ withdrawal",
          email_message: "Your SpaceNet AV€ left as EUR on PayPal after the 3% service charge.",
        },
        items: [{
          recipient_type: "EMAIL",
          amount: { value: net.toFixed(2), currency: "EUR" },
          receiver: paypal,
          note: "SpaceNet cash out after 3%",
          sender_item_id: batchId + "-1",
        }],
      }),
    });
    var j = await r.json().catch(function () { return {}; });
    var batch = j && j.batch_header;
    var st = String((batch && batch.batch_status) || "").toUpperCase();
    if (!r.ok || !batch) {
      w.body.avc = money(w.body.avc + amount);
      w.body.ledger.push({ kind: "withdraw_fail", avc: amount, note: (j && (j.message || j.name)) || "paypal", orderId: batchId, t: Date.now() });
      await putWallet(w);
      res.status(502).json({ ok: false, error: "payout_failed", details: j, avc: w.body.avc });
      return;
    }
    if (fee) {
      var ow = await getWallet(architect());
      ow.body.avc = money(ow.body.avc + fee);
      ow.body.platform = money((ow.body.platform || 0) + fee);
      ow.body.ledger.push({ kind: "fee", avc: fee, note: "SpaceNet 3% withdraw " + email, orderId: batchId, t: Date.now() });
      await putWallet(ow);
    }
    res.status(200).json({
      ok: true,
      gross: amount,
      fee: fee,
      eur: net,
      avc: w.body.avc,
      paypal: paypal,
      batchId: batch.payout_batch_id || batchId,
      status: st || "PENDING",
    });
  } catch (e) {
    w.body.avc = money(w.body.avc + amount);
    w.body.ledger.push({ kind: "withdraw_fail", avc: amount, note: String(e.message || e), orderId: batchId, t: Date.now() });
    await putWallet(w);
    res.status(500).json({ ok: false, error: String(e.message || e), avc: w.body.avc });
  }
};
