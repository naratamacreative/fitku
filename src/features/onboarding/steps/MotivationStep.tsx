import { useState } from 'react'
import { Button } from '../../../shared/components/Button'
import { OptionCard } from '../../../shared/components/OptionCard'
import type { StepProps } from '../onboarding.types'

const PRESETS = [
  'Kesehatan jangka panjang',
  'Percaya diri & penampilan',
  'Ada acara penting',
  'Performa olahraga',
]

export function MotivationStep({ draft, onChange, onNext }: StepProps) {
  const [customText, setCustomText] = useState(
    draft.motivation && !PRESETS.includes(draft.motivation) ? draft.motivation : '',
  )

  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">
        Kenapa target ini penting buatmu?
      </h2>
      <p className="-mt-2 text-sm text-ink-dim">
        Biar FitKu bisa mengingatkanmu dengan cara yang tepat.
      </p>
      {PRESETS.map((label) => (
        <OptionCard
          key={label}
          label={label}
          selected={draft.motivation === label}
          onSelect={() => {
            setCustomText('')
            onChange({ motivation: label })
          }}
        />
      ))}
      <input
        value={customText}
        onChange={(e) => {
          setCustomText(e.target.value)
          onChange({ motivation: e.target.value })
        }}
        placeholder="Tulis alasanmu sendiri (opsional)"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />
      <div className="mt-auto pt-3">
        <Button disabled={!draft.motivation} onClick={onNext}>
          Lanjut
        </Button>
      </div>
    </div>
  )
}
