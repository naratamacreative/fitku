import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hydrationRepository } from '../../data/repositories/hydrationRepository'
import { calculateHydrationTargetGlasses } from '../../domain/hydration'
import { todayIso } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { Button } from '../../shared/components/Button'
import { Chip } from '../../shared/components/Chip'
import { useAppState } from '../../shared/context/AppStateContext'

const PRESETS = [1, 2, 3] as const

export function Hydration() {
  const { user } = useAppState()
  const navigate = useNavigate()
  const [glasses, setGlasses] = useState(0)
  const [selected, setSelected] = useState<number>(1)
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingTotal, setEditingTotal] = useState(false)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (!user) return
    hydrationRepository.getForDate(user.id, todayIso()).then(setGlasses)
  }, [user])

  if (!user) return null

  const target = calculateHydrationTargetGlasses(user.weightKg)
  const pct = Math.min(100, Math.round((glasses / target) * 100))
  const pendingAmount = isCustom ? Math.max(0, Math.round(Number(customValue) || 0)) : selected
  const canSave = pendingAmount > 0

  const handleSelectPreset = (n: number) => {
    setIsCustom(false)
    setSelected(n)
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    await hydrationRepository.adjust(user.id, todayIso(), pendingAmount)
    navigate('/', { replace: true })
  }

  const handleStartEdit = () => {
    setEditValue(String(glasses))
    setEditingTotal(true)
  }

  const handleCancelEdit = () => {
    setEditingTotal(false)
  }

  const handleSaveEdit = async () => {
    const corrected = Math.max(0, Math.round(Number(editValue) || 0))
    const updated = await hydrationRepository.set(user.id, todayIso(), corrected)
    setGlasses(updated)
    setEditingTotal(false)
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pb-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="text-ink-dim" aria-label="Kembali">
            ←
          </button>
          <b className="font-display text-sm text-ink">💧 Air Minum</b>
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-dim">Sudah diminum hari ini</span>
            {!editingTotal && (
              <button type="button" onClick={handleStartEdit} className="text-[11px] font-semibold text-accent">
                ✎ Koreksi
              </button>
            )}
          </div>

          {editingTotal ? (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-20 rounded-xl bg-surface-2 px-3 py-1.5 font-display text-xl font-extrabold tabular-nums text-ink outline-none"
                />
                <span className="text-base font-semibold text-ink-dim">/ {target} gelas</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent"
                >
                  ✓ Simpan koreksi
                </button>
                <button type="button" onClick={handleCancelEdit} className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-dim">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-ink">
              {glasses} <span className="text-base font-semibold text-ink-dim">/ {target} gelas</span>
            </p>
          )}

          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%`, background: 'var(--fk-primary)' }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {Array.from({ length: target }).map((_, i) => (
              <span key={i} className={`text-sm ${i < glasses ? 'opacity-100' : 'opacity-25'}`} aria-hidden="true">
                🥛
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
            Kamu minum berapa gelas?
          </p>
          <div className="flex gap-2">
            {PRESETS.map((n) => (
              <Chip key={n} label={`${n} gelas`} active={!isCustom && selected === n} onClick={() => handleSelectPreset(n)} />
            ))}
            <Chip label="Custom" active={isCustom} onClick={() => setIsCustom(true)} />
          </div>
          {isCustom && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-2xl bg-surface-2 px-3.5 py-2.5">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="mis. 4"
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
              <span className="shrink-0 text-xs text-ink-dim">gelas</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-line px-3.5 py-3 text-[11.5px] text-ink-dim">
          Akan dicatat <b className="text-ink">+{pendingAmount} gelas</b> → total jadi{' '}
          <b className="tabular-nums text-ink">
            {glasses + pendingAmount}/{target} gelas
          </b>
        </div>

        <Button onClick={handleSave} disabled={!canSave || saving}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </div>
    </AppShell>
  )
}
