import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../../shared/components/AppShell'
import { CalorieTab } from './tabs/CalorieTab'
import { WeightTab } from './tabs/WeightTab'

type Tab = 'calorie' | 'weight'

export function Progress() {
  const [searchParams] = useSearchParams()
  const initialTab: Tab = searchParams.get('tab') === 'weight' ? 'weight' : 'calorie'
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <AppShell>
      <div className="flex flex-col gap-3.5 pb-4">
        <div className="flex gap-1.5 rounded-2xl bg-surface-2 p-1">
          {(
            [
              { value: 'calorie', label: 'Kalori' },
              { value: 'weight', label: 'Berat' },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === t.value ? 'grad-hero text-white shadow-soft' : 'text-ink-dim'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'calorie' ? <CalorieTab /> : <WeightTab />}
      </div>
    </AppShell>
  )
}
