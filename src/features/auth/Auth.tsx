import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userRepository } from '../../data/repositories/userRepository'
import { Button } from '../../shared/components/Button'
import { supabase } from '../../shared/lib/supabaseClient'

type Stage = 'email' | 'otp'

// Reuses the same visual language as onboarding steps (BodyDataStep etc.) — labeled
// inputs with border-line/bg-surface, Button component — no new design tokens.
export function Auth() {
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSendCode = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    setSending(true)
    setError('')
    const { error: sendError } = await supabase.auth.signInWithOtp({ email: trimmed })
    setSending(false)
    if (sendError) {
      setError('Gagal mengirim kode. Cek email dan koneksi internetmu, lalu coba lagi.')
      return
    }
    setStage('otp')
  }

  const handleVerify = async () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setSending(true)
    setError('')
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: 'email',
    })
    if (verifyError) {
      setSending(false)
      setError('Kode salah atau sudah kedaluwarsa. Coba lagi atau minta kode baru.')
      return
    }
    // A returning user already has a profile row — skip onboarding and go straight in.
    const existing = await userRepository.get()
    setSending(false)
    navigate(existing ? '/' : '/onboarding', { replace: true })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 bg-bg px-5">
      {stage === 'email' ? (
        <>
          <h2 className="font-display text-xl font-semibold text-ink">Masuk ke FitKu</h2>
          <p className="-mt-2 text-sm text-ink-dim">
            Masukkan email kamu — kami kirim kode 6-digit, tidak perlu password.
          </p>
          <label className="mt-2 text-xs font-semibold text-ink-dim">Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSendCode()}
            placeholder="nama@email.com"
            className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          />
          {error && <p className="text-xs font-semibold text-pro">{error}</p>}
          <Button onClick={() => void handleSendCode()} disabled={sending || !email.trim()} className="mt-2">
            {sending ? 'Mengirim…' : 'Kirim Kode'}
          </Button>
        </>
      ) : (
        <>
          <h2 className="font-display text-xl font-semibold text-ink">Masukkan kode</h2>
          <p className="-mt-2 text-sm text-ink-dim">Kode 6-digit sudah dikirim ke {email.trim()}.</p>
          <label className="mt-2 text-xs font-semibold text-ink-dim">Kode</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleVerify()}
            placeholder="123456"
            className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3 text-center text-lg tracking-[0.3em] text-ink outline-none focus:border-accent"
          />
          {error && <p className="text-xs font-semibold text-pro">{error}</p>}
          <Button onClick={() => void handleVerify()} disabled={sending || !code.trim()} className="mt-2">
            {sending ? 'Memverifikasi…' : 'Verifikasi'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStage('email')
              setCode('')
              setError('')
            }}
          >
            Ganti email
          </Button>
        </>
      )}
    </div>
  )
}
