import { db } from '../db'
import type { DailyNote } from '../types/log.types'

export interface NoteRepository {
  getForDate(userId: string, date: string): Promise<string>
  save(userId: string, date: string, text: string): Promise<void>
}

class DexieNoteRepository implements NoteRepository {
  async getForDate(userId: string, date: string): Promise<string> {
    const entry = await db.dailyNotes.get(`${userId}:${date}`)
    return entry?.text ?? ''
  }

  async save(userId: string, date: string, text: string): Promise<void> {
    const key = `${userId}:${date}`
    const record: DailyNote = { key, userId, date, text, updatedAt: new Date().toISOString() }
    await db.dailyNotes.put(record)
  }
}

export const noteRepository: NoteRepository = new DexieNoteRepository()
