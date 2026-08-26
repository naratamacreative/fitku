import type { HeroSectionData, AssetDef, CtaAction } from '../types'
import { ImageSlot } from '../components/ImageSlot'
import { CTAButton } from '../components/CTAButton'

interface HeroSectionProps {
  data: HeroSectionData
  asset: AssetDef | undefined
  primaryCta: CtaAction
}

export function HeroSection({ data, asset, primaryCta }: HeroSectionProps) {
  return (
    <>
      <ImageSlot asset={asset} tall />
      <h2 className="lp-headline">{data.headline}</h2>
      <p className="lp-sub">{data.subheadline}</p>
      <CTAButton cta={primaryCta} sectionId={data.id} trackAs="lead" />
      <div className="lp-social-proof">
        ⭐⭐⭐⭐⭐ {data.socialProof.text} <span className="lp-flag">{data.socialProof.flag}</span>
      </div>
    </>
  )
}
