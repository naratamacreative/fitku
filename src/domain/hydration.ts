export const GLASS_ML = 250

/**
 * ~33ml per kg bodyweight is a common rough hydration guideline. Always
 * derived live from the user's current weight — never stored — so editing
 * weight (onboarding or Edit Profile) recalculates the target automatically.
 */
export function calculateHydrationTargetGlasses(weightKg: number): number {
  const glasses = Math.round((weightKg * 33) / GLASS_ML)
  return Math.min(15, Math.max(6, glasses))
}
