import type { FoodLog } from '../data/types/food.types'
import type { User } from '../data/types/user.types'

export interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  count: number
}

export function aggregateLogs(logs: FoodLog[]): DailyTotals {
  return logs.reduce<DailyTotals>(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
      count: acc.count + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
  )
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Consecutive-day logging streak, counting back from today (or yesterday, so today isn't required yet). */
export function calculateStreak(loggedDatesDesc: string[]): number {
  const set = new Set(loggedDatesDesc)
  const today = todayIso()
  let cursor = set.has(today) ? 0 : set.has(isoDaysAgo(1)) ? 1 : -1
  if (cursor === -1) return 0

  let streak = 0
  while (set.has(isoDaysAgo(cursor))) {
    streak += 1
    cursor += 1
  }
  return streak
}

export function generateCoachInsight(user: User, totals: DailyTotals): string {
  const proteinRemaining = Math.round(user.targetProtein - totals.protein)
  const calorieRemaining = Math.round(user.targetCalories - totals.calories)

  if (totals.count === 0) {
    return 'Belum ada makanan tercatat hari ini. Mulai dari sarapan atau makan siangmu, yuk.'
  }
  if (proteinRemaining > 15) {
    return `Protein hari ini masih kurang ${proteinRemaining}g — tambah telur, ayam, atau tempe di makan berikutnya.`
  }
  if (calorieRemaining < 0) {
    return `Kalori hari ini sudah lewat ${Math.abs(calorieRemaining)} kkal dari target. Pilih porsi lebih ringan untuk sisa hari ini.`
  }
  if (calorieRemaining < 200) {
    return `Sisa kalorimu tinggal ${Math.max(calorieRemaining, 0)} kkal — cukup untuk camilan ringan, bukan makan besar lagi.`
  }
  return `Progres bagus. Sisa ${calorieRemaining} kkal dan ${Math.max(proteinRemaining, 0)}g protein untuk sisa hari ini.`
}
