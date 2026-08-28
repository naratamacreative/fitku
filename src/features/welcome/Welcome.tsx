import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/components/Button'

const BENEFITS = ['Rencana kalori personal', 'Menu & porsi ala Indonesia', 'Coaching harian dari AI']

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bg px-5 pt-10 pb-6">
      <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
        <div className="relative mt-2 flex h-[100px] w-[100px] items-center justify-center rounded-full">
          <div
            className="absolute -inset-4 rounded-full opacity-40"
            style={{
              background:
                'radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--fk-primary) 35%, transparent), transparent 62%)',
            }}
          />
          {/* Official brand icon mark only — the combined lockup PNGs (icon+wordmark+tagline)
              are too low-res (194×62 for the dark variant) to render the tagline text
              without visible pixelation, so the wordmark/tagline below stay as real DOM
              text (already the correct "Sora" brand typeface, theme-adaptive, always crisp)
              and only the icon graphic — which has no fine text detail to break — uses the
              official asset. The icon's own colors (teal/purple/navy) read fine on both
              light and dark backgrounds, so no separate dark variant is needed for it. */}
          <img src="/brand/fitku-icon-transparent.png" alt="" className="relative h-[76px] w-auto" />
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
