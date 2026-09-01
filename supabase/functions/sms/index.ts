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
const MEM = new Map<string, Record<string, unknown>>()

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
}
function twiml(msg: string) {
  const body = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' +
    String(msg).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>') +
    '</Message></Response>'
  return new Response(body, { status: 200, headers: { ...CORS, 'Content-Type': 'text/xml' } })
}
function takeSid(s: string) {
  const m = String(s || '').match(/AC[a-fA-F0-9]{32}/)
  return m ? m[0] : ''
}
function creds() {
  const raw = (Deno.env.get('Twilio') || Deno.env.get('TWILIO') || Deno.env.get('TWILIO_AUTH_TOKEN') || '').trim()
  let sid = takeSid(Deno.env.get('TWILIO_ACCOUNT_SID') || '') || takeSid(Deno.env.get('TWILIO_SID') || '')
  let token = ''
  let from = Deno.env.get('TWILIO_FROM') || Deno.env.get('TWILIO_NUMBER') || FROM_DEFAULT
  let user = ''
  if (raw.startsWith('{')) {
    try {
      const j = JSON.parse(raw)
      sid = takeSid(String(j.sid || j.accountSid || j.account_sid || j.TWILIO_ACCOUNT_SID || j.AccountSid || '')) || sid
      token = String(j.token || j.authToken || j.auth_token || j.secret || j.TWILIO_AUTH_TOKEN || '')
      from = String(j.from || j.number || from)
      if (String(j.key || j.apiKey || '').startsWith('SK')) user = String(j.key || j.apiKey)
    } catch { /* keep */ }
  } else if (raw.startsWith('AC') && raw.length >= 34) {
    sid = takeSid(raw) || sid
    const rest = raw.slice(34).replace(/^[:|]/, '')
    if (rest && !rest.startsWith('AC')) token = rest
    else if (raw.includes('|') || raw.includes(':')) {
      const sep = raw.includes('|') ? '|' : ':'
      token = raw.slice(raw.indexOf(sep) + 1)
      sid = takeSid(raw.split(sep)[0]) || sid
    }
  } else if (raw.startsWith('SK') && (raw.includes(':') || raw.includes('|'))) {
    const sep = raw.includes('|') ? '|' : ':'
    user = raw.split(sep)[0]
    token = raw.slice(user.length + 1)
  } else if (raw && !raw.startsWith('AC')) {
    token = raw
  }
  sid = sid || takeSid(SID_DEFAULT)
  if (!token && raw && !raw.startsWith('{') && !raw.startsWith('AC')) token = raw
  user = user || sid
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
  async function attempt(userId: string, pass: string) {
    const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(userId + ':' + pass), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const j = await r.json().catch(() => ({}))
    return { ok: r.ok, status: r.status, sid: j.sid || null, error: j.message || j.error_message || null }
  }
  let r = await attempt(user, token)
  if (!r.ok && user !== sid) r = await attempt(sid, token)
  return r
}
async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
function codePepper() {
  const { sid, token } = creds()
  return Deno.env.get('SMS_CODE_PEPPER') || sid + token.slice(0, 8)
}
async function hashCode(phone: string, code: string) {
  return sha256(codePepper() + '|' + phone + '|' + code)
}
async function loadRow(phone: string) {
  if (!phone) return null
  const mem = MEM.get(phone) || null
  const c = sb()
  if (!c) return mem
  const { data } = await c.from('sn_sms').select('*').eq('phone', phone).maybeSingle()
  if (mem && mem.code_hash) return { ...(data || {}), ...mem }
  return data || mem
}
async function saveVerify(phone: string, patch: Record<string, unknown>) {
  if (!phone) return
  const row = { phone, status: 'in', updated_at: new Date().toISOString(), ...patch }
  MEM.set(phone, row)
  const c = sb()
  if (!c) return
  const { error } = await c.from('sn_sms').upsert(row)
  if (error) console.log('sn_sms upsert', error.message)
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
  const { from } = creds()
  const url = new URL(req.url)
  const ct = req.headers.get('content-type') || ''
  if (req.method === 'GET') {
    const { sid, token, from, user } = creds()
    return json({ ok: true, configured: !!token, from, account: (sid||'').slice(0, 10) + '…', sid_len: (sid||'').length, phone_verify: (sid||'').length===34 && token ? 'ready' : 'bad_sid' })
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
    return twiml(HELP)
  }
  const act = String(body.act || body.action || url.searchParams.get('act') || url.searchParams.get('action') || 'send')
  const OWNER = '+306971930225'
  if (act === 'status' || act === 'config') {
    const { sid, token, from } = creds()
    return json({ ok: true, configured: !!token, from, phone_verify: token ? 'ready' : 'missing_secret', account: sid.slice(0, 10) + '…' })
  }
  if (act === 'send_code' || act === 'verify_start') {
    const to = normPhone(String(body.to || body.phone || ''))
    if (to.length < 11) return json({ ok: false, error: 'need_phone' }, 400)
    const row = await loadRow(to)
    const last = row && row.last_sent_at ? Date.parse(String(row.last_sent_at)) : 0
    if (last && Date.now() - last < 45000) return json({ ok: false, error: 'wait' }, 429)
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0')
    const hash = await hashCode(to, code)
    await saveVerify(to, { status: row && row.status === 'out' ? 'out' : 'in', code_hash: hash, code_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(), last_sent_at: new Date().toISOString(), attempts: 0 })
    const r = await sendSms(to, 'Astranov SpaceNet code: ' + code + '. Valid 10 minutes. Do not share. Reply STOP to cancel SMS.')
    return json({ ok: r.ok, sent: r.ok, from, to, ttl: 600, error: r.error || null }, r.ok ? 200 : 502)
  }
  if (act === 'check_code' || act === 'verify_check') {
    const to = normPhone(String(body.to || body.phone || ''))
    const code = String(body.code || body.token || '').replace(/\D/g, '').slice(0, 8)
    if (to.length < 11 || code.length < 4) return json({ ok: false, error: 'need_phone_and_code' }, 400)
    const row = await loadRow(to)
    if (!row || !row.code_hash) return json({ ok: false, error: 'no_code' }, 400)
    if (row.code_expires && Date.parse(String(row.code_expires)) < Date.now()) return json({ ok: false, error: 'expired' }, 400)
    const tries = Number(row.attempts || 0)
    if (tries >= 8) return json({ ok: false, error: 'locked' }, 429)
    const hash = await hashCode(to, code)
    if (hash !== row.code_hash) {
      await saveVerify(to, { attempts: tries + 1, code_hash: row.code_hash, code_expires: row.code_expires })
      return json({ ok: false, error: 'bad_code', left: 8 - tries - 1 }, 400)
    }
    await saveVerify(to, { verified_at: new Date().toISOString(), code_hash: null, code_expires: null, attempts: 0, status: 'in' })
    return json({ ok: true, verified: true, phone: to })
  }
  if (act === 'test') {
    const to = normPhone(String(body.to || OWNER))
    if (to !== OWNER) return json({ ok: false, error: 'not_owner' }, 403)
    await setStatus(to, 'in')
    const r = await sendSms(to, 'Astranov SpaceNet test from +18333030833. You are opted in for delivery SMS. Reply HELP for help, STOP to cancel.')
    return json(r, r.ok ? 200 : 502)
  }
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
