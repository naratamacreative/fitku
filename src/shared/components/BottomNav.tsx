import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { todayIso } from '../../domain/nutrition'
import { ExerciseSheet, type ExerciseFormValues } from '../../features/dashboard/components/ExerciseSheet'
import { useAppState } from '../context/AppStateContext'
import { useTodayExercise } from '../hooks/useTodayExercise'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function ProgressIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="12" width="3.6" height="8" rx="0.9" />
      <rect x="10.2" y="7" width="3.6" height="13" rx="0.9" />
      <rect x="16.4" y="3.5" width="3.6" height="16.5" rx="0.9" />
    </svg>
  )
}

function CoachIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5c.7 3.1 1.3 4.4 2.5 5.5 1.2 1.1 2.6 1.6 5.6 2.5-3 .9-4.4 1.4-5.6 2.5-1.2 1.1-1.8 2.4-2.5 5.5-.7-3.1-1.3-4.4-2.5-5.5-1.2-1.1-2.6-1.6-5.6-2.5 3-.9 4.4-1.4 5.6-2.5 1.2-1.1 1.8-2.4 2.5-5.5Z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="4" y1="6.5" x2="20" y2="6.5" />
      <circle cx="9.5" cy="6.5" r="2.1" fill="var(--fk-surface)" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2.1" fill="var(--fk-surface)" />
      <line x1="4" y1="17.5" x2="20" y2="17.5" />
      <circle cx="9.5" cy="17.5" r="2.1" fill="var(--fk-surface)" />
    </svg>
  )
}

// Same paths as the "Kebiasaan Sehat" tile icons in Dashboard.tsx — reused, not redrawn.
function WeightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="8" width="17" height="12" rx="2.5" />
      <path d="M8 8a4 4 0 0 1 8 0" />
      <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function GlassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l-1.6 16.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8L6 3Z" />
      <path d="M6.9 11h10.2" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c-3.5 0-6-2.4-6-5.8 0-2.6 1.6-4.2 2.6-6 .6 1.4 1.4 1.8 1.9 1.2-.7-2.6.4-5 1.5-7.4 2 2.4 4 5 4 8.6 0 .8-.1 1.5-.4 2.2.8-.4 1.4-1.1 1.7-2 .5 1 .7 2 .7 3.2 0 3.4-2.5 6-6 6Z" />
    </svg>
  )
}

// New icon, hand-drawn to match the same stroke-only style — fork (3 tines + handle) beside a spoon (bowl + handle).
function ForkSpoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v5.2M7 3v5.2M9 3v5.2M7 8.2V21" />
      <ellipse cx="17" cy="6.2" rx="2.6" ry="3.4" />
      <path d="M17 9.6V21" />
    </svg>
  )
}

const LEFT_ITEMS = [
  { to: '/', label: 'Home', end: true, Icon: HomeIcon },
  { to: '/progress', label: 'Progress', end: false, Icon: ProgressIcon },
]
const RIGHT_ITEMS = [
  { to: '/coach', label: 'Coach', end: false, Icon: CoachIcon },
  { to: '/settings', label: 'Setelan', end: false, Icon: SettingsIcon },
]

function NavItem({
  to,
  label,
  end,
  Icon,
}: {
  to: string
  label: string
  end: boolean
  Icon: () => React.JSX.Element
}) {
  return (
    <NavLink to={to} end={end} className="flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[9.5px] text-ink-dim">
      {({ isActive }) => (
        <>
          <span className={`flex h-5 w-5 items-center justify-center ${isActive ? 'text-accent' : ''}`}>
            <Icon />
          </span>
          <span className={isActive ? 'font-bold text-accent' : ''}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const { user } = useAppState()
  const { addExercise } = useTodayExercise(user?.id)
  const navigate = useNavigate()
  const [dialOpen, setDialOpen] = useState(false)
  // Kept mounted slightly past dialOpen=false so the closing transition can play instead of the menu just vanishing.
  const [dialMounted, setDialMounted] = useState(false)
  const [showExerciseSheet, setShowExerciseSheet] = useState(false)

  useEffect(() => {
    if (dialOpen) {
      setDialMounted(true)
      return
    }
    if (!dialMounted) return
    const t = setTimeout(() => setDialMounted(false), 200)
    return () => clearTimeout(t)
  }, [dialOpen, dialMounted])

  const goTo = (path: string) => {
    setDialOpen(false)
    navigate(path)
  }

  const openExercise = () => {
    setDialOpen(false)
    setShowExerciseSheet(true)
  }

  const handleSaveExercise = async (values: ExerciseFormValues) => {
    if (!user) return
    await addExercise({ userId: user.id, date: todayIso(), ...values })
    setShowExerciseSheet(false)
  }

  // Meal-context for "Catat Makanan" is intentionally NOT passed as a `?meal=` param here —
  // FoodTracker already defaults to `defaultMealType()` (time-of-day based) when the param is
  // absent, so navigating bare to /tracker already gives exactly the requested behavior.
  // Array order = top-to-bottom render order; last item sits closest to the FAB (bottom of stack).
  const SPEED_DIAL_ITEMS: { label: string; Icon: () => React.JSX.Element; action: () => void }[] = [
    { label: 'Berat', Icon: WeightIcon, action: () => goTo('/progress?tab=weight') },
    { label: 'Olahraga', Icon: FlameIcon, action: openExercise },
    { label: 'Air', Icon: GlassIcon, action: () => goTo('/hydration') },
    { label: 'Catat Makanan', Icon: ForkSpoonIcon, action: () => goTo('/tracker') },
  ]

  return (
    <>
      {dialMounted && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setDialOpen(false)}
          className={`fixed inset-0 z-20 bg-ink/40 transition-opacity duration-200 ${dialOpen ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      <nav className="relative flex h-[60px] shrink-0 border-t border-line bg-surface">
        <div className="absolute left-1/2 top-[-22px] z-30 flex -translate-x-1/2 flex-col items-center gap-0.5">
          <div className="relative">
            {dialMounted && (
              <div className="absolute bottom-[62px] right-0 flex flex-col items-end gap-2.5">
                {SPEED_DIAL_ITEMS.map((item, i) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={`flex items-center gap-2.5 rounded-full bg-surface py-1.5 pl-1.5 pr-4 shadow-soft transition-all duration-200 ease-out ${
                      dialOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                    }`}
                    // Bottom pill (closest to FAB, last in this top-to-bottom array) animates in first —
                    // "muncul dari bawah ke atas" — so delay counts down from the end of the list.
                    style={{ transitionDelay: dialOpen ? `${(SPEED_DIAL_ITEMS.length - 1 - i) * 30}ms` : '0ms' }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <item.Icon />
                    </span>
                    <span className="whitespace-nowrap text-xs font-semibold text-ink">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              aria-label={dialOpen ? 'Tutup menu' : 'Tambah'}
              aria-expanded={dialOpen}
              onClick={() => setDialOpen((v) => !v)}
              className={`grad-hero flex h-[50px] w-[50px] items-center justify-center rounded-full border-4 border-bg text-2xl font-normal text-white shadow-soft transition-transform duration-200 ${
                dialOpen ? 'rotate-45' : ''
              }`}
            >
              +
            </button>
          </div>
          <span className="text-[8.5px] font-semibold text-ink-dim">Tambah</span>
        </div>
        {LEFT_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <div className="flex-1" />
        {RIGHT_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {showExerciseSheet && user && (
        <ExerciseSheet weightKg={user.weightKg} onCancel={() => setShowExerciseSheet(false)} onConfirm={handleSaveExercise} />
      )}
    </>
  )
}
