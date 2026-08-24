interface OptionCardProps {
  label: string
  sublabel?: string
  selected: boolean
  onSelect: () => void
}

export function OptionCard({ label, sublabel, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl px-4 py-3.5 text-left shadow-soft transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        selected ? 'border-grad-hero' : 'border-[1.5px] border-line bg-surface'
      }`}
    >
      <div className="text-sm font-bold text-ink">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-ink-dim">{sublabel}</div>}
    </button>
  )
}
