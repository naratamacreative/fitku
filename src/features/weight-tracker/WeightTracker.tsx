import { useEffect, useState } from 'react'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import type { FoodLog } from '../../data/types/food.types'
import { aggregateLogs, todayIso } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { useWeightHistory } from '../../shared/hooks/useWeightHistory'

function buildSparklinePoints(weights: number[], width = 220, height = 56): string {
  if (weights.length < 2) return ''
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  return weights
    .map((w, i) => {
      const x = (i / (weights.length - 1)) * width
      const y = height - ((w - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function WeightTracker() {
  const { user } = useAppState()
  const { entries, latest, deltaKg, addEntry } = useWeightHistory(user?.id)
  const [inputWeight, setInputWeight] = useState('')
  const [last7, setLast7] = useState<{ date: string; calories: number }[]>([])
  const [avgPct, setAvgPct] = useState({ protein: 0, carbs: 0, fat: 0 })

  useEffect(() => {
    if (!user) return
    foodLogRepository.getByDateRange(user.id, isoDaysAgo(6), todayIso()).then((logs: FoodLog[]) => {
      const byDate = new Map<string, FoodLog[]>()
      for (const log of logs) byDate.set(log.date, [...(byDate.get(log.date) ?? []), log])

      const days = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i))
      setLast7(days.map((date) => ({ date, calories: aggregateLogs(byDate.get(date) ?? []).calories })))

      const loggedDays = days.filter((d) => byDate.has(d))
      if (loggedDays.length > 0 && user) {
        const totalsPerDay = loggedDays.map((d) => aggregateLogs(byDate.get(d)!))
        const avg = (key: 'protein' | 'carbs' | 'fat', target: number) =>
          target > 0
            ? Math.round(
                (totalsPerDay.reduce((s, t) => s + t[key], 0) / totalsPerDay.length / target) * 100,
              )
            : 0
        setAvgPct({
          protein: avg('protein', user.targetProtein),
          carbs: avg('carbs', user.targetCarbs),
          fat: avg('fat', user.targetFat),
        })
      }
    })
  }, [user])

  if (!user) return null

  const recent = entries.slice(-8)
  const points = buildSparklinePoints(recent.map((e) => e.weightKg))
  const maxCal = Math.max(user.targetCalories, ...last7.map((d) => d.calories), 1)

  const handleLog = async () => {
    const value = Number(inputWeight)
    if (!value) return
    await addEntry({ userId: user.id, date: todayIso(), weightKg: value })
    setInputWeight('')
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5">
        <div className="rounded-2xl bg-surface p-3 shadow-soft">
          <div className="mb-1 flex items-baseline justify-between">
            <b className="font-display text-xs text-ink">Berat Badan</b>
            {entries.length > 1 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                  deltaKg <= 0 ? 'bg-success-soft text-success' : 'bg-pro-soft text-pro'
                }`}
              >
                {deltaKg > 0 ? '+' : ''}
                {deltaKg.toFixed(1)}kg dari awal
              </span>
            )}
          </div>
          <p className="font-display text-2xl font-bold tabular-nums text-ink">{latest ? `${latest.weightKg} kg` : '—'}</p>
          {points && (
            <svg viewBox="0 0 220 56" width="100%" height="56" preserveAspectRatio="none" className="mt-1">
              <defs>
                <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--fk-primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--fk-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`${points} 220,56 0,56`} fill="url(#wgrad)" stroke="none" />
              <polyline points={points} fill="none" stroke="var(--fk-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={inputWeight}
            onChange={(e) => setInputWeight(e.target.value)}
            placeholder={latest ? String(latest.weightKg) : 'Berat (kg)'}
            className="flex-1 rounded-2xl bg-surface px-4 py-3 text-sm text-ink shadow-soft outline-none"
          />
          <div className="w-32">
            <Button onClick={handleLog} disabled={!inputWeight}>
              Catat
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-3 shadow-soft">
          <b className="font-display text-xs text-ink">Kalori 7 Hari</b>
          <div className="mt-2 flex h-10 items-end gap-1">
            {last7.map((d) => {
              const h = Math.max(4, Math.round((d.calories / maxCal) * 100))
              const overTarget = d.calories > user.targetCalories * 1.1
              return (
                <div
                  key={d.date}
                  className={`flex-1 rounded-t ${overTarget ? 'bg-pro' : 'bg-success'}`}
                  style={{ height: `${h}%` }}
                />
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-3 shadow-soft">
          <b className="font-display text-xs text-ink">Rata-rata Makro</b>
          <div className="mt-2 flex justify-between text-[10px] text-ink-dim">
            <div>
              <b className="block text-xs tabular-nums text-ink">{avgPct.protein}%</b>Protein
            </div>
            <div>
              <b className="block text-xs tabular-nums text-ink">{avgPct.carbs}%</b>Karbo
            </div>
            <div>
              <b className="block text-xs tabular-nums text-ink">{avgPct.fat}%</b>Lemak
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {[...entries]
            .reverse()
            .slice(0, 10)
            .map((entry) => (
              <div key={entry.id} className="flex justify-between border-b border-line py-2 text-xs">
                <span className="text-ink-dim">
                  {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
                <span className="tabular-nums text-ink-dim">{entry.weightKg} kg</span>
              </div>
            ))}
        </div>
      </div>
    </AppShell>
  )
}
