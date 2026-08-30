import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
const FROM_DEFAULT = '+18333030833'
const SID_DEFAULT = 'AC317ff2dab7d7610538f2ffc4f5eb7f9'
const OPTIN = 'Astranov SpaceNet: You\'re opted in to delivery SMS. Msg frequency varies per order (typically 1-8). Msg & data rates may apply. Reply HELP for help, STOP to cancel. Privacy: astranov.eu/privacy'
const HELP = 'Astranov SpaceNet help: delivery alerts for orders on astranov.eu. Reply STOP to unsubscribe. Email info@astranov.eu'
const STOP_MSG = 'You are unsubscribed from Astranov SpaceNet SMS. No more messages. Text START to opt in again.'

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
function twiml(msg: string) {
  const body = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' +
    String(msg).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>') +
    '</Message></Response>'
  return new Response(body, { status: 200, headers: { ...CORS, 'Content-Type': 'text/xml' } })
}

function creds() {
  const raw = (Deno.env.get('Twilio') || Deno.env.get('TWILIO') || Deno.env.get('TWILIO_AUTH_TOKEN') || '').trim()
  let sid = Deno.env.get('TWILIO_ACCOUNT_SID') || Deno.env.get('TWILIO_SID') || SID_DEFAULT
  let token = raw
  let from = Deno.env.get('TWILIO_FROM') || Deno.env.get('TWILIO_NUMBER') || FROM_DEFAULT
  let user = sid
  if (raw.startsWith('{')) {
    try {
      const j = JSON.parse(raw)
      sid = j.sid || j.accountSid || j.account_sid || sid
      token = j.token || j.authToken || j.auth_token || j.secret || j.key || token
      from = j.from || j.number || from
      if (String(j.key || j.apiKey || '').startsWith('SK')) user = j.key || j.apiKey
    } catch { /* keep */ }
  } else if (raw.includes('|') || (raw.includes(':') && (raw.startsWith('AC') || raw.startsWith('SK')))) {
    const sep = raw.includes('|') ? '|' : ':'
    const a = raw.split(sep)[0]
    const b = raw.slice(a.length + 1)
    if (a.startsWith('AC')) { sid = a; token = b; user = a }
    else if (a.startsWith('SK')) { token = b; user = a }
  }
  if (token.startsWith('SK') && !token.includes(':')) user = token
  return { sid, token, from, user }
}

function sb() {
  const url = Deno.env.get('SUPABASE_URL') || ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!url || !key) return null
  return createClient(url, key)
}

function normPhone(s: string) {
  const d = String(s || '').replace(/[^\d+]/g, '')
  if (d.startsWith('+')) return d
  if (d.length === 10) return '+1' + d
  if (d.length === 11 && d.startsWith('1')) return '+' + d
  if (d.length >= 10) return '+' + d
  return d
}

async function setStatus(phone: string, status: string) {
  const c = sb()
  if (!c || !phone) return
  await c.from('sn_sms').upsert({ phone, status, updated_at: new Date().toISOString() })
}

async function isIn(phone: string) {
  const c = sb()
  if (!c || !phone) return false
  const { data } = await c.from('sn_sms').select('status').eq('phone', phone).maybeSingle()
  return !!(data && data.status === 'in')
}

async function sendSms(to: string, body: string) {
  const { sid, token, from, user } = creds()
  if (!token) return { ok: false, error: 'no_twilio_secret' }
  const dest = normPhone(to)
  const params = new URLSearchParams({ From: from, To: dest, Body: body })
  const auth = btoa(user + ':' + token)
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok, status: r.status, sid: j.sid || null, error: j.message || j.error_message || null }
}

function keyword(body: string) {
  const t = String(body || '').trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (['START', 'YES', 'SUBSCRIBE', 'UNSTOP'].includes(t)) return 'in'
  if (t === 'STOP' || t === 'STOPALL' || t === 'UNSUBSCRIBE' || t === 'CANCEL' || t === 'END' || t === 'QUIT') return 'out'
  if (t === 'HELP' || t === 'INFO') return 'help'
  return ''
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const { token, from, sid } = creds()
  const url = new URL(req.url)
  const ct = req.headers.get('content-type') || ''

  if (req.method === 'GET') {
    return json({ ok: true, configured: !!token, from, account: sid.slice(0, 10) + '…' })
  }

  let form: Record<string, string> = {}
  let body: Record<string, unknown> = {}
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const raw = await req.text()
    new URLSearchParams(raw).forEach((v, k) => { form[k] = v })
  } else {
    body = await req.json().catch(() => ({}))
  }

  const twilioFrom = form.From || form.from || ''
  const twilioBody = form.Body || form.body || ''
  if (twilioFrom && (twilioBody || form.SmsSid || form.MessageSid)) {
    const k = keyword(twilioBody)
    const phone = normPhone(twilioFrom)
    if (k === 'in') { await setStatus(phone, 'in'); return twiml(OPTIN) }
    if (k === 'out') { await setStatus(phone, 'out'); return twiml(STOP_MSG) }
    if (k === 'help') return twiml(HELP)
    return twiml(HELP)
  }

  const act = String(body.act || url.searchParams.get('act') || 'send')
  if (act === 'send') {
    const to = normPhone(String(body.to || ''))
    const text = String(body.body || body.text || '').slice(0, 320)
    if (!to || !text) return json({ ok: false, error: 'need_to_and_body' }, 400)
    if (!(await isIn(to))) return json({ ok: false, error: 'not_opted_in' })
    const r = await sendSms(to, text)
    return json(r, r.ok ? 200 : 502)
  }
  return json({ ok: false, error: 'unknown_act' }, 400)
})
