import { Link } from 'react-router-dom'

interface ProLockedProps {
  title: string
  description: string
}

/** Non-blocking teaser for a Pro-gated section — always links out to /premium, never a hard wall. */
export function ProLocked({ title, description }: ProLockedProps) {
  return (
    <Link
      to="/premium"
      className="block rounded-2xl border border-dashed border-pro/40 bg-pro-soft px-4 py-4 text-center"
    >
      <span className="text-lg" aria-hidden="true">
        🔒
      </span>
      <p className="mt-1 font-display text-sm font-bold text-pro-ink">{title}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-dim">{description}</p>
      <span className="mt-2.5 inline-block rounded-full bg-pro px-3.5 py-1.5 text-xs font-bold text-white">
        Aktifkan Pro
      </span>
    </Link>
  )
}
