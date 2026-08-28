import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
  // `loading` must only ever flip true -> false ONCE, at first bootstrap. Supabase's
  // onAuthStateChange fires repeatedly after sign-in for reasons that don't change who's
  // logged in (token refresh, tab visibility/focus regaining, etc.) — if `loading` were
  // allowed to flip back to true on every such event, `Gate`/`OnboardingGate` in App.tsx
  // (which render `null` while loading) would briefly unmount whatever route is currently
  // showing, wiping any in-progress local state (e.g. OnboardingFlow's step index and
  // draft answers reset to the very first question). Reproduced live: filling in the
  // onboarding form mid-flow got wiped back to step 1 by exactly this. `initialized` gates
  // that permanently after the first resolution.
  const initialized = useRef(false)

  const refreshUser = useCallback(async () => {
    const current = await userRepository.get()
    setUser(current)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function syncProfile(nextSession: Session | null) {
      const current = nextSession ? await userRepository.get() : undefined
      if (cancelled) return
      setUser(current)
      if (!initialized.current) {
        initialized.current = true
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (cancelled) return
      setSession(initial)
      void syncProfile(initial)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      void syncProfile(next)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AppStateContext.Provider value={{ session, user, loading, refreshUser }}>{children}</AppStateContext.Provider>
  )
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
