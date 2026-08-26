import type { ExerciseCategory } from '../data/types/exercise.types'

// Rough MET (metabolic equivalent) values — not medical-grade, used only to
// suggest a starting calorie estimate the user can always override.
const MET: Record<ExerciseCategory, number> = {
  walk: 3.5,
  run: 8,
  cycle: 6,
  weights: 4,
  other: 5,
}

export const EXERCISE_CATEGORIES: { value: ExerciseCategory; label: string; icon: string }[] = [
  { value: 'walk', label: 'Jalan', icon: '🚶' },
  { value: 'run', label: 'Lari', icon: '🏃' },
  { value: 'cycle', label: 'Sepeda', icon: '🚴' },
  { value: 'weights', label: 'Angkat Beban', icon: '🏋️' },
  { value: 'other', label: 'Lainnya', icon: '⚡' },
]

export const EXERCISE_CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  walk: 'Jalan',
  run: 'Lari',
  cycle: 'Sepeda',
  weights: 'Angkat Beban',
  other: 'Lainnya',
}

/** kcal ≈ MET × weight(kg) × duration(hours) — a standard rough estimate, always user-editable. */
export function estimateCaloriesBurned(category: ExerciseCategory, durationMin: number, weightKg: number): number {
  if (durationMin <= 0) return 0
  return Math.round(MET[category] * weightKg * (durationMin / 60))
}
