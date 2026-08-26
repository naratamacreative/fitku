import type { ResultsSectionData, AssetDef } from '../types'
import { ImageSlot } from '../components/ImageSlot'

interface ResultsSectionProps {
  data: ResultsSectionData
  asset: AssetDef | undefined
}

export function ResultsSection({ data, asset }: ResultsSectionProps) {
  return (
    <>
      <div className="lp-eyebrow">{data.eyebrow}</div>
      <ImageSlot asset={asset} tall />
      <h2 className="lp-headline">{data.headline}</h2>
      <p className="lp-body">{data.body}</p>
    </>
  )
}
