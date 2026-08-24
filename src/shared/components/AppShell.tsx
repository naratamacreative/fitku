import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode
  fab?: ReactNode
}

export function AppShell({ children, fab }: AppShellProps) {
  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col bg-surface-2">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">{children}</div>
      {fab && <div className="absolute right-4 bottom-[72px]">{fab}</div>}
      <BottomNav />
    </div>
  )
}
