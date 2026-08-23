// gtiles — Google Map Tiles API session + satellite proxy
// Key: Supabase Edge secret GOOGLE_MAPS_API_KEY | GOOGLE_PLACES_API_KEY | GOOGLE_MAPS_KEY
// Never Vercel. Never returned to the browser.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function mapsKey(): string {
  return (
    Deno.env.get('GOOGLE_MAPS_API_KEY') ||
    Deno.env.get('GOOGLE_PLACES_API_KEY') ||
    Deno.env.get('GOOGLE_MAPS_KEY') ||
    ''
  ).trim()
}

type Sess = { session: string; expiry: number; key: string; tileWidth: number }
let cache: Sess | null = null

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

async function createSession(k: string): Promise<Sess> {
  const now = Date.now() / 1000
  if (cache && cache.key === k && now < cache.expiry - 120) return cache
  const r = await fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(k), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mapType: 'satellite',
      language: 'en-US',
      region: 'GR',
      imageFormat: 'jpeg',
    }),
  })
  const j = await r.json().catch(() => ({} as Record<string, unknown>))
  const err = (j as { error?: { message?: string; status?: string } }).error
  if (!r.ok || !(j as { session?: string }).session) {
    throw new Error(err?.message || err?.status || 'google session ' + r.status)
  }
  cache = {
    session: String((j as { session: string }).session),
    expiry: Number((j as { expiry?: number }).expiry) || now + 3600,
    key: k,
    tileWidth: Number((j as { tileWidth?: number }).tileWidth) || 256,
  }
  return cache
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const k = mapsKey()
  const url = new URL(req.url)
  const z = url.searchParams.get('z')
  const x = url.searchParams.get('x')
  const y = url.searchParams.get('y')

  if (!k) {
    return json({
      ok: false,
      needsKey: true,
      where: 'supabase-secret',
      hint: 'Supabase → Edge Functions → Secrets → GOOGLE_MAPS_API_KEY (same secret vendor-crawler already reads)',
    })
  }

  try {
    const s = await createSession(k)
    if (z != null && x != null && y != null) {
      const tile =
        'https://tile.googleapis.com/v1/2dtiles/' +
        z +
        '/' +
        x +
        '/' +
        y +
        '?session=' +
        encodeURIComponent(s.session) +
        '&key=' +
        encodeURIComponent(k)
      const img = await fetch(tile)
      if (!img.ok) return json({ ok: false, error: 'tile ' + img.status }, img.status)
      const buf = await img.arrayBuffer()
      return new Response(buf, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': img.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
    return json({
      ok: true,
      engine: 'google-map-tiles',
      where: 'supabase-secret',
      keyed: true,
      session: true,
      expiry: s.expiry,
      tileWidth: s.tileWidth,
      attribution: '© Google',
      proxy: '/api/gtiles?z={z}&x={x}&y={y}',
    })
  } catch (e) {
    return json({
      ok: false,
      keyed: true,
      where: 'supabase-secret',
      error: e instanceof Error ? e.message : String(e),
      hint: 'Secret is present. Enable Map Tiles API on that Google Cloud key.',
    })
  }
})
