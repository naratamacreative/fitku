import { useNavigate } from 'react-router-dom'
import { estimateWeeksToGoal } from '../../domain/tdee'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'

const GOAL_LABEL: Record<string, string> = {
  lose_weight: 'turun berat badan',
  gain_muscle: 'naik otot',
  maintain: 'menjaga berat badan',
}

export function ResultMoment() {
  const { user } = useAppState()
  const navigate = useNavigate()

  if (!user) return null

  const weeks = estimateWeeksToGoal(user.weightKg, user.targetWeightKg, user.goal)

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bg px-5 pt-8 pb-6">
      <div className="flex flex-1 flex-col gap-3">
        <p className="mt-1 text-center font-display text-base font-bold text-ink">Rencana kamu sudah siap 🎉</p>

        <div className="flex items-center justify-center gap-2.5">
          <div className="rounded-2xl bg-surface px-4 py-2.5 text-center shadow-soft">
            <p className="font-display text-lg font-bold tabular-nums text-ink">{user.weightKg}kg</p>
            <p className="text-[10px] text-ink-dim">Sekarang</p>
          </div>
          <span className="text-grad-hero font-display text-lg font-extrabold">→</span>
          <div className="rounded-2xl bg-surface px-4 py-2.5 text-center shadow-soft">
            <p className="font-display text-lg font-bold tabular-nums text-ink">{user.targetWeightKg}kg</p>
            <p className="text-[10px] text-ink-dim">Target</p>
          </div>
        </div>
        {weeks && weeks > 0 && (
          <p className="-mt-1 text-center text-[11px] font-bold text-accent">dalam ~{weeks} minggu</p>
        )}

        <div className="mt-1 flex gap-2.5">
          <div className="flex-1 rounded-2xl bg-surface px-3 py-3 text-center shadow-soft">
            <p className="font-display text-xl font-bold tabular-nums text-ink">
              {user.targetCalories.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-ink-dim">kkal/hari</p>
          </div>
          <div className="flex-1 rounded-2xl bg-surface px-3 py-3 text-center shadow-soft">
            <p className="font-display text-xl font-bold tabular-nums text-ink">{user.targetProtein}g</p>
            <p className="text-[10px] text-ink-dim">protein/hari</p>
          </div>
        </div>

        <div className="relative mx-auto mt-1 flex h-[84px] w-[84px] items-center justify-center rounded-full grad-hero">
          <div className="absolute inset-[9px] rounded-full bg-bg" />
          <span className="relative text-center text-[10px] leading-tight text-ink-dim">
            Progress
            <br />
            dimulai
            <br />
            hari ini
          </span>
        </div>

        <p className="text-center text-xs leading-relaxed text-ink-dim">
          Langkah pertama: <b className="text-ink">catat makananmu berikutnya.</b>
          <br />
          {weeks && weeks > 0 ? <>Estimasi untuk {GOAL_LABEL[user.goal]}, dengan defisit bertahap.</> : null}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl bg-pro-soft px-4 py-2.5">
          <span className="text-xs text-pro-ink">
            <b className="font-bold text-pro">PRO</b> AI Coach lebih pintar &amp; menu personal
          </span>
          <span className="text-pro-ink">›</span>
        </div>
      </div>
      <div className="pt-4">
        <Button onClick={() => navigate('/', { replace: true })}>Mulai Tracking →</Button>
      </div>
    </div>
  )
}
