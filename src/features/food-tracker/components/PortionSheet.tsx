import { useState } from 'react'
import type { Food } from '../../../data/types/food.types'
import { Button } from '../../../shared/components/Button'

const STEPS = [0.5, 1, 1.5, 2]

interface PortionSheetProps {
  food: Food
  onCancel: () => void
  onConfirm: (food: Food, servings: number) => void
}

export function PortionSheet({ food, onCancel, onConfirm }: PortionSheetProps) {
  const [stepIndex, setStepIndex] = useState(1) // default 1x
  const servings = STEPS[stepIndex]
  const calories = Math.round(food.calories * servings)
  const protein = Math.round(food.protein * servings * 10) / 10

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-base font-semibold text-ink">{food.name} — porsi</p>
        <p className="mt-0.5 text-xs text-ink-dim">{food.servingLabel} per 1×</p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-lg font-semibold text-ink"
            aria-label="Kurangi porsi"
          >
            –
          </button>
          <span className="w-12 text-center text-sm font-semibold tabular-nums text-ink">{servings}×</span>
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-lg font-semibold text-ink"
            aria-label="Tambah porsi"
          >
            +
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-ink-dim">
          <b className="tabular-nums text-ink">{calories} kkal</b> ·{' '}
          <b className="tabular-nums text-ink">{protein}g</b> protein
        </p>

        <div className="mt-4">
          <Button onClick={() => onConfirm(food, servings)}>Tambahkan</Button>
        </div>
      </div>
    </div>
  )
}
