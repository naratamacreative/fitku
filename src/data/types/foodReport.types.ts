export type FoodReportReason = 'wrong_name' | 'wrong_nutrition' | 'wrong_serving' | 'duplicate' | 'other'

export interface FoodReport {
  key: string // `${userId}:${foodId}`
  userId: string
  foodId: string
  reasons: FoodReportReason[]
  note?: string
  createdAt: string
  updatedAt: string
}
