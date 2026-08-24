import { useCallback, useEffect, useState } from 'react'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { calculateStreak } from '../../domain/nutrition'

/**
 * Value-moment paywall trigger: fires once a 3-day logging streak is reached,
 * not on a hard log-count limit. See features/paywall/paywall.triggers.ts for the full rule set.
 */
export function usePaywallTrigger(userId: string | undefined) {
  const [streak, setStreak] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) return
    const dates = await foodLogRepository.loggedDates(userId)
    setStreak(calculateStreak(dates))
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const shouldShowPaywall = streak >= 3 && !dismissed

  return { streak, shouldShowPaywall, dismiss: () => setDismissed(true), refresh }
}
