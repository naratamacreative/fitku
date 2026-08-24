import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTheme } from '../../shared/context/ThemeContext'
import { exportBackup, importBackup } from './dataBackup'

const GOAL_LABEL: Record<string, string> = {
  lose_weight: 'Turun berat badan',
  gain_muscle: 'Naik otot',
  maintain: 'Jaga berat badan',
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  pro_monthly: 'PRO Bulanan',
  pro_annual: 'PRO Tahunan',
  pro_lifetime: 'PRO Founder',
}

export function Settings() {
  const { user } = useAppState()
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [plan, setPlan] = useState<string>('free')
  const [importMsg, setImportMsg] = useState('')

  useEffect(() => {
    if (user) subscriptionRepository.get(user.id).then((s) => setPlan(s.plan))
  }, [user])

  if (!user) return null

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const confirmed = window.confirm('Ini akan menimpa semua data di perangkat ini dengan isi file backup. Lanjutkan?')
    if (!confirmed) return
    try {
      await importBackup(file)
      setImportMsg('Data berhasil dipulihkan. Muat ulang halaman untuk melihat perubahan.')
    } catch {
      setImportMsg('Gagal memulihkan — pastikan file backup valid.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Profil</h4>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-dim">Tujuan</span>
            <span className="text-ink">{GOAL_LABEL[user.goal]}</span>
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
            <span className="font-semibold text-accent">
              {theme === 'light' ? 'Terang (default)' : 'Gelap'} — ganti
            </span>
          </button>
        </section>

        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Cadangkan Data</h4>
          <button type="button" onClick={() => exportBackup()} className="mt-2 block text-sm font-semibold text-accent">
            ↓ Unduh salinan data (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 block text-sm font-semibold text-accent"
          >
            ↑ Pulihkan dari file
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
          {importMsg && <p className="mt-2 text-xs text-ink-dim">{importMsg}</p>}
          <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
            Data tersimpan di perangkat ini saja. Ekspor rutin supaya tidak hilang.
          </p>
        </section>

        <section className="rounded-2xl bg-surface px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Langganan</h4>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-dim">Plan aktif</span>
            <span className="text-ink">{PLAN_LABEL[plan] ?? plan}</span>
          </div>
          <Link to="/premium" className="mt-2 block text-sm font-semibold text-accent">
            Lihat FitKu Premium
          </Link>
        </section>
      </div>
    </AppShell>
  )
}
