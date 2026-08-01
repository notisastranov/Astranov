// debug-write — browser/agent payloads → public storage (service role)
// kind: live_bridge → live-bridge.json (runtime control without redeploy)
// else → errors.json + session copy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const payload = await req.json().catch(() => ({}))
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await sb.storage.createBucket('debug-pub', { public: true }).catch(() => {})

    const kind = String(payload.kind || '').toLowerCase()
    const received_at = new Date().toISOString()

    // —— Live bridge: runtime cmds for all open browsers ——
    if (kind === 'live_bridge' || kind === 'live-bridge' || kind === 'bridge') {
      const body = JSON.stringify(
        {
          received_at,
          seq: payload.seq || Date.now(),
          cmds: payload.cmds || payload.commands || [],
          notes: payload.notes || [],
          from: payload.from || 'agent',
          note: payload.note || '',
          build: payload.build || '',
          at: payload.at || received_at,
        },
        null,
        2
      )
      const blob = new Blob([body], { type: 'application/json' })
      const { error } = await sb.storage
        .from('debug-pub')
        .upload('live-bridge.json', blob, { contentType: 'application/json', upsert: true })
      return new Response(
        JSON.stringify({
          ok: !error,
          file: 'live-bridge.json',
          public:
            (Deno.env.get('SUPABASE_URL') || '') +
            '/storage/v1/object/public/debug-pub/live-bridge.json',
          error: error?.message ?? null,
        }),
        { headers: cors }
      )
    }

    const body = JSON.stringify({ received_at, ...payload }, null, 2)
    const blob = new Blob([body], { type: 'application/json' })

    const { error: e1 } = await sb.storage
      .from('debug-pub')
      .upload('errors.json', blob, { contentType: 'application/json', upsert: true })

    const sid = payload.session || 'unknown'
    const fname = `sessions/${sid}-${Date.now()}.json`
    await sb.storage
      .from('debug-pub')
      .upload(fname, blob, { contentType: 'application/json', upsert: true })
      .catch(() => {})

    return new Response(
      JSON.stringify({ ok: true, file: 'errors.json', error: e1?.message ?? null }),
      { headers: cors }
    )
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: cors,
    })
  }
})
