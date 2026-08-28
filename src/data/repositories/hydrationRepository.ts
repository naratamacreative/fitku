import { supabase } from '../../shared/lib/supabaseClient'
import type { HydrationLog } from '../types/log.types'

// Sane ceiling to guard against fat-finger custom-amount input — not a real target.
const MAX_GLASSES = 40

export interface HydrationRepository {
  getForDate(userId: string, date: string): Promise<number>
  getByDateRange(userId: string, fromDate: string, toDate: string): Promise<HydrationLog[]>
  adjust(userId: string, date: string, delta: number): Promise<number>
  set(userId: string, date: string, glasses: number): Promise<number>
}

interface HydrationRow {
  user_id: string
  log_date: string
  glasses: number
}

function fromRow(row: HydrationRow): HydrationLog {
  return { key: `${row.user_id}:${row.log_date}`, userId: row.user_id, date: row.log_date, glasses: row.glasses }
}

class SupabaseHydrationRepository implements HydrationRepository {
  async getForDate(userId: string, date: string): Promise<number> {
    const { data, error } = await supabase
      .from('hydration_logs')
      .select('glasses')
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle()
    if (error) throw error
    return data?.glasses ?? 0
  }

  async getByDateRange(userId: string, fromDate: string, toDate: string): Promise<HydrationLog[]> {
    const { data, error } = await supabase
      .from('hydration_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', fromDate)
      .lte('log_date', toDate)
    if (error) throw error
    return (data as HydrationRow[]).map(fromRow)
  }

  /** delta can be positive (quick add / custom amount) or negative (undo / decrement).
   * NOTE: unlike the old Dexie version (which wrapped this in a transaction), this is a
   * plain read-then-write — supabase-js has no client-side transaction API, so a very
   * fast double-tap could in theory race and lose an increment. Accepted trade-off of
   * this migration; a Postgres RPC function would be the fix if this becomes a real issue. */
  async adjust(userId: string, date: string, delta: number): Promise<number> {
    const current = await this.getForDate(userId, date)
    const glasses = Math.min(MAX_GLASSES, Math.max(0, current + delta))
    const { error } = await supabase
      .from('hydration_logs')
      .upsert({ user_id: userId, log_date: date, glasses }, { onConflict: 'user_id,log_date' })
    if (error) throw error
    return glasses
  }

  /** Absolute correction — overwrites today's total directly, e.g. fixing a mis-tap. */
  async set(userId: string, date: string, glasses: number): Promise<number> {
    const clamped = Math.min(MAX_GLASSES, Math.max(0, Math.round(glasses)))
    const { error } = await supabase
      .from('hydration_logs')
      .upsert({ user_id: userId, log_date: date, glasses: clamped }, { onConflict: 'user_id,log_date' })
    if (error) throw error
    return clamped
  }
}

export const hydrationRepository: HydrationRepository = new SupabaseHydrationRepository()
