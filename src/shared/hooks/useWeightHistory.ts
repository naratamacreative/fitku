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

  // The earliest-dated entry (entries[0], after the ascending sort in the repository) is
  // the anchor every delta/trend calculation is relative to — deleting it would silently
  // invalidate every badge/insight that reads deltaKg. Guarded here (not just in the UI)
  // so any future caller of this hook gets the same protection for free.
  const removeEntry = useCallback(
    async (id: string): Promise<{ ok: true } | { ok: false; reason: string }> => {
      if (entries.length > 0 && entries[0].id === id) {
        return { ok: false, reason: 'Berat awal tidak bisa dihapus — ubah lewat Edit Profil' }
      }
      await weightRepository.delete(id)
      await refresh()
      return { ok: true }
    },
    [entries, refresh],
  )

  const latest = entries[entries.length - 1]
  const first = entries[0]
  const deltaKg = latest && first ? latest.weightKg - first.weightKg : 0

  return { entries, latest, first, deltaKg, loading, addEntry, removeEntry }
}
