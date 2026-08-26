interface CalorieRingProps {
  consumed: number
  target: number
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0

  return (
    <div
      className="relative mx-auto flex h-32 w-32 shrink-0 items-center justify-center rounded-full shadow-soft transition-[background] duration-500 ease-out"
      style={{
        background: `conic-gradient(from -90deg, var(--fk-primary) 0%, var(--fk-accent) ${pct}%, var(--fk-line) ${pct}% 100%)`,
      }}
    >
      <div className="absolute inset-[11px] rounded-full bg-surface" />
      <div className="relative flex flex-col items-center">
        <span className="font-display text-xl font-extrabold tabular-nums text-ink">
          {consumed.toLocaleString('id-ID')}
        </span>
        <span className="text-[9.5px] text-ink-dim">/ {target.toLocaleString('id-ID')} kkal</span>
      </div>
    </div>
  )
}
