/**
 * Value-moment paywall triggers — fire when the user has already felt value,
 * never as a hard block on the free tier. Config-driven so triggers can be
 * tuned/A-B tested without touching component code.
 *
 * V1 ships only STREAK_3_DAYS (see usePaywallTrigger). The others are documented
 * here as the agreed direction for V1.1+.
 */
export const PAYWALL_TRIGGERS = {
  STREAK_3_DAYS: {
    id: 'streak_3_days',
    description: '3 consecutive days of logging — strongest conversion moment.',
    active: true,
  },
  POST_ONBOARDING_PREVIEW: {
    id: 'post_onboarding_preview',
    description: 'Soft, non-blocking PRO teaser shown once on the Result Moment screen.',
    active: true,
  },
  HISTORY_BEYOND_7_DAYS: {
    id: 'history_beyond_7_days',
    description: 'Viewing log/weight history older than 7 days gates to PRO.',
    active: false,
  },
} as const

export const PRO_PLANS = [
  { id: 'pro_monthly', name: 'Bulanan', priceLabel: '49rb', recommended: false },
  { id: 'pro_annual', name: 'Tahunan', priceLabel: '399rb', recommended: true },
  { id: 'pro_lifetime', name: 'Founder', priceLabel: '499rb', recommended: false },
] as const
