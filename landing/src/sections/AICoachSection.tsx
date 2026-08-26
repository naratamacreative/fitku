import type { AICoachSectionData, AssetDef } from '../types'
import { ImageSlot } from '../components/ImageSlot'

interface AICoachSectionProps {
  data: AICoachSectionData
  asset: AssetDef | undefined
}

export function AICoachSection({ data, asset }: AICoachSectionProps) {
  return (
    <>
      <div className="lp-eyebrow">{data.eyebrow}</div>
      <ImageSlot asset={asset} />
      <h2 className="lp-headline">{data.headline}</h2>
      <p className="lp-sub">{data.subheadline}</p>
      <div className="lp-chat-bubble">
        <span className="lp-who">{data.chatExample.who}</span>
        {data.chatExample.message}
      </div>
    </>
  )
}
