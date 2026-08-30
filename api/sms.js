const SB = 'https://lkoatrkhuigdolnjsbie.supabase.co'
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2F0cmtodWlnZG9sbmpzYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODIwOTIsImV4cCI6MjA5NDQ1ODA5Mn0.qf6Kg93YLJ0coTdVQa4baU0ppOdFY5WkmVzMvEV6ejI'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Cache-Control', 'no-store')
}

module.exports = async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  const r = await fetch(SB + '/functions/v1/sms', {
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      apikey: SB_ANON,
    },
    body: req.method === 'GET' ? undefined : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})),
  })
  const ct = r.headers.get('content-type') || 'application/json'
  const buf = await r.text()
  res.status(r.status)
  res.setHeader('Content-Type', ct)
  res.send(buf)
}
