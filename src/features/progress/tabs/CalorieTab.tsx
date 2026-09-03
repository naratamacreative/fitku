import { useEffect, useState } from 'react'
import { exerciseRepository } from '../../../data/repositories/exerciseRepository'
import { foodLogRepository } from '../../../data/repositories/foodLogRepository'
import type { ExerciseLog } from '../../../data/types/exercise.types'
import type { FoodLog } from '../../../data/types/food.types'
import { EXERCISE_CATEGORIES } from '../../../domain/exercise'
import { aggregateLogs, todayIso } from '../../../domain/nutrition'
import { computeCalorieRecap } from '../../../domain/progressRecap'
import { ProLocked } from '../../../shared/components/ProLocked'
import { useAppState } from '../../../shared/context/AppStateContext'
import { useProAccess } from '../../../shared/hooks/useProAccess'
import { ExerciseSheet, type ExerciseFormValues } from '../../dashboard/components/ExerciseSheet'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function buildSparklinePoints(values: number[], width = 220, height = 40): string {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function ExerciseRow({ log, onEdit, onDelete }: { log: ExerciseLog; onEdit: () => void; onDelete: () => void }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  const meta = EXERCISE_CATEGORIES.find((c) => c.value === log.category)

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 shadow-soft">
      <button type="button" onClick={onEdit} className="flex-1 text-left">
        <span className="text-[11.5px] text-ink">
          {meta?.icon} {log.note || meta?.label}
        </span>
        <span className="ml-1.5 text-[10px] text-ink-dim">
          {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {log.durationMin} menit
        </span>
      </button>
      <span className="text-[10.5px] tabular-nums text-ink-dim">{log.caloriesBurned} kkal</span>
      <button
        type="button"
        onClick={() => (armed ? onDelete() : setArmed(true))}
        aria-label={armed ? 'Konfirmasi hapus' : 'Hapus'}
        className={`ml-2 shrink-0 text-[10.5px] font-bold ${armed ? 'text-pro' : 'text-ink-dim'}`}
      >
        {armed ? 'Hapus?' : '✕'}
      </button>
    </div>
  )
}

export function CalorieTab() {
  const { user } = useAppState()
  const proAccess = useProAccess()
  const [logs30, setLogs30] = useState<FoodLog[]>([])
  const [loggedDatesAll, setLoggedDatesAll] = useState<string[]>([])
  const [exercise14, setExercise14] = useState<ExerciseLog[]>([])
  const [editingExercise, setEditingExercise] = useState<ExerciseLog | null>(null)

  useEffect(() => {
    if (!user) return
    foodLogRepository.getByDateRange(user.id, isoDaysAgo(29), todayIso()).then(setLogs30)
    foodLogRepository.loggedDates(user.id).then(setLoggedDatesAll)
    exerciseRepository.getByDateRange(user.id, isoDaysAgo(13), todayIso()).then((list) => setExercise14(list.sort((a, b) => b.date.localeCompare(a.date))))
  }, [user])

  if (!user) return null

  const byDate = new Map<string, FoodLog[]>()
  for (const log of logs30) byDate.set(log.date, [...(byDate.get(log.date) ?? []), log])

  const last7Dates = Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i))
  const last7 = last7Dates.map((date) => ({ date, calories: aggregateLogs(byDate.get(date) ?? []).calories }))
  const maxCal = Math.max(user.targetCalories, ...last7.map((d) => d.calories), 1)

  const loggedDates7 = last7Dates.filter((d) => byDate.has(d))
  const loggedDays7 = loggedDates7.length

  const totalsPerLoggedDay = loggedDates7.map((d) => aggregateLogs(byDate.get(d)!))
  const avgCalories7 = loggedDays7 > 0 ? Math.round(totalsPerLoggedDay.reduce((s, t) => s + t.calories, 0) / loggedDays7) : 0
  const avgPct = (key: 'protein' | 'carbs' | 'fat', target: number) =>
    loggedDays7 > 0 && target > 0
      ? Math.round((totalsPerLoggedDay.reduce((s, t) => s + t[key], 0) / loggedDays7 / target) * 100)
      : 0

  const last30Dates = Array.from({ length: 30 }, (_, i) => isoDaysAgo(29 - i))
  const trend30 = last30Dates.map((date) => aggregateLogs(byDate.get(date) ?? []).calories)
  const trend30Points = buildSparklinePoints(trend30)
  const recap = computeCalorieRecap(logs30, user.targetCalories, loggedDatesAll)

  const handleSaveExercise = async (values: ExerciseFormValues) => {
    if (!editingExercise) return
    await exerciseRepository.update(editingExercise.id, values)
    const refreshed = await exerciseRepository.getByDateRange(user.id, isoDaysAgo(13), todayIso())
    setExercise14(refreshed.sort((a, b) => b.date.localeCompare(a.date)))
    setEditingExercise(null)
  }

  const handleDeleteExercise = async (id: string) => {
    await exerciseRepository.delete(id)
    setExercise14((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-2xl bg-surface p-3 shadow-soft">
        <div className="mb-1 flex items-baseline justify-between">
          <b className="font-display text-xs text-ink">Kalori 7 Hari</b>
          <span className="text-[9.5px] text-ink-dim">
            {loggedDays7}/7 hari tercatat
          </span>
        </div>
        <div className="mt-2 flex h-10 items-end gap-1">
          {last7.map((d) => {
            const h = Math.max(4, Math.round((d.calories / maxCal) * 100))
            const overTarget = d.calories > user.targetCalories * 1.1
            return <div key={d.date} className={`flex-1 rounded-t ${overTarget ? 'bg-pro' : 'bg-success'}`} style={{ height: `${h}%` }} />
          })}
        </div>
        <p className="mt-2 text-[10.5px] text-ink-dim">
          Rata-rata <b className="tabular-nums text-ink">{avgCalories7.toLocaleString('id-ID')} kkal</b> dari target{' '}
          <b className="tabular-nums text-ink">{user.targetCalories.toLocaleString('id-ID')} kkal</b>
        </p>
      </div>

      {recap.hasEnoughData &&
        (proAccess?.active ? (
          <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <b className="font-display text-xs text-ink">Progress Recap 30 Hari</b>
              <span className="rounded-full bg-pro-soft px-2 py-0.5 text-[9.5px] font-bold text-pro-ink">PRO</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="font-display text-lg font-bold tabular-nums text-ink">🔥 {recap.loggingStreakDays}</p>
                <p className="text-[10px] text-ink-dim">hari streak logging</p>
              </div>
              <div>
                <p className="font-display text-lg font-bold tabular-nums text-ink">{recap.daysOnTargetPct ?? 0}%</p>
                <p className="text-[10px] text-ink-dim">hari sesuai target (30 hari)</p>
              </div>
            </div>
            {recap.avgCaloriesRecent14 !== null && recap.avgCaloriesPrior14 !== null && (
              <p className="text-[11px] leading-relaxed text-ink-dim">
                14 hari terakhir rata-rata <b className="tabular-nums text-ink">{recap.avgCaloriesRecent14.toLocaleString('id-ID')} kkal</b>, dibanding{' '}
                <b className="tabular-nums text-ink">{recap.avgCaloriesPrior14.toLocaleString('id-ID')} kkal</b> di 14 hari sebelumnya.
              </p>
            )}
            <svg viewBox="0 0 220 40" width="100%" height="40" preserveAspectRatio="none">
              <line x1="0" y1="40" x2="220" y2="40" stroke="var(--fk-line)" strokeWidth="1" />
              {trend30Points && (
                <polyline points={trend30Points} fill="none" stroke="var(--fk-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        ) : proAccess ? (
          <ProLocked
            title="Progress Recap 30 Hari"
            description="Streak logging, persentase hari sesuai target, dan tren kalorimu — sudah kamu rasakan waktu trial, sekarang terkunci."
          />
        ) : null)}

      <div className="rounded-2xl bg-surface p-3 shadow-soft">
        <b className="font-display text-xs text-ink">Rata-rata Makro (7 hari)</b>
        <div className="mt-2 flex justify-between text-[10px] text-ink-dim">
          <div>
            <b className="block text-xs tabular-nums text-ink">{avgPct('protein', user.targetProtein)}%</b>Protein
          </div>
          <div>
            <b className="block text-xs tabular-nums text-ink">{avgPct('carbs', user.targetCarbs)}%</b>Karbo
          </div>
          <div>
            <b className="block text-xs tabular-nums text-ink">{avgPct('fat', user.targetFat)}%</b>Lemak
          </div>
        </div>
      </div>

      <div>
        <b className="mb-2 block font-display text-xs text-ink">Riwayat Olahraga</b>
        {exercise14.length === 0 ? (
          <p className="text-[11px] text-ink-dim">Belum ada olahraga tercatat 14 hari terakhir.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {exercise14.map((log) => (
              <ExerciseRow key={log.id} log={log} onEdit={() => setEditingExercise(log)} onDelete={() => handleDeleteExercise(log.id)} />
            ))}
          </div>
        )}
      </div>

      {editingExercise && (
        <ExerciseSheet
          initial={editingExercise}
          weightKg={user.weightKg}
          confirmLabel="Simpan"
          onCancel={() => setEditingExercise(null)}
          onConfirm={handleSaveExercise}
          onDelete={() => handleDeleteExercise(editingExercise.id).then(() => setEditingExercise(null))}
        />
      )}
    </div>
  )
}
