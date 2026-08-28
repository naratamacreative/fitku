import { supabase } from '../../shared/lib/supabaseClient'
import type { SubscriptionStatus } from '../types/log.types'

export interface SubscriptionRepository {
  get(userId: string): Promise<SubscriptionStatus>
}

interface SubscriptionRow {
  user_id: string
  plan: SubscriptionStatus['plan']
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
}

export const subscriptionRepository: SubscriptionRepository = new SupabaseSubscriptionRepository()
