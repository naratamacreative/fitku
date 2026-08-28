import { supabase } from '../../shared/lib/supabaseClient'
import type { FoodLog, NewFoodLog } from '../types/food.types'

export type FoodLogUpdate = Partial<Omit<FoodLog, 'id' | 'userId' | 'createdAt'>>

export interface FoodLogRepository {
  getByDate(userId: string, date: string): Promise<FoodLog[]>
  getByDateRange(userId: string, fromDate: string, toDate: string): Promise<FoodLog[]>
  add(log: NewFoodLog): Promise<FoodLog>
  update(id: string, changes: FoodLogUpdate): Promise<void>
  delete(id: string): Promise<void>
  recentFoodIds(userId: string, limit?: number): Promise<string[]>
  loggedDates(userId: string, limit?: number): Promise<string[]>
}

interface FoodLogRow {
  id: string
  user_id: string
  food_id: string | null
  log_date: string
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  food_name: string
  meal_type: FoodLog['mealType'] | null
  created_at: string
}

function fromRow(row: FoodLogRow): FoodLog {
  return {
    id: row.id,
    userId: row.user_id,
    foodId: row.food_id,
    date: row.log_date,
    servings: row.servings,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    foodName: row.food_name,
    mealType: row.meal_type ?? undefined,
    createdAt: row.created_at,
  }
}

class SupabaseFoodLogRepository implements FoodLogRepository {
  async getByDate(userId: string, date: string): Promise<FoodLog[]> {
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
    if (error) throw error
    return (data as FoodLogRow[]).map(fromRow)
  }

  async getByDateRange(userId: string, fromDate: string, toDate: string): Promise<FoodLog[]> {
    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', fromDate)
      .lte('log_date', toDate)
    if (error) throw error
    return (data as FoodLogRow[]).map(fromRow)
  }

  async add(log: NewFoodLog): Promise<FoodLog> {
    const { data, error } = await supabase
      .from('food_logs')
      .insert({
        user_id: log.userId,
        food_id: log.foodId,
        log_date: log.date,
        servings: log.servings,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        food_name: log.foodName,
        meal_type: log.mealType ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return fromRow(data as FoodLogRow)
  }

  async update(id: string, changes: FoodLogUpdate): Promise<void> {
    const updates: Record<string, unknown> = {}
    if (changes.foodId !== undefined) updates.food_id = changes.foodId
    if (changes.date !== undefined) updates.log_date = changes.date
    if (changes.servings !== undefined) updates.servings = changes.servings
    if (changes.calories !== undefined) updates.calories = changes.calories
    if (changes.protein !== undefined) updates.protein = changes.protein
    if (changes.carbs !== undefined) updates.carbs = changes.carbs
    if (changes.fat !== undefined) updates.fat = changes.fat
    if (changes.foodName !== undefined) updates.food_name = changes.foodName
    if (changes.mealType !== undefined) updates.meal_type = changes.mealType
    const { error } = await supabase.from('food_logs').update(updates).eq('id', id)
    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)
    if (error) throw error
  }

  async recentFoodIds(userId: string, limit = 6): Promise<string[]> {
    const { data, error } = await supabase
      .from('food_logs')
      .select('food_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const seen = new Set<string>()
    for (const row of data as Pick<FoodLogRow, 'food_id' | 'created_at'>[]) {
      if (!row.food_id) continue
      seen.add(row.food_id)
      if (seen.size >= limit) break
    }
    return Array.from(seen)
  }

  async loggedDates(userId: string, limit = 30): Promise<string[]> {
    const { data, error } = await supabase.from('food_logs').select('log_date').eq('user_id', userId)
    if (error) throw error
    const dates = Array.from(new Set((data as { log_date: string }[]).map((r) => r.log_date))).sort((a, b) =>
      b.localeCompare(a),
    )
    return dates.slice(0, limit)
  }
}

export const foodLogRepository: FoodLogRepository = new SupabaseFoodLogRepository()
