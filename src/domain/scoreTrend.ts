import type { ExerciseLog } from '../data/types/exercise.types'
import type { FoodLog } from '../data/types/food.types'
import type { HydrationLog } from '../data/types/log.types'
import type { User } from '../data/types/user.types'
import { calculateDailyScore } from './dailyScore'
import { calculateHydrationTargetGlasses } from './hydration'
import { aggregateLogs } from './nutrition'

export interface ScoreTrendPoint {
  date: string
  score: number
}

export interface ScoreTrend {
  hasEnoughData: boolean
  message: string
  /** One point per day in the window, ascending by date — score 0 for days with no log. */
  points: ScoreTrendPoint[]
  avgScore: number
  trendText: string
  correlationText: string | null
}

export interface ScoreTrendInput {
  user: User
  logs: FoodLog[] // within the window
  exerciseLogs: ExerciseLog[] // within the window
  hydrationLogs: HydrationLog[] // within the window
}

const WINDOW_DAYS = 14
const MIN_SCORED_DAYS = 5
const MIN_GROUP_SAMPLES = 3

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Score isn't stored historically anywhere in the app — recomputed per day from the same pure function Dashboard uses for "today." */
export function analyzeScoreTrend(input: ScoreTrendInput): ScoreTrend {
  const { user, logs, exerciseLogs, hydrationLogs } = input
  const byDate = new Map<string, FoodLog[]>()
  for (const log of logs) byDate.set(log.date, [...(byDate.get(log.date) ?? []), log])

  const dates = Array.from({ length: WINDOW_DAYS }, (_, i) => isoDaysAgo(WINDOW_DAYS - 1 - i))
  const points: ScoreTrendPoint[] = dates.map((date) => {
    const totals = aggregateLogs(byDate.get(date) ?? [])
    const score = calculateDailyScore({
      totalCalories: totals.calories,
      targetCalories: user.targetCalories,
      totalProtein: totals.protein,
      targetProtein: user.targetProtein,
      loggedCount: totals.count,
    })
    return { date, score }
  })

  const scoredDays = points.filter((p) => p.score > 0)
  if (scoredDays.length < MIN_SCORED_DAYS) {
    return {
      hasEnoughData: false,
      message: `Baru ${scoredDays.length} dari ${WINDOW_DAYS} hari punya catatan. Butuh minimal ${MIN_SCORED_DAYS} hari supaya tren skor kelihatan jelas.`,
      points,
      avgScore: 0,
      trendText: '',
      correlationText: null,
    }
  }

  const avgScore = Math.round(scoredDays.reduce((s, p) => s + p.score, 0) / scoredDays.length)

  const half = Math.floor(scoredDays.length / 2)
  const firstHalfAvg = scoredDays.slice(0, half).reduce((s, p) => s + p.score, 0) / Math.max(1, half)
  const secondHalfAvg = scoredDays.slice(half).reduce((s, p) => s + p.score, 0) / Math.max(1, scoredDays.length - half)
  const diff = Math.round(secondHalfAvg - firstHalfAvg)
  const trendText =
    Math.abs(diff) < 5
      ? `Skor kamu relatif stabil di kisaran ${avgScore} selama ${WINDOW_DAYS} hari terakhir.`
      : diff > 0
        ? `Skor kamu membaik — naik sekitar ${diff} poin dibanding paruh pertama periode ini.`
        : `Skor kamu menurun sekitar ${Math.abs(diff)} poin dibanding paruh pertama periode ini.`

  const exerciseDates = new Set(exerciseLogs.map((e) => e.date))
  const hydrationTarget = calculateHydrationTargetGlasses(user.weightKg)
  const hydrationByDate = new Map(hydrationLogs.map((h) => [h.date, h.glasses]))

  function correlationFor(label: string, inGroup: (date: string) => boolean): { text: string; gap: number } | null {
    const inG = scoredDays.filter((p) => inGroup(p.date))
    const outG = scoredDays.filter((p) => !inGroup(p.date))
    if (inG.length < MIN_GROUP_SAMPLES || outG.length < MIN_GROUP_SAMPLES) return null
    const inAvg = inG.reduce((s, p) => s + p.score, 0) / inG.length
    const outAvg = outG.reduce((s, p) => s + p.score, 0) / outG.length
    const gap = Math.round(inAvg - outAvg)
    if (Math.abs(gap) < 5) return null
    return { text: `Skor kamu rata-rata ${Math.abs(gap)} poin ${gap > 0 ? 'lebih tinggi' : 'lebih rendah'} di hari ${label}.`, gap }
  }

  const candidates = [
    correlationFor('kamu olahraga', (d) => exerciseDates.has(d)),
    correlationFor(`kamu minum ≥${hydrationTarget} gelas air`, (d) => (hydrationByDate.get(d) ?? 0) >= hydrationTarget),
  ].filter((c): c is { text: string; gap: number } => c !== null)

  // Surface whichever correlation shows the larger gap — the strongest signal, not just the first one checked.
  const strongest = candidates.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0]

  return {
    hasEnoughData: true,
    message: '',
    points,
    avgScore,
    trendText,
    correlationText: strongest?.text ?? null,
  }
}
