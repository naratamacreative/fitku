import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/tracker', label: 'Tracker', end: false },
  { to: '/progress', label: 'Progress', end: false },
  { to: '/settings', label: 'Setelan', end: false },
]

export function BottomNav() {
  return (
    <nav className="flex h-14 shrink-0 border-t border-line bg-surface">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] text-ink-dim"
        >
          {({ isActive }) => (
            <>
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
              <span className={isActive ? 'text-accent' : ''}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
