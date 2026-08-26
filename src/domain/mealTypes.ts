import type { MealType } from '../data/types/food.types'

export const MEAL_TYPES: { value: MealType; label: string; shortLabel: string; icon: string }[] = [
  { value: 'breakfast', label: 'Sarapan', shortLabel: 'Sarapan', icon: '🍳' },
  { value: 'lunch', label: 'Makan Siang', shortLabel: 'Siang', icon: '🍱' },
  { value: 'dinner', label: 'Makan Malam', shortLabel: 'Malam', icon: '🍽️' },
  { value: 'snack', label: 'Kudapan', shortLabel: 'Kudapan', icon: '🍌' },
]

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Kudapan',
}

/** Best-guess meal for "right now", used as the default selection when logging. */
export function defaultMealType(): MealType {
  const hour = new Date().getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

export function isMealType(value: string): value is MealType {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner' || value === 'snack'
}
