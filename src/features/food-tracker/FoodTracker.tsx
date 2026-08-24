import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { foodRepository } from '../../data/repositories/foodRepository'
import type { Food, FoodCategory } from '../../data/types/food.types'
import { todayIso } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { Chip } from '../../shared/components/Chip'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTodayLog } from '../../shared/hooks/useTodayLog'
import { PortionSheet } from './components/PortionSheet'

type Tab = 'favorit' | 'terakhir' | 'semua' | FoodCategory

const CATEGORY_TABS: { value: FoodCategory; label: string }[] = [
  { value: 'nasi_karbo', label: 'Nasi & Karbo' },
  { value: 'lauk', label: 'Lauk' },
  { value: 'gorengan', label: 'Gorengan' },
]

export function FoodTracker() {
  const { user } = useAppState()
  const { addLog } = useTodayLog(user?.id)
  const navigate = useNavigate()

  const [allFoods, setAllFoods] = useState<Food[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('favorit')
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [frequentIds, setFrequentIds] = useState<string[]>([])
  const [activeFood, setActiveFood] = useState<Food | null>(null)

  useEffect(() => {
    foodRepository.all().then(setAllFoods)
  }, [])

  useEffect(() => {
    if (!user) return
    foodLogRepository.recentFoodIds(user.id, 8).then(setRecentIds)
    foodLogRepository.getByDateRange(user.id, '2000-01-01', todayIso()).then((logs) => {
      const counts = new Map<string, number>()
      for (const log of logs) counts.set(log.foodId, (counts.get(log.foodId) ?? 0) + 1)
      const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
      setFrequentIds(sorted.slice(0, 8))
    })
  }, [user])

  const foodsById = useMemo(() => new Map(allFoods.map((f) => [f.id, f])), [allFoods])

  const visibleFoods = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase()
      return allFoods.filter((f) => f.name.toLowerCase().includes(q))
    }
    if (tab === 'favorit') return frequentIds.map((id) => foodsById.get(id)).filter((f): f is Food => !!f)
    if (tab === 'terakhir') return recentIds.map((id) => foodsById.get(id)).filter((f): f is Food => !!f)
    if (tab === 'semua') return allFoods
    return allFoods.filter((f) => f.category === tab)
  }, [query, tab, allFoods, foodsById, frequentIds, recentIds])

  const handleAdd = async (food: Food, servings: number) => {
    if (!user) return
    await addLog({
      userId: user.id,
      foodId: food.id,
      date: todayIso(),
      servings,
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings * 10) / 10,
      carbs: Math.round(food.carbs * servings * 10) / 10,
      fat: Math.round(food.fat * servings * 10) / 10,
      foodName: food.name,
    })
    setActiveFood(null)
    navigate('/', { replace: true })
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Cari makanan…"
          className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink shadow-soft outline-none placeholder:text-ink-dim"
        />
        {!query && (
          <div className="flex gap-2 overflow-x-auto">
            <Chip label="Favorit" active={tab === 'favorit'} onClick={() => setTab('favorit')} />
            <Chip label="Terakhir" active={tab === 'terakhir'} onClick={() => setTab('terakhir')} />
            {CATEGORY_TABS.map((c) => (
              <Chip key={c.value} label={c.label} active={tab === c.value} onClick={() => setTab(c.value)} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {visibleFoods.length === 0 && (
            <p className="py-6 text-center text-xs text-ink-dim">
              {tab === 'favorit' || tab === 'terakhir'
                ? 'Belum ada riwayat — coba kategori lain.'
                : 'Makanan tidak ditemukan.'}
            </p>
          )}
          {visibleFoods.map((food) => (
            <div key={food.id} className="flex items-center justify-between rounded-2xl bg-surface px-3.5 py-2.5 shadow-soft">
              <div>
                <div className="text-sm font-bold text-ink">
                  {food.name}
                  {food.region && (
                    <span className="ml-1.5 rounded-md bg-accent-soft px-1.5 py-px text-[9px] font-bold text-accent">
                      {food.region}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-dim">{food.servingLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-ink-dim">{food.calories} kkal</span>
                <button
                  type="button"
                  onClick={() => setActiveFood(food)}
                  className="grad-hero flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold text-white"
                  aria-label={`Tambah ${food.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeFood && (
        <PortionSheet food={activeFood} onCancel={() => setActiveFood(null)} onConfirm={handleAdd} />
      )}
    </AppShell>
  )
}
