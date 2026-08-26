import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTheme } from '../../shared/context/ThemeContext'
import { useProAccess } from '../../shared/hooks/useProAccess'
import { exportBackup, importBackup } from './dataBackup'

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
}

export function Settings() {
  const { user } = useAppState()
  const { theme, toggleTheme } = useTheme()
  const proAccess = useProAccess()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [plan, setPlan] = useState<string>('free')
  const [importMsg, setImportMsg] = useState('')
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) subscriptionRepository.get(user.id).then((s) => setPlan(s.plan))
  }, [user])

  if (!user) return null

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImportFile(file)
  }

  const handleCancelImport = () => {
    setPendingImportFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return
    try {
      const count = await importBackup(pendingImportFile)
      setImportMsg(`Data berhasil dipulihkan (${count} tabel). Muat ulang halaman untuk melihat perubahan.`)
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Gagal memulihkan — pastikan file backup valid.')
    } finally {
      setPendingImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileSelected} />
          {pendingImportFile && (
            <div className="mt-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
              <p className="text-[11.5px] leading-relaxed text-ink-dim">
                Ini akan menimpa semua data di perangkat ini dengan isi{' '}
                <b className="text-ink">{pendingImportFile.name}</b>. Lanjutkan?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="rounded-full bg-pro-soft px-3 py-1.5 text-xs font-bold text-pro"
                >
                  Ya, Timpa Data
                </button>
                <button
                  type="button"
                  onClick={handleCancelImport}
                  className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink-dim"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
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
      </div>
    </AppShell>
  )
}
