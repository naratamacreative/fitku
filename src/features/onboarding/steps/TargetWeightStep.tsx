import { useEffect } from 'react'
import { estimateWeeksToGoal } from '../../../domain/tdee'
import { Button } from '../../../shared/components/Button'
import type { StepProps } from '../onboarding.types'

export function TargetWeightStep({ draft, onChange, onNext }: StepProps) {
  const isMaintain = draft.goal === 'maintain'

  useEffect(() => {
    if (isMaintain && draft.weightKg && draft.targetWeightKg === undefined) {
      onChange({ targetWeightKg: draft.weightKg })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaintain, draft.weightKg])

  const weeks =
    draft.weightKg && draft.targetWeightKg && draft.goal
      ? estimateWeeksToGoal(draft.weightKg, draft.targetWeightKg, draft.goal)
      : null

  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">
        {isMaintain ? 'Berat yang ingin kamu jaga' : 'Berat target realistismu'}
      </h2>
      <p className="-mt-2 text-sm text-ink-dim">
        {isMaintain
          ? 'Kami pakai berat sekarang sebagai patokan.'
          : 'Target bertahap lebih mudah dicapai daripada target ekstrem.'}
      </p>

      <label className="text-xs font-semibold text-ink-dim">Target berat (kg)</label>
      <input
        type="number"
        inputMode="decimal"
        value={draft.targetWeightKg ?? ''}
        onChange={(e) => onChange({ targetWeightKg: Number(e.target.value) || undefined })}
        placeholder={draft.weightKg ? String(draft.weightKg) : '65'}
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      {weeks !== null && weeks > 0 && (
        <div className="rounded-2xl bg-accent-soft px-4 py-3 text-xs text-ink">
          Estimasi <b className="text-accent">~{weeks} minggu</b> dengan progres bertahap &amp; sehat.
        </div>
      )}

      <div className="mt-auto pt-3">
        <Button disabled={!draft.targetWeightKg} onClick={onNext}>
          Lanjut
        </Button>
      </div>
    </div>
  )
}
