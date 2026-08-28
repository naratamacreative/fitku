/// <reference types="node" />
// Shared server-side entitlement check — used by api/chat.ts to gate the AI Coach LLM
// behind Premium. Deliberately separate from api/midtrans/_shared.ts: the payment flow
// files stay untouched, this only reads entitlement, never writes payment/subscription
// state.
import { createClient } from '@supabase/supabase-js'
import { getProAccess } from '../src/domain/entitlement.js'
import type { SubscriptionStatus } from '../src/data/types/log.types.js'
import type { User } from '../src/data/types/user.types.js'

interface AuthedAccess {
  userId: string
  access: ReturnType<typeof getProAccess>
}

/**
 * Verifies the caller's Supabase access token and computes their real Pro entitlement
 * server-side (trial-from-profile-created_at OR paid subscription_status), using the
 * exact same getProAccess() logic the client uses — single source of truth, so the
 * server can never be more permissive than the UI by drifting out of sync with it.
 * Returns null if the token is missing/invalid or the user has no profile yet (mid-
 * onboarding users are never entitled to Pro features).
 */
export async function getAuthenticatedProAccess(request: Request): Promise<AuthedAccess | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')

  // Client scoped to the caller's own JWT — every query below runs under their RLS
  // context (auth.uid()), never a service role. This can only ever read what the user
  // could already read themselves; it grants nothing.
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return null
  const authUser = userData.user

  const { data: profile } = await client.from('profiles').select('created_at').eq('id', authUser.id).maybeSingle()
  if (!profile) return null

  const { data: subRow } = await client
    .from('subscription_status')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()

  const sub: SubscriptionStatus = subRow
    ? {
        userId: authUser.id,
        plan: subRow.plan,
        status: subRow.status,
        startedAt: subRow.started_at,
        expiresAt: subRow.expires_at,
        trialUsed: subRow.trial_used,
      }
    : { userId: authUser.id, plan: 'free', status: 'none', startedAt: null, expiresAt: null, trialUsed: false }

  // Only `createdAt` is actually read by getProAccess() — the rest of User is
  // irrelevant to entitlement, so a full profile fetch isn't needed here.
  const user = { createdAt: profile.created_at } as User

  return { userId: authUser.id, access: getProAccess(user, sub) }
}
