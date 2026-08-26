import Dexie, { type EntityTable } from 'dexie'
import type { User } from './types/user.types'
import type { Food, FoodLog } from './types/food.types'
import type { DailyNote, DailySummary, HydrationLog, SubscriptionStatus, WeightEntry } from './types/log.types'
import type { ExerciseLog } from './types/exercise.types'
import type { FoodReport } from './types/foodReport.types'
import type { MyFood } from './types/myFood.types'

export const SCHEMA_VERSION = 6

class FitKuDB extends Dexie {
  users!: EntityTable<User, 'id'>
  foods!: EntityTable<Food, 'id'>
  foodLogs!: EntityTable<FoodLog, 'id'>
  dailySummaries!: EntityTable<DailySummary, 'date'>
  weightHistory!: EntityTable<WeightEntry, 'id'>
  subscriptionStatus!: EntityTable<SubscriptionStatus, 'userId'>
  hydrationLogs!: EntityTable<HydrationLog, 'key'>
  dailyNotes!: EntityTable<DailyNote, 'key'>
  exerciseLogs!: EntityTable<ExerciseLog, 'id'>
  myFoods!: EntityTable<MyFood, 'id'>
  foodReports!: EntityTable<FoodReport, 'key'>

  constructor() {
    super('fitku')
    this.version(1).stores({
      users: 'id',
      foods: 'id, category, region',
      foodLogs: 'id, userId, date, foodId, [userId+date]',
      dailySummaries: 'date, userId',
      weightHistory: 'id, userId, date',
      subscriptionStatus: 'userId',
    })
    this.version(2).stores({
      hydrationLogs: 'key, userId, date',
    })
    this.version(3).stores({
      dailyNotes: 'key, userId, date',
    })
    this.version(4).stores({
      exerciseLogs: 'id, userId, date, [userId+date]',
    })
    this.version(5).stores({
      myFoods: 'id, userId',
    })
    this.version(SCHEMA_VERSION).stores({
      foodReports: 'key, userId, foodId',
    })
  }
}

export const db = new FitKuDB()
