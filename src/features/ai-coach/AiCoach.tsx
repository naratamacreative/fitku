import { useEffect, useState } from 'react'
import { exerciseRepository } from '../../data/repositories/exerciseRepository'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { hydrationRepository } from '../../data/repositories/hydrationRepository'
import { userRepository } from '../../data/repositories/userRepository'
import { weightRepository } from '../../data/repositories/weightRepository'
import { analyzeAdaptiveTarget, type AdaptiveTargetResult } from '../../domain/adaptiveTarget'
import { generateDeepInsight, type DeepInsight } from '../../domain/deepInsight'
import { calculateStreak, generateCoachReply, generateDailyCoaching, todayIso } from '../../domain/nutrition'
import { analyzeScoreTrend, type ScoreTrend } from '../../domain/scoreTrend'
import { recalculateMacrosForCalories } from '../../domain/tdee'
import { assessDailyWeightTip, type DailyWeightTip } from '../../domain/weightAssessment'
import { generateWeeklyInsight, type WeeklyInsight } from '../../domain/weeklyInsight'
import { AppShell } from '../../shared/components/AppShell'
import { ProLocked } from '../../shared/components/ProLocked'
import { useAppState } from '../../shared/context/AppStateContext'
import { useProAccess } from '../../shared/hooks/useProAccess'
import { useTodayLog } from '../../shared/hooks/useTodayLog'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

const STEP_LABELS = ['Analisa', 'Insight', 'Action'] as const

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function buildScoreSparkline(points: { score: number }[], width = 220, height = 40): string {
  if (points.length < 2) return ''
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - (Math.min(100, Math.max(0, p.score)) / 100) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function AiCoach() {
  const { user, refreshUser } = useAppState()
  const { totals } = useTodayLog(user?.id)
  const proAccess = useProAccess()
  const [streak, setStreak] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [weekly, setWeekly] = useState<WeeklyInsight | null>(null)
  const [deep, setDeep] = useState<DeepInsight | null>(null)
  const [scoreTrend, setScoreTrend] = useState<ScoreTrend | null>(null)
  const [adaptiveTarget, setAdaptiveTarget] = useState<AdaptiveTargetResult | null>(null)
  const [applyingTarget, setApplyingTarget] = useState(false)
  const [targetApplied, setTargetApplied] = useState(false)
  const [dailyWeightTip, setDailyWeightTip] = useState<DailyWeightTip | null>(null)

  useEffect(() => {
    if (!user) return
    foodLogRepository.loggedDates(user.id).then((dates) => setStreak(calculateStreak(dates)))
  }, [user, totals.count])

  useEffect(() => {
    if (!user) return
    const from = isoDaysAgo(6)
    const to = todayIso()
    Promise.all([
      foodLogRepository.getByDateRange(user.id, from, to),
      weightRepository.all(user.id),
      exerciseRepository.getByDateRange(user.id, from, to),
    ]).then(([logs, allWeights, exerciseLogs]) => {
      const weightEntriesInWindow = allWeights.filter((w) => w.date >= from && w.date <= to)
      const loggedDatesInWindow = Array.from(new Set(logs.map((l) => l.date)))
      setWeekly(
        generateWeeklyInsight({ user, logs, loggedDatesInWindow, weightEntriesInWindow, exerciseLogsInWindow: exerciseLogs, streak }),
      )

      // Only compare when BOTH today and yesterday actually have a logged entry —
      // no forced/guessed comparison from missing data.
      const todayEntry = allWeights.find((w) => w.date === to)
      const yesterdayEntry = allWeights.find((w) => w.date === isoDaysAgo(1))
      setDailyWeightTip(
        todayEntry && yesterdayEntry
          ? assessDailyWeightTip(user.goal, Math.round((todayEntry.weightKg - yesterdayEntry.weightKg) * 10) / 10)
          : null,
      )
    })
  }, [user, streak, totals.count])

  // Pro-only insight: deeper 30-day analysis, score trend, and adaptive target — only worth
  // fetching once we know the user actually has access, expired users just see ProLocked.
  useEffect(() => {
    if (!user || !proAccess?.active) return
    const from30 = isoDaysAgo(29)
    const from14 = isoDaysAgo(13)
    const to = todayIso()
    Promise.all([
      foodLogRepository.getByDateRange(user.id, from30, to),
      weightRepository.all(user.id),
      exerciseRepository.getByDateRange(user.id, from30, to),
      hydrationRepository.getByDateRange(user.id, from30, to),
    ]).then(([logs30, allWeights, exercise30, hydration30]) => {
      const weightEntries30 = allWeights.filter((w) => w.date >= from30 && w.date <= to)
      setDeep(generateDeepInsight({ user, logs30, weightEntries30, exerciseLogs30: exercise30, hydrationLogs30: hydration30 }))
      setAdaptiveTarget(analyzeAdaptiveTarget(user, weightEntries30))

      const logs14 = logs30.filter((l) => l.date >= from14)
      const exercise14 = exercise30.filter((e) => e.date >= from14)
      const hydration14 = hydration30.filter((h) => h.date >= from14)
      setScoreTrend(analyzeScoreTrend({ user, logs: logs14, exerciseLogs: exercise14, hydrationLogs: hydration14 }))
    })
  }, [user, proAccess?.active, totals.count])

  if (!user) return null

  const handleApplyTarget = async () => {
    if (!adaptiveTarget?.suggestedCalories) return
    setApplyingTarget(true)
    const { targetFat, targetCarbs } = recalculateMacrosForCalories(adaptiveTarget.suggestedCalories, user.targetProtein)
    await userRepository.update(user.id, {
      targetCalories: adaptiveTarget.suggestedCalories,
      targetFat,
      targetCarbs,
      lastAdaptiveTargetAppliedAt: new Date().toISOString(),
    })
    await refreshUser()
    setApplyingTarget(false)
    setTargetApplied(true)
  }

  const coaching = generateDailyCoaching(user, totals, streak, dailyWeightTip)
  const steps = [coaching.analisa, coaching.insight, coaching.action]

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    const reply = generateCoachReply(user, totals)
    setMessages((m) => [...m, { role: 'user', text }, { role: 'ai', text: reply }])
    setInput('')
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grad-hero h-8 w-8 shrink-0 rounded-full" />
          <b className="font-display text-sm text-ink">AI Coach</b>
        </div>

        <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-3.5 shadow-soft">
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Daily Coaching · hari ini</span>
          {steps.map((text, i) => (
            <div key={STEP_LABELS[i]} className="flex gap-2">
              <span className="grad-hero flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <div>
                <b className="block text-[10px] font-bold uppercase tracking-wide text-accent">{STEP_LABELS[i]}</b>
                <span className="text-[11px] leading-relaxed text-ink">{text}</span>
              </div>
            </div>
          ))}
        </div>

        {weekly && (
          <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-3.5 shadow-soft">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Weekly Insight · 7 hari terakhir</span>
            {!weekly.hasEnoughData ? (
              <>
                <p className="text-[11px] leading-relaxed text-ink">{weekly.summary}</p>
                <p className="text-[11px] leading-relaxed text-ink-dim">{weekly.recommendation}</p>
              </>
            ) : (
              <>
                <p className="text-[11.5px] leading-relaxed text-ink">{weekly.summary}</p>
                <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-ink-dim">
                  <p>📊 {weekly.consistency}</p>
                  <p>⚖️ {weekly.weightTrend}</p>
                  <p>🔍 {weekly.pattern}</p>
                </div>
                <div className="mt-1 rounded-xl bg-accent-soft px-3 py-2 text-[11px] text-ink">
                  <b className="text-accent">Rekomendasi: </b>
                  {weekly.recommendation}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">✨ FitKu Pro · Insight Personal</p>
          {proAccess?.reason === 'trial' && (
            <span className="rounded-full bg-pro-soft px-2 py-0.5 text-[9.5px] font-bold text-pro-ink">
              Trial {proAccess.trialDaysLeft} hari lagi
            </span>
          )}
        </div>

        {proAccess && !proAccess.active && (
          <ProLocked
            title="Insight Personal Pro"
            description="Analisa 30 hari, tren skor & korelasi kebiasaan, dan target adaptif — sudah kamu rasakan waktu trial, sekarang terkunci."
          />
        )}

        {proAccess?.active && scoreTrend && (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3.5 shadow-soft">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Tren Skor · 14 hari</span>
            {!scoreTrend.hasEnoughData ? (
              <p className="text-[11px] leading-relaxed text-ink-dim">{scoreTrend.message}</p>
            ) : (
              <>
                <p className="font-display text-2xl font-bold tabular-nums text-ink">{scoreTrend.avgScore}</p>
                <svg viewBox="0 0 220 40" width="100%" height="40" preserveAspectRatio="none">
                  <line x1="0" y1="40" x2="220" y2="40" stroke="var(--fk-line)" strokeWidth="1" />
                  <polyline
                    points={buildScoreSparkline(scoreTrend.points)}
                    fill="none"
                    stroke="var(--fk-pro)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-[11px] leading-relaxed text-ink">{scoreTrend.trendText}</p>
                {scoreTrend.correlationText && (
                  <div className="rounded-xl bg-accent-soft px-3 py-2 text-[11px] text-ink">
                    <b className="text-accent">Pola ditemukan: </b>
                    {scoreTrend.correlationText}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {proAccess?.active && adaptiveTarget && (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3.5 shadow-soft">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Target Adaptif</span>
            <p className="text-[11.5px] leading-relaxed text-ink">{adaptiveTarget.message}</p>
            {adaptiveTarget.suggestedCalories && !targetApplied && (
              <button
                type="button"
                onClick={handleApplyTarget}
                disabled={applyingTarget}
                className="self-start rounded-full bg-pro px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {applyingTarget ? 'Menerapkan…' : `Terapkan ${adaptiveTarget.suggestedCalories.toLocaleString('id-ID')} kkal`}
              </button>
            )}
            {targetApplied && <p className="text-[11px] font-semibold text-success">✓ Target baru diterapkan ke profilmu.</p>}
          </div>
        )}

        {proAccess?.active && deep && (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3.5 shadow-soft">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Analisa Mendalam · 30 hari</span>
            {!deep.hasEnoughData ? (
              <p className="text-[11px] leading-relaxed text-ink-dim">{deep.message}</p>
            ) : (
              <>
                <p className="text-[11.5px] leading-relaxed text-ink">{deep.headline}</p>
                <div className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-ink-dim">
                  <p>⚖️ {deep.weightTrendText}</p>
                  {deep.exerciseCorrelationText && <p>🏃 {deep.exerciseCorrelationText}</p>}
                  {deep.hydrationCorrelationText && <p>💧 {deep.hydrationCorrelationText}</p>}
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Tanya lebih lanjut</p>
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed ${
                m.role === 'user'
                  ? 'self-end rounded-br-md bg-surface-2 text-ink'
                  : 'self-start rounded-bl-md text-ink shadow-soft'
              }`}
              style={
                m.role === 'ai'
                  ? {
                      backgroundImage:
                        'linear-gradient(120deg, color-mix(in srgb, var(--fk-primary) 10%, var(--fk-surface)), color-mix(in srgb, var(--fk-accent) 10%, var(--fk-surface)))',
                    }
                  : undefined
              }
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 rounded-full bg-surface px-4 py-2.5 shadow-soft">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya AI Coach…"
            className="flex-1 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink-dim"
          />
          <button type="button" onClick={handleSend} className="text-accent" aria-label="Kirim">
            ➤
          </button>
        </div>
      </div>
    </AppShell>
  )
}
