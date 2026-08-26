import type { SolutionSectionData, AssetDef } from '../types'
import { ImageSlot } from '../components/ImageSlot'

interface SolutionSectionProps {
  data: SolutionSectionData
  asset: AssetDef | undefined
}

export function SolutionSection({ data, asset }: SolutionSectionProps) {
  return (
    <>
      <div className="lp-eyebrow">{data.eyebrow}</div>
      <h2 className="lp-headline">{data.headline}</h2>
      <ImageSlot asset={asset} />
      <div className="lp-checklist">
        {data.checklist.map((item) => (
          <div className="lp-check-row" key={item.title}>
            <span className="lp-check-mark">✓</span>
            <div>
              <b>{item.title}</b>
              <span className="lp-d">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
