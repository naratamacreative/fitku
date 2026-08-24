import { db } from '../db'
import type { FoodLog, NewFoodLog } from '../types/food.types'

export interface FoodLogRepository {
  getByDate(userId: string, date: string): Promise<FoodLog[]>
  getByDateRange(userId: string, fromDate: string, toDate: string): Promise<FoodLog[]>
  add(log: NewFoodLog): Promise<FoodLog>
  delete(id: string): Promise<void>
  recentFoodIds(userId: string, limit?: number): Promise<string[]>
  loggedDates(userId: string, limit?: number): Promise<string[]>
}

class DexieFoodLogRepository implements FoodLogRepository {
  async getByDate(userId: string, date: string): Promise<FoodLog[]> {
    return db.foodLogs.where('[userId+date]').equals([userId, date]).toArray()
  }

  async getByDateRange(userId: string, fromDate: string, toDate: string): Promise<FoodLog[]> {
    return db.foodLogs
      .where('date')
      .between(fromDate, toDate, true, true)
      .and((log) => log.userId === userId)
      .toArray()
  }

  async add(log: NewFoodLog): Promise<FoodLog> {
    const record: FoodLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    await db.foodLogs.add(record)
    return record
  }

  async delete(id: string): Promise<void> {
    await db.foodLogs.delete(id)
  }

  async recentFoodIds(userId: string, limit = 6): Promise<string[]> {
    const logs = await db.foodLogs.where('userId').equals(userId).reverse().sortBy('createdAt')
    const seen = new Set<string>()
    for (const log of logs) {
      seen.add(log.foodId)
      if (seen.size >= limit) break
    }
    return Array.from(seen)
  }

  async loggedDates(userId: string, limit = 30): Promise<string[]> {
    const logs = await db.foodLogs.where('userId').equals(userId).toArray()
    const dates = Array.from(new Set(logs.map((l) => l.date))).sort((a, b) => b.localeCompare(a))
    return dates.slice(0, limit)
  }
}

export const foodLogRepository: FoodLogRepository = new DexieFoodLogRepository()
