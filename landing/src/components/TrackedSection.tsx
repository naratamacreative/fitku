import { useEffect, useRef, type ReactNode } from 'react'
import { trackViewContent } from '../tracking'

interface TrackedSectionProps {
  id: string
  children: ReactNode
}

/**
 * Wraps a section and fires ViewContent (once) the first time it becomes at
 * least 50% visible in the viewport, per the tracking spec in
 * landing-page-spec.json ("ViewContent", trigger: "onSectionVisible").
 */
export function TrackedSection({ id, children }: TrackedSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const fired = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true
            trackViewContent(id)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [id])

  return (
    <section id={id} ref={ref} className="lp-section">
      {children}
    </section>
  )
}
