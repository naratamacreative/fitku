/// <reference types="node" />
// Vercel Edge Function — Midtrans server-to-server payment notification webhook.
// This is the ONLY place subscription_status is ever written after the payments
// migration (supabase/migrations/0003_payments.sql) locked client writes out via RLS.
// The client is never trusted to self-report a successful payment — every notification
// is verified against Midtrans's own signature before anything is granted.
export const config = { runtime: 'edge' }

import { expiryFor, getServiceClient, isPaidPlan, json, sha512Hex } from './_shared'

interface MidtransNotification {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
  transaction_status?: string
  fraud_status?: string
  payment_type?: string
  transaction_id?: string
}

// Midtrans transaction_status/fraud_status → our own payment_transactions status enum.
// 'challenge' (3DS manual review) is treated as pending, not granted, until Midtrans
// sends a follow-up notification resolving it.
function resolveStatus(n: MidtransNotification): 'settlement' | 'capture' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure' | null {
  const { transaction_status, fraud_status } = n
  if (transaction_status === 'capture') return fraud_status === 'accept' ? 'capture' : 'pending'
  if (transaction_status === 'settlement') return 'settlement'
  if (transaction_status === 'pending') return 'pending'
  if (
    transaction_status === 'deny' ||
    transaction_status === 'cancel' ||
    transaction_status === 'expire' ||
    transaction_status === 'failure'
  ) {
    return transaction_status
  }
  return null
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: MidtransNotification
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { order_id, status_code, gross_amount, signature_key } = body
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  const expectedSignature = await sha512Hex(`${order_id}${status_code}${gross_amount}${serverKey}`)
  if (expectedSignature !== signature_key) {
    return json({ error: 'Invalid signature' }, 403)
  }

  const supabase = getServiceClient()
  const { data: transaction, error: fetchError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('order_id', order_id)
    .maybeSingle()

  // Unrecognized order_id, or already-resolved amount mismatch: acknowledge with 200
  // (Midtrans retries on non-200) but do not grant anything.
  if (fetchError || !transaction) {
    return json({ received: true }, 200)
  }
  if (Math.round(Number(gross_amount)) !== transaction.gross_amount) {
    return json({ received: true }, 200)
  }

  const resolved = resolveStatus(body)
  if (!resolved) {
    return json({ received: true }, 200)
  }

  await supabase
    .from('payment_transactions')
    .update({
      status: resolved,
      midtrans_transaction_id: body.transaction_id ?? null,
      payment_type: body.payment_type ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', order_id)

  const isSuccess = resolved === 'settlement' || resolved === 'capture'
  if (isSuccess && isPaidPlan(transaction.plan)) {
    const now = new Date()
    await supabase.from('subscription_status').upsert(
      {
        user_id: transaction.user_id,
        plan: transaction.plan,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiryFor(transaction.plan, now),
        trial_used: true,
      },
      { onConflict: 'user_id' },
    )
  }

  return json({ received: true }, 200)
}
