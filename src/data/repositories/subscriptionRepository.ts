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

function expiryFor(plan: SubscriptionPlan, startedAt: Date): string | null {
  if (plan === 'pro_lifetime') return null
  const expires = new Date(startedAt)
  if (plan === 'pro_monthly') expires.setMonth(expires.getMonth() + 1)
  if (plan === 'pro_annual') expires.setFullYear(expires.getFullYear() + 1)
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
