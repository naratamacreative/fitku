import { supabase } from '../../shared/lib/supabaseClient'
import type { NewUser, User } from '../types/user.types'

export interface UserRepository {
  get(): Promise<User | undefined>
  save(user: NewUser): Promise<User>
  update(id: string, patch: Partial<User>): Promise<void>
}

interface ProfileRow {
  id: string
  gender: User['gender']
  age: number
  height_cm: number
  weight_kg: number
  goal: User['goal']
  motivation: string
  target_weight_kg: number
  activity_level: User['activityLevel']
  meals_per_day: User['mealsPerDay']
  target_calories: number
  target_protein: number
  target_carbs: number
  target_fat: number
  last_adaptive_target_applied_at: string | null
  created_at: string
  updated_at: string
}

function fromRow(row: ProfileRow): User {
  return {
    id: row.id,
    gender: row.gender,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    goal: row.goal,
    motivation: row.motivation,
    targetWeightKg: row.target_weight_kg,
    activityLevel: row.activity_level,
    mealsPerDay: row.meals_per_day,
    targetCalories: row.target_calories,
    targetProtein: row.target_protein,
    targetCarbs: row.target_carbs,
    targetFat: row.target_fat,
    lastAdaptiveTargetAppliedAt: row.last_adaptive_target_applied_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

class SupabaseUserRepository implements UserRepository {
  async get(): Promise<User | undefined> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return undefined

    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
    if (error) throw error
    return data ? fromRow(data as ProfileRow) : undefined
  }

  async save(user: NewUser): Promise<User> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Tidak ada sesi login aktif — tidak bisa membuat profil.')

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        gender: user.gender,
        age: user.age,
        height_cm: user.heightCm,
        weight_kg: user.weightKg,
        goal: user.goal,
        motivation: user.motivation,
        target_weight_kg: user.targetWeightKg,
        activity_level: user.activityLevel,
        meals_per_day: user.mealsPerDay,
        target_calories: user.targetCalories,
        target_protein: user.targetProtein,
        target_carbs: user.targetCarbs,
        target_fat: user.targetFat,
      })
      .select()
      .single()
    if (error) throw error
    return fromRow(data as ProfileRow)
  }

  async update(id: string, patch: Partial<User>): Promise<void> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (patch.gender !== undefined) updates.gender = patch.gender
    if (patch.age !== undefined) updates.age = patch.age
    if (patch.heightCm !== undefined) updates.height_cm = patch.heightCm
    if (patch.weightKg !== undefined) updates.weight_kg = patch.weightKg
    if (patch.goal !== undefined) updates.goal = patch.goal
    if (patch.motivation !== undefined) updates.motivation = patch.motivation
    if (patch.targetWeightKg !== undefined) updates.target_weight_kg = patch.targetWeightKg
    if (patch.activityLevel !== undefined) updates.activity_level = patch.activityLevel
    if (patch.mealsPerDay !== undefined) updates.meals_per_day = patch.mealsPerDay
    if (patch.targetCalories !== undefined) updates.target_calories = patch.targetCalories
    if (patch.targetProtein !== undefined) updates.target_protein = patch.targetProtein
    if (patch.targetCarbs !== undefined) updates.target_carbs = patch.targetCarbs
    if (patch.targetFat !== undefined) updates.target_fat = patch.targetFat
    if (patch.lastAdaptiveTargetAppliedAt !== undefined) {
      updates.last_adaptive_target_applied_at = patch.lastAdaptiveTargetAppliedAt
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) throw error
  }
}

export const userRepository: UserRepository = new SupabaseUserRepository()
