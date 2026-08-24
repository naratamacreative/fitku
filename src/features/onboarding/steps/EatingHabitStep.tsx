import type { MealsPerDay } from '../../../data/types/user.types'
import { Button } from '../../../shared/components/Button'
import { OptionCard } from '../../../shared/components/OptionCard'
import type { StepProps } from '../onboarding.types'

const OPTIONS: { value: MealsPerDay; label: string }[] = [
  { value: '1-2', label: '1-2 kali sehari' },
  { value: '3', label: '3 kali sehari' },
  { value: '4-5', label: '4-5 kali (termasuk camilan)' },
  { value: '6+', label: '6+ kali (sering ngemil)' },
]

export function EatingHabitStep({ draft, onChange, onNext }: StepProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">
        Biasanya berapa kali kamu makan berat per hari?
      </h2>
      <p className="-mt-2 text-sm text-ink-dim">Langkah terakhir — janji, ini singkat.</p>
      {OPTIONS.map((o) => (
        <OptionCard
          key={o.value}
          label={o.label}
          selected={draft.mealsPerDay === o.value}
          onSelect={() => onChange({ mealsPerDay: o.value })}
        />
      ))}
      <div className="mt-auto pt-3">
        <Button disabled={!draft.mealsPerDay} onClick={onNext}>
          Lihat hasilku →
        </Button>
      </div>
    </div>
  )
}
