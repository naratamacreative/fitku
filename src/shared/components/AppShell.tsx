import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col bg-bg">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">{children}</div>
      <BottomNav />
    </div>
  )
}
