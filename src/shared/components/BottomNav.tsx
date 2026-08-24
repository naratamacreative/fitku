import { Link, NavLink } from 'react-router-dom'

const LEFT_ITEMS = [{ to: '/', label: 'Home', end: true }, { to: '/progress', label: 'Progress', end: false }]
const RIGHT_ITEMS = [{ to: '/coach', label: 'Coach', end: false }, { to: '/settings', label: 'Setelan', end: false }]

function NavItem({ to, label, end }: { to: string; label: string; end: boolean }) {
  return (
    <NavLink to={to} end={end} className="flex flex-1 flex-col items-center justify-center gap-1 text-[9.5px] text-ink-dim">
      {({ isActive }) => (
        <>
          <span className={`h-1 w-1 rounded-full ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
          <span className={isActive ? 'font-bold text-accent' : ''}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  return (
    <nav className="relative flex h-[60px] shrink-0 border-t border-line bg-surface">
      <div className="flex flex-col items-center gap-0.5 absolute left-1/2 top-[-22px] -translate-x-1/2">
        <Link
          to="/tracker"
          aria-label="Tambah makanan"
          className="grad-hero flex h-[50px] w-[50px] items-center justify-center rounded-full border-4 border-bg text-2xl font-normal text-white shadow-soft"
        >
          +
        </Link>
        <span className="text-[8.5px] font-semibold text-ink-dim">Tambah Makanan</span>
      </div>
      {LEFT_ITEMS.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
      <div className="flex-1" />
      {RIGHT_ITEMS.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </nav>
  )
}
