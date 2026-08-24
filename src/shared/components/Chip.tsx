interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? 'grad-hero text-white' : 'bg-surface text-ink-dim shadow-soft'
      }`}
    >
      {label}
    </button>
  )
}
