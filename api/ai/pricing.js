module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    usdInPerM: 3,
    usdOutPerM: 15,
    eurPerUsd: 0.92,
    model: 'grok-4.6',
    asof: '2026-08-19',
  });
};
