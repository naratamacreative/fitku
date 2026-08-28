import { supabase } from '../../shared/lib/supabaseClient'
import type { FoodReport, FoodReportReason } from '../types/foodReport.types'

export interface FoodReportRepository {
  reportedFoodIds(userId: string): Promise<Set<string>>
  getForFood(userId: string, foodId: string): Promise<FoodReport | undefined>
  save(userId: string, foodId: string, reasons: FoodReportReason[], note: string): Promise<FoodReport>
}

interface FoodReportRow {
  user_id: string
  food_id: string
  reasons: FoodReportReason[]
  note: string | null
  created_at: string
  updated_at: string
}

function fromRow(row: FoodReportRow): FoodReport {
  return {
    key: `${row.user_id}:${row.food_id}`,
    userId: row.user_id,
    foodId: row.food_id,
    reasons: row.reasons,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class SupabaseFoodReportRepository implements FoodReportRepository {
  async reportedFoodIds(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase.from('food_reports').select('food_id').eq('user_id', userId)
    if (error) throw error
    return new Set((data as { food_id: string }[]).map((r) => r.food_id))
  }

  async getForFood(userId: string, foodId: string): Promise<FoodReport | undefined> {
    const { data, error } = await supabase
      .from('food_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('food_id', foodId)
      .maybeSingle()
    if (error) throw error
    return data ? fromRow(data as FoodReportRow) : undefined
  }

  async save(userId: string, foodId: string, reasons: FoodReportReason[], note: string): Promise<FoodReport> {
    const existing = await this.getForFood(userId, foodId)
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('food_reports')
      .upsert(
        {
          user_id: userId,
          food_id: foodId,
          reasons,
          note: note.trim() || null,
          created_at: existing?.createdAt ?? now,
          updated_at: now,
        },
        { onConflict: 'user_id,food_id' },
      )
      .select()
      .single()
    if (error) throw error
    return fromRow(data as FoodReportRow)
  }
}

export const foodReportRepository: FoodReportRepository = new SupabaseFoodReportRepository()
