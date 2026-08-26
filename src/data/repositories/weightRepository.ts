import { db } from '../db'
import { generateId } from '../../shared/lib/id'
import type { NewWeightEntry, WeightEntry } from '../types/log.types'

export interface WeightRepository {
  all(userId: string): Promise<WeightEntry[]>
  latest(userId: string): Promise<WeightEntry | undefined>
  add(entry: NewWeightEntry): Promise<WeightEntry>
}

class DexieWeightRepository implements WeightRepository {
  async all(userId: string): Promise<WeightEntry[]> {
    const entries = await db.weightHistory.where('userId').equals(userId).toArray()
    return entries.sort((a, b) => a.date.localeCompare(b.date))
  }

  async latest(userId: string): Promise<WeightEntry | undefined> {
    const entries = await this.all(userId)
    return entries[entries.length - 1]
  }

  async add(entry: NewWeightEntry): Promise<WeightEntry> {
    const record: WeightEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    await db.weightHistory.add(record)
    return record
  }
}

export const weightRepository: WeightRepository = new DexieWeightRepository()
