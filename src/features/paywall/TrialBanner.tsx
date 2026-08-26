import { Link } from 'react-router-dom'
import type { ProAccess } from '../../domain/entitlement'

interface TrialBannerProps {
  access: ProAccess
}

/**
 * Ambient trial-status nudge — quiet for most of the trial (no daily nagging),
 * clearer once it's actually running out or already over. Never a hard block:
 * base FitKu features stay usable either way, this only points at what's Pro.
 */
export function TrialBanner({ access }: TrialBannerProps) {
  if (access.reason === 'paid') return null
  if (access.reason === 'trial' && access.trialDaysLeft > 3) return null

  const message =
    access.reason === 'expired'
      ? '🔒 Trial Pro kamu sudah berakhir. Insight personal & riwayat penuh terkunci.'
      : `✨ Trial Pro kamu berakhir dalam ${access.trialDaysLeft} hari. Lanjutkan supaya insight & riwayat tetap terbuka.`

  return (
    <div className="grad-premium flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-white shadow-soft">
      <span className="flex-1 text-xs leading-snug">{message}</span>
      <Link to="/premium" className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">
        {access.reason === 'expired' ? 'Aktifkan' : 'Lihat'}
      </Link>
    </div>
  )
}
