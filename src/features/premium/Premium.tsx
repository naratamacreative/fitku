import { useState } from 'react'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import type { SubscriptionPlan } from '../../data/types/log.types'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { PRO_PLANS } from '../paywall/paywall.triggers'

// These 4 are real and actually gated via useProAccess() — see AiCoach.tsx
// (Weekly Insight mendalam, Target Adaptif, Tren Skor) and CalorieTab.tsx /
// WeightTab.tsx (Riwayat & grafik penuh). Every new user gets full access to
// all 4 during the 7-day trial (see domain/entitlement.ts), then they lock.
// Replaces the earlier 4-benefit list (Chat lanjutan, Menu personal harian,
// Riwayat unlimited, Analisa progress mendalam) that was never actually
// enforced anywhere — see the P0 audit note in git history for that finding.
const BENEFITS = [
  'Weekly Insight mendalam — analisa pola 30 hari, bukan cuma 7',
  'Riwayat & grafik kalori dan berat badan tanpa batas',
  'Target kalori adaptif berdasarkan tren berat aktualmu',
  'Skor harian dengan tren & korelasi kebiasaan',
]

export function Premium() {
  const { user } = useAppState()
  const [selected, setSelected] = useState<SubscriptionPlan>('pro_annual')
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  if (!user) return null

  const handleActivate = async () => {
    setActivating(true)
    // No payment gateway in V1 — this records intent locally as a mock activation.
    await subscriptionRepository.activate(user.id, selected)
    setActivating(false)
    setActivated(true)
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3">
        <div className="grad-premium rounded-2xl px-4 py-5 text-center text-white">
          <p className="font-display text-lg font-extrabold">FitKu Premium</p>
          <p className="text-[11px] opacity-90">FitKu yang makin memahami kamu</p>
        </div>

        {activated ? (
          <div className="py-4 text-center">
            <p className="font-display text-base font-bold text-ink">Terima kasih! 🎉</p>
            <p className="mt-1 text-sm text-ink-dim">
              FitKu Premium kamu aktif (mode uji coba — belum ada pembayaran nyata di V1).
            </p>
          </div>
        ) : (
          <>
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 shadow-soft">
                <span className="grad-premium flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] text-white">
                  ✓
                </span>
                <span className="text-[11.5px] font-semibold text-ink">{b}</span>
              </div>
            ))}

            <div className="mt-1 flex gap-1.5">
              {PRO_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={`flex-1 rounded-xl px-2 py-2 text-center ${
                    selected === plan.id ? 'border-2 border-transparent' : 'border-[1.5px] border-line'
                  }`}
                  style={
                    selected === plan.id
                      ? {
                          backgroundImage:
                            'linear-gradient(var(--fk-surface),var(--fk-surface)) padding-box, linear-gradient(120deg, var(--fk-pro) 0%, var(--fk-accent) 100%) border-box',
                        }
                      : undefined
                  }
                >
                  <div className="text-[10px] text-ink-dim">
                    {plan.name}
                    {plan.recommended && ' ★'}
                  </div>
                  <div className="mt-0.5 text-xs font-bold tabular-nums text-ink">{plan.priceLabel}</div>
                </button>
              ))}
            </div>

            <Button variant="pro" onClick={handleActivate} disabled={activating}>
              {activating ? 'Memproses…' : 'Upgrade ke Premium'}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
