import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { calculateDailyScore } from '../../domain/dailyScore'
import { calculateStreak, generateCoachInsight } from '../../domain/nutrition'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTodayLog } from '../../shared/hooks/useTodayLog'
import { useWeightHistory } from '../../shared/hooks/useWeightHistory'
import { usePaywallTrigger } from '../../shared/hooks/usePaywallTrigger'
import { PaywallModal } from '../paywall/PaywallModal'
import { CalorieRing } from './components/CalorieRing'

const HOUR = new Date().getHours()
const GREETING = HOUR < 11 ? 'Selamat pagi' : HOUR < 15 ? 'Selamat siang' : HOUR < 18 ? 'Selamat sore' : 'Selamat malam'

export function Dashboard() {
  const { user } = useAppState()
  const { totals } = useTodayLog(user?.id)
  const { latest, deltaKg } = useWeightHistory(user?.id)
  const { shouldShowPaywall, dismiss } = usePaywallTrigger(user?.id)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    foodLogRepository.loggedDates(user.id).then((dates) => setStreak(calculateStreak(dates)))
  }, [user, totals.count])

  if (!user) return null

  const remaining = Math.max(0, user.targetCalories - totals.calories)
  const proteinPct = user.targetProtein > 0 ? Math.min(100, Math.round((totals.protein / user.targetProtein) * 100)) : 0
  const score = calculateDailyScore({
    totalCalories: totals.calories,
    targetCalories: user.targetCalories,
    totalProtein: totals.protein,
    targetProtein: user.targetProtein,
    loggedCount: totals.count,
  })
  const insight = generateCoachInsight(user, totals)

  return (
    <AppShell
      fab={
        <Link
          to="/tracker"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-medium text-accent-ink shadow-lg"
          aria-label="Tambah makanan"
        >
          +
        </Link>
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between text-sm text-ink-dim">
          <span>
            {GREETING}, <b className="font-semibold text-ink">Kamu</b>
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-pro-soft px-2 py-1 text-xs font-bold text-pro-ink">
              🔥 {streak}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <CalorieRing consumed={totals.calories} target={user.targetCalories} />
          <div className="text-xs leading-relaxed text-ink-dim">
            <b className="tabular-nums text-ink">{remaining.toLocaleString('id-ID')} kkal</b> tersisa hari ini
            <br />
            {totals.count} makanan tercatat
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-ink-dim">
            <span>Protein</span>
            <span className="tabular-nums">
              {Math.round(totals.protein)} / {user.targetProtein} g
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent" style={{ width: `${proteinPct}%` }} />
          </div>
        </div>

        <div className="rounded-2xl bg-accent-soft px-3.5 py-3">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-ink">
              ✦
            </span>
            <span className="text-[9.5px] font-bold uppercase tracking-wide text-accent">AI Coach</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-ink">{insight}</p>
        </div>

        <div className="flex justify-between px-0.5 text-[10.5px] text-ink-dim">
          <span>
            Skor hari ini: <b className="text-ink">{score}</b>
          </span>
          <span>
            Berat: <b className="text-ink">{latest ? `${latest.weightKg}kg` : '—'}</b>
            {latest && deltaKg !== 0 && ` (${deltaKg > 0 ? '+' : ''}${deltaKg.toFixed(1)}kg)`}
          </span>
        </div>
      </div>

      {shouldShowPaywall && <PaywallModal onDismiss={dismiss} />}
    </AppShell>
  )
}
