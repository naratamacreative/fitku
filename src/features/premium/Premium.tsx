import { useEffect, useState } from 'react'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import type { SubscriptionPlan, SubscriptionStatus } from '../../data/types/log.types'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { loadSnap } from '../../shared/lib/midtransSnap'
import { PRO_PLANS } from '../paywall/paywall.triggers'

// These 4 are real and actually gated via useProAccess() — see AiCoach.tsx
// (Weekly Insight mendalam, Target Adaptif, Tren Skor) and CalorieTab.tsx /
// WeightTab.tsx (Riwayat & grafik penuh). Every new user gets full access to
// all 4 during the 7-day trial (see domain/entitlement.ts), then they lock.
const BENEFITS = [
  'Weekly Insight mendalam — analisa pola 30 hari, bukan cuma 7',
  'Riwayat & grafik kalori dan berat badan tanpa batas',
  'Target kalori adaptif berdasarkan tren berat aktualmu',
  'Skor harian dengan tren & korelasi kebiasaan',
]

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  free: 'Free',
  pro_monthly: 'Pro 1 Bulan',
  pro_annual: 'Pro 3 Bulan',
  pro_lifetime: 'Pro 12 Bulan',
}

type PayState = 'idle' | 'creating' | 'confirming' | 'error'

// After Snap reports success/pending, the actual grant happens asynchronously via the
// Midtrans notification webhook (api/midtrans/notification.ts) — the client can no
// longer write subscription_status itself (see supabase/migrations/0003_payments.sql).
// Poll briefly for the webhook to land instead of trusting Snap's callback alone.
const POLL_INTERVAL_MS = 1500
const POLL_MAX_TRIES = 20

export function Premium() {
  const { user, session } = useAppState()
  const [selected, setSelected] = useState<SubscriptionPlan>('pro_annual')
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [payState, setPayState] = useState<PayState>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    subscriptionRepository.get(user.id).then(setSub)
  }, [user])

  if (!user) return null

  const isActivePaid = sub && sub.plan !== 'free' && sub.status === 'active'

  const pollForActivation = async () => {
    setPayState('confirming')
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      const latest = await subscriptionRepository.get(user.id)
      if (latest.plan !== 'free' && latest.status === 'active') {
        setSub(latest)
        setPayState('idle')
        return
      }
    }
    // Still not confirmed after ~30s — Midtrans notification may just be slow (sandbox
    // can lag). Not an error: leave the user on the confirming message rather than
    // falsely claiming failure when the payment may still land.
  }

  const handleActivate = async () => {
    if (!session) {
      setError('Sesi tidak valid — coba masuk ulang.')
      setPayState('error')
      return
    }
    setPayState('creating')
    setError('')

    try {
      const res = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: selected }),
      })
      const data = await res.json()
      if (!res.ok || !data.token) {
        setError(data.error ?? 'Gagal membuat transaksi.')
        setPayState('error')
        return
      }

      const snap = await loadSnap(import.meta.env.VITE_MIDTRANS_CLIENT_KEY)
      snap.pay(data.token, {
        onSuccess: () => void pollForActivation(),
        onPending: () => void pollForActivation(),
        onError: () => {
          setError('Pembayaran gagal. Coba lagi atau gunakan metode lain.')
          setPayState('error')
        },
        onClose: () => {
          setPayState('idle')
        },
      })
    } catch {
      setError('Gagal menghubungi server pembayaran. Cek koneksi internetmu.')
      setPayState('error')
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3">
        <div className="grad-premium rounded-2xl px-4 py-5 text-center text-white">
          <p className="font-display text-lg font-extrabold">FitKu Premium</p>
          <p className="text-[11px] opacity-90">FitKu yang makin memahami kamu</p>
        </div>

        {isActivePaid ? (
          <div className="py-4 text-center">
            <p className="font-display text-base font-bold text-ink">Premium kamu aktif 🎉</p>
            <p className="mt-1 text-sm text-ink-dim">
              Plan aktif: <b className="text-ink">{PLAN_LABEL[sub!.plan]}</b>
              {sub!.expiresAt && ` · berlaku sampai ${new Date(sub!.expiresAt).toLocaleDateString('id-ID')}`}
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
                  disabled={payState === 'creating' || payState === 'confirming'}
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

            {payState === 'confirming' && (
              <p className="text-center text-xs font-semibold text-accent">
                Menunggu konfirmasi pembayaran dari Midtrans…
              </p>
            )}
            {payState === 'error' && error && <p className="text-center text-xs font-semibold text-pro">{error}</p>}

            <Button
              variant="pro"
              onClick={handleActivate}
              disabled={payState === 'creating' || payState === 'confirming'}
            >
              {payState === 'creating'
                ? 'Membuka pembayaran…'
                : payState === 'confirming'
                  ? 'Menunggu konfirmasi…'
                  : 'Upgrade ke Premium'}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  )
}
