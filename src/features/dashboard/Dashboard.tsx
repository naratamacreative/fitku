import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { foodRepository } from '../../data/repositories/foodRepository'
import { hydrationRepository, GLASS_TARGET } from '../../data/repositories/hydrationRepository'
import type { Food } from '../../data/types/food.types'
import { calculateDailyScore } from '../../domain/dailyScore'
import { calculateStreak, generateCoachInsight, suggestMealPlan, todayIso, type MealSuggestion } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { usePaywallTrigger } from '../../shared/hooks/usePaywallTrigger'
import { useTodayLog } from '../../shared/hooks/useTodayLog'
import { useWeightHistory } from '../../shared/hooks/useWeightHistory'
import { PaywallBanner } from '../paywall/PaywallBanner'
import { CalorieRing } from './components/CalorieRing'

const HOUR = new Date().getHours()
const GREETING = HOUR < 11 ? 'Selamat pagi' : HOUR < 15 ? 'Selamat siang' : HOUR < 18 ? 'Selamat sore' : 'Selamat malam'

const MACROS = [
  { key: 'protein' as const, label: 'Protein', color: 'var(--fk-primary)', unit: 'g' },
  { key: 'carbs' as const, label: 'Karbo', color: 'var(--fk-accent)', unit: 'g' },
  { key: 'fat' as const, label: 'Lemak', color: 'var(--fk-pro)', unit: 'g' },
]

export function Dashboard() {
  const { user } = useAppState()
  const { totals } = useTodayLog(user?.id)
  const { latest, deltaKg } = useWeightHistory(user?.id)
  const { streak: paywallStreak, shouldShowPaywall, dismiss } = usePaywallTrigger(user?.id)
  const [streak, setStreak] = useState(0)
  const [meals, setMeals] = useState<MealSuggestion[]>([])
  const [glasses, setGlasses] = useState(0)

  useEffect(() => {
    if (!user) return
    foodLogRepository.loggedDates(user.id).then((dates) => setStreak(calculateStreak(dates)))
    hydrationRepository.getForDate(user.id, todayIso()).then(setGlasses)
  }, [user, totals.count])

  useEffect(() => {
    if (!user) return
    const remaining = Math.max(0, user.targetCalories - totals.calories)
    foodRepository.all().then((foods: Food[]) => setMeals(suggestMealPlan(remaining, foods)))
  }, [user, totals.calories])

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

  const handleDrinkWater = async () => {
    if (!user) return
    const updated = await hydrationRepository.increment(user.id, todayIso())
    setGlasses(updated)
  }

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
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color }} />
                </div>
                <b className="text-[11px] tabular-nums text-ink">
                  {Math.round(value)}/{target}
                  {m.unit}
                </b>
              </div>
            )
          })}
        </div>

        {meals.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface px-3.5 py-3 shadow-soft">
            <div className="flex items-baseline justify-between">
              <b className="font-display text-xs text-ink">Menu Hari Ini</b>
              <span className="text-[9.5px] text-ink-dim">sesuai sisa kalorimu</span>
            </div>
            {meals.map((m) => (
              <div key={m.food.id} className="flex items-center justify-between">
                <div>
                  <div className="text-[11.5px] font-semibold text-ink">
                    {m.food.name}
                    {m.food.region && (
                      <span className="ml-1.5 rounded-md bg-accent-soft px-1.5 py-px text-[9px] font-bold text-accent">
                        {m.food.region}
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] text-ink-dim">{m.mealLabel}</div>
                </div>
                <span className="text-[10.5px] font-bold tabular-nums text-primary">{m.food.calories} kkal</span>
              </div>
            ))}
          </div>
        )}

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

        <div className="flex gap-2 text-[10px] text-ink-dim">
          <div className="flex-1 rounded-xl bg-surface px-2 py-1.5 text-center shadow-soft">
            Berat
            <br />
            <b className="text-ink">
              {latest ? `${latest.weightKg}kg` : '—'}
              {latest && deltaKg !== 0 && ` (${deltaKg > 0 ? '+' : ''}${deltaKg.toFixed(1)})`}
            </b>
          </div>
          <button type="button" onClick={handleDrinkWater} className="flex-1 rounded-xl bg-surface px-2 py-1.5 text-center shadow-soft">
            Air
            <br />
            <b className="text-ink">
              {glasses}/{GLASS_TARGET} gls
            </b>
          </button>
          <div className="flex-1 rounded-xl bg-surface px-2 py-1.5 text-center shadow-soft">
            Skor
            <br />
            <b className="text-ink">{score}</b>
          </div>
        </div>

        {shouldShowPaywall && <PaywallBanner streak={paywallStreak} onDismiss={dismiss} />}
      </div>
    </AppShell>
  )
}
