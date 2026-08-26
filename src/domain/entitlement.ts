import type { SubscriptionStatus } from '../data/types/log.types'
import type { User } from '../data/types/user.types'

/** Every new user gets full Pro access for this many days from account creation, no free tier after. */
export const TRIAL_DAYS = 7

export type ProAccessReason = 'trial' | 'paid' | 'expired'

export interface ProAccess {
  active: boolean
  reason: ProAccessReason
  trialEndsAt: string
  /** Days remaining in trial, 0 once trial is over or plan is paid. */
  trialDaysLeft: number
}

function isPaidActive(sub: SubscriptionStatus, now: Date): boolean {
  if (sub.plan === 'free' || sub.status !== 'active') return false
  if (!sub.expiresAt) return true // lifetime plan
  return new Date(sub.expiresAt).getTime() > now.getTime()
}

/**
 * Single source of truth for "does this user currently get Pro benefits."
 * Client-side only — same trust model as the rest of `subscriptionStatus` today
 * (see fitku-security-status: real payment stays blocked until this moves server-side).
 * Trial window is derived from `user.createdAt`, never stored separately, so it
 * can't drift out of sync and needs no schema migration.
 */
export function getProAccess(user: User, sub: SubscriptionStatus, now: Date = new Date()): ProAccess {
  const trialEndsAt = new Date(user.createdAt)
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

  if (isPaidActive(sub, now)) {
    return { active: true, reason: 'paid', trialEndsAt: trialEndsAt.toISOString(), trialDaysLeft: 0 }
  }

  const msLeft = trialEndsAt.getTime() - now.getTime()
  if (msLeft > 0) {
    const trialDaysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
    return { active: true, reason: 'trial', trialEndsAt: trialEndsAt.toISOString(), trialDaysLeft }
  }

  return { active: false, reason: 'expired', trialEndsAt: trialEndsAt.toISOString(), trialDaysLeft: 0 }
}
