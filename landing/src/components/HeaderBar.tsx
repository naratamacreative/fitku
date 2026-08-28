import logoLight from '../../fitku-logo-primary-transparent.png'
import logoDark from '../../fitku-wordmark-primary-transparent.png'

/**
 * Minimal brand header — logo only, no nav links and no secondary CTA.
 * Deliberately kept this light: the approved spec is a single-focus ad landing
 * page with one CTA flow, and a nav bar would give visitors an exit besides that
 * flow. Two logo files swapped via prefers-color-scheme/data-theme (same pattern
 * as landing.css's other tokens) because the real app never shows a plain white
 * logo in dark mode — see Welcome.tsx in the main app for the same convention.
 */
export function HeaderBar() {
  return (
    <header className="lp-header">
      <img src={logoLight} alt="FitKu — AI Diet Coach Indonesia" className="lp-header__logo lp-header__logo--light" />
      <img src={logoDark} alt="FitKu — AI Diet Coach Indonesia" className="lp-header__logo lp-header__logo--dark" />
    </header>
  )
}
