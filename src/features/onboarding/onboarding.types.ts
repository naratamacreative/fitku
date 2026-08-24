import type { ActivityLevel, Gender, Goal, MealsPerDay } from '../../data/types/user.types'

export interface OnboardingDraft {
  goal?: Goal
  motivation?: string
  gender?: Gender
  age?: number
  heightCm?: number
  weightKg?: number
  targetWeightKg?: number
  activityLevel?: ActivityLevel
  mealsPerDay?: MealsPerDay
}

export interface StepProps {
  draft: OnboardingDraft
  onChange: (patch: Partial<OnboardingDraft>) => void
  onNext: () => void
}
