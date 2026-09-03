import type { FoodLog } from '../data/types/food.types'
import type { WeightEntry } from '../data/types/log.types'
import type { Goal } from '../data/types/user.types'
import { aggregateLogs, calculateStreak } from './nutrition'
import { assessMonthlyWeightTrend } from './weightAssessment'

function isoDaysAgo(days: number, now: Date): string {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / (24 * 60 * 60 * 1000))
}

export interface WeightRecap {
  hasEnoughData: boolean
  totalDeltaKg: number
  daysSinceStart: number
  paceKgPerWeek: number
  loggingStreakDays: number
  /** Goal-aware narrative for the most recent 30-day window, reusing the same copy as Deep Insight. */
  trend30Text: string | null
  /** Raw delta for the 30 days before that window, for a plain side-by-side comparison (no goal judgment). */
  priorWindowDeltaKg: number | null
}

const MIN_WEIGHT_ENTRIES = 3
const MIN_DAYS_TRACKED = 7

/** `entries` must be sorted ascending by date (the order every weight repository/hook already returns). */
export function computeWeightRecap(entries: WeightEntry[], goal: Goal, now: Date = new Date()): WeightRecap {
  const loggingStreakDays = calculateStreak(entries.map((e) => e.date))
  const empty = { hasEnoughData: false as const, totalDeltaKg: 0, daysSinceStart: 0, paceKgPerWeek: 0, loggingStreakDays, trend30Text: null, priorWindowDeltaKg: null }

  if (entries.length < MIN_WEIGHT_ENTRIES) return empty

  const first = entries[0]
  const latest = entries[entries.length - 1]
  const daysSinceStart = daysBetween(first.date, latest.date)
  if (daysSinceStart < MIN_DAYS_TRACKED) return { ...empty, daysSinceStart }

  const totalDeltaKg = Math.round((latest.weightKg - first.weightKg) * 10) / 10
  const paceKgPerWeek = Math.round((totalDeltaKg / (daysSinceStart / 7)) * 100) / 100

  const recentCutoff = isoDaysAgo(29, now)
  const priorCutoff = isoDaysAgo(59, now)
  const recentWindow = entries.filter((e) => e.date >= recentCutoff)
  const priorWindow = entries.filter((e) => e.date >= priorCutoff && e.date < recentCutoff)

  const windowDelta = (window: WeightEntry[]): number | null =>
    window.length >= 2 ? Math.round((window[window.length - 1].weightKg - window[0].weightKg) * 10) / 10 : null

  const recentWindowDeltaKg = windowDelta(recentWindow)
  const priorWindowDeltaKg = windowDelta(priorWindow)
  const trend30Text = recentWindowDeltaKg !== null ? assessMonthlyWeightTrend(goal, recentWindowDeltaKg) : null

  return { hasEnoughData: true, totalDeltaKg, daysSinceStart, paceKgPerWeek, loggingStreakDays, trend30Text, priorWindowDeltaKg }
}

export interface CalorieRecap {
  hasEnoughData: boolean
  loggingStreakDays: number
  loggedDays30: number
  avgCaloriesRecent14: number | null
  avgCaloriesPrior14: number | null
  /** % of logged days (within the 30-day window) within ±15% of target calories. Null if there's no target set. */
  daysOnTargetPct: number | null
}

const MIN_LOGGED_DAYS_30 = 8
const ADHERENCE_BAND = 0.15

/**
 * `logs30` = food logs from the last 30 days. `loggedDatesAll` is unbounded (same source Dashboard/AI
 * Coach use for their streak counter) so the streak shown here always matches the rest of the app.
 */
export function computeCalorieRecap(logs30: FoodLog[], targetCalories: number, loggedDatesAll: string[], now: Date = new Date()): CalorieRecap {
  const byDate = new Map<string, FoodLog[]>()
  for (const log of logs30) byDate.set(log.date, [...(byDate.get(log.date) ?? []), log])
  const loggedDates30 = Array.from(byDate.keys())
  const loggedDays30 = loggedDates30.length
  const loggingStreakDays = calculateStreak(loggedDatesAll)

  if (loggedDays30 < MIN_LOGGED_DAYS_30) {
    return { hasEnoughData: false, loggingStreakDays, loggedDays30, avgCaloriesRecent14: null, avgCaloriesPrior14: null, daysOnTargetPct: null }
  }

  const caloriesOn = (date: string) => aggregateLogs(byDate.get(date) ?? []).calories
  const recentCutoff = isoDaysAgo(13, now)
  const priorCutoff = isoDaysAgo(27, now)

  const avg = (dates: string[]): number | null => (dates.length > 0 ? Math.round(dates.reduce((s, d) => s + caloriesOn(d), 0) / dates.length) : null)

  const avgCaloriesRecent14 = avg(loggedDates30.filter((d) => d >= recentCutoff))
  const avgCaloriesPrior14 = avg(loggedDates30.filter((d) => d >= priorCutoff && d < recentCutoff))

  const daysOnTargetPct =
    targetCalories > 0
      ? Math.round((loggedDates30.filter((d) => Math.abs(caloriesOn(d) - targetCalories) / targetCalories <= ADHERENCE_BAND).length / loggedDays30) * 100)
      : null

  return { hasEnoughData: true, loggingStreakDays, loggedDays30, avgCaloriesRecent14, avgCaloriesPrior14, daysOnTargetPct }
}
