import { supabase } from '../../shared/lib/supabaseClient'
import type { NewWeightEntry, WeightEntry } from '../types/log.types'

export interface WeightRepository {
  all(userId: string): Promise<WeightEntry[]>
  latest(userId: string): Promise<WeightEntry | undefined>
  add(entry: NewWeightEntry): Promise<WeightEntry>
  delete(id: string): Promise<void>
}

interface WeightRow {
  id: string
  user_id: string
  entry_date: string
  weight_kg: number
  note: string | null
  created_at: string
}

function fromRow(row: WeightRow): WeightEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.entry_date,
    weightKg: row.weight_kg,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

class SupabaseWeightRepository implements WeightRepository {
  async all(userId: string): Promise<WeightEntry[]> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true })
    if (error) throw error
    return (data as WeightRow[]).map(fromRow)
  }

  async latest(userId: string): Promise<WeightEntry | undefined> {
    const entries = await this.all(userId)
    return entries[entries.length - 1]
  }

  async add(entry: NewWeightEntry): Promise<WeightEntry> {
    const { data, error } = await supabase
      .from('weight_entries')
      .insert({
        user_id: entry.userId,
        entry_date: entry.date,
        weight_kg: entry.weightKg,
        note: entry.note ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return fromRow(data as WeightRow)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('weight_entries').delete().eq('id', id)
    if (error) throw error
  }
}

export const weightRepository: WeightRepository = new SupabaseWeightRepository()
