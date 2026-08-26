import type { PremiumOfferSectionData, AssetDef, CtaAction } from '../types'
import { ImageSlot } from '../components/ImageSlot'
import { CTAButton } from '../components/CTAButton'
import { formatIDR } from '../utils'

interface PremiumOfferSectionProps {
  data: PremiumOfferSectionData
  asset: AssetDef | undefined
  premiumCta: CtaAction
}

export function PremiumOfferSection({ data, asset, premiumCta }: PremiumOfferSectionProps) {
  return (
    <>
      <div className="lp-eyebrow">{data.eyebrow}</div>
      <h2 className="lp-headline">{data.headline}</h2>

      <div className="lp-value-card">
        {data.valueStack.map((item) => (
          <div className="lp-value-row" key={item.name}>
            <span className="lp-name">{item.name}</span>
            <span className="lp-val">{formatIDR(item.value)}</span>
          </div>
        ))}
        <div className="lp-value-total">
          <span>Total Value</span>
          <span>{formatIDR(data.valueStackTotal)}+</span>
        </div>
      </div>

      <ImageSlot asset={asset} />

      <div className="lp-price-reveal">
        <div className="lp-old">{formatIDR(data.priceReveal.oldPriceMonthly)}</div>
        <div className="lp-new">{formatIDR(data.priceReveal.newPriceMonthly)}</div>
        <div className="lp-unit">/bulan</div>
      </div>
      <p className="lp-sub lp-center">{data.tagline}</p>

      <CTAButton cta={premiumCta} sectionId={data.id} variant="gold" trackAs="upgrade-intent" />
    </>
  )
}
