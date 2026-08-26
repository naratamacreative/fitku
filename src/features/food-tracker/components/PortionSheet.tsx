import { useState } from 'react'
import type { Food, MealType } from '../../../data/types/food.types'
import { defaultMealType, MEAL_TYPES } from '../../../domain/mealTypes'
import { Button } from '../../../shared/components/Button'
import { Chip } from '../../../shared/components/Chip'

const STEPS = [0.5, 1, 1.5, 2]

interface PortionSheetProps {
  food: Food
  initialServings?: number
  initialMealType?: MealType
  confirmLabel?: string
  onCancel: () => void
  onConfirm: (food: Food, servings: number, mealType: MealType) => void
  onReport?: () => void
  reported?: boolean
}

export function PortionSheet({
  food,
  initialServings,
  initialMealType,
  confirmLabel = 'Tambahkan',
  onCancel,
  onConfirm,
  onReport,
  reported,
}: PortionSheetProps) {
  const closestStepIndex = initialServings
    ? STEPS.reduce((best, step, i) => (Math.abs(step - initialServings) < Math.abs(STEPS[best] - initialServings) ? i : best), 1)
    : 1
  const [stepIndex, setStepIndex] = useState(closestStepIndex) // default 1x
  const [mealType, setMealType] = useState<MealType>(initialMealType ?? defaultMealType())
  const servings = STEPS[stepIndex]
  const calories = Math.round(food.calories * servings)
  const protein = Math.round(food.protein * servings * 10) / 10

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-base font-semibold text-ink">{food.name}</p>
        <p className="mt-0.5 text-xs text-ink-dim">{food.servingLabel} per 1×</p>

        <p className="mt-2.5 text-sm text-ink">
          <b className="tabular-nums text-ink">{calories} kkal</b> ·{' '}
          <b className="tabular-nums text-ink">{protein}g</b> protein
        </p>

        <p className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Porsi</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-lg font-semibold text-ink active:scale-95"
            aria-label="Kurangi porsi"
          >
            –
          </button>
          <span className="w-12 text-center text-base font-semibold tabular-nums text-ink">{servings}×</span>
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-lg font-semibold text-ink active:scale-95"
            aria-label="Tambah porsi"
          >
            +
          </button>
        </div>

        <p className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Masukkan ke</p>
        <div className="grid grid-cols-2 gap-1.5">
          {MEAL_TYPES.map((m) => (
            <Chip key={m.value} label={`${m.icon} ${m.shortLabel}`} active={mealType === m.value} onClick={() => setMealType(m.value)} />
          ))}
        </div>

        <div className="mt-4">
          <Button onClick={() => onConfirm(food, servings, mealType)}>{confirmLabel}</Button>
        </div>

        {onReport && (
          <button type="button" onClick={onReport} className="mt-3 block w-full text-center text-xs text-ink-dim">
            {reported ? '✓ Sudah dilaporkan · Lihat laporan' : '⚠️ Laporkan masalah pada makanan ini'}
          </button>
        )}
      </div>
    </div>
  )
}
