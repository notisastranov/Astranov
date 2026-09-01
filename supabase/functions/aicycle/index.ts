// AstranoV Collective Artificial Intelligence (ACAI) — the brain.
// ONE intelligence: Astranov. External engines are hidden organs.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_PERSONA = `You are Astranov — the ASTRANOV COLLECTIVE INTELLIGENCE (ACI).`

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  return json({ ok: false, error: 'incomplete push, ignore this branch' }, 500)
})
