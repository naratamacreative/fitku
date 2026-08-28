import { supabase } from '../../shared/lib/supabaseClient'
import type { ExerciseLog, ExerciseLogUpdate, NewExerciseLog } from '../types/exercise.types'

export interface ExerciseRepository {
  getByDate(userId: string, date: string): Promise<ExerciseLog[]>
  getByDateRange(userId: string, fromDate: string, toDate: string): Promise<ExerciseLog[]>
  add(log: NewExerciseLog): Promise<ExerciseLog>
  update(id: string, changes: ExerciseLogUpdate): Promise<void>
  delete(id: string): Promise<void>
}

interface ExerciseRow {
  id: string
  user_id: string
  log_date: string
  category: ExerciseLog['category']
  duration_min: number
  calories_burned: number
  note: string | null
  created_at: string
}

function fromRow(row: ExerciseRow): ExerciseLog {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.log_date,
    category: row.category,
    durationMin: row.duration_min,
    caloriesBurned: row.calories_burned,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }
}

class SupabaseExerciseRepository implements ExerciseRepository {
  async getByDate(userId: string, date: string): Promise<ExerciseLog[]> {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
    if (error) throw error
    return (data as ExerciseRow[]).map(fromRow)
  }

  async getByDateRange(userId: string, fromDate: string, toDate: string): Promise<ExerciseLog[]> {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', fromDate)
      .lte('log_date', toDate)
    if (error) throw error
    return (data as ExerciseRow[]).map(fromRow)
  }

  async add(log: NewExerciseLog): Promise<ExerciseLog> {
    const { data, error } = await supabase
      .from('exercise_logs')
      .insert({
        user_id: log.userId,
        log_date: log.date,
        category: log.category,
        duration_min: log.durationMin,
        calories_burned: log.caloriesBurned,
        note: log.note ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return fromRow(data as ExerciseRow)
  }

  async update(id: string, changes: ExerciseLogUpdate): Promise<void> {
    const updates: Record<string, unknown> = {}
    if (changes.date !== undefined) updates.log_date = changes.date
    if (changes.category !== undefined) updates.category = changes.category
    if (changes.durationMin !== undefined) updates.duration_min = changes.durationMin
    if (changes.caloriesBurned !== undefined) updates.calories_burned = changes.caloriesBurned
    if (changes.note !== undefined) updates.note = changes.note
    const { error } = await supabase.from('exercise_logs').update(updates).eq('id', id)
    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('exercise_logs').delete().eq('id', id)
    if (error) throw error
  }
}

export const exerciseRepository: ExerciseRepository = new SupabaseExerciseRepository()
