import type { PricingSectionData, CtaAction } from '../types'
import { CTAButton } from '../components/CTAButton'
import { formatIDR } from '../utils'

interface PricingSectionProps {
  data: PricingSectionData
  premiumCta: CtaAction
}

export function PricingSection({ data, premiumCta }: PricingSectionProps) {
  return (
    <>
      <div className="lp-eyebrow">{data.eyebrow}</div>
      <h2 className="lp-headline">{data.headline}</h2>

      <div className="lp-plan-stack">
        {data.plans.map((plan) => (
          <div className={`lp-plan${plan.featured ? ' lp-featured' : ''}`} key={plan.id}>
            {plan.ribbon && <span className="lp-ribbon">⭐ {plan.ribbon}</span>}
            <div className="lp-pname">{plan.name}</div>
            <div className="lp-pold">{formatIDR(plan.oldPrice)}</div>
            <div className="lp-pnew">{formatIDR(plan.newPrice)}</div>
          </div>
        ))}
      </div>

      <p className="lp-sub lp-center">{data.footnote}</p>
      <CTAButton cta={premiumCta} sectionId={data.id} variant="gold" trackAs="upgrade-intent" />
    </>
  )
}
