import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userRepository } from '../../data/repositories/userRepository'
import type { ActivityLevel, Goal, MealsPerDay } from '../../data/types/user.types'
import { calculateTdee } from '../../domain/tdee'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { OptionCard } from '../../shared/components/OptionCard'
import { useAppState } from '../../shared/context/AppStateContext'

const GOALS: { value: Goal; label: string; sublabel: string }[] = [
  { value: 'lose_weight', label: 'Turun berat badan', sublabel: 'Defisit kalori bertahap' },
  { value: 'gain_muscle', label: 'Naik otot', sublabel: 'Surplus kalori + protein tinggi' },
  { value: 'maintain', label: 'Jaga berat badan', sublabel: 'Kalori seimbang' },
]

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; sublabel: string }[] = [
  { value: 'sedentary', label: 'Jarang gerak', sublabel: 'Kerja duduk, jarang olahraga' },
  { value: 'light', label: 'Ringan', sublabel: 'Olahraga 1-3x/minggu' },
  { value: 'moderate', label: 'Sedang', sublabel: 'Olahraga 3-5x/minggu' },
  { value: 'active', label: 'Aktif', sublabel: 'Olahraga 6-7x/minggu' },
  { value: 'very_active', label: 'Sangat aktif', sublabel: 'Fisik berat / atlet' },
]

const MEALS_PER_DAY: { value: MealsPerDay; label: string }[] = [
  { value: '1-2', label: '1-2 kali sehari' },
  { value: '3', label: '3 kali sehari' },
  { value: '4-5', label: '4-5 kali (termasuk camilan)' },
  { value: '6+', label: '6+ kali (sering ngemil)' },
]

export function EditProfile() {
  const { user, refreshUser } = useAppState()
  const navigate = useNavigate()
  const [goal, setGoal] = useState<Goal | undefined>(user?.goal)
  const [weightKg, setWeightKg] = useState(user ? String(user.weightKg) : '')
  const [targetWeightKg, setTargetWeightKg] = useState(user ? String(user.targetWeightKg) : '')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(user?.activityLevel)
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay | undefined>(user?.mealsPerDay)
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const weightNum = Number(weightKg)
  const targetWeightNum = Number(targetWeightKg)
  const isValid = Boolean(goal) && Boolean(activityLevel) && Boolean(mealsPerDay) && weightNum > 0 && targetWeightNum > 0

  const handleSave = async () => {
    if (!isValid || !goal || !activityLevel || !mealsPerDay) return
    setSaving(true)
    const tdee = calculateTdee({
      gender: user.gender,
      age: user.age,
      heightCm: user.heightCm,
      weightKg: weightNum,
      activityLevel,
      goal,
    })
    await userRepository.update(user.id, {
      goal,
      weightKg: weightNum,
      targetWeightKg: targetWeightNum,
      activityLevel,
      mealsPerDay,
      targetCalories: tdee.targetCalories,
      targetProtein: tdee.targetProtein,
      targetCarbs: tdee.targetCarbs,
      targetFat: tdee.targetFat,
    })
    await refreshUser()
    navigate('/settings', { replace: true })
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="text-ink-dim" aria-label="Kembali">
            ←
          </button>
          <b className="font-display text-sm text-ink">Edit Profil</b>
        </div>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Tujuan</h4>
          <div className="flex flex-col gap-2">
            {GOALS.map((g) => (
              <OptionCard key={g.value} label={g.label} sublabel={g.sublabel} selected={goal === g.value} onSelect={() => setGoal(g.value)} />
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Berat badan</h4>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-dim">Berat sekarang (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-dim">Target berat (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(e.target.value)}
                className="w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Tingkat aktivitas</h4>
          <div className="flex flex-col gap-2">
            {ACTIVITY_LEVELS.map((l) => (
              <OptionCard
                key={l.value}
                label={l.label}
                sublabel={l.sublabel}
                selected={activityLevel === l.value}
                onSelect={() => setActivityLevel(l.value)}
              />
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Kebiasaan makan</h4>
          <div className="flex flex-col gap-2">
            {MEALS_PER_DAY.map((m) => (
              <OptionCard key={m.value} label={m.label} selected={mealsPerDay === m.value} onSelect={() => setMealsPerDay(m.value)} />
            ))}
          </div>
        </section>

        <p className="text-[11px] leading-relaxed text-ink-dim">
          Target kalori, makro, dan air akan dihitung ulang otomatis berdasarkan data barumu.
        </p>

        <Button onClick={handleSave} disabled={!isValid || saving}>
          {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
      </div>
    </AppShell>
  )
}
