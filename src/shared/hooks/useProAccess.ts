import { useEffect, useState } from 'react'
import { subscriptionRepository } from '../../data/repositories/subscriptionRepository'
import { getProAccess, type ProAccess } from '../../domain/entitlement'
import { useAppState } from '../context/AppStateContext'

/** undefined while loading — callers should treat that as "don't know yet", not "locked." */
export function useProAccess(): ProAccess | undefined {
  const { user } = useAppState()
  const [access, setAccess] = useState<ProAccess | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    subscriptionRepository.get(user.id).then((sub) => {
      if (!cancelled) setAccess(getProAccess(user, sub))
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return access
}
