import type { Goal } from '../../../data/types/user.types'
import { Button } from '../../../shared/components/Button'
import { OptionCard } from '../../../shared/components/OptionCard'
import type { StepProps } from '../onboarding.types'

const GOALS: { value: Goal; label: string; sublabel: string }[] = [
  { value: 'lose_weight', label: 'Turun berat badan', sublabel: 'Defisit kalori bertahap' },
  { value: 'gain_muscle', label: 'Naik otot', sublabel: 'Surplus kalori + protein tinggi' },
  { value: 'maintain', label: 'Jaga berat badan', sublabel: 'Kalori seimbang' },
]

export function GoalStep({ draft, onChange, onNext }: StepProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">Apa tujuanmu?</h2>
      <p className="-mt-2 text-sm text-ink-dim">Seperti sesi pertama dengan personal trainer.</p>
      {GOALS.map((g) => (
        <OptionCard
          key={g.value}
          label={g.label}
          sublabel={g.sublabel}
          selected={draft.goal === g.value}
          onSelect={() => onChange({ goal: g.value })}
        />
      ))}
      <div className="mt-auto pt-3">
        <Button disabled={!draft.goal} onClick={onNext}>
          Lanjut
        </Button>
      </div>
    </div>
  )
}
