interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
  // 'lg' is opt-in per caller — default stays pixel-identical to every existing usage.
  size?: 'sm' | 'lg'
}

export function Chip({ label, active, onClick, size = 'sm' }: ChipProps) {
  const sizeClasses = size === 'lg' ? 'px-5 py-3 text-sm' : 'px-3.5 py-1.5 text-xs'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${sizeClasses} ${
        active ? 'grad-hero text-white' : 'bg-surface text-ink-dim shadow-soft'
      }`}
    >
      {label}
    </button>
  )
}
