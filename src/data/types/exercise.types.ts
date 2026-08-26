export type ExerciseCategory = 'walk' | 'run' | 'cycle' | 'weights' | 'other'

export interface ExerciseLog {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  category: ExerciseCategory
  durationMin: number
  caloriesBurned: number
  // Optional free-text description — mainly used for the "Lainnya" category.
  note?: string
  createdAt: string
}

export type NewExerciseLog = Omit<ExerciseLog, 'id' | 'createdAt'>
export type ExerciseLogUpdate = Partial<Omit<ExerciseLog, 'id' | 'userId' | 'createdAt'>>
