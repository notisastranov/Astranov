import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Body = {
  action?: 'create' | 'capture' | 'health'
  amount?: number
  currency?: string
  description?: string
  orderId?: string
  kind?: 'purchase' | 'top_up'
  reference?: string
  signalId?: string
  returnUrl?: string
  cancelUrl?: string
  userId?: string
}

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || ''
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || ''
const PAYPAL_ENV = (Deno.env.get('PAYPAL_ENV') || 'live').trim().toLowerCase() === 'sandbox' ? 'sandbox' : 'live'
const PAYPAL_BASE_URL = PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || ''
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

function safeText(value: unknown, max = 240) {
  return String(value || '').trim().slice(0, max)
}

function safeAmount(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.round(Math.max(amount, 0) * 100) / 100
}

function ensureUrl(value: string, fallbackStatus: 'success' | 'cancel') {
  const base = safeText(value || APP_BASE_URL, 2048) || 'https://astranov.eu/'
  const url = new URL(base)
  url.searchParams.set('paypal_status', fallbackStatus)
  return url.toString()
}

function buildCustomId(body: Body) {
  const kind = body.kind === 'top_up' ? 'top_up' : 'purchase'
  const reference = safeText(body.orderId || body.reference || body.signalId || 'astranov', 96)
  return `${kind}:${reference}`
}

function parseCustomId(customId: string) {
  const [kindRaw, ...rest] = safeText(customId, 120).split(':')
  const kind = kindRaw === 'top_up' ? 'top_up' : 'purchase'
  return {
    kind,
    reference: rest.join(':'),
  }
}

async function getAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are not configured in Supabase secrets')
  }

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || 'PayPal OAuth failed')
  }

  return safeText(data?.access_token, 4096)
}

async function paypalFetch(path: string, token: string, init: RequestInit) {
  const res = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || data?.details?.[0]?.description || 'PayPal API request failed')
  }

  return data
}

async function createPayPalOrder(body: Body) {
  const amount = safeAmount(body.amount)
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  const token = await getAccessToken()
  const currency = safeText(body.currency || 'EUR', 8) || 'EUR'
  const customId = buildCustomId(body)
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: safeText(body.orderId || body.reference || body.signalId || 'astranov', 127) || undefined,
        description: safeText(body.description || 'Astranov checkout', 127) || 'Astranov checkout',
        custom_id: customId,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: 'Astranov Planet',
      user_action: 'PAY_NOW',
      return_url: ensureUrl(body.returnUrl || APP_BASE_URL, 'success'),
      cancel_url: ensureUrl(body.cancelUrl || APP_BASE_URL, 'cancel'),
      shipping_preference: 'NO_SHIPPING',
    },
  }

  const data = await paypalFetch('/v2/checkout/orders', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const approveUrl = data?.links?.find((entry: any) => entry?.rel === 'payer-action' || entry?.rel === 'approve')?.href || ''
  if (!approveUrl) throw new Error('PayPal approval URL missing from create order response')

  return {
    ok: true,
    action: 'create',
    env: PAYPAL_ENV,
    kind: parseCustomId(customId).kind,
    orderId: safeText(data?.id, 128),
    approveUrl,
    amount,
    currency,
  }
}

async function syncCaptureToDatabase(capture: any) {
  const purchaseUnit = capture?.purchase_units?.[0]
  const customId = safeText(purchaseUnit?.custom_id, 120)
  const parsed = parseCustomId(customId)
  const captureId = safeText(purchaseUnit?.payments?.captures?.[0]?.id, 128)
  const amount = safeAmount(purchaseUnit?.payments?.captures?.[0]?.amount?.value || purchaseUnit?.amount?.value)

  if (!db || !captureId) {
    return { synced: false, kind: parsed.kind, reference: parsed.reference, captureId }
  }

  try {
    if (parsed.kind === 'top_up') {
      const { data, error } = await db.rpc('create_wallet_topup', {
        p_payload: {
          amountEur: amount,
          paymentProvider: 'paypal',
          providerReference: captureId,
        },
      })
      if (error) throw error
      return { synced: true, kind: parsed.kind, reference: parsed.reference, captureId, db: data }
    }

    const { data, error } = await db.rpc('bind_order_payment_reference', {
      p_payload: {
        orderId: parsed.reference,
        paymentProvider: 'paypal',
        providerReference: captureId,
      },
    })
    if (error) throw error
    return { synced: true, kind: parsed.kind, reference: parsed.reference, captureId, db: data }
  } catch (error) {
    return {
      synced: false,
      kind: parsed.kind,
      reference: parsed.reference,
      captureId,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function capturePayPalOrder(orderId: string) {
  const cleanOrderId = safeText(orderId, 128)
  if (!cleanOrderId) throw new Error('orderId is required')

  const token = await getAccessToken()
  const data = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(cleanOrderId)}/capture`, token, {
    method: 'POST',
    body: JSON.stringify({}),
  })

  const sync = await syncCaptureToDatabase(data)
  const purchaseUnit = data?.purchase_units?.[0]
  const captureId = safeText(purchaseUnit?.payments?.captures?.[0]?.id, 128)
  const amount = safeAmount(purchaseUnit?.payments?.captures?.[0]?.amount?.value || purchaseUnit?.amount?.value)
  const currency = safeText(purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || purchaseUnit?.amount?.currency_code, 8)
  const parsed = parseCustomId(safeText(purchaseUnit?.custom_id, 120))

  return {
    ok: true,
    action: 'capture',
    env: PAYPAL_ENV,
    status: safeText(data?.status, 48) || 'COMPLETED',
    orderId: cleanOrderId,
    captureId,
    amount,
    currency,
    kind: parsed.kind,
    reference: parsed.reference,
    sync,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json()) as Body
    const action = body.action || 'health'

    if (action === 'health') {
      return json({
        ok: true,
        env: PAYPAL_ENV,
        configured: !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET),
        dbAvailable: !!db,
      })
    }

    if (action === 'create') {
      return json(await createPayPalOrder(body))
    }

    if (action === 'capture') {
      return json(await capturePayPalOrder(body.orderId || ''))
    }

    return json({ ok: false, error: 'Unknown action' }, 400)
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected server error',
    }, 500)
  }
})
