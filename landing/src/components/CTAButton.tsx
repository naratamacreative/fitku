import type { MouseEvent } from 'react'
import type { CtaAction } from '../types'
import { trackLead, trackUpgradeIntent } from '../tracking'

interface CTAButtonProps {
  cta: CtaAction
  sectionId: string
  variant?: 'default' | 'gold' | 'ghost'
  /** Which tracking event this click represents. 'none' skips tracking (e.g. the scroll-only secondary CTA). */
  trackAs?: 'lead' | 'upgrade-intent' | 'none'
}

/**
 * Renders a CTA from ctaFlow in landing-page-spec.json and performs its declared
 * action ('navigate' or 'scroll'). Navigation and payment are intentionally kept
 * separate: the 'premium' CTA never triggers a real transaction here, only an
 * UpgradeIntent tracking event and a route to a waitlist page.
 */
export function CTAButton({ cta, sectionId, variant = 'default', trackAs = 'none' }: CTAButtonProps) {
  const className = `lp-btn${variant === 'gold' ? ' lp-gold' : ''}${variant === 'ghost' ? ' lp-ghost' : ''}`

  function handleClick(e: MouseEvent) {
    if (trackAs === 'lead') trackLead(cta.id, sectionId)
    if (trackAs === 'upgrade-intent') trackUpgradeIntent(cta.id, sectionId)

    if (cta.action === 'scroll') {
      e.preventDefault()
      document.querySelector(cta.target)?.scrollIntoView({ behavior: 'smooth' })
    }
    // 'navigate' actions fall through to the anchor's href.
  }

  return (
    <a
      className={className}
      href={cta.target}
      onClick={handleClick}
      {...(cta.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {cta.label}
    </a>
  )
}
