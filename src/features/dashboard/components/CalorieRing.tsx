interface CalorieRingProps {
  consumed: number
  target: number
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0

  return (
    <div
      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(var(--color-accent) ${pct}%, var(--color-line) ${pct}% 100%)` }}
    >
      <div className="absolute inset-2 rounded-full bg-surface" />
      <div className="relative flex flex-col items-center">
        <span className="font-display text-base font-bold tabular-nums text-ink">
          {consumed.toLocaleString('id-ID')}
        </span>
        <span className="text-[9px] text-ink-dim">/ {target.toLocaleString('id-ID')} kkal</span>
      </div>
    </div>
  )
}
