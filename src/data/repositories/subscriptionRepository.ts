import { db } from '../db'
import type { SubscriptionPlan, SubscriptionStatus } from '../types/log.types'

export interface SubscriptionRepository {
  get(userId: string): Promise<SubscriptionStatus>
  activate(userId: string, plan: SubscriptionPlan): Promise<SubscriptionStatus>
}

function expiryFor(plan: SubscriptionPlan, startedAt: Date): string | null {
  if (plan === 'pro_lifetime') return null
  const expires = new Date(startedAt)
  if (plan === 'pro_monthly') expires.setMonth(expires.getMonth() + 1)
  if (plan === 'pro_annual') expires.setFullYear(expires.getFullYear() + 1)
  return expires.toISOString()
}

class DexieSubscriptionRepository implements SubscriptionRepository {
  async get(userId: string): Promise<SubscriptionStatus> {
    const existing = await db.subscriptionStatus.get(userId)
    if (existing) return existing
    const fallback: SubscriptionStatus = {
      userId,
      plan: 'free',
      status: 'none',
      startedAt: null,
      expiresAt: null,
      trialUsed: false,
    }
    return fallback
  }

  async activate(userId: string, plan: SubscriptionPlan): Promise<SubscriptionStatus> {
    const now = new Date()
    const record: SubscriptionStatus = {
      userId,
      plan,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expiryFor(plan, now),
      trialUsed: true,
    }
    await db.subscriptionStatus.put(record)
    return record
  }
}

export const subscriptionRepository: SubscriptionRepository = new DexieSubscriptionRepository()
