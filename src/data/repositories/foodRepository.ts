import { supabase } from '../../shared/lib/supabaseClient'
import type { Food } from '../types/food.types'

export interface FoodRepository {
  all(): Promise<Food[]>
  search(query: string): Promise<Food[]>
  byId(id: string): Promise<Food | undefined>
}

interface FoodRow {
  id: string
  name: string
  category: Food['category']
  serving_label: string
  serving_grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  region: string | null
}

function fromRow(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    servingLabel: row.serving_label,
    servingGrams: row.serving_grams,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    region: row.region ?? undefined,
  }
}

class SupabaseFoodRepository implements FoodRepository {
  async all(): Promise<Food[]> {
    const { data, error } = await supabase.from('foods').select('*')
    if (error) throw error
    return (data as FoodRow[]).map(fromRow)
  }

  async search(query: string): Promise<Food[]> {
    const q = query.trim()
    if (!q) return this.all()
    // Server-side filter, same substring/case-insensitive semantics as the old
    // client-side `name.toLowerCase().includes(q)`.
    const { data, error } = await supabase.from('foods').select('*').ilike('name', `%${q}%`)
    if (error) throw error
    return (data as FoodRow[]).map(fromRow)
  }

  async byId(id: string): Promise<Food | undefined> {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? fromRow(data as FoodRow) : undefined
  }
}

export const foodRepository: FoodRepository = new SupabaseFoodRepository()
