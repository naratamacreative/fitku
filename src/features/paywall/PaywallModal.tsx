import { useState } from 'react'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import type { SubscriptionPlan } from '../../data/types/log.types'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { PRO_PLANS } from './paywall.triggers'

interface PaywallModalProps {
  onDismiss: () => void
}

export function PaywallModal({ onDismiss }: PaywallModalProps) {
  const { user } = useAppState()
  const [selected, setSelected] = useState<SubscriptionPlan>('pro_annual')
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  const handleActivate = async () => {
    if (!user) return
    setActivating(true)
    // No payment gateway in V1 — this records intent locally as a mock activation.
    await subscriptionRepository.activate(user.id, selected)
    setActivating(false)
    setActivated(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-7 shadow-xl">
        {activated ? (
          <div className="py-4 text-center">
            <p className="font-display text-lg font-bold text-ink">Terima kasih! 🎉</p>
            <p className="mt-1 text-sm text-ink-dim">
              FitKu PRO kamu aktif (mode uji coba — belum ada pembayaran nyata di V1).
            </p>
            <div className="mt-4">
              <Button onClick={onDismiss}>Lanjut</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-display text-lg font-bold text-ink">3 Hari Berturut-turut 🔥</p>
            <p className="mt-1 text-sm text-ink-dim">
              Kamu konsisten tracking 3 hari terakhir. Lanjutkan tanpa batas dengan PRO.
            </p>
            <div className="mt-4 flex gap-2">
              {PRO_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={`flex-1 rounded-xl border-[1.5px] px-2 py-2.5 text-center ${
                    selected === plan.id
                      ? 'border-pro bg-pro-soft'
                      : 'border-line bg-surface-2'
                  }`}
                >
                  <div className={`text-[10.5px] ${selected === plan.id ? 'text-pro-ink' : 'text-ink-dim'}`}>
                    {plan.name}
                    {plan.recommended && ' ★'}
                  </div>
                  <div className="mt-0.5 text-xs font-bold tabular-nums text-ink">{plan.priceLabel}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="pro" onClick={handleActivate} disabled={activating}>
                {activating ? 'Memproses…' : 'Coba PRO'}
              </Button>
              <Button variant="ghost" onClick={onDismiss}>
                Nanti dulu
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
