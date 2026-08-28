import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { userRepository } from '../../data/repositories/userRepository'
import type { NewUser } from '../../data/types/user.types'
import { PENDING_ONBOARDING_KEY } from '../onboarding/OnboardingFlow'
import { Button } from '../../shared/components/Button'
import { useAppState } from '../../shared/context/AppStateContext'
import { supabase } from '../../shared/lib/supabaseClient'

type Mode = 'login' | 'register'

// Email OTP was the original plan, but Supabase's default email template only
// exposes the confirmation link ({{ .ConfirmationURL }}), not the 6-digit token —
// showing the token requires editing the template (SMTP-locked on this project's
// tier), so the code-entry UI never actually receives a usable code. Switched to
// conventional email+password, which only depends on the (working) confirmation
// link, not a template edit. Reuses the same visual language as onboarding steps
// (BodyDataStep etc.) — labeled inputs with border-line/bg-surface, Button — no
// new design tokens.
export function Auth() {
  const location = useLocation()
  const initialMode: Mode = location.state?.mode === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const navigate = useNavigate()
  const { refreshUser } = useAppState()

  const goPastAuth = async () => {
    // Lazy auth: a completed onboarding draft may be waiting from before the user had
    // a session (see OnboardingFlow.tsx's finishOnboarding). Finish that save now that
    // a session exists, instead of sending them back through onboarding again. The key
    // is only cleared once the save actually succeeds, so a failed save can be retried.
    // Navigate away from /auth BEFORE refreshUser(): setting `user` while still on
    // /auth makes GuestOnly (session && user) redirect to "/" first, racing ahead of
    // our own navigate('/result') below — reproduced live, landed on "/" instead of
    // the result screen. Leaving /auth first removes GuestOnly from the tree, so its
    // redirect can't fire once `user` updates. ResultMoment reads `user` from
    // AppStateContext and nothing else re-syncs it after this save, hence refreshUser().
    const pending = sessionStorage.getItem(PENDING_ONBOARDING_KEY)
    if (pending) {
      await userRepository.save(JSON.parse(pending) as NewUser)
      sessionStorage.removeItem(PENDING_ONBOARDING_KEY)
      navigate('/result', { replace: true })
      await refreshUser()
      return
    }
    const existing = await userRepository.get()
    navigate(existing ? '/' : '/onboarding', { replace: true })
  }

  const handleSubmit = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) return
    setSending(true)
    setError('')
    setInfo('')

    if (mode === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: trimmedEmail, password })
      if (signUpError) {
        setSending(false)
        setError(
          signUpError.message.includes('already registered')
            ? 'Email ini sudah terdaftar — coba menu Masuk.'
            : 'Gagal mendaftar. Cek email dan koneksi internetmu, lalu coba lagi.',
        )
        return
      }
      // Supabase's default project setting requires confirming the email via the
      // link it sends before a session exists — `data.session` is null until then.
      if (!data.session) {
        setSending(false)
        setInfo('Pendaftaran berhasil — buka email kamu dan klik link konfirmasi, lalu kembali ke sini untuk Masuk.')
        setMode('login')
        return
      }
      await goPastAuth()
      setSending(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
    if (signInError) {
      setSending(false)
      setError('Email atau password salah, atau email belum dikonfirmasi. Coba lagi.')
      return
    }
    await goPastAuth()
    setSending(false)
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setInfo('')
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 bg-bg px-5">
      <h2 className="font-display text-xl font-semibold text-ink">{mode === 'login' ? 'Masuk ke FitKu' : 'Daftar FitKu'}</h2>
      <p className="-mt-2 text-sm text-ink-dim">
        {mode === 'login' ? 'Masukkan email dan password kamu.' : 'Buat akun baru dengan email dan password.'}
      </p>

      <label className="mt-2 text-xs font-semibold text-ink-dim">Email</label>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@email.com"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      <label className="mt-2 text-xs font-semibold text-ink-dim">Password</label>
      <input
        type="password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
        placeholder="Minimal 6 karakter"
        className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
      />

      {error && <p className="text-xs font-semibold text-pro">{error}</p>}
      {info && <p className="text-xs font-semibold text-success">{info}</p>}

      <Button onClick={() => void handleSubmit()} disabled={sending || !email.trim() || !password} className="mt-2">
        {sending ? (mode === 'login' ? 'Masuk…' : 'Mendaftar…') : mode === 'login' ? 'Masuk' : 'Daftar'}
      </Button>
      <Button variant="ghost" onClick={switchMode}>
        {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </Button>
    </div>
  )
}
