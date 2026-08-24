import type { Gender } from '../../../data/types/user.types'
import { Button } from '../../../shared/components/Button'
import type { StepProps } from '../onboarding.types'

export function BodyDataStep({ draft, onChange, onNext }: StepProps) {
  // Truthy checks alone let a negative number through (e.g. age: -5 is
  // truthy) and produce a nonsense TDEE — require positive values.
  const isValid = Boolean(draft.gender) && (draft.age ?? 0) > 0 && (draft.heightCm ?? 0) > 0 && (draft.weightKg ?? 0) > 0

  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">Ceritakan kondisimu sekarang</h2>
      <p className="-mt-2 text-sm text-ink-dim">Dipakai untuk menghitung kebutuhan kalori akuratmu.</p>

      <div className="flex gap-2">
        {(['male', 'female'] as Gender[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange({ gender: g })}
            className={`flex-1 rounded-2xl border-[1.5px] py-3 text-sm font-semibold ${
              draft.gender === g ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface text-ink-dim'
            }`}
          >
            {g === 'male' ? 'Pria' : 'Wanita'}
          </button>
        ))}
      </div>

      <label className="text-xs font-semibold text-ink-dim">Usia (tahun)</label>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        value={draft.age ?? ''}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange({ age: n > 0 ? n : undefined })
        }}
        placeholder="25"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      <label className="text-xs font-semibold text-ink-dim">Tinggi badan (cm)</label>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        value={draft.heightCm ?? ''}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange({ heightCm: n > 0 ? n : undefined })
        }}
        placeholder="170"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      <label className="text-xs font-semibold text-ink-dim">Berat badan sekarang (kg)</label>
      <input
        type="number"
        inputMode="decimal"
        min="1"
        value={draft.weightKg ?? ''}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange({ weightKg: n > 0 ? n : undefined })
        }}
        placeholder="70"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      <div className="mt-auto pt-3">
        <Button disabled={!isValid} onClick={onNext}>
          Lanjut
        </Button>
      </div>
    </div>
  )
}
