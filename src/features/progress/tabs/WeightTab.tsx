import { useEffect, useState } from 'react'
import type { WeightEntry } from '../../../data/types/log.types'
import { todayIso } from '../../../domain/nutrition'
import { assessWeightChange, type WeightAssessmentTone } from '../../../domain/weightAssessment'
import { Button } from '../../../shared/components/Button'
import { ProLocked } from '../../../shared/components/ProLocked'
import { useAppState } from '../../../shared/context/AppStateContext'
import { useProAccess } from '../../../shared/hooks/useProAccess'
import { useWeightHistory } from '../../../shared/hooks/useWeightHistory'

const BADGE_CLASSES: Record<WeightAssessmentTone, string> = {
  good: 'bg-success-soft text-success',
  caution: 'bg-pro-soft text-pro',
  neutral: 'bg-surface-2 text-ink-dim',
}

interface SparklineData {
  points: string
  /** y-position of the target-weight reference line, or null when there's no target to plot. */
  targetY: number | null
}

function buildSparklineData(weights: number[], targetWeightKg: number | undefined, width = 220, height = 56): SparklineData | null {
  if (weights.length < 2) return null
  const hasTarget = Number.isFinite(targetWeightKg) && (targetWeightKg as number) > 0
  // Fold the target into the min/max range too, so the reference line always lands inside
  // the chart instead of being clipped when the target sits outside the actual weight span.
  const values = hasTarget ? [...weights, targetWeightKg as number] : weights
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = weights
    .map((w, i) => {
      const x = (i / (weights.length - 1)) * width
      const y = height - ((w - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const targetY = hasTarget ? height - (((targetWeightKg as number) - min) / range) * height : null
  return { points, targetY }
}

/** One history row — two-tap delete, same pattern as MyFoodRow/ExerciseSheet elsewhere in the app. */
function WeightEntryRow({ entry, isAnchor, onDelete }: { entry: WeightEntry; isAnchor: boolean; onDelete: () => void }) {
  const [armed, setArmed] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const dateLabel = new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  useEffect(() => {
    if (!showBlocked) return
    const t = setTimeout(() => setShowBlocked(false), 3000)
    return () => clearTimeout(t)
  }, [showBlocked])

  const handleTapDelete = () => {
    if (isAnchor) {
      setShowBlocked(true)
      return
    }
    if (armed) {
      onDelete()
      return
    }
    setArmed(true)
  }

  return (
    <div className="border-b border-line py-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-dim">{dateLabel}</span>
        <div className="flex items-center gap-2.5">
          <span className="tabular-nums text-ink-dim">{entry.weightKg} kg</span>
          <button
            type="button"
            onClick={handleTapDelete}
            aria-label={armed ? `Konfirmasi hapus entri ${dateLabel}` : `Hapus entri ${dateLabel}`}
            className={`text-[10.5px] font-bold ${armed ? 'text-pro' : 'text-ink-dim'}`}
          >
            {armed ? 'Hapus?' : '✕'}
          </button>
        </div>
      </div>
      {showBlocked && <p className="mt-1 text-[10.5px] leading-relaxed text-pro">Berat awal tidak bisa dihapus — ubah lewat Edit Profil</p>}
    </div>
  )
}

export function WeightTab() {
  const { user } = useAppState()
  const proAccess = useProAccess()
  const { entries, first, latest, deltaKg, addEntry, removeEntry } = useWeightHistory(user?.id)
  const [inputWeight, setInputWeight] = useState('')

  if (!user) return null

  const fullHistory = Boolean(proAccess?.active)
  const chartEntries = fullHistory ? entries : entries.slice(-8)
  const chart = buildSparklineData(chartEntries.map((e) => e.weightKg), user.targetWeightKg)
  const listEntries = [...entries].reverse().slice(0, fullHistory ? entries.length : 10)
  const hasMoreHistory = entries.length > 10
  // Basic health info, shown to every user regardless of Pro status — not paywalled.
  const assessment = entries.length > 1 ? assessWeightChange(user.goal, deltaKg) : null

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
          {assessment && <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${BADGE_CLASSES[assessment.tone]}`}>{assessment.label}</span>}
        </div>
        <p className="font-display text-2xl font-bold tabular-nums text-ink">{latest ? `${latest.weightKg} kg` : '—'}</p>
        {chart && (
          <svg viewBox="0 0 220 56" width="100%" height="56" preserveAspectRatio="none" className="mt-1">
            <defs>
              <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--fk-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--fk-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline points={`${chart.points} 220,56 0,56`} fill="url(#wgrad)" stroke="none" />
            {chart.targetY !== null && (
              <>
                <line x1="0" y1={chart.targetY} x2="220" y2={chart.targetY} stroke="var(--fk-accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <text x="218" y={chart.targetY - 3} textAnchor="end" fontSize="7" fill="var(--fk-accent)" opacity="0.7">
                  Target: {user.targetWeightKg}kg
                </text>
              </>
            )}
            <polyline points={chart.points} fill="none" stroke="var(--fk-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <WeightEntryRow key={entry.id} entry={entry} isAnchor={entry.id === first?.id} onDelete={() => removeEntry(entry.id)} />
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
