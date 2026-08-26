import { db } from '../db'
import type { HydrationLog } from '../types/log.types'

// Sane ceiling to guard against fat-finger custom-amount input — not a real target.
const MAX_GLASSES = 40

export interface HydrationRepository {
  getForDate(userId: string, date: string): Promise<number>
  getByDateRange(userId: string, fromDate: string, toDate: string): Promise<HydrationLog[]>
  adjust(userId: string, date: string, delta: number): Promise<number>
  set(userId: string, date: string, glasses: number): Promise<number>
}

class DexieHydrationRepository implements HydrationRepository {
  async getForDate(userId: string, date: string): Promise<number> {
    const entry = await db.hydrationLogs.get(`${userId}:${date}`)
    return entry?.glasses ?? 0
  }

  async getByDateRange(userId: string, fromDate: string, toDate: string): Promise<HydrationLog[]> {
    return db.hydrationLogs
      .where('date')
      .between(fromDate, toDate, true, true)
      .and((log) => log.userId === userId)
      .toArray()
  }

  /** delta can be positive (quick add / custom amount) or negative (undo / decrement). */
  async adjust(userId: string, date: string, delta: number): Promise<number> {
    const key = `${userId}:${date}`
    // Wrapped in a transaction: the read-then-write was previously two
    // separate awaits, so a fast double-tap could read the same starting
    // value twice and lose an increment (classic non-atomic read-modify-write).
    return db.transaction('rw', db.hydrationLogs, async () => {
      const current = await db.hydrationLogs.get(key)
      const glasses = Math.min(MAX_GLASSES, Math.max(0, (current?.glasses ?? 0) + delta))
      const record: HydrationLog = { key, userId, date, glasses }
      await db.hydrationLogs.put(record)
      return glasses
    })
  }

  /** Absolute correction — overwrites today's total directly, e.g. fixing a mis-tap. */
  async set(userId: string, date: string, glasses: number): Promise<number> {
    const key = `${userId}:${date}`
    const clamped = Math.min(MAX_GLASSES, Math.max(0, Math.round(glasses)))
    const record: HydrationLog = { key, userId, date, glasses: clamped }
    await db.hydrationLogs.put(record)
    return clamped
  }
}

export const hydrationRepository: HydrationRepository = new DexieHydrationRepository()
