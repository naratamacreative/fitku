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
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-surface-2 px-5 pt-8 pb-6">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex justify-between rounded-2xl bg-surface px-4 py-3">
          <span className="text-xs text-ink-dim">Kondisi sekarang</span>
          <span className="text-sm font-semibold tabular-nums text-ink">{user.weightKg} kg</span>
        </div>
        <div className="flex justify-between rounded-2xl bg-surface px-4 py-3">
          <span className="text-xs text-ink-dim">Target realistis</span>
          <span className="text-sm font-semibold tabular-nums text-ink">{user.targetWeightKg} kg</span>
        </div>

        <div className="py-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">Target harian kalori</p>
          <p className="mt-1 font-display text-5xl font-bold tabular-nums text-accent">
            {user.targetCalories.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-xs text-ink-dim">
            kkal · protein <b className="tabular-nums text-ink">{user.targetProtein}g</b>
          </p>
        </div>

        <p className="text-center text-xs leading-relaxed text-ink-dim">
          {weeks && weeks > 0 ? (
            <>
              Estimasi <b className="text-ink">~{weeks} minggu</b> untuk {GOAL_LABEL[user.goal]}, dengan defisit
              bertahap &amp; aktivitas yang kamu pilih.
              <br />
            </>
          ) : null}
          Langkah pertama: <b className="text-ink">catat makananmu berikutnya.</b>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl bg-pro-soft px-4 py-2.5">
          <span className="text-xs text-pro-ink">
            <b className="font-bold text-pro">PRO</b> rencana makan otomatis &amp; riwayat penuh
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
