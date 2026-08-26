import { useState } from 'react'
import type { MealType } from '../../../data/types/food.types'
import { defaultMealType, MEAL_TYPES } from '../../../domain/mealTypes'
import { Button } from '../../../shared/components/Button'
import { Chip } from '../../../shared/components/Chip'

export interface QuickAddValues {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: MealType
  saveToMyFoods?: boolean
}

interface QuickAddSheetProps {
  initial?: Partial<QuickAddValues>
  confirmLabel?: string
  showSaveToMyFoods?: boolean
  onCancel: () => void
  onConfirm: (values: QuickAddValues) => void
}

function NumberField({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-ink-dim">{label}</span>
      <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3.5 py-2.5">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink outline-none"
        />
        <span className="shrink-0 text-xs text-ink-dim">{unit}</span>
      </div>
    </label>
  )
}

export function QuickAddSheet({ initial, confirmLabel = 'Simpan', showSaveToMyFoods = false, onCancel, onConfirm }: QuickAddSheetProps) {
  const [name, setName] = useState(initial?.name && initial.name !== 'Tambah Cepat' ? initial.name : '')
  const [calories, setCalories] = useState(initial?.calories ? String(initial.calories) : '')
  const [protein, setProtein] = useState(initial?.protein ? String(initial.protein) : '')
  const [carbs, setCarbs] = useState(initial?.carbs ? String(initial.carbs) : '')
  const [fat, setFat] = useState(initial?.fat ? String(initial.fat) : '')
  const [mealType, setMealType] = useState<MealType>(initial?.mealType ?? defaultMealType())
  const [saveToMyFoods, setSaveToMyFoods] = useState(false)

  const caloriesNum = Number(calories)
  const canSave = calories.trim() !== '' && caloriesNum > 0

  const handleSave = () => {
    if (!canSave) return
    onConfirm({
      name: name.trim() || 'Tambah Cepat',
      calories: Math.round(caloriesNum),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      mealType,
      saveToMyFoods: showSaveToMyFoods && saveToMyFoods && name.trim() !== '',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onCancel}>
      <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-base font-semibold text-ink">Tambah Cepat</p>
        <p className="mt-0.5 text-xs text-ink-dim">Catat kalori langsung tanpa cari di database.</p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-ink-dim">Nama makanan (opsional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Nasi goreng kantin"
              className="rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-dim"
            />
          </label>
          <NumberField label="Kalori" unit="kkal" value={calories} onChange={setCalories} placeholder="450" />
          <div className="grid grid-cols-3 gap-2">
            <NumberField label="Protein" unit="g" value={protein} onChange={setProtein} placeholder="0" />
            <NumberField label="Karbo" unit="g" value={carbs} onChange={setCarbs} placeholder="0" />
            <NumberField label="Lemak" unit="g" value={fat} onChange={setFat} placeholder="0" />
          </div>
          {showSaveToMyFoods && (
            <label className={`flex items-center gap-2 text-xs ${name.trim() ? 'text-ink-dim' : 'text-ink-dim/50'}`}>
              <input
                type="checkbox"
                checked={saveToMyFoods}
                disabled={!name.trim()}
                onChange={(e) => setSaveToMyFoods(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Simpan sebagai Makanan Saya untuk dipakai lagi
            </label>
          )}
        </div>

        <p className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Masukkan ke</p>
        <div className="grid grid-cols-2 gap-1.5">
          {MEAL_TYPES.map((m) => (
            <Chip key={m.value} label={`${m.icon} ${m.shortLabel}`} active={mealType === m.value} onClick={() => setMealType(m.value)} />
          ))}
        </div>

        <div className="mt-4">
          <Button onClick={handleSave} disabled={!canSave}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
