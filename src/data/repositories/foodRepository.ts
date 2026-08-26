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
    // Always upsert (not just when empty): `foods` is written ONLY by this seed —
    // MyFood/FoodLog live in separate tables — so re-running bulkPut on every boot
    // is purely additive/self-healing. This is what lets a catalog update (e.g. new
    // items added to indonesianFoodsSeed) reach a device that was already seeded
    // from an older build, without the user having to clear IndexedDB by hand.
    // bulkPut (not bulkAdd) is also safe against StrictMode's double-invoked effects.
    await db.foods.bulkPut(indonesianFoodsSeed)
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
