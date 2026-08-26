import type { FinalCTASectionData, AssetDef, CtaAction } from '../types'
import { ImageSlot } from '../components/ImageSlot'
import { CTAButton } from '../components/CTAButton'

interface FinalCTASectionProps {
  data: FinalCTASectionData
  asset: AssetDef | undefined
  primaryCta: CtaAction
  secondaryCta: CtaAction
}

export function FinalCTASection({ data, asset, primaryCta, secondaryCta }: FinalCTASectionProps) {
  return (
    <>
      <ImageSlot asset={asset} tall />
      <h2 className="lp-headline lp-center">{data.headline}</h2>
      <CTAButton cta={primaryCta} sectionId={data.id} variant="gold" trackAs="lead" />
      <CTAButton cta={secondaryCta} sectionId={data.id} variant="ghost" trackAs="none" />
    </>
  )
}
