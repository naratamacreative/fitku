import { Link } from 'react-router-dom'

interface PaywallBannerProps {
  streak: number
  onDismiss: () => void
}

/** Non-blocking value-moment nudge — links to the full /premium page, never an auto-opening modal. */
export function PaywallBanner({ streak, onDismiss }: PaywallBannerProps) {
  return (
    <div className="grad-premium flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-white shadow-soft">
      <span className="flex-1 text-xs leading-snug">
        🔥 <b>{streak} hari berturut-turut!</b> Lanjutkan tanpa batas dengan Premium.
      </span>
      <Link to="/premium" className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">
        Lihat
      </Link>
      <button type="button" onClick={onDismiss} aria-label="Tutup" className="shrink-0 text-sm opacity-80">
        ✕
      </button>
    </div>
  )
}
