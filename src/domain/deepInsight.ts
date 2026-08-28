import type { ExerciseLog } from '../data/types/exercise.types'
import type { FoodLog } from '../data/types/food.types'
import type { HydrationLog, WeightEntry } from '../data/types/log.types'
import type { User } from '../data/types/user.types'
import { calculateHydrationTargetGlasses } from './hydration'
import { aggregateLogs } from './nutrition'
import { assessMonthlyWeightTrend } from './weightAssessment'

export interface DeepInsightInput {
  user: User
  logs30: FoodLog[] // food logs within the last 30 days
  weightEntries30: WeightEntry[] // ascending by date, within the last 30 days
  exerciseLogs30: ExerciseLog[]
  hydrationLogs30: HydrationLog[]
}

export interface DeepInsight {
  hasEnoughData: boolean
  message: string
  loggedDays30: number
  calorieAdherencePct: number
  weightTrendText: string
  exerciseCorrelationText: string | null
  hydrationCorrelationText: string | null
  headline: string
}

const MIN_LOGGED_DAYS_30 = 10
const ADHERENCE_BAND = 0.15 // within ±15% of target calories counts as "on target"
const MIN_GROUP_SAMPLES = 3

function withinBand(calories: number, target: number): boolean {
  if (target <= 0) return false
  const ratio = calories / target
  return ratio >= 1 - ADHERENCE_BAND && ratio <= 1 + ADHERENCE_BAND
}

export function generateDeepInsight(input: DeepInsightInput): DeepInsight {
  const { user, logs30, weightEntries30, exerciseLogs30, hydrationLogs30 } = input

  const byDate = new Map<string, FoodLog[]>()
  for (const log of logs30) byDate.set(log.date, [...(byDate.get(log.date) ?? []), log])
  const loggedDates30 = Array.from(byDate.keys())
  const loggedDays30 = loggedDates30.length

  if (loggedDays30 < MIN_LOGGED_DAYS_30) {
    return {
      hasEnoughData: false,
      message: `Baru ${loggedDays30} dari 30 hari terakhir tercatat. Butuh minimal ${MIN_LOGGED_DAYS_30} hari data supaya analisa 30-hari ini akurat — terus catat makanan tiap hari.`,
      loggedDays30,
      calorieAdherencePct: 0,
      weightTrendText: '',
      exerciseCorrelationText: null,
      hydrationCorrelationText: null,
      headline: '',
    }
  }

  const onTargetDays = loggedDates30.filter((d) => withinBand(aggregateLogs(byDate.get(d)!).calories, user.targetCalories))
  const calorieAdherencePct = Math.round((onTargetDays.length / loggedDays30) * 100)

  let weightTrendText = 'Belum cukup data untuk melihat tren 30 hari — terus catat berat harian kamu.'
  if (weightEntries30.length >= 2) {
    const first = weightEntries30[0]
    const last = weightEntries30[weightEntries30.length - 1]
    const deltaKg = Math.round((last.weightKg - first.weightKg) * 10) / 10
    weightTrendText = assessMonthlyWeightTrend(user.goal, deltaKg)
  }

  // Exercise-day vs non-exercise-day calorie adherence — only when both groups have enough samples.
  const exerciseDates = new Set(exerciseLogs30.map((e) => e.date))
  const exerciseDayLogged = loggedDates30.filter((d) => exerciseDates.has(d))
  const nonExerciseDayLogged = loggedDates30.filter((d) => !exerciseDates.has(d))
  let exerciseCorrelationText: string | null = null
  if (exerciseDayLogged.length >= MIN_GROUP_SAMPLES && nonExerciseDayLogged.length >= MIN_GROUP_SAMPLES) {
    const exercisePct = Math.round(
      (exerciseDayLogged.filter((d) => withinBand(aggregateLogs(byDate.get(d)!).calories, user.targetCalories)).length / exerciseDayLogged.length) * 100,
    )
    const nonExercisePct = Math.round(
      (nonExerciseDayLogged.filter((d) => withinBand(aggregateLogs(byDate.get(d)!).calories, user.targetCalories)).length / nonExerciseDayLogged.length) *
        100,
    )
    const gap = exercisePct - nonExercisePct
    if (Math.abs(gap) >= 10) {
      exerciseCorrelationText =
        gap > 0
          ? `Di hari kamu olahraga, kamu ${gap}% lebih sering mencapai target kalori dibanding hari tanpa olahraga.`
          : `Di hari kamu olahraga, kamu justru ${Math.abs(gap)}% lebih jarang mencapai target kalori — mungkin porsi makan ikut naik setelah olahraga, coba diperhatikan.`
    }
  }

  // Hydration-adherence-day vs not, same comparison.
  const hydrationTarget = calculateHydrationTargetGlasses(user.weightKg)
  const hydrationByDate = new Map(hydrationLogs30.map((h) => [h.date, h.glasses]))
  const hydratedDates = new Set(loggedDates30.filter((d) => (hydrationByDate.get(d) ?? 0) >= hydrationTarget))
  const hydratedLogged = loggedDates30.filter((d) => hydratedDates.has(d))
  const dehydratedLogged = loggedDates30.filter((d) => !hydratedDates.has(d))
  let hydrationCorrelationText: string | null = null
  if (hydratedLogged.length >= MIN_GROUP_SAMPLES && dehydratedLogged.length >= MIN_GROUP_SAMPLES) {
    const hydratedPct = Math.round(
      (hydratedLogged.filter((d) => withinBand(aggregateLogs(byDate.get(d)!).calories, user.targetCalories)).length / hydratedLogged.length) * 100,
    )
    const dehydratedPct = Math.round(
      (dehydratedLogged.filter((d) => withinBand(aggregateLogs(byDate.get(d)!).calories, user.targetCalories)).length / dehydratedLogged.length) * 100,
    )
    const gap = hydratedPct - dehydratedPct
    if (gap >= 10) {
      hydrationCorrelationText = `Di hari kamu minum air cukup (≥${hydrationTarget} gelas), kamu ${gap}% lebih sering mencapai target kalori.`
    }
  }

  const headline =
    calorieAdherencePct >= 70
      ? `30 hari terakhir kamu konsisten — ${calorieAdherencePct}% hari di jalur target kalori.`
      : calorieAdherencePct >= 40
        ? `Pola kamu naik-turun bulan ini — ${calorieAdherencePct}% hari di jalur target kalori.`
        : `Bulan ini masih jauh dari target di sebagian besar hari (${calorieAdherencePct}% di jalur) — coba fokus konsistensi dulu, bukan kesempurnaan.`

  return {
    hasEnoughData: true,
    message: '',
    loggedDays30,
    calorieAdherencePct,
    weightTrendText,
    exerciseCorrelationText,
    hydrationCorrelationText,
    headline,
  }
}
