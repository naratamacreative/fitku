import type { WeightEntry } from '../data/types/log.types'
import type { Goal, User } from '../data/types/user.types'

export interface AdaptiveTargetResult {
  hasEnoughData: boolean
  message: string
  actualWeeklyRateKg: number
  expectedWeeklyRateKg: number
  currentCalories: number
  suggestedCalories: number | null
  adjustmentKcal: number
}

const LOOKBACK_DAYS = 30
const MIN_SPAN_DAYS = 10
const KCAL_PER_KG = 7700
const MAX_ADJUSTMENT_KCAL = 300
const MIN_TARGET_CALORIES = 1200
const MEANINGFUL_GAP_KG_PER_WEEK = 0.15

function expectedWeeklyRateKg(goal: Goal): number {
  if (goal === 'lose_weight') return -0.5
  if (goal === 'gain_muscle') return 0.25
  return 0
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime()
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function roundTo25(n: number): number {
  return Math.round(n / 25) * 25
}

function clampAdjustment(kcal: number): number {
  return Math.max(-MAX_ADJUSTMENT_KCAL, Math.min(MAX_ADJUSTMENT_KCAL, roundTo25(kcal)))
}

/**
 * Advisory only — never writes anything. Caller (AiCoach) shows the suggestion
 * with an explicit "Terapkan" action; targetCalories is never changed silently,
 * same principle the app already holds for every other correction (hydration,
 * exercise, profile edits — always user-confirmed, never automatic).
 *
 * `weightEntriesLookback` must already be filtered to the last LOOKBACK_DAYS and sorted ascending.
 */
export function analyzeAdaptiveTarget(user: User, weightEntriesLookback: WeightEntry[]): AdaptiveTargetResult {
  const currentCalories = user.targetCalories
  const expected = expectedWeeklyRateKg(user.goal)

  if (weightEntriesLookback.length < 2) {
    return {
      hasEnoughData: false,
      message: `Catat berat badan minimal 2× dengan jarak ${MIN_SPAN_DAYS}+ hari supaya FitKu bisa menghitung tren aktualmu.`,
      actualWeeklyRateKg: 0,
      expectedWeeklyRateKg: expected,
      currentCalories,
      suggestedCalories: null,
      adjustmentKcal: 0,
    }
  }

  const first = weightEntriesLookback[0]
  const last = weightEntriesLookback[weightEntriesLookback.length - 1]
  const spanDays = daysBetween(first.date, last.date)

  if (spanDays < MIN_SPAN_DAYS) {
    return {
      hasEnoughData: false,
      message: `Baru ${spanDays} hari rentang data berat dalam ${LOOKBACK_DAYS} hari terakhir — butuh minimal ${MIN_SPAN_DAYS} hari supaya trennya akurat.`,
      actualWeeklyRateKg: 0,
      expectedWeeklyRateKg: expected,
      currentCalories,
      suggestedCalories: null,
      adjustmentKcal: 0,
    }
  }

  const weeks = spanDays / 7
  const actualWeeklyRateKg = Math.round(((last.weightKg - first.weightKg) / weeks) * 100) / 100

  if (user.goal === 'maintain') {
    const onTrack = Math.abs(actualWeeklyRateKg) < MEANINGFUL_GAP_KG_PER_WEEK
    if (onTrack) {
      return {
        hasEnoughData: true,
        message: `Berat kamu stabil (${actualWeeklyRateKg >= 0 ? '+' : ''}${actualWeeklyRateKg}kg/minggu) — target kalori saat ini sudah pas untuk menjaga berat.`,
        actualWeeklyRateKg,
        expectedWeeklyRateKg: expected,
        currentCalories,
        suggestedCalories: null,
        adjustmentKcal: 0,
      }
    }
    const adjustmentKcal = clampAdjustment((-actualWeeklyRateKg * KCAL_PER_KG) / 7 / 2) // half-correction, gentle
    const suggestedCalories = Math.max(MIN_TARGET_CALORIES, currentCalories + adjustmentKcal)
    return {
      hasEnoughData: true,
      message: `Berat kamu ${actualWeeklyRateKg > 0 ? 'naik' : 'turun'} ${Math.abs(actualWeeklyRateKg)}kg/minggu padahal tujuanmu menjaga berat. FitKu sarankan sesuaikan target kalori jadi ${suggestedCalories.toLocaleString('id-ID')} kkal.`,
      actualWeeklyRateKg,
      expectedWeeklyRateKg: expected,
      currentCalories,
      suggestedCalories: suggestedCalories === currentCalories ? null : suggestedCalories,
      adjustmentKcal,
    }
  }

  // Flip sign by goal direction so "more progress toward the goal" is always positive,
  // regardless of whether the raw rate itself is negative (lose_weight) or positive (gain_muscle).
  // Without this, "behind pace" and the calorie-adjustment direction come out inverted for lose_weight.
  const direction = user.goal === 'lose_weight' ? -1 : 1
  const paceGapKg = expected * direction - actualWeeklyRateKg * direction // positive = behind pace

  if (Math.abs(paceGapKg) < MEANINGFUL_GAP_KG_PER_WEEK) {
    return {
      hasEnoughData: true,
      message: `Kamu di jalur yang tepat — tren aktual (${actualWeeklyRateKg >= 0 ? '+' : ''}${actualWeeklyRateKg}kg/minggu) sudah dekat dengan target (${expected}kg/minggu). Tidak perlu perubahan target kalori.`,
      actualWeeklyRateKg,
      expectedWeeklyRateKg: expected,
      currentCalories,
      suggestedCalories: null,
      adjustmentKcal: 0,
    }
  }

  // Behind pace → intensify (cut calories for lose_weight, add calories for gain_muscle).
  // Ahead of pace → ease off in the same direction-aware sense.
  const adjustmentKcal = clampAdjustment(((paceGapKg * KCAL_PER_KG) / 7) * direction)
  const suggestedCalories = Math.max(MIN_TARGET_CALORIES, currentCalories + adjustmentKcal)

  const behindPace = paceGapKg > 0
  const goalLabel = user.goal === 'lose_weight' ? 'turun berat' : 'naik otot'
  // Verb follows the actual sign of the suggested change, not which pace-branch this is —
  // "ahead of pace" doesn't always mean "raise calories" (e.g. gaining muscle too fast means cut).
  const verb = adjustmentKcal > 0 ? 'naikkan' : 'turunkan'
  const message = behindPace
    ? `Progres ${goalLabel}mu lebih lambat dari target (aktual ${actualWeeklyRateKg}kg/minggu vs target ${expected}kg/minggu). FitKu sarankan ${verb} target kalori jadi ${suggestedCalories.toLocaleString('id-ID')} kkal.`
    : `Progres ${goalLabel}mu lebih cepat dari target yang aman (aktual ${actualWeeklyRateKg}kg/minggu vs target ${expected}kg/minggu). FitKu sarankan ${verb} target kalori jadi ${suggestedCalories.toLocaleString('id-ID')} kkal supaya lebih berkelanjutan.`

  return {
    hasEnoughData: true,
    message,
    actualWeeklyRateKg,
    expectedWeeklyRateKg: expected,
    currentCalories,
    suggestedCalories: suggestedCalories === currentCalories ? null : suggestedCalories,
    adjustmentKcal,
  }
}
