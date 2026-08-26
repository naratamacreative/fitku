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

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface FoodLog {
  id: string
  userId: string
  // null for Quick Add entries — there's no matching Food record to snapshot from.
  foodId: string | null
  date: string // YYYY-MM-DD
  servings: number
  // Snapshot at time of logging so later edits to `foods` never rewrite history.
  calories: number
  protein: number
  carbs: number
  fat: number
  foodName: string
  // Optional: logs created before this field existed have no mealType. Treat
  // `undefined` as "uncategorized" at read time — never backfill/guess it.
  mealType?: MealType
  createdAt: string
}

export type NewFoodLog = Omit<FoodLog, 'id' | 'createdAt'>
