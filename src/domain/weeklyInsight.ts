import type { ExerciseLog } from '../data/types/exercise.types'
import type { FoodLog, MealType } from '../data/types/food.types'
import type { WeightEntry } from '../data/types/log.types'
import type { User } from '../data/types/user.types'
import { MEAL_TYPE_LABEL, MEAL_TYPES } from './mealTypes'
import { aggregateLogs } from './nutrition'

export interface WeeklyInsightInput {
  user: User
  logs: FoodLog[] // food logs within the 7-day window
  loggedDatesInWindow: string[] // distinct dates with at least 1 log in the window
  weightEntriesInWindow: WeightEntry[] // sorted ascending by date
  exerciseLogsInWindow: ExerciseLog[]
  streak: number
}

export interface WeeklyInsight {
  hasEnoughData: boolean
  summary: string
  consistency: string
  weightTrend: string
  pattern: string
  recommendation: string
}

const MIN_LOGGED_DAYS = 3
const MEAL_FAIR_SHARE = 0.25 // each of the 4 meals "should" carry roughly a quarter of daily protein target

/** Finds the meal type whose protein most often falls short of its fair share — null if no clear pattern. */
function weakestMealForProtein(logs: FoodLog[], targetProtein: number): MealType | null {
  const byDateMeal = new Map<string, Map<MealType, number>>()
  for (const log of logs) {
    if (!log.mealType) continue
    const dayMap = byDateMeal.get(log.date) ?? new Map<MealType, number>()
    dayMap.set(log.mealType, (dayMap.get(log.mealType) ?? 0) + log.protein)
    byDateMeal.set(log.date, dayMap)
  }

  const fairShare = targetProtein * MEAL_FAIR_SHARE
  const shortfallDays = new Map<MealType, number>()
  for (const dayMap of byDateMeal.values()) {
    for (const m of MEAL_TYPES) {
      const val = dayMap.get(m.value) ?? 0
      if (val < fairShare) shortfallDays.set(m.value, (shortfallDays.get(m.value) ?? 0) + 1)
    }
  }

  let worst: MealType | null = null
  let worstCount = 0
  for (const [mt, count] of shortfallDays) {
    if (count > worstCount) {
      worst = mt
      worstCount = count
    }
  }
  return worstCount >= 3 ? worst : null
}

/** Rule-based weekly pattern summary — no medical claims, derived only from data actually logged. */
export function generateWeeklyInsight(input: WeeklyInsightInput): WeeklyInsight {
  const { user, logs, loggedDatesInWindow, weightEntriesInWindow, exerciseLogsInWindow, streak } = input
  const loggedDays = loggedDatesInWindow.length

  if (loggedDays < MIN_LOGGED_DAYS) {
    return {
      hasEnoughData: false,
      summary: `Kamu baru mencatat makanan di ${loggedDays} dari 7 hari terakhir.`,
      consistency: 'Data minggu ini belum cukup untuk melihat pola yang akurat.',
      weightTrend: '',
      pattern: '',
      recommendation: 'Catat makanan minimal 3 hari dalam seminggu supaya Weekly Insight bisa membaca polamu.',
    }
  }

  const totals = aggregateLogs(logs)
  const avgCalories = Math.round(totals.calories / loggedDays)
  const avgProteinPct = user.targetProtein > 0 ? Math.round((totals.protein / loggedDays / user.targetProtein) * 100) : 0

  const summary = `Kamu mencatat makanan di ${loggedDays} dari 7 hari terakhir, rata-rata ${avgCalories.toLocaleString('id-ID')} kkal/hari.`

  const consistency =
    loggedDays >= 6
      ? 'Konsistensi logging kamu sangat baik minggu ini — pertahankan.'
      : loggedDays >= 4
        ? 'Konsistensi logging kamu cukup baik, tapi masih ada hari yang terlewat.'
        : 'Logging kamu masih naik-turun minggu ini — coba catat setiap hari, walau cuma satu makanan.'

  let weightTrend = 'Belum ada catatan berat baru minggu ini — catat beratmu di Progress untuk melihat tren.'
  if (weightEntriesInWindow.length >= 2) {
    const first = weightEntriesInWindow[0].weightKg
    const last = weightEntriesInWindow[weightEntriesInWindow.length - 1].weightKg
    const delta = Math.round((last - first) * 10) / 10
    weightTrend = Math.abs(delta) < 0.1 ? 'Berat kamu stabil minggu ini.' : `Berat kamu ${delta < 0 ? 'turun' : 'naik'} ${Math.abs(delta)}kg minggu ini.`
  }

  const weakestMeal = weakestMealForProtein(logs, user.targetProtein)
  let pattern: string
  let recommendation: string
  if (weakestMeal) {
    const label = MEAL_TYPE_LABEL[weakestMeal].toLowerCase()
    pattern = `Protein kamu paling sering kurang saat ${label}.`
    recommendation = `Besok coba tambahkan sumber protein (telur/ayam/tempe) saat ${label}.`
  } else if (avgProteinPct < 80) {
    pattern = 'Protein harian kamu rata-rata masih di bawah target minggu ini.'
    recommendation = 'Minggu depan, coba tambahkan satu porsi sumber protein di setiap makan besar.'
  } else if (exerciseLogsInWindow.length === 0) {
    pattern = 'Belum ada olahraga tercatat minggu ini.'
    recommendation = 'Coba catat satu sesi olahraga ringan minggu depan, walau cuma jalan 20 menit.'
  } else {
    pattern = 'Pola makan kamu cukup seimbang minggu ini.'
    recommendation =
      streak >= 3 ? 'Pertahankan konsistensi logging seperti sekarang.' : 'Coba catat makanan setiap hari minggu depan supaya polanya makin akurat.'
  }

  return { hasEnoughData: true, summary, consistency, weightTrend, pattern, recommendation }
}
