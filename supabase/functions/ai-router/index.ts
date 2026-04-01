import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-owner-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ChatMsg = { role?: string; content?: string }

type RequestBody = {
  lane?: 'owner' | 'public'
  message?: string
  history?: ChatMsg[]
  publicProvider?: 'auto' | 'gemini' | 'xai'
  ownerToken?: string
  codeContext?: string
}

const OWNER_TOKEN = Deno.env.get('OWNER_RELAY_TOKEN') || ''
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
const XAI_API_KEY = Deno.env.get('XAI_API_KEY') || ''

const OWNER_MODEL = Deno.env.get('OWNER_MODEL') || 'gpt-4o-mini'
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
const XAI_MODEL = Deno.env.get('XAI_MODEL') || 'grok-4'
const PUBLIC_PROVIDER_ORDER = (Deno.env.get('PUBLIC_PROVIDER_ORDER') || 'gemini,xai')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const PUBLIC_RATE_LIMIT_PER_MINUTE = Number(Deno.env.get('PUBLIC_RATE_LIMIT_PER_MINUTE') || '12')

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const db = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function safeText(value: unknown, max = 12000) {
  return String(value || '').trim().slice(0, max)
}

function extractIp(req: Request) {
  const h = req.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    'unknown'
  )
}

async function logRequest(payload: Record<string, unknown>) {
  if (!db) return
  try {
    await db.from('ai_request_logs').insert(payload)
  } catch (_e) {
    // non-fatal
  }
}

async function checkRateLimit(bucketKey: string) {
  if (!db) return { allowed: true, current_count: 0, reset_at: null }
  try {
    const { data, error } = await db.rpc('bump_ai_rate_limit', {
      p_bucket_key: bucketKey,
      p_window_seconds: 60,
      p_limit: PUBLIC_RATE_LIMIT_PER_MINUTE,
    })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return row || { allowed: true, current_count: 0, reset_at: null }
  } catch (_e) {
    return { allowed: true, current_count: 0, reset_at: null }
  }
}

function normalizeHistory(history?: ChatMsg[]) {
  return (history || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-10)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: safeText(m.content, 6000),
    }))
}

async function askOpenAI(message: string, history: ChatMsg[], codeContext = '') {
  const input = [
    {
      role: 'system',
      content: [
        {
          type: 'input_text',
          text:
            'You are the private owner-only developer AI inside the Astranov app. Give concrete implementation help, prioritize direct code changes, and stay concise.' +
            (codeContext ? `\n\nCurrent code context:\n${codeContext.slice(0, 100000)}` : ''),
        },
      ],
    },
    ...history.map((m) => ({
      role: m.role || 'user',
      content: [{ type: 'input_text', text: m.content || '' }],
    })),
    { role: 'user', content: [{ type: 'input_text', text: message }] },
  ]

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OWNER_MODEL,
      input,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'OpenAI request failed')
  }

  const text =
    data?.output_text ||
    data?.output?.flatMap((item: any) => item?.content || [])?.map((c: any) => c?.text || '')?.join('') ||
    ''

  return { text: text.trim(), provider: 'openai', model: OWNER_MODEL }
}

async function askGemini(message: string, history: ChatMsg[]) {
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: 'You are Astranov public AI. Help users inside the app with concise, practical answers.' }],
        },
        contents,
      }),
    },
  )
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed')
  }
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || ''
  if (!text.trim()) throw new Error('Gemini returned an empty response')
  return { text: text.trim(), provider: 'gemini', model: GEMINI_MODEL }
}

async function askXai(message: string, history: ChatMsg[]) {
  const messages = [
    { role: 'system', content: 'You are Astranov public AI. Help users inside the app with concise, practical answers.' },
    ...history,
    { role: 'user', content: message },
  ]

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages,
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || 'xAI request failed')
  }
  const text = data?.choices?.[0]?.message?.content || ''
  if (!String(text).trim()) throw new Error('xAI returned an empty response')
  return { text: String(text).trim(), provider: 'xai', model: XAI_MODEL }
}

async function askPublic(message: string, history: ChatMsg[], requested: string) {
  const order = requested && requested !== 'auto'
    ? [requested]
    : PUBLIC_PROVIDER_ORDER

  const tried: string[] = []
  let lastError = 'No provider configured'

  for (const provider of order) {
    tried.push(provider)
    try {
      if (provider === 'gemini' && GEMINI_API_KEY) return await askGemini(message, history)
      if (provider === 'xai' && XAI_API_KEY) return await askXai(message, history)
      lastError = `${provider} not configured`
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }

  throw new Error(`Public AI failed after trying ${tried.join(', ')}: ${lastError}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const ip = extractIp(req)
  const started = Date.now()

  try {
    const body = (await req.json()) as RequestBody
    const lane = body?.lane === 'owner' ? 'owner' : 'public'
    const message = safeText(body?.message, 12000)
    const history = normalizeHistory(body?.history)

    if (!message) return json({ ok: false, error: 'Missing message' }, 400)

    if (lane === 'owner') {
      const token = req.headers.get('x-owner-token') || safeText(body?.ownerToken, 256)
      if (!OWNER_TOKEN || token !== OWNER_TOKEN) {
        await logRequest({ lane, provider: 'openai', model: OWNER_MODEL, ip, ok: false, status_code: 401, prompt_chars: message.length, error_text: 'Invalid owner token' })
        return json({ ok: false, error: 'Invalid owner token' }, 401)
      }
      if (!OPENAI_API_KEY) {
        return json({ ok: false, error: 'OPENAI_API_KEY is not configured in Supabase secrets' }, 500)
      }
      const result = await askOpenAI(message, history, safeText(body?.codeContext, 100000))
      await logRequest({ lane, provider: result.provider, model: result.model, ip, ok: true, status_code: 200, prompt_chars: message.length, response_chars: result.text.length, elapsed_ms: Date.now() - started })
      return json({ ok: true, lane, ...result })
    }

    const rl = await checkRateLimit(`public:${ip}`)
    if (!rl.allowed) {
      await logRequest({ lane, provider: 'rate_limit', model: null, ip, ok: false, status_code: 429, prompt_chars: message.length, error_text: 'Rate limit exceeded' })
      return json({ ok: false, error: 'Rate limit exceeded', reset_at: rl.reset_at }, 429)
    }

    const providerWanted = (body?.publicProvider || 'auto').toLowerCase()
    const result = await askPublic(message, history, providerWanted)
    await logRequest({ lane, provider: result.provider, model: result.model, ip, ok: true, status_code: 200, prompt_chars: message.length, response_chars: result.text.length, elapsed_ms: Date.now() - started })
    return json({ ok: true, lane, ...result, rate_limit: { current_count: rl.current_count, reset_at: rl.reset_at } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected server error'
    await logRequest({ lane: 'unknown', provider: 'unknown', model: null, ip, ok: false, status_code: 500, error_text: message, elapsed_ms: Date.now() - started })
    return json({ ok: false, error: message }, 500)
  }
})
