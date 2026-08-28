/// <reference types="node" />
// Vercel Edge Function — creates a Midtrans Snap transaction for a Premium plan.
// MIDTRANS_SERVER_KEY never reaches the frontend. The client only ever gets back a
// short-lived Snap `token`, which Snap.js uses to open the payment UI.
export const config = { runtime: 'edge' }

import { getAuthenticatedUser, getServiceClient, isPaidPlan, json, PLAN_AMOUNTS, PLAN_ITEM_NAMES } from './_shared'

// Sandbox only — this task is explicitly Sandbox testing (see fitku-security-status
// memory: real payment stays blocked until backend entitlement + legal land). Switching
// to production is a one-line change to this URL plus a production Server/Client Key,
// left for a separate, explicit go-live decision.
const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions'

interface CreateTransactionBody {
  plan: string
}

interface MidtransSnapResponse {
  token?: string
  redirect_url?: string
  error_messages?: string[]
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const user = await getAuthenticatedUser(request)
  if (!user) {
    return json({ error: 'Sesi tidak valid — coba masuk ulang.' }, 401)
  }

  let body: CreateTransactionBody
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!isPaidPlan(body.plan)) {
    return json({ error: 'Plan tidak dikenali.' }, 400)
  }
  const plan = body.plan
  const grossAmount = PLAN_AMOUNTS[plan]

  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) {
    return json({ error: 'Pembayaran sedang tidak tersedia. Coba lagi nanti.' }, 500)
  }

  const orderId = `fitku-${plan}-${user.id.slice(0, 8)}-${Date.now()}`

  const supabase = getServiceClient()
  const { error: insertError } = await supabase.from('payment_transactions').insert({
    order_id: orderId,
    user_id: user.id,
    plan,
    gross_amount: grossAmount,
    status: 'pending',
  })
  if (insertError) {
    return json({ error: 'Gagal membuat transaksi. Coba lagi.' }, 500)
  }

  try {
    const midtransRes = await fetch(MIDTRANS_SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${btoa(`${serverKey}:`)}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        credit_card: { secure: true },
        customer_details: { email: user.email },
        item_details: [{ id: plan, price: grossAmount, quantity: 1, name: PLAN_ITEM_NAMES[plan] }],
      }),
    })

    const data = (await midtransRes.json()) as MidtransSnapResponse
    if (!midtransRes.ok || !data.token) {
      return json({ error: data.error_messages?.join(', ') ?? 'Gagal membuat transaksi Midtrans.' }, 502)
    }

    return json({ token: data.token, redirectUrl: data.redirect_url, orderId }, 200)
  } catch {
    return json({ error: 'Gagal menghubungi Midtrans. Cek koneksi internetmu dan coba lagi.' }, 502)
  }
}
