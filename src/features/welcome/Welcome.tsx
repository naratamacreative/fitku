import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { useTheme } from '../../shared/context/ThemeContext'

const BENEFITS = ['Rencana kalori personal', 'Menu & porsi ala Indonesia', 'Coaching harian dari AI']

export function Welcome() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bg px-5 pt-10 pb-6">
      <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
        <div className="relative mt-2 flex w-full items-center justify-center">
          <div
            className="absolute h-[132px] w-[132px] rounded-full opacity-40"
            style={{
              background:
                'radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--fk-primary) 35%, transparent), transparent 62%)',
            }}
          />
          {/* Official brand lockup (icon + wordmark + tagline), full color in both themes —
              per brand spec, the icon/"Ku" never turn monochrome. The dark-theme file has
              "Fit" pre-rendered white (icon + "Ku" stay full color) since flat navy "Fit"
              is unreadable on a dark background; light theme uses the standard navy "Fit"
              file. Both source PNGs are ≥578px wide, so displaying at 260px is always a
              downscale — never upscaled, so never blurred/pixelated. */}
          <img
            src={
              theme === 'dark'
                ? '/brand/fitku-wordmark-primary-transparent.png'
                : '/brand/fitku-logo-primary-transparent.png'
            }
            alt="FitKu — AI Diet Coach Indonesia"
            className="relative h-auto w-[260px]"
          />
        </div>

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
        <Button onClick={() => navigate('/auth')}>Mulai Sekarang</Button>
        <Button variant="ghost" onClick={() => navigate('/auth')}>
          Saya sudah punya akun
        </Button>
      </div>
    </div>
  )
}
