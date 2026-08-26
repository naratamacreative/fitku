import { db } from '../db'
import { generateId } from '../../shared/lib/id'
import type { MyFood, NewMyFood } from '../types/myFood.types'

export interface MyFoodRepository {
  all(userId: string): Promise<MyFood[]>
  add(food: NewMyFood): Promise<MyFood>
  delete(id: string): Promise<void>
}

class DexieMyFoodRepository implements MyFoodRepository {
  async all(userId: string): Promise<MyFood[]> {
    const foods = await db.myFoods.where('userId').equals(userId).toArray()
    return foods.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(food: NewMyFood): Promise<MyFood> {
    const record: MyFood = {
      ...food,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    await db.myFoods.add(record)
    return record
  }

  async delete(id: string): Promise<void> {
    await db.myFoods.delete(id)
  }
}

export const myFoodRepository: MyFoodRepository = new DexieMyFoodRepository()
