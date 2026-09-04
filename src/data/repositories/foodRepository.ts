import { supabase } from '../../shared/lib/supabaseClient'
import type { Food } from '../types/food.types'

export interface FoodRepository {
  /** The free/trial-visible catalog only (tier='core') — RLS also enforces this, this is just the intentional query shape for browsing/tabs. */
  core(): Promise<Food[]>
  /** RLS decides what comes back: free/trial gets core-only matches, Pro gets the full catalog. */
  search(query: string): Promise<Food[]>
  byId(id: string): Promise<Food | undefined>
  byIds(ids: string[]): Promise<Food[]>
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
  async core(): Promise<Food[]> {
    const { data, error } = await supabase.from('foods').select('*').eq('tier', 'core')
    if (error) throw error
    return (data as FoodRow[]).map(fromRow)
  }

  async search(query: string): Promise<Food[]> {
    const q = query.trim()
    if (!q) return this.core()
    // Server-side filter, same substring/case-insensitive semantics as the old
    // client-side `name.toLowerCase().includes(q)`. No tier filter here — RLS
    // (see supabase/migrations/0005_food_tiers.sql) already restricts which rows
    // are visible per-caller, so a free/trial user's search can only ever match
    // core rows regardless of what's in the underlying table.
    const { data, error } = await supabase.from('foods').select('*').ilike('name', `%${q}%`)
    if (error) throw error
    return (data as FoodRow[]).map(fromRow)
  }

  async byId(id: string): Promise<Food | undefined> {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? fromRow(data as FoodRow) : undefined
  }

  async byIds(ids: string[]): Promise<Food[]> {
    if (ids.length === 0) return []
    const { data, error } = await supabase.from('foods').select('*').in('id', ids)
    if (error) throw error
    return (data as FoodRow[]).map(fromRow)
  }
}

export const foodRepository: FoodRepository = new SupabaseFoodRepository()
