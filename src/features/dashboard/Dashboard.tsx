import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { foodReportRepository } from '../../data/repositories/foodReportRepository'
import { foodRepository } from '../../data/repositories/foodRepository'
import { hydrationRepository } from '../../data/repositories/hydrationRepository'
import { noteRepository } from '../../data/repositories/noteRepository'
import type { Food, FoodLog } from '../../data/types/food.types'
import type { FoodReportReason } from '../../data/types/foodReport.types'
import { calculateDailyScore } from '../../domain/dailyScore'
import { calculateHydrationTargetGlasses } from '../../domain/hydration'
import { calculateStreak, generateCoachInsight, todayIso } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { useProAccess } from '../../shared/hooks/useProAccess'
import { usePaywallTrigger } from '../../shared/hooks/usePaywallTrigger'
import { useTodayExercise } from '../../shared/hooks/useTodayExercise'
import { useTodayLog } from '../../shared/hooks/useTodayLog'
import { useWeightHistory } from '../../shared/hooks/useWeightHistory'
import { ExerciseSheet, type ExerciseFormValues } from './components/ExerciseSheet'
import { PortionSheet } from '../food-tracker/components/PortionSheet'
import { QuickAddSheet, type QuickAddValues } from '../food-tracker/components/QuickAddSheet'
import { ReportFoodSheet } from '../food-tracker/components/ReportFoodSheet'
import { PaywallBanner } from '../paywall/PaywallBanner'
import { TrialBanner } from '../paywall/TrialBanner'
import { CalorieRing } from './components/CalorieRing'
import { MealDiary } from './components/MealDiary'

const HOUR = new Date().getHours()
const GREETING = HOUR < 11 ? 'Selamat pagi' : HOUR < 15 ? 'Selamat siang' : HOUR < 18 ? 'Selamat sore' : 'Selamat malam'

const MACROS = [
  { key: 'protein' as const, label: 'Protein', color: 'var(--fk-primary)', unit: 'g' },
  { key: 'carbs' as const, label: 'Karbo', color: 'var(--fk-accent)', unit: 'g' },
  { key: 'fat' as const, label: 'Lemak', color: 'var(--fk-pro)', unit: 'g' },
]

export function Dashboard() {
  const { user } = useAppState()
  const navigate = useNavigate()
  const { totals, logs, removeLog, updateLog } = useTodayLog(user?.id)
  const { latest, deltaKg } = useWeightHistory(user?.id)
  const { streak: paywallStreak, shouldShowPaywall, dismiss } = usePaywallTrigger(user?.id)
  const proAccess = useProAccess()
  const { logs: todayExercise, addExercise } = useTodayExercise(user?.id)
  const [streak, setStreak] = useState(0)
  const [glasses, setGlasses] = useState(0)
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null)
  const [editingFood, setEditingFood] = useState<Food | undefined>(undefined)
  const [editingFoodLookupDone, setEditingFoodLookupDone] = useState(true)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [showExerciseSheet, setShowExerciseSheet] = useState(false)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [reportingFood, setReportingFood] = useState<Food | null>(null)
  const [reportingInitial, setReportingInitial] = useState<{ reasons: FoodReportReason[]; note?: string } | undefined>()

  useEffect(() => {
    if (!user) return
    foodLogRepository.loggedDates(user.id).then((dates) => setStreak(calculateStreak(dates)))
    hydrationRepository.getForDate(user.id, todayIso()).then(setGlasses)
    noteRepository.getForDate(user.id, todayIso()).then(setNoteDraft)
  }, [user, totals.count])

  useEffect(() => {
    if (!user) return
    foodReportRepository.reportedFoodIds(user.id).then(setReportedIds)
  }, [user])

  // Async lookup replaces a synchronous find() over a fully-loaded catalog — the
  // `editingFoodLookupDone` guard exists so the "no matching Food" fallback sheet
  // (rendered below) never flashes while this fetch is still in flight.
  useEffect(() => {
    const foodId = editingLog?.foodId
    if (!foodId) {
      setEditingFood(undefined)
      setEditingFoodLookupDone(true)
      return
    }
    let cancelled = false
    setEditingFoodLookupDone(false)
    foodRepository.byId(foodId).then((food) => {
      if (cancelled) return
      setEditingFood(food)
      setEditingFoodLookupDone(true)
    })
    return () => {
      cancelled = true
    }
  }, [editingLog?.foodId])

  const handleDeleteItem = (log: FoodLog) => {
    // Confirmation is handled inline in MealDiary (tap ✕ twice) — no native
    // dialog here, since window.confirm() blocks the page's event loop.
    removeLog(log.id)
  }

  const handleEditPortion = (food: Food, servings: number, mealType: FoodLog['mealType']) => {
    if (!editingLog) return
    updateLog(editingLog.id, {
      servings,
      mealType,
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings * 10) / 10,
      carbs: Math.round(food.carbs * servings * 10) / 10,
      fat: Math.round(food.fat * servings * 10) / 10,
      foodName: food.name,
    })
    setEditingLog(null)
  }

  const handleEditQuickAdd = (values: QuickAddValues) => {
    if (!editingLog) return
    updateLog(editingLog.id, {
      calories: values.calories,
      protein: values.protein,
      carbs: values.carbs,
      fat: values.fat,
      mealType: values.mealType,
      foodName: values.name,
    })
    setEditingLog(null)
  }

  if (!user) return null

  const remaining = Math.max(0, user.targetCalories - totals.calories)
  const targets = { protein: user.targetProtein, carbs: user.targetCarbs, fat: user.targetFat }
  const score = calculateDailyScore({
    totalCalories: totals.calories,
    targetCalories: user.targetCalories,
    totalProtein: totals.protein,
    targetProtein: user.targetProtein,
    loggedCount: totals.count,
  })
  const insight = generateCoachInsight(user, totals)
  const hydrationTarget = calculateHydrationTargetGlasses(user.weightKg)
  const exerciseCalories = todayExercise.reduce((sum, e) => sum + e.caloriesBurned, 0)

  const handleSaveNote = () => {
    noteRepository.save(user.id, todayIso(), noteDraft.trim())
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const handleSaveExercise = async (values: ExerciseFormValues) => {
    await addExercise({ userId: user.id, date: todayIso(), ...values })
    setShowExerciseSheet(false)
  }

  const handleOpenReport = async (food: Food) => {
    const existing = await foodReportRepository.getForFood(user.id, food.id)
    setReportingInitial(existing ? { reasons: existing.reasons, note: existing.note } : undefined)
    setReportingFood(food)
    setEditingLog(null)
  }

  const handleSubmitReport = async (reasons: FoodReportReason[], note: string) => {
    if (!reportingFood) return
    await foodReportRepository.save(user.id, reportingFood.id, reasons, note)
    setReportedIds((prev) => new Set(prev).add(reportingFood.id))
    setReportingFood(null)
  }

  const hydrationPct = Math.min(100, Math.round((glasses / hydrationTarget) * 100))

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pb-4">
        <div className="flex items-center justify-between text-sm text-ink-dim">
          <span>
            {GREETING}, <b className="font-bold text-ink">Kamu</b> 👋
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-pro-soft px-2 py-1 text-xs font-bold text-pro">
              🔥 {streak} hari
            </span>
          )}
        </div>

        <CalorieRing consumed={totals.calories} target={user.targetCalories} />
        <p className="-mt-1 text-center text-[11.5px] text-ink-dim">
          <b className="tabular-nums text-ink">{remaining.toLocaleString('id-ID')} kkal</b> tersisa · {totals.count} makanan
        </p>

        <div className="flex gap-2">
          {MACROS.map((m) => {
            const value = totals[m.key]
            const target = targets[m.key]
            const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0
            return (
              <div key={m.key} className="flex-1 rounded-2xl bg-surface px-2.5 py-2.5 text-center shadow-soft">
                <span className="text-[9.5px] text-ink-dim">{m.label}</span>
                <div className="my-1.5 h-[5px] overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%`, background: m.color }}
                  />
                </div>
                <b className="text-[11px] tabular-nums text-ink">
                  {Math.round(value)}/{target}
                  {m.unit}
                </b>
              </div>
            )
          })}
        </div>

        <MealDiary logs={logs} onEditItem={setEditingLog} onDeleteItem={handleDeleteItem} />

        <Link
          to="/coach"
          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 shadow-soft"
          style={{
            backgroundImage:
              'linear-gradient(120deg, color-mix(in srgb, var(--fk-primary) 10%, var(--fk-surface)), color-mix(in srgb, var(--fk-accent) 10%, var(--fk-surface)))',
          }}
        >
          <span className="grad-hero flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] text-white">
            ✦
          </span>
          <span className="flex-1 text-[11px] text-ink">
            <b className="text-accent">AI Coach:</b> {insight}
          </span>
          <span className="text-accent">›</span>
        </Link>

        <div>
          <b className="mb-2 block font-display text-xs text-ink">Kebiasaan Sehat</b>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/progress?tab=weight')}
              className="flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-3 text-left shadow-soft transition active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <rect x="3.5" y="8" width="17" height="12" rx="2.5" />
                  <path d="M8 8a4 4 0 0 1 8 0" />
                  <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] text-ink-dim">Berat</span>
                <b className="block truncate text-xs text-ink">
                  {latest ? `${latest.weightKg}kg` : '—'}
                  {latest && deltaKg !== 0 && ` (${deltaKg > 0 ? '+' : ''}${deltaKg.toFixed(1)})`}
                </b>
              </span>
              <span className="shrink-0 text-sm text-ink-dim">›</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/hydration')}
              className="flex flex-col gap-2 rounded-2xl bg-surface px-3 py-3 text-left shadow-soft transition active:scale-[0.97]"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                    <path d="M6 3h12l-1.6 16.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8L6 3Z" />
                    <path d="M6.9 11h10.2" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] text-ink-dim">Air</span>
                  <b className="block text-xs tabular-nums text-ink">
                    {glasses}/{hydrationTarget} gls
                  </b>
                </span>
                <span className="shrink-0 text-sm text-ink-dim">›</span>
              </span>
              <div className="h-[5px] overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${hydrationPct}%`, background: 'var(--fk-primary)' }}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowExerciseSheet(true)}
              className="flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-3 text-left shadow-soft transition active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d="M12 21c-3.5 0-6-2.4-6-5.8 0-2.6 1.6-4.2 2.6-6 .6 1.4 1.4 1.8 1.9 1.2-.7-2.6.4-5 1.5-7.4 2 2.4 4 5 4 8.6 0 .8-.1 1.5-.4 2.2.8-.4 1.4-1.1 1.7-2 .5 1 .7 2 .7 3.2 0 3.4-2.5 6-6 6Z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] text-ink-dim">Olahraga</span>
                <b className="block truncate text-xs text-ink">{exerciseCalories > 0 ? `${exerciseCalories} kkal` : '—'}</b>
              </span>
              <span className="shrink-0 text-sm text-ink-dim">›</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/coach')}
              className="flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-3 text-left shadow-soft transition active:scale-[0.97]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[15px] w-[15px]">
                  <path d="M12 3.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7 2.2-4.5Z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] text-ink-dim">Skor</span>
                <b className="block text-xs text-ink">{score}</b>
              </span>
              <span className="shrink-0 text-sm text-ink-dim">›</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line/70 bg-surface-2/50 p-3.5">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px]">📝</span>
            <b className="font-display text-xs text-ink">Catatan Hari Ini</b>
            {noteSaved && <span className="ml-auto text-[9.5px] text-ink-dim">Tersimpan</span>}
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onFocus={() => setNoteSaved(false)}
            onBlur={handleSaveNote}
            placeholder="Apa yang ingin kamu ingat hari ini?"
            rows={2}
            className="w-full resize-none rounded-xl border border-transparent bg-surface px-3 py-2.5 text-[12.5px] text-ink outline-none transition placeholder:text-ink-dim/70 focus:border-accent/40"
          />
        </div>

        {proAccess?.reason === 'paid'
          ? null
          : proAccess && proAccess.trialDaysLeft <= 3
            ? <TrialBanner access={proAccess} />
            : shouldShowPaywall && <PaywallBanner streak={paywallStreak} onDismiss={dismiss} />}
      </div>

      {editingLog && editingFood && (
        <PortionSheet
          food={editingFood}
          initialServings={editingLog.servings}
          initialMealType={editingLog.mealType}
          confirmLabel="Simpan"
          onCancel={() => setEditingLog(null)}
          onConfirm={handleEditPortion}
          onReport={() => handleOpenReport(editingFood)}
          reported={reportedIds.has(editingFood.id)}
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
      {editingLog && editingFoodLookupDone && !editingFood && (
        <QuickAddSheet
          initial={{
            name: editingLog.foodName,
            calories: editingLog.calories,
            protein: editingLog.protein,
            carbs: editingLog.carbs,
            fat: editingLog.fat,
            mealType: editingLog.mealType,
          }}
          confirmLabel="Simpan"
          onCancel={() => setEditingLog(null)}
          onConfirm={handleEditQuickAdd}
        />
      )}
      {showExerciseSheet && (
        <ExerciseSheet weightKg={user.weightKg} onCancel={() => setShowExerciseSheet(false)} onConfirm={handleSaveExercise} />
      )}
    </AppShell>
  )
}
