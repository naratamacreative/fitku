import { useRef, useState } from 'react'
import { supabase } from '../../../shared/lib/supabaseClient'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  feedbackGiven?: boolean
}

interface SupportChatSheetProps {
  userId: string
  planLabel: string
  trialDaysLeft: number
  onClose: () => void
}

const GREETING: ChatMessage = {
  role: 'ai',
  text: 'Halo! Saya FitKu Support Assistant. Ada yang bisa saya bantu soal cara pakai FitKu, atau ada kendala yang mau kamu laporkan?',
}

export function SupportChatSheet({ userId, planLabel, trialDaysLeft, onClose }: SupportChatSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    scrollToEnd()

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: text,
          history: nextMessages
            .slice(1) // drop the local-only greeting — it was never sent to the API
            .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
          context: { plan: planLabel, trialDaysLeft },
        }),
      })
      if (!res.ok) {
        setMessages((m) => [...m, { role: 'ai', text: 'Tanya Admin sedang mengalami gangguan. Coba lagi sebentar lagi.' }])
        return
      }
      const data = (await res.json()) as { reply?: string; error?: string }
      setMessages((m) => [
        ...m,
        { role: 'ai', text: data.reply ?? data.error ?? 'Tanya Admin tidak bisa memberikan jawaban saat ini. Coba lagi ya.' },
      ])
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Gagal menghubungi Tanya Admin. Cek koneksi internetmu dan coba lagi.' }])
    } finally {
      setSending(false)
      scrollToEnd()
    }
  }

  const giveFeedback = (index: number, helpful: boolean) => {
    setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, feedbackGiven: true } : msg)))
    const question = messages[index - 1]?.text ?? ''
    void supabase.from('support_feedback').insert({ user_id: userId, helpful, question })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="flex h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-surface p-5 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">💬 Tanya Admin</p>
            <p className="text-[11px] text-ink-dim">Pusat bantuan FitKu</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-lg text-ink-dim">
            ✕
          </button>
        </div>

        <div ref={listRef} className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="flex flex-col">
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed ${
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
              {m.role === 'ai' && i > 0 && (
                <div className="mt-1 self-start">
                  {m.feedbackGiven ? (
                    <span className="text-[10px] text-ink-dim">Makasih atas feedback-nya 🙏</span>
                  ) : (
                    <div className="flex gap-2 text-xs">
                      <button type="button" onClick={() => giveFeedback(i, true)} aria-label="Membantu" className="opacity-70">
                        👍
                      </button>
                      <button type="button" onClick={() => giveFeedback(i, false)} aria-label="Tidak membantu" className="opacity-70">
                        👎
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 ring-1 ring-line/60">
          <input
            name="supportChatMessage"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            placeholder={sending ? 'Sedang menjawab…' : 'Tanya soal FitKu…'}
            disabled={sending}
            className="flex-1 bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink-dim disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending}
            className="text-accent disabled:opacity-60"
            aria-label="Kirim"
          >
            {sending ? '…' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}
