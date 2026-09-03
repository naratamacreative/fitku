import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTheme } from '../../shared/context/ThemeContext'
import { useProAccess } from '../../shared/hooks/useProAccess'
import { supabase } from '../../shared/lib/supabaseClient'
import { SupportChatSheet } from './components/SupportChatSheet'

const GOAL_LABEL: Record<string, string> = {
  lose_weight: 'Turun berat badan',
  gain_muscle: 'Naik otot',
  maintain: 'Jaga berat badan',
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  pro_monthly: 'PRO 1 Bulan',
  pro_annual: 'PRO 3 Bulan',
  pro_lifetime: 'PRO 12 Bulan',
  dev_test: 'PRO (Dev Test)',
}

export function Settings() {
  const { user } = useAppState()
  const { theme, toggleTheme } = useTheme()
  const proAccess = useProAccess()
  const [plan, setPlan] = useState<string>('free')
  const [supportOpen, setSupportOpen] = useState(false)

  useEffect(() => {
    if (user) subscriptionRepository.get(user.id).then((s) => setPlan(s.plan))
  }, [user])

  if (!user) return null

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl bg-surface px-4 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Profil</h4>
            <Link to="/settings/profile" className="text-xs font-semibold text-accent">
              Edit
            </Link>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-dim">Tujuan</span>
            <span className="text-ink">{GOAL_LABEL[user.goal]}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-ink-dim">Berat sekarang</span>
            <span className="tabular-nums text-ink">{user.weightKg} kg</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-ink-dim">Target berat</span>
            <span className="tabular-nums text-ink">{user.targetWeightKg} kg</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-ink-dim">Motivasi</span>
            <span className="text-right text-ink">{user.motivation}</span>
          </div>
        </section>

        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Tampilan</h4>
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-2 flex w-full items-center justify-between text-sm"
          >
            <span className="text-ink-dim">Tema</span>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {theme === 'light' ? '☀️ Terang' : '🌙 Gelap'}
            </span>
          </button>
        </section>

        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Langganan</h4>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-dim">Plan aktif</span>
            <span className="text-ink">{PLAN_LABEL[plan] ?? plan}</span>
          </div>
          {proAccess?.reason === 'trial' && (
            <div className="mt-1.5 flex justify-between text-sm">
              <span className="text-ink-dim">Status</span>
              <span className="rounded-full bg-pro-soft px-2 py-0.5 text-xs font-bold text-pro-ink">
                Trial · {proAccess.trialDaysLeft} hari lagi
              </span>
            </div>
          )}
          {proAccess?.reason === 'expired' && (
            <div className="mt-1.5 flex justify-between text-sm">
              <span className="text-ink-dim">Status</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-dim">Trial berakhir</span>
            </div>
          )}
          <Link to="/premium" className="mt-2 block text-sm font-semibold text-accent">
            Lihat FitKu Premium
          </Link>
        </section>

        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Bantuan</h4>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="mt-2 block text-sm font-semibold text-accent"
          >
            💬 Tanya Admin
          </button>
        </section>

        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Akun</h4>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="mt-2 block text-sm font-semibold text-accent"
          >
            Keluar
          </button>
        </section>
      </div>

      {supportOpen && (
        <SupportChatSheet
          userId={user.id}
          planLabel={proAccess?.reason === 'trial' ? `Trial (${PLAN_LABEL[plan] ?? plan})` : (PLAN_LABEL[plan] ?? plan)}
          trialDaysLeft={proAccess?.reason === 'trial' ? proAccess.trialDaysLeft : 0}
          onClose={() => setSupportOpen(false)}
        />
      )}
    </AppShell>
  )
}
