export type Gender = 'male' | 'female'

export type Goal = 'lose_weight' | 'gain_muscle' | 'maintain'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export type MealsPerDay = '1-2' | '3' | '4-5' | '6+'

export interface User {
  id: string
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  goal: Goal
  motivation: string
  targetWeightKg: number
  activityLevel: ActivityLevel
  mealsPerDay: MealsPerDay
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  createdAt: string
  updatedAt: string
}

export type NewUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
