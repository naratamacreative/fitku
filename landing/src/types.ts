export interface ImageRef {
  assetId: string
  placement: string
  aspectRatio: string
}

export interface CtaAction {
  id: string
  label: string
  action: 'navigate' | 'scroll'
  target: string
  description: string
  /** Open target in a new tab (e.g. an external link) instead of navigating away from the landing page. */
  newTab?: boolean
}

export interface CtaFlow {
  primary: CtaAction
  premium: CtaAction
  secondary: CtaAction
}

export interface TrackingEventDef {
  name: string
  trigger: string
  firesOn: string
  params: string[]
  note?: string
}

export interface TrackingSpec {
  providers: string[]
  events: TrackingEventDef[]
}

export interface HeroSectionData {
  id: 'hero'
  order: number
  type: 'Hero'
  headline: string
  subheadline: string
  cta: 'primary'
  socialProof: { text: string; flag: string }
  image: ImageRef
}

export interface ProblemSectionData {
  id: 'masalah'
  order: number
  type: 'Problem'
  eyebrow: string
  headline: string
  body: string
  image: ImageRef
}

export interface SolutionSectionData {
  id: 'solusi'
  order: number
  type: 'Solution'
  eyebrow: string
  headline: string
  checklist: { title: string; desc: string }[]
  image: ImageRef
}

export interface AICoachSectionData {
  id: 'ai-coach'
  order: number
  type: 'AICoach'
  eyebrow: string
  headline: string
  subheadline: string
  chatExample: { who: string; message: string }
  image: ImageRef
}

export interface ResultsSectionData {
  id: 'hasil'
  order: number
  type: 'Results'
  eyebrow: string
  headline: string
  body: string
  image: ImageRef
}

export interface PremiumOfferSectionData {
  id: 'premium-offer'
  order: number
  type: 'PremiumOffer'
  eyebrow: string
  headline: string
  valueStack: { name: string; value: number; currency: string }[]
  valueStackTotal: number
  valueStackNote: string
  priceReveal: { oldPriceMonthly: number; newPriceMonthly: number; currency: string }
  tagline: string
  image: ImageRef
  cta: 'premium'
}

export interface PricingPlan {
  id: string
  name: string
  oldPrice: number
  newPrice: number
  featured: boolean
  ribbon?: string
}

export interface PricingSectionData {
  id: 'pricing'
  order: number
  type: 'Pricing'
  eyebrow: string
  headline: string
  plans: PricingPlan[]
  footnote: string
  cta: 'premium'
}

export interface FAQSectionData {
  id: 'faq'
  order: number
  type: 'FAQ'
  headline: string
  items: { q: string; a: string }[]
}

export interface FinalCTASectionData {
  id: 'final-cta'
  order: number
  type: 'FinalCTA'
  headline: string
  cta: 'primary'
  secondaryCta: 'secondary'
  image: ImageRef
}

export type SectionData =
  | HeroSectionData
  | ProblemSectionData
  | SolutionSectionData
  | AICoachSectionData
  | ResultsSectionData
  | PremiumOfferSectionData
  | PricingSectionData
  | FAQSectionData
  | FinalCTASectionData

export interface LandingPageSpec {
  meta: { name: string; version: string; purpose: string; locale: string; lastUpdated: string }
  theme: { colors: Record<string, string>; colorsDark: Record<string, string>; fonts: { display: string; body: string } }
  ctaFlow: CtaFlow
  tracking: TrackingSpec
  sections: SectionData[]
}

export interface AssetDef {
  id: string
  usedInSection: string
  type: string
  description: string
  style: string
  aspectRatio: string
  minWidth: number
  format: string[]
  altText: string
  finalPath: string
  status: 'pending' | 'ready'
}

export interface AssetManifest {
  version: string
  lastUpdated: string
  assets: AssetDef[]
}
