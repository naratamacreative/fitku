import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SubscriptionPlan } from '../../data/types/log.types'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { loadMidtransSnap, type SnapResult } from '../../shared/lib/midtrans'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import { PRO_PLANS } from '../paywall/paywall.triggers'

const BENEFITS = [
  'Weekly Insight mendalam — analisa pola 30 hari, bukan cuma 7',
  'Riwayat & grafik kalori dan berat badan tanpa batas',
  'Target kalori adaptif berdasarkan tren berat aktualmu',
  'Skor harian dengan tren & korelasi kebiasaan',
]

function formatIndonesianDate(date: Date): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function calculateEstimatedExpiry(planId: SubscriptionPlan): string {
  const target = new Date()
  if (planId === 'pro_monthly') target.setMonth(target.getMonth() + 1)
  else if (planId === 'pro_annual') target.setMonth(target.getMonth() + 3)
  else if (planId === 'pro_lifetime') target.setMonth(target.getMonth() + 12)
  else target.setMonth(target.getMonth() + 1)
  return formatIndonesianDate(target)
}

interface SuccessInfo {
  orderId: string
  planName: string
  expiryDate: string
}

export function Premium() {
  const { user, session, refreshUser } = useAppState()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<SubscriptionPlan>('pro_annual')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  if (!user) return null

  const activePlan = PRO_PLANS.find((p) => p.id === selected) || PRO_PLANS[1]

  const handleCheckout = async () => {
    setErrorMsg(null)
    setLoading(true)

    try {
      if (!session?.access_token) {
        setErrorMsg('Sesi login telah berakhir. Silakan muat ulang halaman.')
        setLoading(false)
        return
      }

      // Pre-load Midtrans Snap script
      await loadMidtransSnap()

      const res = await fetch('/api/payment/create-snap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId: selected }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const message =
          errorData.error || 'Gagal memulai transaksi. Silakan coba lagi.'
        setErrorMsg(message)
        setLoading(false)
        return
      }

      const { token, orderId } = (await res.json()) as {
        token: string
        orderId: string
      }

      if (!window.snap) {
        setErrorMsg('Gagal memuat sistem pembayaran Midtrans. Coba beberapa saat lagi.')
        setLoading(false)
        return
      }

      window.snap.pay(token, {
        onSuccess: async () => {
          setLoading(true)
          try {
            await refreshUser()
            // Check real subscription status from database
            const sub = await subscriptionRepository.get(user.id)
            const expiryStr = sub.expiresAt
              ? formatIndonesianDate(new Date(sub.expiresAt))
              : calculateEstimatedExpiry(selected)

            setSuccessInfo({
              orderId,
              planName: `FitKu Pro (${activePlan.name} Akses)`,
              expiryDate: `s/d ${expiryStr}`,
            })
          } catch {
            setSuccessInfo({
              orderId,
              planName: `FitKu Pro (${activePlan.name} Akses)`,
              expiryDate: `s/d ${calculateEstimatedExpiry(selected)}`,
            })
          } finally {
            setLoading(false)
          }
        },
        onPending: (_result: SnapResult) => {
          setPendingOrderId(orderId)
          setLoading(false)
        },
        onError: (_result: SnapResult) => {
          setErrorMsg('Pembayaran gagal atau dibatalkan. Kamu bisa mencoba kembali.')
          setLoading(false)
        },
        onClose: () => {
          setLoading(false)
        },
      })
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMsg('Terjadi kendala jaringan saat menghubungi sistem pembayaran.')
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3 pb-8">
        <div className="grad-premium rounded-2xl px-4 py-5 text-center text-white shadow-soft">
          <p className="font-display text-lg font-extrabold tracking-tight">FitKu Premium</p>
          <p className="text-[11px] opacity-90">FitKu yang makin memahami kebutuhan nutrisi & kebugaranmu</p>
        </div>

        {successInfo ? (
          <div className="flex flex-col items-center gap-3.5 rounded-2xl bg-surface p-5 text-center shadow-soft border border-line animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
              ✓
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-ink">Pembayaran Sukses!</p>
              <p className="mt-0.5 text-xs text-ink-dim">Akun FitKu Pro Kamu Telah Aktif 🎉</p>
            </div>

            <div className="w-full mt-1.5 rounded-xl bg-surface-subtle p-3.5 text-left text-xs space-y-2 border border-line font-medium">
              <div className="flex justify-between items-center text-ink-dim">
                <span>Order ID:</span>
                <span className="font-mono text-[11px] font-semibold text-ink">{successInfo.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-ink-dim">
                <span>Paket:</span>
                <span className="font-semibold text-ink">{successInfo.planName}</span>
              </div>
              <div className="flex justify-between items-center text-ink-dim">
                <span>Masa Aktif:</span>
                <span className="font-semibold text-ink">{successInfo.expiryDate}</span>
              </div>
              <div className="flex justify-between items-center text-ink-dim border-t border-line/60 pt-2">
                <span>Status:</span>
                <span className="font-bold text-emerald-600 tracking-wide">SETTLED (LUNAS)</span>
              </div>
            </div>

            <Button
              variant="pro"
              onClick={() => navigate('/')}
              className="mt-2"
            >
              Buka Dashboard FitKu Pro
            </Button>
          </div>
        ) : pendingOrderId ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-5 text-center shadow-soft border border-line">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xl font-bold">
              ⏱
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">Menunggu Pembayaran</p>
              <p className="mt-1 text-xs text-ink-dim">
                Pesananmu dengan Order ID <span className="font-mono font-semibold text-ink">{pendingOrderId}</span> telah dibuat. Akun Pro akan otomatis aktif setelah pembayaran diselesaikan.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setPendingOrderId(null)}
              className="mt-2 text-xs"
            >
              Kembali ke Pilihan Paket
            </Button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {BENEFITS.map((b) => (
              <div
                key={b}
                className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 shadow-soft border border-line/60"
              >
                <span className="grad-premium flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] text-white">
                  ✓
                </span>
                <span className="text-[11.5px] font-semibold text-ink">{b}</span>
              </div>
            ))}

            <p className="mt-1 text-[11px] font-semibold text-ink-dim">Pilih Durasi Berlangganan:</p>

            <div className="flex gap-2">
              {PRO_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelected(plan.id)}
                  className={`flex-1 rounded-xl px-2 py-2.5 text-center transition ${
                    selected === plan.id ? 'border-2 border-transparent shadow-soft' : 'border-[1.5px] border-line'
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
                  <div className="text-[10px] text-ink-dim font-semibold">
                    {plan.name}
                    {plan.recommended && ' ★'}
                  </div>
                  <div className="mt-0.5 text-xs font-extrabold tabular-nums text-ink">{plan.priceLabel}</div>
                  {plan.saveBadge ? (
                    <div className="mt-0.5 text-[9.5px] font-bold text-emerald-600">
                      {plan.saveBadge}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[9.5px] text-transparent select-none">-</div>
                  )}
                </button>
              ))}
            </div>

            <Button variant="pro" onClick={handleCheckout} disabled={loading} className="mt-1">
              {loading ? 'Memproses…' : `Upgrade ke Premium — ${activePlan.priceDisplay}`}
            </Button>

            <p className="text-center text-[10.5px] text-ink-dim flex items-center justify-center gap-1">
              <span>🔒</span> Pembayaran aman & instan via Midtrans Gateway
            </p>
          </>
        )}
      </div>
    </AppShell>
  )
}
