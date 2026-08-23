import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
}
const OWNER = 'notisastranov@gmail.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  if (req.method === 'GET') {
    const { data } = await sb.from('investor_budget').select('payload, updated_at').eq('id', 'deck-v1').maybeSingle()
    return new Response(JSON.stringify({ ok: true, payload: data?.payload || null, updated_at: data?.updated_at || null }), { headers: cors })
  }

  if (req.method === 'POST') {
    const auth = req.headers.get('authorization') ?? ''
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'login_required' }), { status: 401, headers: cors })
    }
    const userSb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { authorization: auth } },
      auth: { persistSession: false },
    })
    const { data: { user } } = await userSb.auth.getUser()
    const email = String(user?.email || '').toLowerCase()
    if (!user || email !== OWNER) {
      return new Response(JSON.stringify({ error: 'owner_only' }), { status: 403, headers: cors })
    }
    const body = await req.json().catch(() => ({}))
    const payload = body.payload || body
    const { error } = await sb.from('investor_budget').upsert({
      id: 'deck-v1',
      payload,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: cors })
    return new Response(JSON.stringify({ ok: true }), { headers: cors })
  }

  return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: cors })
})
