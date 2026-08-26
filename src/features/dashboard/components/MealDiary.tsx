import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FoodLog, MealType } from '../../../data/types/food.types'
import { MEAL_TYPES } from '../../../domain/mealTypes'

interface MealDiaryProps {
  logs: FoodLog[]
  onEditItem: (log: FoodLog) => void
  onDeleteItem: (log: FoodLog) => void
}

/**
 * Delete confirmation is inline (tap ✕ once to arm, again to confirm) rather
 * than window.confirm() — a native dialog blocks the page's event loop, which
 * both feels out of place next to FitKu's own sheets and breaks anything
 * automating the page. Arming auto-resets after 3s so it never gets stuck.
 */
function DiaryRow({
  log,
  onEditItem,
  onDeleteItem,
}: {
  log: FoodLog
  onEditItem: (log: FoodLog) => void
  onDeleteItem: (log: FoodLog) => void
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 shadow-soft">
      <button type="button" onClick={() => onEditItem(log)} className="flex-1 text-left">
        <span className="text-[11.5px] text-ink">{log.foodName}</span>
      </button>
      <span className="text-[10.5px] tabular-nums text-ink-dim">{log.calories} kkal</span>
      <button
        type="button"
        onClick={() => (armed ? onDeleteItem(log) : setArmed(true))}
        aria-label={armed ? `Konfirmasi hapus ${log.foodName}` : `Hapus ${log.foodName}`}
        className={`ml-2 shrink-0 text-[10.5px] font-bold ${armed ? 'text-pro' : 'text-ink-dim'}`}
      >
        {armed ? 'Hapus?' : '✕'}
      </button>
    </div>
  )
}

function MealSection({
  icon,
  label,
  mealType,
  items,
  onEditItem,
  onDeleteItem,
}: {
  icon: string
  label: string
  mealType: MealType | 'uncategorized'
  items: FoodLog[]
  onEditItem: (log: FoodLog) => void
  onDeleteItem: (log: FoodLog) => void
}) {
  const total = items.reduce((sum, l) => sum + l.calories, 0)

  return (
    <div className="flex flex-col gap-1.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs shadow-soft" aria-hidden="true">
            {icon}
          </span>
          <span className="truncate text-[11.5px] font-bold text-ink">{label}</span>
          {items.length > 0 && (
            <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[9.5px] font-semibold tabular-nums text-ink-dim">
              {total} kkal
            </span>
          )}
        </div>
        {mealType !== 'uncategorized' && (
          <Link
            to={`/tracker?meal=${mealType}`}
            className="flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1.5 text-[10.5px] font-bold text-accent transition active:scale-95"
          >
            <span className="text-xs leading-none">+</span> Catat
          </Link>
        )}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-1 pl-9">
          {items.map((log) => (
            <DiaryRow key={log.id} log={log} onEditItem={onEditItem} onDeleteItem={onDeleteItem} />
          ))}
        </div>
      ) : (
        mealType !== 'uncategorized' && (
          <Link
            to={`/tracker?meal=${mealType}`}
            className="ml-9 rounded-xl border border-dashed border-line px-3 py-2 text-[10.5px] text-ink-dim transition active:bg-surface/60"
          >
            Belum dicatat
          </Link>
        )
      )}
    </div>
  )
}

export function MealDiary({ logs, onEditItem, onDeleteItem }: MealDiaryProps) {
  const byMeal = (type: MealType) => logs.filter((l) => l.mealType === type)
  const uncategorized = logs.filter((l) => !l.mealType)

  return (
    <div className="flex flex-col divide-y divide-line rounded-2xl bg-surface-2/60 p-3">
      <b className="pb-1 font-display text-xs text-ink">Buku Harian</b>
      {MEAL_TYPES.map((m) => (
        <MealSection
          key={m.value}
          icon={m.icon}
          label={m.label}
          mealType={m.value}
          items={byMeal(m.value)}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      ))}
      {uncategorized.length > 0 && (
        <MealSection
          icon="📋"
          label="Belum dikategorikan"
          mealType="uncategorized"
          items={uncategorized}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
        />
      )}
    </div>
  )
}
