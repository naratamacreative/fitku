import { supabase } from '../../shared/lib/supabaseClient'
import type { SubscriptionPlan, SubscriptionStatus } from '../types/log.types'

export interface SubscriptionRepository {
  get(userId: string): Promise<SubscriptionStatus>
  activate(userId: string, plan: SubscriptionPlan): Promise<SubscriptionStatus>
}

interface SubscriptionRow {
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus['status']
  started_at: string | null
  expires_at: string | null
  trial_used: boolean
}

function fromRow(row: SubscriptionRow): SubscriptionStatus {
  return {
    userId: row.user_id,
    plan: row.plan,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    trialUsed: row.trial_used,
  }
}

// Plan ids are legacy/stable (see paywall.triggers.ts PRO_PLANS comment) but their sold
// name/duration changed to a 3-tier scheme: pro_monthly = 1 bulan, pro_annual = 3 bulan,
// pro_lifetime = 12 bulan. Durations below were previously mismatched (pro_annual expired
// after 1 YEAR, pro_lifetime never expired) — fixed here to match what's actually sold.
// 'dev_test' is the only plan that legitimately never expires: an internal-only grant for
// pre-launch testing, never offered through Premium.tsx's plan picker.
function expiryFor(plan: SubscriptionPlan, startedAt: Date): string | null {
  if (plan === 'dev_test') return null
  const expires = new Date(startedAt)
  if (plan === 'pro_monthly') expires.setMonth(expires.getMonth() + 1)
  if (plan === 'pro_annual') expires.setMonth(expires.getMonth() + 3)
  if (plan === 'pro_lifetime') expires.setMonth(expires.getMonth() + 12)
  return expires.toISOString()
}

class SupabaseSubscriptionRepository implements SubscriptionRepository {
  async get(userId: string): Promise<SubscriptionStatus> {
    const { data, error } = await supabase
      .from('subscription_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (data) return fromRow(data as SubscriptionRow)

    // No row yet — same in-memory fallback as before, no row is inserted just for a read.
    return { userId, plan: 'free', status: 'none', startedAt: null, expiresAt: null, trialUsed: false }
  }

  async activate(userId: string, plan: SubscriptionPlan): Promise<SubscriptionStatus> {
    const now = new Date()
    const { data, error } = await supabase
      .from('subscription_status')
      .upsert(
        {
          user_id: userId,
          plan,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expiryFor(plan, now),
          trial_used: true,
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single()
    if (error) throw error
    return fromRow(data as SubscriptionRow)
  }
}

export const subscriptionRepository: SubscriptionRepository = new SupabaseSubscriptionRepository()
