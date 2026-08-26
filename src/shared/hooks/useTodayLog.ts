import { useCallback, useEffect, useState } from 'react'
import { foodLogRepository, type FoodLogUpdate } from '../../data/repositories/foodLogRepository'
import type { FoodLog, NewFoodLog } from '../../data/types/food.types'
import { aggregateLogs, todayIso, type DailyTotals } from '../../domain/nutrition'

export function useTodayLog(userId: string | undefined) {
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setLogs([])
      setLoading(false)
      return
    }
    const todayLogs = await foodLogRepository.getByDate(userId, todayIso())
    setLogs(todayLogs)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addLog = useCallback(
    async (log: NewFoodLog) => {
      await foodLogRepository.add(log)
      await refresh()
    },
    [refresh],
  )

  const removeLog = useCallback(
    async (id: string) => {
      await foodLogRepository.delete(id)
      await refresh()
    },
    [refresh],
  )

  const updateLog = useCallback(
    async (id: string, changes: FoodLogUpdate) => {
      await foodLogRepository.update(id, changes)
      await refresh()
    },
    [refresh],
  )

  const totals: DailyTotals = aggregateLogs(logs)

  return { logs, totals, loading, addLog, removeLog, updateLog, refresh }
}
