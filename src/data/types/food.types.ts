export type FoodCategory =
  | 'nasi_karbo'
  | 'lauk'
  | 'sayur'
  | 'gorengan'
  | 'sup_kuah'
  | 'camilan'
  | 'minuman'

export interface Food {
  id: string
  name: string
  category: FoodCategory
  servingLabel: string
  servingGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  region?: string
}

export interface FoodLog {
  id: string
  userId: string
  foodId: string
  date: string // YYYY-MM-DD
  servings: number
  // Snapshot at time of logging so later edits to `foods` never rewrite history.
  calories: number
  protein: number
  carbs: number
  fat: number
  foodName: string
  createdAt: string
}

export type NewFoodLog = Omit<FoodLog, 'id' | 'createdAt'>
