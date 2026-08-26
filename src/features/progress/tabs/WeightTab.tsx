import { useState } from 'react'
import { todayIso } from '../../../domain/nutrition'
import { Button } from '../../../shared/components/Button'
import { ProLocked } from '../../../shared/components/ProLocked'
import { useAppState } from '../../../shared/context/AppStateContext'
import { useProAccess } from '../../../shared/hooks/useProAccess'
import { useWeightHistory } from '../../../shared/hooks/useWeightHistory'

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

export function WeightTab() {
  const { user } = useAppState()
  const proAccess = useProAccess()
  const { entries, latest, deltaKg, addEntry } = useWeightHistory(user?.id)
  const [inputWeight, setInputWeight] = useState('')

  if (!user) return null

  const fullHistory = Boolean(proAccess?.active)
  const chartEntries = fullHistory ? entries : entries.slice(-8)
  const points = buildSparklinePoints(chartEntries.map((e) => e.weightKg))
  const listEntries = [...entries].reverse().slice(0, fullHistory ? entries.length : 10)
  const hasMoreHistory = entries.length > 10

  const handleLog = async () => {
    const value = Number(inputWeight)
    if (!value) return
    await addEntry({ userId: user.id, date: todayIso(), weightKg: value })
    setInputWeight('')
  }

  return (
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

      <div className="flex flex-col">
        {listEntries.map((entry) => (
          <div key={entry.id} className="flex justify-between border-b border-line py-2 text-xs">
            <span className="text-ink-dim">
              {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
            <span className="tabular-nums text-ink-dim">{entry.weightKg} kg</span>
          </div>
        ))}
      </div>

      {!fullHistory && hasMoreHistory && (
        <ProLocked
          title="Riwayat & Grafik Penuh"
          description="Lihat seluruh catatan beratmu, bukan cuma 10 terakhir — sudah kamu rasakan waktu trial, sekarang terkunci."
        />
      )}
    </div>
  )
}
