/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

async function computeSha512(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function calculateExpiry(plan: string, existingExpiry: string | null): string {
  const base =
    existingExpiry && new Date(existingExpiry).getTime() > Date.now()
      ? new Date(existingExpiry)
      : new Date()

  if (plan === 'pro_monthly') {
    base.setMonth(base.getMonth() + 1)
  } else if (plan === 'pro_annual') {
    base.setMonth(base.getMonth() + 3)
  } else if (plan === 'pro_lifetime') {
    base.setMonth(base.getMonth() + 12)
  } else {
    base.setMonth(base.getMonth() + 1)
  }

  return base.toISOString()
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface MidtransNotificationPayload {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
  transaction_status?: string
  fraud_status?: string
  payment_type?: string
  transaction_id?: string
  custom_field1?: string // user_id
  custom_field2?: string // plan
  [key: string]: unknown
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: MidtransNotificationPayload
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    payment_type,
    transaction_id,
    custom_field1,
    custom_field2,
  } = body

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return json({ error: 'Incomplete notification payload' }, 400)
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    return json({ error: 'MIDTRANS_SERVER_KEY is not configured' }, 500)
  }

  // 1. Cryptographic Signature Verification
  const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`
  const computedSignature = await computeSha512(rawSignature)

  if (computedSignature.toLowerCase() !== signature_key.toLowerCase()) {
    console.error('Midtrans signature verification failed for order:', order_id)
    return json({ error: 'Invalid signature key' }, 403)
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Supabase configuration missing' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // 2. Fetch recorded transaction
  const { data: existingTx } = await admin
    .from('payment_transactions')
    .select('*')
    .eq('order_id', order_id)
    .maybeSingle()

  const userId = existingTx?.user_id || custom_field1
  const plan = existingTx?.plan || custom_field2

  if (!userId || !plan) {
    console.error('Could not identify user or plan for order:', order_id)
    return json({ error: 'Order context not found' }, 404)
  }

  // 3. Check idempotency: if already settled, return immediately
  if (existingTx?.status === 'settlement' && transaction_status === 'settlement') {
    return json({ status: 'already_processed' }, 200)
  }

  const isSuccess =
    transaction_status === 'settlement' ||
    (transaction_status === 'capture' && fraud_status === 'accept')

  const nowIso = new Date().toISOString()

  if (isSuccess) {
    // 4. Update transaction status to settlement
    await admin
      .from('payment_transactions')
      .update({
        status: 'settlement',
        payment_type: payment_type ?? null,
        transaction_id: transaction_id ?? null,
        payload: body,
        updated_at: nowIso,
      })
      .eq('order_id', order_id)

    // 5. Calculate expiry and activate user's subscription
    const { data: currentSub } = await admin
      .from('subscription_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const newExpiry = calculateExpiry(plan, currentSub?.expires_at ?? null)

    await admin.from('subscription_status').upsert(
      {
        user_id: userId,
        plan,
        status: 'active',
        started_at: currentSub?.started_at ?? nowIso,
        expires_at: newExpiry,
        trial_used: true,
      },
      { onConflict: 'user_id' },
    )

    console.info(`Successfully activated Pro plan (${plan}) for user ${userId} via order ${order_id}`)
  } else if (
    transaction_status === 'cancel' ||
    transaction_status === 'deny' ||
    transaction_status === 'expire'
  ) {
    await admin
      .from('payment_transactions')
      .update({
        status: transaction_status,
        payload: body,
        updated_at: nowIso,
      })
      .eq('order_id', order_id)
  } else if (transaction_status === 'pending') {
    await admin
      .from('payment_transactions')
      .update({
        status: 'pending',
        payment_type: payment_type ?? null,
        transaction_id: transaction_id ?? null,
        payload: body,
        updated_at: nowIso,
      })
      .eq('order_id', order_id)
  }

  return json({ status: 'ok' }, 200)
}
