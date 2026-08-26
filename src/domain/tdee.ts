import type { ActivityLevel, Gender, Goal } from '../data/types/user.types'

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

// kcal/day added or removed from maintenance depending on goal.
const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose_weight: -500,
  gain_muscle: 300,
  maintain: 0,
}

const PROTEIN_PER_KG: Record<Goal, number> = {
  lose_weight: 1.8,
  gain_muscle: 2.0,
  maintain: 1.6,
}

export interface TdeeInput {
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
}

export interface TdeeResult {
  bmr: number
  maintenanceCalories: number
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
}

/** Mifflin-St Jeor equation. */
function bmr({ gender, age, heightCm, weightKg }: TdeeInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

/** Recomputes fat/carb targets for an already-decided calorie+protein pair — same 25%-fat/remainder-carb split as `calculateTdee`, used when a target is adjusted without redoing the full profile calculation. */
export function recalculateMacrosForCalories(targetCalories: number, targetProtein: number): { targetFat: number; targetCarbs: number } {
  const proteinCalories = targetProtein * 4
  const fatCalories = targetCalories * 0.25
  const targetFat = Math.round(fatCalories / 9)
  const carbCalories = targetCalories - proteinCalories - fatCalories
  const targetCarbs = Math.round(Math.max(carbCalories, 0) / 4)
  return { targetFat, targetCarbs }
}

export function calculateTdee(input: TdeeInput): TdeeResult {
  const bmrValue = bmr(input)
  const maintenanceCalories = Math.round(bmrValue * ACTIVITY_MULTIPLIER[input.activityLevel])
  const targetCalories = Math.max(
    1200,
    Math.round(maintenanceCalories + GOAL_ADJUSTMENT[input.goal]),
  )

  const targetProtein = Math.round(input.weightKg * PROTEIN_PER_KG[input.goal])
  const proteinCalories = targetProtein * 4
  const fatCalories = targetCalories * 0.25
  const targetFat = Math.round(fatCalories / 9)
  const carbCalories = targetCalories - proteinCalories - fatCalories
  const targetCarbs = Math.round(Math.max(carbCalories, 0) / 4)

  return {
    bmr: Math.round(bmrValue),
    maintenanceCalories,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
  }
}

/** Rough weeks-to-goal estimate assuming ~0.5kg fat = ~3850 kcal deficit/surplus. */
export function estimateWeeksToGoal(
  currentWeightKg: number,
  targetWeightKg: number,
  goal: Goal,
): number | null {
  if (goal === 'maintain') return null
  const diffKg = Math.abs(currentWeightKg - targetWeightKg)
  if (diffKg < 0.1) return 0
  const weeklyRateKg = 0.5
  return Math.max(1, Math.round(diffKg / weeklyRateKg))
}
