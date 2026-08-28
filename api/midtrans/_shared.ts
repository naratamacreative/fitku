/// <reference types="node" />
// Shared helpers for the Midtrans edge functions. Filename starts with `_` so Vercel
// does not treat it as a routable endpoint.
import { createClient } from '@supabase/supabase-js'

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual' | 'pro_lifetime'
type PaidPlan = Exclude<SubscriptionPlan, 'free'>

// Canonical IDR amounts — server is the only source of truth for price, the client
// never sends an amount. Must match the display labels in
// src/features/paywall/paywall.triggers.ts (49rb / 119rb / 399rb) exactly.
export const PLAN_AMOUNTS: Record<PaidPlan, number> = {
  pro_monthly: 49000,
  pro_annual: 119000,
  pro_lifetime: 399000,
}

export const PLAN_ITEM_NAMES: Record<PaidPlan, string> = {
  pro_monthly: 'FitKu Premium — 1 Bulan',
  pro_annual: 'FitKu Premium — 3 Bulan',
  pro_lifetime: 'FitKu Premium — 12 Bulan',
}

export function isPaidPlan(plan: unknown): plan is PaidPlan {
  return plan === 'pro_monthly' || plan === 'pro_annual' || plan === 'pro_lifetime'
}

// Mirrors subscriptionRepository.ts's expiryFor() — duplicated rather than imported
// because that module pulls in supabaseClient.ts, which reads import.meta.env and is
// built for the Vite/browser bundle, not this edge runtime.
export function expiryFor(plan: PaidPlan, startedAt: Date): string | null {
  if (plan === 'pro_lifetime') return null
  const expires = new Date(startedAt)
  if (plan === 'pro_monthly') expires.setMonth(expires.getMonth() + 1)
  if (plan === 'pro_annual') expires.setFullYear(expires.getFullYear() + 1)
  return expires.toISOString()
}

export async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Service-role client — bypasses RLS. Only ever used server-side, after our own verification. */
export function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

/**
 * Verifies the caller's Supabase access token and returns the real authenticated user —
 * never trust a client-supplied userId for who is paying.
 */
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')

  const client = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
