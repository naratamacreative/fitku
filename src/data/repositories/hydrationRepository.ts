import { db } from '../db'
import type { HydrationLog } from '../types/log.types'

const GLASS_TARGET = 8

export interface HydrationRepository {
  getForDate(userId: string, date: string): Promise<number>
  increment(userId: string, date: string): Promise<number>
}

class DexieHydrationRepository implements HydrationRepository {
  async getForDate(userId: string, date: string): Promise<number> {
    const entry = await db.hydrationLogs.get(`${userId}:${date}`)
    return entry?.glasses ?? 0
  }

  async increment(userId: string, date: string): Promise<number> {
    const key = `${userId}:${date}`
    // Wrapped in a transaction: the read-then-write was previously two
    // separate awaits, so a fast double-tap could read the same starting
    // value twice and lose an increment (classic non-atomic read-modify-write).
    return db.transaction('rw', db.hydrationLogs, async () => {
      const current = await db.hydrationLogs.get(key)
      const glasses = Math.min(GLASS_TARGET, (current?.glasses ?? 0) + 1)
      const record: HydrationLog = { key, userId, date, glasses }
      await db.hydrationLogs.put(record)
      return glasses
    })
  }
}

export const hydrationRepository: HydrationRepository = new DexieHydrationRepository()
export { GLASS_TARGET }
