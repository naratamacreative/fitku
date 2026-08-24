interface ProgressDotsProps {
  total: number
  current: number // 1-indexed
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i < current ? 'grad-hero' : 'bg-line'}`} />
      ))}
    </div>
  )
}
