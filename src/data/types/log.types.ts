export interface DailySummary {
  date: string // YYYY-MM-DD, primary key
  userId: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  targetCalories: number
  targetProtein: number
  dailyScore: number
  loggedCount: number
}

export interface WeightEntry {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  weightKg: number
  note?: string
  createdAt: string
}

export type NewWeightEntry = Omit<WeightEntry, 'id' | 'createdAt'>

export interface HydrationLog {
  key: string // `${userId}:${date}`
  userId: string
  date: string // YYYY-MM-DD
  glasses: number
}

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_annual' | 'pro_lifetime'

export interface SubscriptionStatus {
  userId: string // primary key
  plan: SubscriptionPlan
  status: 'active' | 'expired' | 'none'
  startedAt: string | null
  expiresAt: string | null
  trialUsed: boolean
}
