import { db } from '../db'
import { generateId } from '../../shared/lib/id'
import type { ExerciseLog, ExerciseLogUpdate, NewExerciseLog } from '../types/exercise.types'

export interface ExerciseRepository {
  getByDate(userId: string, date: string): Promise<ExerciseLog[]>
  getByDateRange(userId: string, fromDate: string, toDate: string): Promise<ExerciseLog[]>
  add(log: NewExerciseLog): Promise<ExerciseLog>
  update(id: string, changes: ExerciseLogUpdate): Promise<void>
  delete(id: string): Promise<void>
}

class DexieExerciseRepository implements ExerciseRepository {
  async getByDate(userId: string, date: string): Promise<ExerciseLog[]> {
    return db.exerciseLogs.where('[userId+date]').equals([userId, date]).toArray()
  }

  async getByDateRange(userId: string, fromDate: string, toDate: string): Promise<ExerciseLog[]> {
    return db.exerciseLogs
      .where('date')
      .between(fromDate, toDate, true, true)
      .and((log) => log.userId === userId)
      .toArray()
  }

  async add(log: NewExerciseLog): Promise<ExerciseLog> {
    const record: ExerciseLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    await db.exerciseLogs.add(record)
    return record
  }

  async update(id: string, changes: ExerciseLogUpdate): Promise<void> {
    await db.exerciseLogs.update(id, changes)
  }

  async delete(id: string): Promise<void> {
    await db.exerciseLogs.delete(id)
  }
}

export const exerciseRepository: ExerciseRepository = new DexieExerciseRepository()
