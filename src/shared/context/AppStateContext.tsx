import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { userRepository } from '../../data/repositories/userRepository'
import type { User } from '../../data/types/user.types'
import { supabase } from '../lib/supabaseClient'

interface AppStateContextValue {
  session: Session | null
  user: User | undefined
  loading: boolean
  refreshUser: () => Promise<void>
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const current = await userRepository.get()
    setUser(current)
  }, [])

  // `foods` no longer needs a client-side ensureSeeded() — the shared catalog is
  // seeded once server-side via supabase/migrations/0002_seed_foods.sql, not per-boot.
  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!cancelled) setSession(initial)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      if (!session) {
        if (!cancelled) {
          setUser(undefined)
          setLoading(false)
        }
        return
      }
      const current = await userRepository.get()
      if (!cancelled) {
        setUser(current)
        setLoading(false)
      }
    }
    setLoading(true)
    loadProfile()
    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <AppStateContext.Provider value={{ session, user, loading, refreshUser }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
