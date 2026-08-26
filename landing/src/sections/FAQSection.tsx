import type { FAQSectionData } from '../types'

interface FAQSectionProps {
  data: FAQSectionData
}

export function FAQSection({ data }: FAQSectionProps) {
  return (
    <>
      <h2 className="lp-headline">{data.headline}</h2>
      {data.items.map((item) => (
        <div className="lp-faq-item" key={item.q}>
          <div className="lp-q">{item.q}</div>
          <div className="lp-a">{item.a}</div>
        </div>
      ))}
    </>
  )
}
