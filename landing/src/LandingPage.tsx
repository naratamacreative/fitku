import { useEffect, useMemo } from 'react'
import spec from '../spec/landing-page-spec.json'
import assetManifest from '../spec/asset-manifest.json'
import type { LandingPageSpec, AssetManifest } from './types'
import { trackPageView } from './tracking'
import { TrackedSection } from './components/TrackedSection'
import { HeroSection } from './sections/HeroSection'
import { ProblemSection } from './sections/ProblemSection'
import { SolutionSection } from './sections/SolutionSection'
import { AICoachSection } from './sections/AICoachSection'
import { ResultsSection } from './sections/ResultsSection'
import { PremiumOfferSection } from './sections/PremiumOfferSection'
import { PricingSection } from './sections/PricingSection'
import { FAQSection } from './sections/FAQSection'
import { FinalCTASection } from './sections/FinalCTASection'
import './landing.css'

const landingSpec = spec as LandingPageSpec
const assets = assetManifest as AssetManifest

/**
 * Root component. Reads every section's content from landing-page-spec.json and
 * every image's brief from asset-manifest.json, so editing copy or swapping a
 * photo never requires touching this file — only the JSON.
 */
export function LandingPage() {
  const assetMap = useMemo(() => {
    const map = new Map(assets.assets.map((a) => [a.id, a]))
    return map
  }, [])

  useEffect(() => {
    trackPageView()
  }, [])

  const orderedSections = useMemo(() => [...landingSpec.sections].sort((a, b) => a.order - b.order), [])

  return (
    <div className="lp-root">
      <div className="lp-page">
        {orderedSections.map((section) => (
          <TrackedSection id={section.id} key={section.id}>
            {section.type === 'Hero' && (
              <HeroSection data={section} asset={assetMap.get(section.image.assetId)} primaryCta={landingSpec.ctaFlow.primary} />
            )}
            {section.type === 'Problem' && <ProblemSection data={section} asset={assetMap.get(section.image.assetId)} />}
            {section.type === 'Solution' && <SolutionSection data={section} asset={assetMap.get(section.image.assetId)} />}
            {section.type === 'AICoach' && <AICoachSection data={section} asset={assetMap.get(section.image.assetId)} />}
            {section.type === 'Results' && <ResultsSection data={section} asset={assetMap.get(section.image.assetId)} />}
            {section.type === 'PremiumOffer' && (
              <PremiumOfferSection data={section} asset={assetMap.get(section.image.assetId)} premiumCta={landingSpec.ctaFlow.premium} />
            )}
            {section.type === 'Pricing' && <PricingSection data={section} premiumCta={landingSpec.ctaFlow.premium} />}
            {section.type === 'FAQ' && <FAQSection data={section} />}
            {section.type === 'FinalCTA' && (
              <FinalCTASection
                data={section}
                asset={assetMap.get(section.image.assetId)}
                primaryCta={landingSpec.ctaFlow.primary}
                secondaryCta={landingSpec.ctaFlow.secondary}
              />
            )}
          </TrackedSection>
        ))}
      </div>
    </div>
  )
}
