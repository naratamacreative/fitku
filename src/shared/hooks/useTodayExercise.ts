import { useCallback, useEffect, useState } from 'react'
import { exerciseRepository } from '../../data/repositories/exerciseRepository'
import type { ExerciseLog, NewExerciseLog } from '../../data/types/exercise.types'
import { todayIso } from '../../domain/nutrition'

// Module-level pub/sub: BottomNav's FAB opens the exercise sheet in place (no route
// change), so Dashboard's own instance of this hook would never re-fetch on its own.
// Every mounted instance registers its refresh callback here; addExercise() notifies
// all of them, regardless of which component instance actually made the call.
const listeners = new Set<() => void>()

export function useTodayExercise(userId: string | undefined) {
  const [logs, setLogs] = useState<ExerciseLog[]>([])

  const refresh = useCallback(async () => {
    if (!userId) {
      setLogs([])
      return
    }
    const todayLogs = await exerciseRepository.getByDate(userId, todayIso())
    setLogs(todayLogs)
  }, [userId])

  useEffect(() => {
    refresh()
    listeners.add(refresh)
    return () => {
      listeners.delete(refresh)
    }
  }, [refresh])

  const addExercise = useCallback(async (log: NewExerciseLog) => {
    await exerciseRepository.add(log)
    listeners.forEach((fn) => fn())
  }, [])

  return { logs, addExercise, refresh }
}
