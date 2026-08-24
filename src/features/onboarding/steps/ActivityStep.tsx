import type { ActivityLevel } from '../../../data/types/user.types'
import { Button } from '../../../shared/components/Button'
import { OptionCard } from '../../../shared/components/OptionCard'
import type { StepProps } from '../onboarding.types'

const LEVELS: { value: ActivityLevel; label: string; sublabel: string }[] = [
  { value: 'sedentary', label: 'Jarang gerak', sublabel: 'Kerja duduk, jarang olahraga' },
  { value: 'light', label: 'Ringan', sublabel: 'Olahraga 1-3x/minggu' },
  { value: 'moderate', label: 'Sedang', sublabel: 'Olahraga 3-5x/minggu' },
  { value: 'active', label: 'Aktif', sublabel: 'Olahraga 6-7x/minggu' },
  { value: 'very_active', label: 'Sangat aktif', sublabel: 'Fisik berat / atlet' },
]

export function ActivityStep({ draft, onChange, onNext }: StepProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">Seberapa aktif harianmu?</h2>
      <p className="-mt-2 text-sm text-ink-dim">Ini menentukan seberapa besar kebutuhan kalorimu.</p>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {LEVELS.map((l) => (
          <OptionCard
            key={l.value}
            label={l.label}
            sublabel={l.sublabel}
            selected={draft.activityLevel === l.value}
            onSelect={() => onChange({ activityLevel: l.value })}
          />
        ))}
      </div>
      <div className="mt-auto pt-3">
        <Button disabled={!draft.activityLevel} onClick={onNext}>
          Lanjut
        </Button>
      </div>
    </div>
  )
}
