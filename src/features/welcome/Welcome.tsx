import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/Button'

const BENEFITS = ['Rencana kalori personal', 'Menu & porsi ala Indonesia', 'Coaching harian dari AI']

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bg px-5 pt-10 pb-6">
      <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
        <div className="relative mt-2 flex h-[132px] w-[132px] items-center justify-center rounded-full">
          <div
            className="absolute -inset-4 rounded-full opacity-40"
            style={{
              background:
                'radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--fk-primary) 35%, transparent), transparent 62%)',
            }}
          />
          <div className="grad-hero relative flex h-full w-full items-center justify-center rounded-full">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
              <circle cx="36" cy="18" r="8" fill="#fff" />
              <path d="M36 27 C 25 30, 22 42, 24 54" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M36 27 C 47 30, 50 42, 48 54" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M36 32 L 20 24" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <path d="M36 32 L 52 24" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="absolute -left-2 top-1.5 h-3.5 w-3.5 rounded-full bg-success" />
            <span className="absolute -right-1.5 bottom-2.5 h-2.5 w-2.5 rounded-full bg-pro" />
            <span className="absolute right-1 top-3.5 h-2 w-2 rounded-full bg-white" />
          </div>
        </div>
        <p className="mt-3 font-display text-2xl font-extrabold text-ink">FitKu</p>
        <p className="text-[12.5px] font-semibold text-accent">AI Diet Coach Indonesia</p>

        <div className="mt-5 flex w-full flex-col gap-2 text-left">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-center gap-2.5 rounded-2xl bg-surface px-3 py-2.5 shadow-soft">
              <span className="grad-hero flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] text-white">
                ✓
              </span>
              <span className="text-xs font-semibold text-ink">{b}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <Button onClick={() => navigate('/onboarding')}>Mulai Sekarang</Button>
        <Button variant="ghost" onClick={() => navigate('/onboarding')}>
          Saya sudah punya akun
        </Button>
      </div>
    </div>
  )
}
