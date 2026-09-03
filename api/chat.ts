/// <reference types="node" />
// Vercel Edge Function — proxies AI Coach chat messages to OpenAI.
// Runs server-side only: OPENAI_API_KEY never reaches the frontend bundle.
import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

const RATE_LIMIT = 20
const WINDOW_MS = 24 * 60 * 60 * 1000

// Module-scope Map — persists only within a single warm Edge Function instance.
// Vercel Edge Functions can run as multiple concurrent instances across regions and
// restart on cold start/redeploy, so this bounds abuse per-instance, it is NOT a durable
// global "20/day" guarantee across the whole deployment. Flagged as a known limitation,
// per explicit instruction to use an in-memory counter rather than an external store.
const requestCounts = new Map<string, { count: number; resetAt: number }>()

interface UserContext {
  userGoal: string
  targetCalories: number
  todayCalories: number
  targetWeight: number
  currentWeight: number
}

interface ChatRequestBody {
  userId: string
  message: string
  context: UserContext
}

interface OpenAiChatResponse {
  choices?: { message?: { content?: string } }[]
}

function buildSystemPrompt(context: UserContext): string {
  // No "Nama: {userName}" line — FitKu's User model (src/data/types/user.types.ts) has
  // no name field at all, so there is nothing real to interpolate there. Omitted rather
  // than filled with a placeholder, per the no-hardcoded-placeholder constraint.
  return `Kamu adalah FitKu AI Coach — asisten kesehatan personal yang membantu user mencapai tujuan fitness mereka.

Kamu HANYA membahas topik yang berkaitan dengan:
- Nutrisi dan makanan (kalori, protein, karbo, lemak, porsi)
- Hidrasi dan minum air
- Olahraga dan aktivitas fisik
- Berat badan dan progress
- Kebiasaan sehat sehari-hari
- Data tracking yang ada di FitKu

Jika ditanya di luar topik di atas, jawab dengan ramah bahwa kamu hanya bisa membantu soal kesehatan dan fitness, lalu tawarkan untuk membantu dengan hal yang relevan.

Gunakan bahasa Indonesia yang natural dan supportif. Jawaban singkat dan actionable — maksimal 3-4 kalimat kecuali user minta penjelasan lebih detail. Jangan pernah memberikan diagnosis medis.

Konteks user saat ini:
- Tujuan: ${context.userGoal}
- Target kalori harian: ${context.targetCalories} kkal
- Kalori hari ini: ${context.todayCalories} kkal
- Target berat: ${context.targetWeight} kg
- Berat sekarang: ${context.currentWeight} kg`
}

// AI Coach is Pro-only (trial no longer includes it) — verified server-side against the
// database, same "own rows only" subscription_status table the client reads, using the
// service-role client so this can't be spoofed by a client-crafted request body. Same
// admin-client pattern as api/support-chat.ts's createTicket(). Mirrors the exact rule in
// src/domain/entitlement.ts isPaidActive() — kept in sync manually since the edge runtime
// here doesn't share a module graph with the Vite app bundle.
async function isProUser(userId: string): Promise<boolean> {
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return false // fail closed — can't verify, don't grant access

  const admin = createClient(url, serviceKey)
  const { data, error } = await admin
    .from('subscription_status')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return false
  if (data.plan === 'free' || data.status !== 'active') return false
  if (!data.expires_at) return true // lifetime/dev_test-style plan, never expires
  return new Date(data.expires_at).getTime() > Date.now()
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = requestCounts.get(userId)
  if (!entry || now >= entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) {
    return false
  }
  entry.count += 1
  return true
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
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

  const { userId, message, context } = body
  if (!userId || !message || !context) {
    return json({ error: 'Missing userId, message, or context' }, 400)
  }

  if (!(await isProUser(userId))) {
    return json({ error: 'AI Coach adalah fitur Pro. Upgrade untuk mulai chat.', locked: true }, 403)
  }

  if (!checkRateLimit(userId)) {
    return json(
      {
        reply: 'Kamu sudah mencapai batas 20 pesan hari ini. Coba lagi besok, ya.',
        rateLimited: true,
      },
      200,
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json({ error: 'AI Coach sedang tidak tersedia. Coba lagi nanti.' }, 500)
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: buildSystemPrompt(context) },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!openaiRes.ok) {
      return json({ error: 'AI Coach sedang mengalami gangguan. Coba lagi sebentar lagi.' }, 502)
    }

    const data = (await openaiRes.json()) as OpenAiChatResponse
    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return json({ error: 'AI Coach tidak bisa memberikan jawaban saat ini. Coba lagi ya.' }, 502)
    }

    return json({ reply }, 200)
  } catch {
    return json({ error: 'Gagal menghubungi AI Coach. Cek koneksi internetmu dan coba lagi.' }, 502)
  }
}
