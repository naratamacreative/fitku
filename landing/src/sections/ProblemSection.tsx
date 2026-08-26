import type { ProblemSectionData, AssetDef } from '../types'
import { ImageSlot } from '../components/ImageSlot'

interface ProblemSectionProps {
  data: ProblemSectionData
  asset: AssetDef | undefined
}

export function ProblemSection({ data, asset }: ProblemSectionProps) {
  return (
    <>
      <div className="lp-eyebrow">{data.eyebrow}</div>
      <ImageSlot asset={asset} />
      <h2 className="lp-headline">{data.headline}</h2>
      <p className="lp-body">{data.body}</p>
    </>
  )
}
