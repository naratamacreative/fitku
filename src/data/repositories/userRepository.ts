import { db } from '../db'
import type { NewUser, User } from '../types/user.types'

export interface UserRepository {
  get(): Promise<User | undefined>
  save(user: NewUser): Promise<User>
  update(id: string, patch: Partial<User>): Promise<void>
}

class DexieUserRepository implements UserRepository {
  async get(): Promise<User | undefined> {
    return db.users.toCollection().first()
  }

  async save(user: NewUser): Promise<User> {
    const now = new Date().toISOString()
    const record: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.users.add(record)
    return record
  }

  async update(id: string, patch: Partial<User>): Promise<void> {
    await db.users.update(id, { ...patch, updatedAt: new Date().toISOString() })
  }
}

export const userRepository: UserRepository = new DexieUserRepository()
