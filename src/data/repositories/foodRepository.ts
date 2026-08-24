import { db } from '../db'
import { indonesianFoodsSeed } from '../seed/indonesianFoods.seed'
import type { Food } from '../types/food.types'

export interface FoodRepository {
  ensureSeeded(): Promise<void>
  all(): Promise<Food[]>
  search(query: string): Promise<Food[]>
  byId(id: string): Promise<Food | undefined>
}

class DexieFoodRepository implements FoodRepository {
  async ensureSeeded(): Promise<void> {
    const count = await db.foods.count()
    if (count === 0) {
      // bulkPut (not bulkAdd): safe if this races with itself (e.g. React
      // StrictMode double-invoking effects in dev) since re-inserting the
      // same fixed-id rows is a no-op instead of a duplicate-key error.
      await db.foods.bulkPut(indonesianFoodsSeed)
    }
  }

  async all(): Promise<Food[]> {
    return db.foods.toArray()
  }

  async search(query: string): Promise<Food[]> {
    const q = query.trim().toLowerCase()
    if (!q) return this.all()
    const foods = await db.foods.toArray()
    return foods.filter((f) => f.name.toLowerCase().includes(q))
  }

  async byId(id: string): Promise<Food | undefined> {
    return db.foods.get(id)
  }
}

export const foodRepository: FoodRepository = new DexieFoodRepository()
