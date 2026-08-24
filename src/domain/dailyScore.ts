export interface DailyScoreInput {
  totalCalories: number
  targetCalories: number
  totalProtein: number
  targetProtein: number
  loggedCount: number
}

/**
 * 0-100 score blending three signals: calorie accuracy (not just "under"),
 * protein sufficiency, and whether the user logged meals at all today.
 */
export function calculateDailyScore(input: DailyScoreInput): number {
  const { totalCalories, targetCalories, totalProtein, targetProtein, loggedCount } = input

  if (loggedCount === 0) return 0

  const calorieRatio = targetCalories > 0 ? totalCalories / targetCalories : 0
  // Best score sits in the 90-110% band; falls off outside it.
  const calorieScore = Math.max(0, 100 - Math.abs(100 - calorieRatio * 100) * 1.5)

  const proteinRatio = targetProtein > 0 ? totalProtein / targetProtein : 0
  const proteinScore = Math.min(100, proteinRatio * 100)

  const loggingScore = Math.min(100, loggedCount * 34)

  const weighted = calorieScore * 0.45 + proteinScore * 0.35 + loggingScore * 0.2
  return Math.round(Math.min(100, Math.max(0, weighted)))
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Bagus!'
  if (score >= 55) return 'Lumayan'
  if (score > 0) return 'Perlu diperbaiki'
  return 'Belum ada catatan'
}
