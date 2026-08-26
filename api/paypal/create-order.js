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
  var amount = Math.max(1, Math.round(Number(body.amount || body.eur || 10) * 100) / 100);
  var origin = String(body.origin || "https://astranov.eu").replace(/\/$/, "");
  try {
    var t = await token();
    var r = await fetch(base() + "/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + t,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: "avc-deposit",
            description: "Astranov AVC deposit · 1 EUR = 1 AVC · raises the pool",
            amount: { currency_code: "EUR", value: amount.toFixed(2) },
          },
        ],
        application_context: {
          brand_name: "Astranov SpaceNet",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: origin + "/?paypal=success",
          cancel_url: origin + "/?paypal=cancel",
        },
      }),
    });
    var j = await r.json().catch(function () {
      return {};
    });
    var approve = (j.links || []).find(function (l) {
      return l && l.rel === "approve";
    });
    if (!r.ok || !j.id) {
      res.status(502).json({ error: j.message || j.error || "create_failed", details: j });
      return;
    }
    res.status(200).json({
      ok: true,
      orderId: j.id,
      amount: amount,
      approve: approve && approve.href,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
