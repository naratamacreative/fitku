import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { supabase } from '../../shared/lib/supabaseClient'

// Reached via the recovery link Supabase emails from resetPasswordForEmail (see
// Auth.tsx). The link lands here with #access_token=...&type=recovery in the URL;
// the Supabase client (detectSessionInUrl, on by default) parses that on load and
// establishes a session before this component ever renders, so by the time we get
// here `session` from AppStateContext already reflects it — no manual token parsing
// needed here. No session means the link is missing/expired/already used.
export function ResetPassword() {
  const { session, loading } = useAppState()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setSending(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSending(false)
    if (updateError) {
      setError('Gagal menyimpan password baru. Coba minta link reset lagi.')
      return
    }
    setDone(true)
  }

  if (loading) return null

  if (!session) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 bg-bg px-5">
        <h2 className="font-display text-xl font-semibold text-ink">Link tidak valid</h2>
        <p className="text-sm text-ink-dim">
          Link reset password ini sudah kedaluwarsa atau sudah dipakai. Minta link baru lewat halaman Masuk.
        </p>
        <Button onClick={() => navigate('/auth', { replace: true })}>Ke halaman Masuk</Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 bg-bg px-5">
        <h2 className="font-display text-xl font-semibold text-ink">Password berhasil diubah</h2>
        <p className="text-sm text-ink-dim">Lanjut pakai FitKu dengan password barumu.</p>
        <Button onClick={() => navigate('/', { replace: true })}>Lanjut ke FitKu</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 bg-bg px-5">
      <h2 className="font-display text-xl font-semibold text-ink">Atur password baru</h2>
      <p className="-mt-2 text-sm text-ink-dim">Masukkan password baru untuk akunmu.</p>

      <label className="mt-2 text-xs font-semibold text-ink-dim">Password baru</label>
      <input
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Minimal 6 karakter"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      <label className="mt-2 text-xs font-semibold text-ink-dim">Konfirmasi password</label>
      <input
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
        placeholder="Ulangi password baru"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      {error && <p className="text-xs font-semibold text-pro">{error}</p>}

      <Button onClick={() => void handleSubmit()} disabled={sending || !password || !confirm} className="mt-2">
        {sending ? 'Menyimpan…' : 'Simpan password baru'}
      </Button>
    </div>
  )
}
