import { useCallback, useEffect, useState } from 'react'
import { weightRepository } from '../../data/repositories/weightRepository'
import type { NewWeightEntry, WeightEntry } from '../../data/types/log.types'

export function useWeightHistory(userId: string | undefined) {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setLoading(false)
      return
    }
    const all = await weightRepository.all(userId)
    setEntries(all)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addEntry = useCallback(
    async (entry: NewWeightEntry) => {
      await weightRepository.add(entry)
      await refresh()
    },
    [refresh],
  )

  const latest = entries[entries.length - 1]
  const first = entries[0]
  const deltaKg = latest && first ? latest.weightKg - first.weightKg : 0

  return { entries, latest, deltaKg, loading, addEntry }
}
