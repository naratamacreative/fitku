export interface MyFood {
  id: string
  userId: string
  name: string
  servingLabel: string
  servingGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  createdAt: string
}

export type NewMyFood = Omit<MyFood, 'id' | 'createdAt'>
