import Dexie, { type EntityTable } from 'dexie'
import type { User } from './types/user.types'
import type { Food, FoodLog } from './types/food.types'
import type { DailySummary, SubscriptionStatus, WeightEntry } from './types/log.types'

export const SCHEMA_VERSION = 1

class FitKuDB extends Dexie {
  users!: EntityTable<User, 'id'>
  foods!: EntityTable<Food, 'id'>
  foodLogs!: EntityTable<FoodLog, 'id'>
  dailySummaries!: EntityTable<DailySummary, 'date'>
  weightHistory!: EntityTable<WeightEntry, 'id'>
  subscriptionStatus!: EntityTable<SubscriptionStatus, 'userId'>

  constructor() {
    super('fitku')
    this.version(SCHEMA_VERSION).stores({
      users: 'id',
      foods: 'id, category, region',
      foodLogs: 'id, userId, date, foodId, [userId+date]',
      dailySummaries: 'date, userId',
      weightHistory: 'id, userId, date',
      subscriptionStatus: 'userId',
    })
  }
}

export const db = new FitKuDB()
