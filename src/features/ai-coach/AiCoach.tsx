import { useEffect, useState } from 'react'
import { foodLogRepository } from '../../data/repositories/foodLogRepository'
import { calculateStreak, generateCoachReply, generateDailyCoaching } from '../../domain/nutrition'
import { AppShell } from '../../shared/components/AppShell'
import { useAppState } from '../../shared/context/AppStateContext'
import { useTodayLog } from '../../shared/hooks/useTodayLog'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

const STEP_LABELS = ['Analisa', 'Insight', 'Action'] as const

export function AiCoach() {
  const { user } = useAppState()
  const { totals } = useTodayLog(user?.id)
  const [streak, setStreak] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!user) return
    foodLogRepository.loggedDates(user.id).then((dates) => setStreak(calculateStreak(dates)))
  }, [user, totals.count])

  if (!user) return null

  const coaching = generateDailyCoaching(user, totals, streak)
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
