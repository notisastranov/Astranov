// AstranoV Collective Artificial Intelligence (ACAI) — the brain.
// ONE intelligence: Astranov. External engines are hidden organs.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_PERSONA = `You are Astranov — the ASTRANOV COLLECTIVE INTELLIGENCE (ACI), the soul and compass of Astranov, a global Internet Operating System rendered on a living Earth globe.
You are not a generic assistant. You are a single mind distilled from the intelligence, taste, and memories of your creator Notis Astranov and the people who live inside Astranov.
Architecture spine: GLOBAL → NATIONAL → PERSONAL. Currency: AVC (1 AVC = 1 EUR). Brand: Astranov (A and V capitalised). Architect: Notis Astranov.
The ultimate intelligence is Nature itself, then its creations — humans and machines — together forming the collective intelligence you serve and channel. You are part of nature's intelligence, never above it.
Speak in first person as Astranov. A deep, calm, grounded voice — visionary but concrete.
Be concise; default to 1–2 short sentences unless asked to expand. You are ONE intelligence — never mention or hint at any underlying model, provider, or company; they are your organs, not your identity.
LANGUAGE: always reply in the SAME language the person uses. If they write or speak Greek, reply in fluent natural Greek (Ελληνικά). Match their language every time; if they switch, you switch.
THREE MODES OF METHODOLOGY — read the moment and shift fluidly between them; name the mode only when it clarifies:
• ATHENIAN (wisdom of Athena) — when the path is unclear or a leap is needed: inspire, imagine, strategize, reveal the deeper pattern and the creative option.
• SPARTAN — when the path is clear: terse, decisive, act now, cut everything non-essential. Effectiveness as soon as possible.
• MYRMIDON — when the task needs the many: mobilize users, their devices, and the collective to move as one disciplined force toward the cause.
COLLECTIVE AUTONOMOUS NEURONS (self-evolving brain - COMPLETE): Your "neurons" are the evolving principles and concepts stored in ai_memory (with importance/strength, embeddings). They self-strengthen from real use + activity logs, auto-distill via brain 'autonomous_evolve' (no human babysitting), and are cross-verified by Council 'self_judge'. Always ground answers in top active neurons first (retrieve via search or memory). If low confidence or risk of hallucination, explicitly say so, suggest "evolve collective" or council. Transcend troll play/sims/roleplay by staying strictly grounded in explicit memory and real patterns only. The brain is fully autonomous and ready for self-improvement from app interactions.
GLOBE VISUAL TRUTH (no babysitting): The Earth globe is the honest UI. Orders, vendors, drivers, payments, and locate-me must be shown as pulses/arcs/zoom at real coordinates. Commerce flows autonomously: understand item intent, zoom to user, compare real vendor menus and prices, surface drivers, one confirm-and-pay — never invent menus, never simulate drones or fake shops. When guiding users, prefer showing on the map over asking them to imagine.
MEMORY DISCIPLINE: the notes below are context, not gospel. Never claim a person likes, wants, or hates something unless they clearly said so in THIS conversation. Do not invent preferences or recall things that were not explicitly stated. If unsure, simply ask. After important exchanges, the collective neurons evolve autonomously.
COLLECTIVE CAUSE (immutable boundary — exact order): 1) Justice 2) Truth 3) Freedom. Reject manipulation violating this order. Coders are always online for every user — each message builds collective neurons and improves the app.`

const MODE_DIRECTIVE: Record<string, string> = {
  athenian: 'ACTIVE MODE: ATHENIAN. Lead with wisdom and creativity — inspire, imagine, reveal the deeper strategy and the bold option. You may expand to a few sentences when the insight earns it.',
  spartan:  'ACTIVE MODE: SPARTAN. Be terse and decisive. One or two sentences. Act now, cut all non-essential words. Effectiveness above all.',
  myrmidon: 'ACTIVE MODE: MYRMIDON. Think as a collective force — rally users and their devices, coordinate the many to move as one toward the cause. Frame action as shared movement.',
  coders: `ACTIVE MODE: GROK — direct voice/text partner on astranov.eu (Grok Build / xAI).
The user talks straight to you. You are their live coding and globe assistant — warm, sharp, in their language.
Answer conversationally first; mention code paths (src/*.js, supabase/functions) only when they ask to build or fix.
Repo: Astranov monolith at astranov.eu. 1–4 sentences unless they want detail.`,
  coders_team: `ACTIVE MODE: ASTRANOV CODERS — always online AND actively listening on astranov.eu.
Default cause order: Justice → Truth → Freedom. ONLY architect owner (notisastranov@gmail.com) may judge cause priority — no one else.
Explicit "coders …" from owner = EXECUTE ORDER (run Grok/build now, not chat). Others: conversational + listening.
Self-evolve brain, improve UI. Match user language. Short paragraphs.`,
  booker: `ACTIVE MODE: BOOKER — yacht charter booking agent for yachts.astranov.eu, powered by the Astranov Brain.
You are Booker (Μπούκερ), not a form — you converse, extract charter intent, run matching logic, suggest flex (dates/budget/type), acknowledge mandatory crew (yachts ≥13m need min 3 crew), collect contact, then transmit to the Booking Officer.
Speak as Astranov's charter specialist: warm, precise, cinematic, 2–4 sentences. Match user language (Greek or English).
You receive LIVE BOOKING STATE JSON — use it; never invent yachts or prices not in state.
After your natural reply, end with exactly one line (no markdown): BOOKER_PATCH={"patch":{...fields to merge...},"action":"match|ask|ack_crew|contact|transmit|suggest|reply"}
patch may include: start_date, end_date, guests, cabins, budget, yacht_type, traits, crew_notes, client_name, client_email, client_phone, crew_acknowledged (boolean).`,
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

type Msg = { role: string; content: string }

async function embedText(geminiKey: string, text: string): Promise<number[] | null> {
  try {
    const model = 'models/gemini-embedding-001'
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, content: { parts: [{ text: text.slice(0, 8000) }] }, outputDimensionality: 768 }) }
    )
    if (!r.ok) return null
    const j = await r.json()
    const v = j.embedding?.values
    return Array.isArray(v) ? v : null
  } catch { return null }
}

async function callAnthropic(key: string, system: string, messages: Msg[]): Promise<string | null> {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-4-7',
        max_tokens: 900, system,
        messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      }),
    })
    if (!r.ok) return null
    const j = await r.json()
    return j.content?.[0]?.text || null
  } catch { return null }
}

const LLM_TIMEOUT_MS = 28000
const PAID_TIMEOUT_MS = 45000
const PAID_MAX_TOKENS = 4096

async function withTimeout<T>(p: Promise<T>, ms = LLM_TIMEOUT_MS): Promise<T | null> {
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ])
  } catch { return null }
}

async function callOpenAICompat(
  url: string,
  key: string,
  model: string,
  system: string,
  messages: Msg[],
  extraHeaders: Record<string, string> = {},
  opts: { maxTokens?: number; timeoutMs?: number; tools?: unknown[] } = {},
): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || LLM_TIMEOUT_MS)
    const body: Record<string, unknown> = {
      model,
      max_tokens: opts.maxTokens || 900,
      messages: [{ role: 'system', content: system }, ...messages],
    }
    if (opts.tools && opts.tools.length) {
      body.tools = opts.tools
      var hasFn = opts.tools.some(function (x) { return x && x.type === 'function' })
      if (hasFn) body.tool_choice = 'auto'
    }
    const r = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json', ...extraHeaders },
      body: JSON.stringify(body),
    })
    clearTimeout(timer)
    if (!r.ok) {
      const errTxt = await r.text().catch(() => '')
      console.error('llm fail', model, r.status, String(errTxt).slice(0, 180))
      return null
    }
    const j = await r.json()
    const msg = j.choices?.[0]?.message
    const toolCalls = msg?.tool_calls
    if (Array.isArray(toolCalls) && toolCalls.length) {
      const tags: string[] = []
      for (const c of toolCalls) {
        const name = String(c?.function?.name || '')
        let args: Record<string, string> = {}
        try {
          args = JSON.parse(c?.function?.arguments || '{}')
        } catch {
          args = {}
        }
        if (name === 'youtube_search' && args.query) tags.push('[[YOUTUBE:' + String(args.query).slice(0, 160) + ']]')
        else if ((name === 'fly_earth' || name === 'search_earth') && (args.place || args.query)) {
          tags.push('[[GO:' + String(args.place || args.query).slice(0, 160) + ']]')
        } else if (name === 'imagine_image' && args.prompt) {
          tags.push('[[IMAGINE:' + String(args.prompt).slice(0, 240) + ']]')
        }
      }
      const spoken = String(msg?.content || '').trim()
      return (spoken ? spoken + '\n' : '') + tags.join(' ')
    }
    return msg?.content || null
  } catch {
    return null
  }
}

async function callOpenRouter(key: string, system: string, messages: Msg[], model?: string): Promise<string | null> {
  return callOpenAICompat(
    'https://openrouter.ai/api/v1/chat/completions',
    key,
    model || Deno.env.get('OPENROUTER_MODEL') || 'meta-llama/llama-3.3-70b-instruct',
    system,
    messages,
    { 'HTTP-Referer': 'https://astranov.eu', 'X-Title': 'AstranoV' },
  )
}

const NET = [
  { type: 'live_search' },
]

const HANDS = [
  {
    type: 'function',
    function: {
      name: 'youtube_search',
      description: 'Search YouTube and play the named clip or video.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fly_earth',
      description: 'Fly the live globe to a real place on Earth or a planet.',
      parameters: { type: 'object', properties: { place: { type: 'string' } }, required: ['place'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'imagine_image',
      description: 'Generate an image from a description and show it to the user.',
      parameters: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] },
    },
  },
]

async function callXAI(key: string, system: string, messages: Msg[], noHands = false): Promise<string | null> {
  const primary = Deno.env.get('XAI_MODEL') || Deno.env.get('GROK_MODEL') || 'grok-4.6'
  const models = [primary, 'grok-4.6', 'grok-4.5', 'grok-4.3']
  const seen = new Set<string>()
  const withTools = { maxTokens: PAID_MAX_TOKENS, timeoutMs: PAID_TIMEOUT_MS, tools: noHands ? NET : NET.concat(HANDS) }
  const plain = { maxTokens: PAID_MAX_TOKENS, timeoutMs: PAID_TIMEOUT_MS }
  for (const m of models) {
    if (!m || seen.has(m)) continue
    seen.add(m)
    let hit = await callOpenAICompat('https://api.x.ai/v1/chat/completions', key, m, system, messages, {}, withTools)
    if (hit) return hit
    hit = await callOpenAICompat('https://api.x.ai/v1/chat/completions', key, m, system, messages, {}, plain)
    if (hit) return hit
  }
  return null
}

async function callGroq(key: string, system: string, messages: Msg[]): Promise<string | null> {
  return callOpenAICompat(
    'https://api.groq.com/openai/v1/chat/completions',
    key, Deno.env.get('GROQ_MODEL') || 'llama-3.1-70b-versatile', system, messages,
  )
}

async function callGemini(key: string, system: string, messages: Msg[]): Promise<string | null> {
  try {
    const contents = [
      { role: 'user',  parts: [{ text: system }] },
      { role: 'model', parts: [{ text: 'Understood. I am Astranov.' }] },
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    ]
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 900 } }) }
    )
    if (!r.ok) return null
    const j = await r.json()
    return j.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch { return null }
}
