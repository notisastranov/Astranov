// osrm-route — Astranov street routing gateway
// Backend: env OSRM_URL (self-hosted) or public router.project-osrm.org
// GET  ?path=lng,lat;lng,lat  OR  ?coords=...
// POST { waypoints: [{lat,lng}, ...] } | { path: "lng,lat;..." }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
}

const PUBLIC = 'https://router.project-osrm.org'
const CACHE = new Map<string, { at: number; body: unknown }>()
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_WP = 25

function osrmRoot(): string {
  const u = (Deno.env.get('OSRM_URL') || Deno.env.get('OSRM_BASE') || '').replace(/\/$/, '')
  return u || PUBLIC
}

function engineLabel(root: string): string {
  if (root.includes('project-osrm.org')) return 'osrm-public'
  return 'osrm-selfhosted'
}

function parsePath(raw: string): string | null {
  const s = String(raw || '').trim()
  if (!s) return null
  // lng,lat;lng,lat — reject junk
  if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?(;-?\d+(\.\d+)?,-?\d+(\.\d+)?)+$/.test(s)) return null
  const n = s.split(';').length
  if (n < 2 || n > MAX_WP) return null
  return s
}

function pathFromWaypoints(wps: Array<{ lat?: number; lng?: number }>): string | null {
  if (!Array.isArray(wps) || wps.length < 2 || wps.length > MAX_WP) return null
  const parts: string[] = []
  for (const p of wps) {
    const lat = Number(p?.lat)
    const lng = Number(p?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    parts.push(lng + ',' + lat)
  }
  return parts.join(';')
}

function normalizeRoute(j: Record<string, unknown>, root: string) {
  const routes = (j.routes as Array<Record<string, unknown>>) || []
  const rt = routes[0]
  if (!rt) return null
  const geom = rt.geometry as { coordinates?: number[][] } | undefined
  const coords = geom?.coordinates
  if (!coords?.length) return null
  const points = coords.map((c) => ({ lat: c[1], lng: c[0] }))
  const km = rt.distance != null ? Number(rt.distance) / 1000 : 0
  const durationS = rt.duration != null ? Number(rt.duration) : 0
  return {
    ok: true,
    engine: engineLabel(root),
    engineRoot: root,
    points,
    km,
    durationS,
    distanceM: Number(rt.distance) || km * 1000,
    weight: rt.weight,
    code: j.code || 'Ok',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    let pathStr: string | null = null
    let overview = 'full'
    let geometries = 'geojson'
    let steps = false

    if (req.method === 'GET') {
      const u = new URL(req.url)
      pathStr = parsePath(u.searchParams.get('path') || u.searchParams.get('coords') || '')
      overview = u.searchParams.get('overview') || overview
      geometries = u.searchParams.get('geometries') || geometries
      steps = u.searchParams.get('steps') === 'true'
    } else {
      const body = await req.json().catch(() => ({}))
      pathStr =
        parsePath(String(body.path || body.coords || '')) ||
        pathFromWaypoints(body.waypoints || body.points || [])
      if (body.overview) overview = String(body.overview)
      if (body.geometries) geometries = String(body.geometries)
      if (body.steps === true) steps = true
    }

    if (!pathStr) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'need 2..' + MAX_WP + ' waypoints as path=lng,lat;lng,lat or waypoints:[{lat,lng}]',
        }),
        { status: 400, headers: cors },
      )
    }

    const root = osrmRoot()
    const cacheKey = root + '|' + pathStr + '|' + overview + '|' + steps
    const hit = CACHE.get(cacheKey)
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ ...(hit.body as object), cached: true }), { headers: cors })
    }

    const qs =
      'overview=' +
      encodeURIComponent(overview) +
      '&geometries=' +
      encodeURIComponent(geometries) +
      '&steps=' +
      (steps ? 'true' : 'false')
    const url = root + '/route/v1/driving/' + pathStr + '?' + qs

    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 12000)
    let res: Response
    try {
      res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      })
    } finally {
      clearTimeout(to)
    }

    if (!res.ok) {
      // fallback to public if self-hosted fails
      if (root !== PUBLIC) {
        const fb =
          PUBLIC + '/route/v1/driving/' + pathStr + '?' + qs
        const r2 = await fetch(fb, { headers: { Accept: 'application/json' } })
        if (!r2.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: 'osrm ' + res.status + ' / public ' + r2.status }),
            { status: 502, headers: cors },
          )
        }
        const j2 = await r2.json()
        const norm2 = normalizeRoute(j2, PUBLIC)
        if (!norm2) {
          return new Response(JSON.stringify({ ok: false, error: 'no geometry' }), {
            status: 502,
            headers: cors,
          })
        }
        const out2 = { ...norm2, fallback: true, preferredRoot: root }
        CACHE.set(cacheKey, { at: Date.now(), body: out2 })
        return new Response(JSON.stringify(out2), { headers: cors })
      }
      return new Response(JSON.stringify({ ok: false, error: 'osrm HTTP ' + res.status }), {
        status: 502,
        headers: cors,
      })
    }

    const j = await res.json()
    const norm = normalizeRoute(j, root)
    if (!norm) {
      return new Response(JSON.stringify({ ok: false, error: 'no geometry', rawCode: j.code }), {
        status: 502,
        headers: cors,
      })
    }
    CACHE.set(cacheKey, { at: Date.now(), body: norm })
    return new Response(JSON.stringify(norm), { headers: cors })
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }),
      { status: 500, headers: cors },
    )
  }
})
