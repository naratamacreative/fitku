/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

const PLAN_DETAILS: Record<string, { name: string; grossAmount: number }> = {
  pro_monthly: { name: 'FitKu Pro 1 Bulan', grossAmount: 49000 },
  pro_annual: { name: 'FitKu Pro 3 Bulan', grossAmount: 119000 },
  pro_lifetime: { name: 'FitKu Pro 12 Bulan', grossAmount: 399000 },
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid Authorization header' }, 401)
  }
  const token = authHeader.replace('Bearer ', '').trim()

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Supabase configuration missing on server' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token)

  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let body: { planId?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { planId } = body
  if (!planId || !PLAN_DETAILS[planId]) {
    return json({ error: 'Invalid or missing planId' }, 400)
  }

  const planInfo = PLAN_DETAILS[planId]
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

  if (!serverKey) {
    return json({ error: 'MIDTRANS_SERVER_KEY is not configured on server' }, 500)
  }

  // Format: FITKU-PRO-YYYYMMDD-XXXX (matches DOKUMEN_ALUR_TRANSAKSI_FITKU_MIDTRANS.pdf)
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const orderId = `FITKU-PRO-${dateStr}-${randomSuffix}`

  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

  const userEmail = user.email || 'user@fitku.fit'
  const userName = user.user_metadata?.full_name || userEmail.split('@')[0] || 'FitKu User'

  const snapPayload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: planInfo.grossAmount,
    },
    item_details: [
      {
        id: planId,
        price: planInfo.grossAmount,
        quantity: 1,
        name: planInfo.name,
      },
    ],
    customer_details: {
      email: userEmail,
      first_name: userName,
    },
    custom_field1: user.id,
    custom_field2: planId,
  }

  try {
    const midtransAuth = btoa(`${serverKey}:`)
    const snapRes = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${midtransAuth}`,
      },
      body: JSON.stringify(snapPayload),
    })

    const snapData = await snapRes.json()

    if (!snapRes.ok || !snapData.token) {
      return json(
        {
          error: 'Failed to create Midtrans Snap transaction',
          details: snapData,
        },
        502,
      )
    }

    // Persist pending transaction in database
    const { error: dbError } = await admin.from('payment_transactions').insert({
      order_id: orderId,
      user_id: user.id,
      plan: planId,
      gross_amount: planInfo.grossAmount,
      status: 'pending',
      snap_token: snapData.token,
    })

    if (dbError) {
      // Still return the token so user can pay, but log warning
      console.error('Failed to log payment transaction:', dbError)
    }

    return json(
      {
        token: snapData.token,
        redirectUrl: snapData.redirect_url,
        orderId,
        grossAmount: planInfo.grossAmount,
        planId,
      },
      200,
    )
  } catch (err) {
    console.error('Midtrans Snap request error:', err)
    return json({ error: 'Connection to payment gateway failed' }, 502)
  }
}
