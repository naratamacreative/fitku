import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { foodRepository } from '../../data/repositories/foodRepository'
import { userRepository } from '../../data/repositories/userRepository'
import type { User } from '../../data/types/user.types'

interface AppStateContextValue {
  user: User | undefined
  loading: boolean
  refreshUser: () => Promise<void>
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const current = await userRepository.get()
    setUser(current)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      await foodRepository.ensureSeeded()
      const current = await userRepository.get()
      if (!cancelled) {
        setUser(current)
        setLoading(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppStateContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
