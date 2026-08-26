import { useState } from 'react'
import type { ExerciseCategory } from '../../../data/types/exercise.types'
import { EXERCISE_CATEGORIES, estimateCaloriesBurned } from '../../../domain/exercise'
import { Button } from '../../../shared/components/Button'
import { Chip } from '../../../shared/components/Chip'

export interface ExerciseFormValues {
  category: ExerciseCategory
  durationMin: number
  caloriesBurned: number
  note?: string
}

interface ExerciseSheetProps {
  initial?: Partial<ExerciseFormValues>
  weightKg: number
  confirmLabel?: string
  onCancel: () => void
  onConfirm: (values: ExerciseFormValues) => void
  onDelete?: () => void
}

export function ExerciseSheet({ initial, weightKg, confirmLabel = 'Simpan', onCancel, onConfirm, onDelete }: ExerciseSheetProps) {
  const [category, setCategory] = useState<ExerciseCategory>(initial?.category ?? 'walk')
  const [duration, setDuration] = useState(initial?.durationMin ? String(initial.durationMin) : '')
  const [calories, setCalories] = useState(initial?.caloriesBurned ? String(initial.caloriesBurned) : '')
  const [manualCalories, setManualCalories] = useState(Boolean(initial?.caloriesBurned))
  const [note, setNote] = useState(initial?.note ?? '')
  const [deleteArmed, setDeleteArmed] = useState(false)

  const durationNum = Number(duration)
  const canSave = duration.trim() !== '' && durationNum > 0

  const applyCategory = (next: ExerciseCategory) => {
    setCategory(next)
    if (!manualCalories && durationNum > 0) {
      setCalories(String(estimateCaloriesBurned(next, durationNum, weightKg)))
    }
  }

  const applyDuration = (value: string) => {
    setDuration(value)
    const n = Number(value)
    if (!manualCalories && n > 0) {
      setCalories(String(estimateCaloriesBurned(category, n, weightKg)))
    }
  }

  const handleSave = () => {
    if (!canSave) return
    onConfirm({
      category,
      durationMin: Math.round(durationNum),
      caloriesBurned: Math.max(0, Math.round(Number(calories) || 0)),
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onCancel}>
      <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-base font-semibold text-ink">🏃 Catat Olahraga</p>
        <p className="mt-0.5 text-xs text-ink-dim">Estimasi kalori otomatis, bisa kamu sesuaikan.</p>

        <p className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Kategori</p>
        <div className="grid grid-cols-2 gap-1.5">
          {EXERCISE_CATEGORIES.map((c) => (
            <Chip key={c.value} label={`${c.icon} ${c.label}`} active={category === c.value} onClick={() => applyCategory(c.value)} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-dim">Durasi</span>
          <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3.5 py-2.5">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={duration}
              onChange={(e) => applyDuration(e.target.value)}
              placeholder="30"
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
            <span className="shrink-0 text-xs text-ink-dim">menit</span>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-dim">Kalori terbakar</span>
          <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3.5 py-2.5">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={calories}
              onChange={(e) => {
                setManualCalories(true)
                setCalories(e.target.value)
              }}
              placeholder="0"
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
            <span className="shrink-0 text-xs text-ink-dim">kkal</span>
          </div>
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-dim">Deskripsi (opsional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. Badminton 1 jam"
            className="rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-dim"
          />
        </label>

        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={handleSave} disabled={!canSave}>
            {confirmLabel}
          </Button>
          {onDelete && (
            <button
              type="button"
              onClick={() => (deleteArmed ? onDelete() : setDeleteArmed(true))}
              className={`text-center text-xs font-semibold ${deleteArmed ? 'text-pro' : 'text-ink-dim'}`}
            >
              {deleteArmed ? 'Yakin hapus? Tap lagi' : 'Hapus catatan ini'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
