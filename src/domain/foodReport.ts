import type { FoodReportReason } from '../data/types/foodReport.types'

export const FOOD_REPORT_REASONS: { value: FoodReportReason; label: string }[] = [
  { value: 'wrong_name', label: 'Nama makanan salah' },
  { value: 'wrong_nutrition', label: 'Kalori/gizi tidak akurat' },
  { value: 'wrong_serving', label: 'Ukuran porsi tidak sesuai' },
  { value: 'duplicate', label: 'Makanan duplikat' },
  { value: 'other', label: 'Lainnya' },
]
