/// <reference types="node" />
// Vercel Edge Function — proxies "Tanya Admin" support chat to OpenAI. Same pattern as
// api/chat.ts (AI Coach): OPENAI_API_KEY never reaches the frontend bundle. Separate file,
// separate rate-limit bucket, separate system prompt — does not read or write anything
// AI Coach touches.
import { createClient } from '@supabase/supabase-js'
import { SUPPORT_SYSTEM_PROMPT } from './_lib/supportKnowledge'

export const config = { runtime: 'edge' }

const RATE_LIMIT = 15
const WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_HISTORY = 6 // last 3 exchanges — enough to carry a bug report across a couple of clarifying turns, capped to bound token cost

// Module-scope Map — same known limitation as api/chat.ts: bounds abuse per warm instance,
// not a durable global guarantee across the whole deployment. Separate Map instance from
// AI Coach's (different file, different module scope), so its 20/day limit is untouched.
const requestCounts = new Map<string, { count: number; resetAt: number }>()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SupportContext {
  plan: string
  trialDaysLeft: number
}

interface ChatRequestBody {
  userId: string
  message: string
  history?: ChatMessage[]
  context: SupportContext
}

interface TicketArgs {
  featureArea: string
  description: string
  stepsBefore?: string
  errorMessage?: string
  urgency: 'low' | 'medium' | 'high'
  conversationSummary: string
}

interface OpenAiToolCall {
  function: { name: string; arguments: string }
}

interface OpenAiChatResponse {
  choices?: { message?: { content?: string | null; tool_calls?: OpenAiToolCall[] } }[]
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(userId)
  if (!entry || now >= entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count += 1
  return true
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const TICKET_TOOL = {
  type: 'function' as const,
  function: {
    name: 'create_support_ticket',
    description:
      'Buat laporan untuk tim FitKu — panggil HANYA saat user melaporkan bug/error teknis atau masalah yang butuh tindak lanjut tim, bukan untuk pertanyaan cara pakai biasa.',
    parameters: {
      type: 'object',
      properties: {
        featureArea: { type: 'string', description: 'Fitur FitKu yang bermasalah, misal: AI Coach, FoodTracker, Premium, Login' },
        description: { type: 'string', description: 'Ringkasan masalah dari sudut pandang user' },
        stepsBefore: { type: 'string', description: 'Langkah yang dilakukan user sebelum masalah terjadi, jika disebutkan' },
        errorMessage: { type: 'string', description: 'Pesan error persis jika user menyebutkannya' },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description:
            'high = kehilangan data / tidak bisa login / pembayaran-Premium bermasalah / aplikasi sama sekali tidak bisa dipakai. medium = fitur penting tidak jalan tapi ada workaround. low = gangguan kecil/kosmetik.',
        },
        conversationSummary: { type: 'string', description: 'Ringkasan singkat percakapan untuk konteks tim FitKu' },
      },
      required: ['featureArea', 'description', 'urgency', 'conversationSummary'],
    },
  },
}

async function createTicket(userId: string, args: TicketArgs): Promise<{ id: string } | null> {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  const admin = createClient(url, serviceKey)
  const { data, error } = await admin
    .from('support_tickets')
    .insert({
      user_id: userId,
      feature_area: args.featureArea,
      description: args.description,
      steps_before: args.stepsBefore ?? null,
      error_message: args.errorMessage ?? null,
      urgency: args.urgency,
      conversation_summary: args.conversationSummary,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return { id: data.id as string }
}

async function notifyTelegram(ticketId: string, args: TicketArgs): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return false // Not configured yet — ticket is still saved, just not pushed live.

  const text = [
    `🚨 FitKu — laporan urgensi TINGGI`,
    `Fitur: ${args.featureArea}`,
    `Masalah: ${args.description}`,
    args.errorMessage ? `Error: ${args.errorMessage}` : null,
    `Ticket ID: ${ticketId}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    return res.ok
  } catch {
    return false // Best-effort — a Telegram outage must never break ticket creation for the user.
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let body: ChatRequestBody
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { userId, message, context, history } = body
  if (!userId || !message || !context) {
    return json({ error: 'Missing userId, message, or context' }, 400)
  }

  if (!checkRateLimit(userId)) {
    return json(
      {
        reply: 'Kamu sudah mencapai batas 15 pertanyaan hari ini untuk Tanya Admin. Coba lagi besok, ya.',
        rateLimited: true,
      },
      200,
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json({ error: 'Tanya Admin sedang tidak tersedia. Coba lagi nanti.' }, 500)
  }

  const contextLine = `\n\nKonteks user saat ini: status langganan ${context.plan}${context.trialDaysLeft > 0 ? `, sisa trial ${context.trialDaysLeft} hari` : ''}.`
  const trimmedHistory = (history ?? []).slice(-MAX_HISTORY)

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SUPPORT_SYSTEM_PROMPT + contextLine },
          ...trimmedHistory,
          { role: 'user', content: message },
        ],
        tools: [TICKET_TOOL],
        max_tokens: 300,
        temperature: 0.5,
      }),
    })

    if (!openaiRes.ok) {
      return json({ error: 'Tanya Admin sedang mengalami gangguan. Coba lagi sebentar lagi.' }, 502)
    }

    const data = (await openaiRes.json()) as OpenAiChatResponse
    const choice = data.choices?.[0]?.message
    const toolCall = choice?.tool_calls?.find((t) => t.function.name === 'create_support_ticket')

    if (toolCall) {
      let args: TicketArgs
      try {
        args = JSON.parse(toolCall.function.arguments) as TicketArgs
      } catch {
        return json({ error: 'Tanya Admin tidak bisa memproses laporan ini. Coba jelaskan ulang ya.' }, 502)
      }

      const ticket = await createTicket(userId, args)
      if (!ticket) {
        return json(
          { reply: 'Sudah saya catat masalahnya, tapi ada kendala teknis menyimpan laporan. Coba lagi sebentar ya.' },
          200,
        )
      }
      if (args.urgency === 'high') {
        await notifyTelegram(ticket.id, args)
      }

      return json(
        {
          reply: `Terima kasih sudah melaporkan. Saya sudah catat masalah ini dan akan diteruskan ke tim FitKu${args.urgency === 'high' ? ' — karena sepertinya cukup mendesak, tim akan segera ditindaklanjuti' : ''}. Ada lagi yang bisa saya bantu?`,
          ticketCreated: true,
        },
        200,
      )
    }

    const reply = choice?.content?.trim()
    if (!reply) {
      return json({ error: 'Tanya Admin tidak bisa memberikan jawaban saat ini. Coba lagi ya.' }, 502)
    }
    return json({ reply, ticketCreated: false }, 200)
  } catch (e) {
    // Logged (not swallowed silently) so a transient OpenAI/network failure is visible
    // in Vercel's function logs instead of only ever surfacing as a generic user-facing message.
    console.error('support-chat handler error:', e)
    return json({ error: 'Gagal menghubungi Tanya Admin. Cek koneksi internetmu dan coba lagi.' }, 502)
  }
}
