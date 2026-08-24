import { useState } from 'react'
import { todayIso } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { useWeightHistory } from '../../shared/hooks/useWeightHistory'

function buildSparklinePoints(weights: number[], width = 220, height = 60): string {
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

export function WeightTracker() {
  const { user } = useAppState()
  const { entries, latest, deltaKg, addEntry } = useWeightHistory(user?.id)
  const [inputWeight, setInputWeight] = useState('')

  if (!user) return null

  const recent = entries.slice(-8)
  const points = buildSparklinePoints(recent.map((e) => e.weightKg))

  const handleLog = async () => {
    const value = Number(inputWeight)
    if (!value) return
    await addEntry({ userId: user.id, date: todayIso(), weightKg: value })
    setInputWeight('')
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-display text-3xl font-bold tabular-nums text-ink">
            {latest ? `${latest.weightKg} kg` : '—'}
          </p>
          <p className="-mt-1 text-xs text-ink-dim">Berat saat ini</p>
        </div>

        {entries.length > 1 && (
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              deltaKg <= 0 ? 'bg-accent-soft text-accent' : 'bg-pro-soft text-pro-ink'
            }`}
          >
            {deltaKg > 0 ? '+' : ''}
            {deltaKg.toFixed(1)} kg dari awal
          </span>
        )}

        {points && (
          <div className="rounded-2xl bg-surface p-3">
            <svg viewBox="0 0 220 60" width="100%" height="60" preserveAspectRatio="none">
              <polyline
                points={points}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={inputWeight}
            onChange={(e) => setInputWeight(e.target.value)}
            placeholder={latest ? String(latest.weightKg) : 'Berat (kg)'}
            className="flex-1 rounded-2xl bg-surface px-4 py-3 text-sm text-ink outline-none"
          />
          <div className="w-36">
            <Button onClick={handleLog} disabled={!inputWeight}>
              Catat
            </Button>
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
