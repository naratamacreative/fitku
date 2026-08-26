declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void }
  }
}

/**
 * Fires a tracking event to Meta Pixel and TikTok Pixel if they are loaded on the page.
 * Safe to call even when neither pixel is present (e.g. local dev, or before consent).
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return

  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, params)
  }

  if (window.ttq && typeof window.ttq.track === 'function') {
    window.ttq.track(eventName, params)
  }
}

export function trackPageView(): void {
  if (typeof window === 'undefined') return
  if (typeof window.fbq === 'function') window.fbq('track', 'PageView')
  if (window.ttq && typeof window.ttq.track === 'function') window.ttq.track('PageView')
}

export function trackViewContent(sectionId: string): void {
  trackEvent('ViewContent', { section_id: sectionId })
}

export function trackLead(ctaId: string, sectionId: string): void {
  trackEvent('Lead', { cta_id: ctaId, section_id: sectionId })
}

export function trackUpgradeIntent(ctaId: string, sectionId: string): void {
  trackEvent('UpgradeIntent', { cta_id: ctaId, section_id: sectionId })
}
