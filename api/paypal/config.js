const { cors, keyed, mode } = require("./_lib");

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  res.status(200).json({
    ok: true,
    configured: keyed(),
    mode: mode(),
    currency: "EUR",
    avc_peg: 1,
    note: "EUR in → AVC 1:1 · deposit raises the system pool",
  });
};
