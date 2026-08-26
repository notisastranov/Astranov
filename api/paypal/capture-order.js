const { cors, keyed, token, base } = require("./_lib");

function readBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST" });
    return;
  }
  if (!keyed()) {
    res.status(503).json({ error: "paypal_not_configured" });
    return;
  }
  var body = readBody(req);
  var orderId = String(body.orderId || body.token || "").trim();
  if (!orderId) {
    res.status(400).json({ error: "missing_order" });
    return;
  }
  try {
    var t = await token();
    var r = await fetch(base() + "/v2/checkout/orders/" + encodeURIComponent(orderId) + "/capture", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + t,
        "Content-Type": "application/json",
      },
    });
    var j = await r.json().catch(function () {
      return {};
    });
    var cap =
      j.purchase_units &&
      j.purchase_units[0] &&
      j.purchase_units[0].payments &&
      j.purchase_units[0].payments.captures &&
      j.purchase_units[0].payments.captures[0];
    var value = cap && cap.amount && cap.amount.value;
    var eur = Math.round(Number(value || body.amount || 0) * 100) / 100;
    if (!r.ok || !cap) {
      res.status(502).json({ error: j.message || "capture_failed", details: j });
      return;
    }
    res.status(200).json({
      ok: true,
      orderId: j.id || orderId,
      captureId: cap.id,
      eur: eur,
      avc: eur,
      pool_delta: eur,
      status: cap.status,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
