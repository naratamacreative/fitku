import { db } from '../db'
import type { FoodReport, FoodReportReason } from '../types/foodReport.types'

export interface FoodReportRepository {
  reportedFoodIds(userId: string): Promise<Set<string>>
  getForFood(userId: string, foodId: string): Promise<FoodReport | undefined>
  save(userId: string, foodId: string, reasons: FoodReportReason[], note: string): Promise<FoodReport>
}

class DexieFoodReportRepository implements FoodReportRepository {
  async reportedFoodIds(userId: string): Promise<Set<string>> {
    const reports = await db.foodReports.where('userId').equals(userId).toArray()
    return new Set(reports.map((r) => r.foodId))
  }

  async getForFood(userId: string, foodId: string): Promise<FoodReport | undefined> {
    return db.foodReports.get(`${userId}:${foodId}`)
  }

  async save(userId: string, foodId: string, reasons: FoodReportReason[], note: string): Promise<FoodReport> {
    const key = `${userId}:${foodId}`
    const existing = await db.foodReports.get(key)
    const now = new Date().toISOString()
    const record: FoodReport = {
      key,
      userId,
      foodId,
      reasons,
      note: note.trim() || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.foodReports.put(record)
    return record
  }
}

export const foodReportRepository: FoodReportRepository = new DexieFoodReportRepository()
