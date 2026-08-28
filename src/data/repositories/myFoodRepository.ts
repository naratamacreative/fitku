import { supabase } from '../../shared/lib/supabaseClient'
import type { MyFood, NewMyFood } from '../types/myFood.types'

export interface MyFoodRepository {
  all(userId: string): Promise<MyFood[]>
  add(food: NewMyFood): Promise<MyFood>
  delete(id: string): Promise<void>
}

interface MyFoodRow {
  id: string
  user_id: string
  name: string
  serving_label: string
  serving_grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

function fromRow(row: MyFoodRow): MyFood {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    servingLabel: row.serving_label,
    servingGrams: row.serving_grams,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    createdAt: row.created_at,
  }
}

class SupabaseMyFoodRepository implements MyFoodRepository {
  async all(userId: string): Promise<MyFood[]> {
    const { data, error } = await supabase
      .from('my_foods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data as MyFoodRow[]).map(fromRow)
  }

  async add(food: NewMyFood): Promise<MyFood> {
    const { data, error } = await supabase
      .from('my_foods')
      .insert({
        user_id: food.userId,
        name: food.name,
        serving_label: food.servingLabel,
        serving_grams: food.servingGrams,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      })
      .select()
      .single()
    if (error) throw error
    return fromRow(data as MyFoodRow)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('my_foods').delete().eq('id', id)
    if (error) throw error
  }
}

export const myFoodRepository: MyFoodRepository = new SupabaseMyFoodRepository()
