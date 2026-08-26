import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { foodReportRepository } from '../../data/repositories/foodReportRepository'
import { foodRepository } from '../../data/repositories/foodRepository'
import { myFoodRepository } from '../../data/repositories/myFoodRepository'
import type { Food, FoodCategory, MealType } from '../../data/types/food.types'
import type { FoodReportReason } from '../../data/types/foodReport.types'
import type { MyFood } from '../../data/types/myFood.types'
import { defaultMealType, isMealType, MEAL_TYPE_LABEL, MEAL_TYPES } from '../../domain/mealTypes'
import { todayIso } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { Chip } from '../../shared/components/Chip'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTodayLog } from '../../shared/hooks/useTodayLog'
import { generateId } from '../../shared/lib/id'
import { PortionSheet } from './components/PortionSheet'
import { QuickAddSheet, type QuickAddValues } from './components/QuickAddSheet'
import { ReportFoodSheet } from './components/ReportFoodSheet'

type Tab = 'favorit' | 'terakhir' | 'milikku' | 'semua' | FoodCategory

interface BasketItem {
  key: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servings: number
  mealType: MealType
  // Catalog food id for real Food rows; null for My Foods/Quick-Add-sourced rows —
  // same "snapshot, not a catalog reference" rule used everywhere else in this file.
  foodId: string | null
}

function myFoodAsFood(mf: MyFood): Food {
  return {
    id: mf.id,
    name: mf.name,
    category: 'camilan',
    servingLabel: mf.servingLabel,
    servingGrams: mf.servingGrams,
    calories: mf.calories,
    protein: mf.protein,
    carbs: mf.carbs,
    fat: mf.fat,
  }
}

/** Tiny "+" → "✓" flash used by every quick-add button — self-contained per-row state, no id bookkeeping needed. */
function useAddedFlash() {
  // A ref lock, not just the `justAdded` state, because two clicks landing back-to-back
  // before React re-renders would both still see the stale (pre-update) state value —
  // the ref is checked/set synchronously inside the same click handler, closing that gap.
  const lockRef = useRef(false)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const t = setTimeout(() => {
      lockRef.current = false
      setJustAdded(false)
    }, 800)
    return () => clearTimeout(t)
  }, [justAdded])

  const trigger = (action: () => void) => {
    if (lockRef.current) return
    lockRef.current = true
    action()
    setJustAdded(true)
  }

  return { justAdded, trigger }
}

function FoodRow({
  food,
  reported,
  onOpen,
  onQuickAdd,
}: {
  food: Food
  reported: boolean
  onOpen: () => void
  onQuickAdd: () => void
}) {
  const { justAdded, trigger } = useAddedFlash()

  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface px-3.5 py-2.5 shadow-soft">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-bold text-ink">
          {food.name}
          {food.region && (
            <span className="ml-1.5 rounded-md bg-accent-soft px-1.5 py-px text-[9px] font-bold text-accent">
              {food.region}
            </span>
          )}
          {reported && (
            <span className="ml-1.5 rounded-md bg-pro-soft px-1.5 py-px text-[9px] font-bold text-pro">
              Dilaporkan
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-dim">{food.servingLabel}</div>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs tabular-nums text-ink-dim">{food.calories} kkal</span>
        <button
          type="button"
          onClick={() => trigger(onQuickAdd)}
          disabled={justAdded}
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold transition-colors duration-150 ${
            justAdded ? 'bg-success-soft text-success' : 'grad-hero text-white'
          }`}
          aria-label={justAdded ? `${food.name} ditambahkan ke keranjang` : `Tambah ${food.name} ke keranjang`}
        >
          {justAdded ? '✓' : '+'}
        </button>
      </div>
    </div>
  )
}

function MyFoodRow({
  food,
  onOpenSheet,
  onQuickAdd,
  onDelete,
}: {
  food: MyFood
  onOpenSheet: () => void
  onQuickAdd: () => void
  onDelete: () => void
}) {
  const [armed, setArmed] = useState(false)
  const { justAdded, trigger } = useAddedFlash()

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface px-3.5 py-2.5 shadow-soft">
      <button type="button" onClick={onOpenSheet} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-bold text-ink">{food.name}</div>
        <div className="text-[11px] text-ink-dim">{food.servingLabel}</div>
      </button>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="text-xs tabular-nums text-ink-dim">{food.calories} kkal</span>
        <button
          type="button"
          onClick={() => trigger(onQuickAdd)}
          disabled={justAdded}
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold transition-colors duration-150 ${
            justAdded ? 'bg-success-soft text-success' : 'grad-hero text-white'
          }`}
          aria-label={justAdded ? `${food.name} ditambahkan ke keranjang` : `Tambah ${food.name} ke keranjang`}
        >
          {justAdded ? '✓' : '+'}
        </button>
        <button
          type="button"
          onClick={() => (armed ? onDelete() : setArmed(true))}
          aria-label={armed ? `Konfirmasi hapus ${food.name}` : `Hapus ${food.name}`}
          className={`text-[10.5px] font-bold ${armed ? 'text-pro' : 'text-ink-dim'}`}
        >
          {armed ? 'Hapus?' : '✕'}
        </button>
      </div>
    </div>
  )
}

const CATEGORY_TABS: { value: FoodCategory; label: string }[] = [
  { value: 'nasi_karbo', label: 'Nasi & Karbo' },
  { value: 'lauk', label: 'Lauk' },
  { value: 'sayur', label: 'Sayur' },
  { value: 'gorengan', label: 'Gorengan' },
  { value: 'sup_kuah', label: 'Sup & Kuah' },
  { value: 'camilan', label: 'Camilan' },
  { value: 'minuman', label: 'Minuman' },
]

export function FoodTracker() {
  const { user } = useAppState()
  const { addLog } = useTodayLog(user?.id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mealParam = searchParams.get('meal')
  const presetMealType: MealType = mealParam && isMealType(mealParam) ? mealParam : defaultMealType()
  const presetMeal = MEAL_TYPES.find((m) => m.value === presetMealType)!

  const [allFoods, setAllFoods] = useState<Food[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('favorit')
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [frequentIds, setFrequentIds] = useState<string[]>([])
  const [myFoods, setMyFoods] = useState<MyFood[]>([])
  const [activeFood, setActiveFood] = useState<Food | null>(null)
  const [activeMyFood, setActiveMyFood] = useState<MyFood | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [reportingFood, setReportingFood] = useState<Food | null>(null)
  const [reportingInitial, setReportingInitial] = useState<{ reasons: FoodReportReason[]; note?: string } | undefined>()
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [basketExpanded, setBasketExpanded] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [savingBasket, setSavingBasket] = useState(false)

  useEffect(() => {
    foodRepository.all().then(setAllFoods)
  }, [])

  useEffect(() => {
    if (!user) return
    myFoodRepository.all(user.id).then(setMyFoods)
  }, [user])

  useEffect(() => {
    if (!user) return
    foodReportRepository.reportedFoodIds(user.id).then(setReportedIds)
  }, [user])

  useEffect(() => {
    if (!user) return
    foodLogRepository.recentFoodIds(user.id, 8).then(setRecentIds)
    foodLogRepository.getByDateRange(user.id, '2000-01-01', todayIso()).then((logs) => {
      const counts = new Map<string, number>()
      for (const log of logs) {
        if (!log.foodId) continue // Quick Add entries aren't "a food" to resurface here.
        counts.set(log.foodId, (counts.get(log.foodId) ?? 0) + 1)
      }
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
    if (tab === 'favorit')
      return frequentIds.map((id) => foodsById.get(id)).filter((f): f is Food => !!f && !reportedIds.has(f.id))
    if (tab === 'terakhir') return recentIds.map((id) => foodsById.get(id)).filter((f): f is Food => !!f)
    if (tab === 'milikku') return []
    if (tab === 'semua') return allFoods
    return allFoods.filter((f) => f.category === tab)
  }, [query, tab, allFoods, foodsById, frequentIds, recentIds, reportedIds])

  const basketTotalCalories = useMemo(
    () => Math.round(basket.reduce((sum, item) => sum + item.calories * item.servings, 0)),
    [basket],
  )
  const basketHasOverflow = basket.length > 3
  const visibleBasketItems = basketExpanded || !basketHasOverflow ? basket : basket.slice(0, 3)

  const addToBasket = (item: Omit<BasketItem, 'key'>) => {
    setBasket((prev) => [...prev, { ...item, key: generateId() }])
  }

  const removeFromBasket = (key: string) => {
    setBasket((prev) => prev.filter((b) => b.key !== key))
  }

  /** Tap "+" on a catalog row — straight into the basket at 1x, no sheet, no navigation. */
  const handleQuickBasketAdd = (food: Food) => {
    addToBasket({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servings: 1,
      mealType: presetMealType,
      foodId: food.id,
    })
  }

  /** Tap "+" on a My Foods row — same quick-add, foodId null (not part of the shared catalog). */
  const handleQuickBasketAddMyFood = (food: MyFood) => {
    addToBasket({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servings: 1,
      mealType: presetMealType,
      foodId: null,
    })
  }

  /** PortionSheet "Tambahkan" for a catalog food — adds to basket, closes the sheet, stays on the list. */
  const handleConfirmFromSheet = (food: Food, servings: number, mealType: MealType) => {
    addToBasket({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servings,
      mealType,
      foodId: food.id,
    })
    setActiveFood(null)
  }

  /** Same as above for a My Foods item — foodId stays null even though `food.id` here is the MyFood's own id. */
  const handleConfirmMyFoodFromSheet = (food: Food, servings: number, mealType: MealType) => {
    addToBasket({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servings,
      mealType,
      foodId: null,
    })
    setActiveMyFood(null)
  }

  /** Commits every basket item to the real log in one go, then returns Home — the only point this flow actually persists anything. */
  const handleSaveBasket = async () => {
    if (!user || basket.length === 0) return
    setSavingBasket(true)
    for (const item of basket) {
      await foodLogRepository.add({
        userId: user.id,
        foodId: item.foodId,
        date: todayIso(),
        servings: item.servings,
        calories: Math.round(item.calories * item.servings),
        protein: Math.round(item.protein * item.servings * 10) / 10,
        carbs: Math.round(item.carbs * item.servings * 10) / 10,
        fat: Math.round(item.fat * item.servings * 10) / 10,
        foodName: item.name,
        mealType: item.mealType,
      })
    }
    navigate('/', { replace: true })
  }

  const handleBack = () => {
    if (basket.length > 0) {
      setShowCancelConfirm(true)
      return
    }
    navigate('/')
  }

  const handleConfirmCancel = () => {
    setBasket([])
    setShowCancelConfirm(false)
    navigate('/')
  }

  const handleQuickAdd = async (values: QuickAddValues) => {
    if (!user) return
    await addLog({
      userId: user.id,
      foodId: null,
      date: todayIso(),
      servings: 1,
      calories: values.calories,
      protein: values.protein,
      carbs: values.carbs,
      fat: values.fat,
      foodName: values.name,
      mealType: values.mealType,
    })
    if (values.saveToMyFoods) {
      const saved = await myFoodRepository.add({
        userId: user.id,
        name: values.name,
        servingLabel: '1 porsi',
        servingGrams: 0,
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
      })
      setMyFoods((prev) => [saved, ...prev])
    }
    setQuickAddOpen(false)
    navigate('/', { replace: true })
  }

  const handleDeleteMyFood = async (id: string) => {
    await myFoodRepository.delete(id)
    setMyFoods((prev) => prev.filter((f) => f.id !== id))
  }

  const handleOpenReport = async (food: Food) => {
    if (!user) return
    const existing = await foodReportRepository.getForFood(user.id, food.id)
    setReportingInitial(existing ? { reasons: existing.reasons, note: existing.note } : undefined)
    setReportingFood(food)
    setActiveFood(null)
  }

  const handleSubmitReport = async (reasons: FoodReportReason[], note: string) => {
    if (!user || !reportingFood) return
    await foodReportRepository.save(user.id, reportingFood.id, reasons, note)
    setReportedIds((prev) => new Set(prev).add(reportingFood.id))
    setReportingFood(null)
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Kembali ke Beranda"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink-dim"
          >
            ←
          </button>
          <span className="text-xs font-semibold text-ink-dim">
            Catat ke <b className="text-ink">{presetMeal.icon} {presetMeal.label}</b>
          </span>
        </div>

        {showCancelConfirm && (
          <div className="rounded-2xl border border-line bg-surface-2 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-ink">
              Batalkan pilihan? <b className="text-ink">{basket.length} item</b> di keranjang akan dihapus.
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={handleConfirmCancel} className="rounded-full bg-pro-soft px-3 py-1.5 text-xs font-bold text-pro">
                Ya, Batalkan
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink-dim"
              >
                Lanjutkan Pilih
              </button>
            </div>
          </div>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Cari makanan…"
          className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink shadow-soft outline-none placeholder:text-ink-dim"
        />
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-surface px-4 py-2.5 text-xs font-semibold text-accent shadow-soft"
        >
          ⚡ Tambah Cepat — catat kalori tanpa cari makanan
        </button>

        {basket.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
              Dipilih ({basket.length}) · {basketTotalCalories.toLocaleString('id-ID')} kkal
            </p>
            {visibleBasketItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 shadow-soft">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-ink">{item.name}</div>
                  <div className="text-[10.5px] text-ink-dim">
                    {item.servings}× · {MEAL_TYPE_LABEL[item.mealType]}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] tabular-nums text-ink-dim">{Math.round(item.calories * item.servings)} kkal</span>
                  <button
                    type="button"
                    onClick={() => removeFromBasket(item.key)}
                    aria-label={`Hapus ${item.name} dari keranjang`}
                    className="text-[10.5px] font-bold text-ink-dim"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {basketHasOverflow && (
              <button
                type="button"
                onClick={() => setBasketExpanded((v) => !v)}
                className="self-start text-[11px] font-semibold text-accent"
              >
                {basketExpanded ? '▲ Sembunyikan' : `▼ ...${basket.length - 3} item lainnya`}
              </button>
            )}
          </div>
        )}

        {!query && (
          <div className="flex gap-2 overflow-x-auto">
            <Chip label="Favorit" active={tab === 'favorit'} onClick={() => setTab('favorit')} size="lg" />
            <Chip label="Terakhir" active={tab === 'terakhir'} onClick={() => setTab('terakhir')} size="lg" />
            <Chip label="Milikku" active={tab === 'milikku'} onClick={() => setTab('milikku')} size="lg" />
            {CATEGORY_TABS.map((c) => (
              <Chip key={c.value} label={c.label} active={tab === c.value} onClick={() => setTab(c.value)} size="lg" />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!query && tab === 'milikku' ? (
            myFoods.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-dim">
                Belum ada Makanan Saya — centang "Simpan sebagai Makanan Saya" saat Tambah Cepat untuk mulai mengumpulkan.
              </p>
            ) : (
              myFoods.map((food) => (
                <MyFoodRow
                  key={food.id}
                  food={food}
                  onOpenSheet={() => setActiveMyFood(food)}
                  onQuickAdd={() => handleQuickBasketAddMyFood(food)}
                  onDelete={() => handleDeleteMyFood(food.id)}
                />
              ))
            )
          ) : (
            <>
              {visibleFoods.length === 0 && (
                <p className="py-6 text-center text-xs text-ink-dim">
                  {tab === 'favorit' || tab === 'terakhir'
                    ? 'Belum ada riwayat — coba kategori lain.'
                    : 'Makanan tidak ditemukan.'}
                </p>
              )}
              {visibleFoods.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  reported={reportedIds.has(food.id)}
                  onOpen={() => setActiveFood(food)}
                  onQuickAdd={() => handleQuickBasketAdd(food)}
                />
              ))}
            </>
          )}
        </div>

        {basket.length > 0 && (
          <div className="sticky bottom-0 -mx-4 mt-auto bg-bg px-4 pt-2 pb-1">
            <Button onClick={handleSaveBasket} disabled={savingBasket}>
              {savingBasket ? 'Menyimpan…' : `Simpan ${basket.length} item`}
            </Button>
          </div>
        )}
      </div>

      {activeFood && (
        <PortionSheet
          food={activeFood}
          initialMealType={presetMealType}
          onCancel={() => setActiveFood(null)}
          onConfirm={handleConfirmFromSheet}
          onReport={() => handleOpenReport(activeFood)}
          reported={reportedIds.has(activeFood.id)}
        />
      )}
      {reportingFood && (
        <ReportFoodSheet
          foodName={reportingFood.name}
          initial={reportingInitial}
          onCancel={() => setReportingFood(null)}
          onSubmit={handleSubmitReport}
        />
      )}
      {activeMyFood && (
        <PortionSheet
          food={myFoodAsFood(activeMyFood)}
          initialMealType={presetMealType}
          onCancel={() => setActiveMyFood(null)}
          onConfirm={handleConfirmMyFoodFromSheet}
        />
      )}
      {quickAddOpen && (
        <QuickAddSheet
          initial={{ mealType: presetMealType }}
          showSaveToMyFoods
          onCancel={() => setQuickAddOpen(false)}
          onConfirm={handleQuickAdd}
        />
      )}
    </AppShell>
  )
}
