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

// "Menu Hari Ini" (suggestMealPlan) was removed: it deterministically picked
// the highest-calorie region-tagged dish plus the cheapest fitting camilan,
// so it surfaced the same 1-2 foods for nearly every user/budget — not a
// real recommendation, closer to a hardcoded placeholder.

export interface DailyCoaching {
  analisa: string
  insight: string
  action: string
}

/** Daily Coaching: Analisa -> Insight -> Action, auto-generated from today's data. Rule-based, no LLM call. */
export function generateDailyCoaching(user: User, totals: DailyTotals, streak: number): DailyCoaching {
  if (totals.count === 0) {
    return {
      analisa: 'Belum ada makanan tercatat hari ini.',
      insight: 'Insight baru muncul setelah ada catatan — pola makanmu belum terbaca.',
      action: 'Catat satu makanan sekarang, mulai dari yang sudah kamu makan hari ini.',
    }
  }

  const proteinRemaining = Math.round(user.targetProtein - totals.protein)
  const calorieRemaining = Math.round(user.targetCalories - totals.calories)

  const analisa =
    streak >= 2
      ? `Kamu konsisten tracking ${streak} hari berturut-turut, dengan ${totals.count} makanan tercatat hari ini.`
      : `Ada ${totals.count} makanan tercatat hari ini.`

  let insight: string
  let action: string
  if (calorieRemaining < 0) {
    insight = 'Kalori hari ini sudah melewati target — polanya kelihatan dari catatanmu.'
    action = `Kurangi porsi di makan berikutnya sekitar ${Math.min(300, Math.abs(calorieRemaining))} kkal.`
  } else if (proteinRemaining > 15) {
    insight = 'Kekurangan protein jadi pola yang paling sering muncul dibanding kekurangan lain.'
    action = `Tambahkan sumber protein (telur/ayam/tempe) sekitar ${proteinRemaining}g di makan berikutnya.`
  } else {
    insight = 'Kalori dan protein hari ini sudah cukup seimbang.'
    action = 'Pertahankan pola makan seperti ini sampai akhir hari.'
  }

  return { analisa, insight, action }
}

/** Templated follow-up reply for the Coach chat thread — not a real LLM call. */
export function generateCoachReply(user: User, totals: DailyTotals): string {
  const proteinRemaining = Math.round(user.targetProtein - totals.protein)
  if (proteinRemaining > 15) {
    return `Berdasarkan catatanmu, protein masih kurang ${proteinRemaining}g hari ini — itu biasanya penyebab utama progress terasa lambat. Ikuti Action di atas dan cek lagi 3-4 hari ya.`
  }
  return 'Progress kadang melambat sementara, itu normal. Tetap ikuti Action di Daily Coaching di atas, dan cek lagi dalam beberapa hari.'
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
