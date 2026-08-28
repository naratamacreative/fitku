import type { Goal } from '../data/types/user.types'

// Design note: FitKu's token set has only two non-neutral semantic colors — `success`
// (green) and `pro` (amber/gold), see index.css — and the design system is frozen.
// The badge spec below calls for merah/kuning/hijau (3 colors); `caution` covers both
// "merah" and "kuning" cases under the single `pro` token rather than inventing a red.
// The wording (⚠️ + urgency-specific text) still carries the severity distinction —
// only the color tier is collapsed. Approved 2026-08-27.
export type WeightAssessmentTone = 'good' | 'caution' | 'neutral'

export interface WeightAssessment {
  tone: WeightAssessmentTone
  label: string
}

const MAINTAIN_TOLERANCE_KG = 1
const MONTHLY_STABLE_THRESHOLD_KG = 0.3
const DAILY_MAINTAIN_TOLERANCE_KG = 0.5

function fmt(kg: number): string {
  return (Math.round(Math.abs(kg) * 10) / 10).toString()
}

/** Weight-tab badge: delta = current - onboarding anchor. Shown to every user, not Pro-gated. */
export function assessWeightChange(goal: Goal, deltaKg: number): WeightAssessment {
  if (goal === 'lose_weight') {
    if (deltaKg > 0) return { tone: 'caution', label: `⚠️ +${fmt(deltaKg)}kg — berat naik, di luar jalur` }
    if (deltaKg < 0) return { tone: 'good', label: `↓ ${fmt(deltaKg)}kg — sesuai target` }
    return { tone: 'neutral', label: 'Berat stabil' }
  }

  if (goal === 'gain_muscle') {
    if (deltaKg > 0) return { tone: 'good', label: `↑ ${fmt(deltaKg)}kg — progres bagus` }
    if (deltaKg < 0) return { tone: 'caution', label: `⚠️ −${fmt(deltaKg)}kg — berat turun, perhatikan asupan` }
    return { tone: 'caution', label: 'Berat belum berubah' }
  }

  // maintain
  if (Math.abs(deltaKg) <= MAINTAIN_TOLERANCE_KG) {
    return { tone: 'good', label: 'Berat terjaga' }
  }
  return { tone: 'caution', label: `⚠️ ${fmt(deltaKg)}kg dari target jaga berat` }
}

/** Deep Insight's 30-day weight trend commentary. Stability band: ±0.3kg. */
export function assessMonthlyWeightTrend(goal: Goal, deltaKg: number): string {
  const x = fmt(deltaKg)
  const stable = Math.abs(deltaKg) <= MONTHLY_STABLE_THRESHOLD_KG

  if (goal === 'lose_weight') {
    if (stable) return 'Berat kamu stabil — tingkatkan defisit kalori untuk hasil lebih cepat.'
    return deltaKg > 0
      ? `Berat kamu naik ${x}kg dalam 30 hari — perlu evaluasi asupan kalori.`
      : `Berat kamu turun ${x}kg dalam 30 hari — sesuai target penurunan.`
  }

  if (goal === 'gain_muscle') {
    if (stable) return 'Berat kamu stabil — pastikan surplus kalori cukup untuk pertumbuhan otot.'
    return deltaKg > 0
      ? `Berat kamu naik ${x}kg dalam 30 hari — progres pembentukan otot berjalan.`
      : `Berat kamu turun ${x}kg dalam 30 hari — tambah asupan protein dan kalori.`
  }

  // maintain
  if (stable) return 'Berat kamu terjaga dengan baik — pertahankan.'
  return deltaKg > 0 ? `Berat kamu naik ${x}kg — kurangi sedikit asupan kalori.` : `Berat kamu turun ${x}kg — tambah sedikit asupan kalori.`
}

export interface DailyWeightTip {
  insight: string
  action: string
}

/**
 * AI Coach daily tip: deltaKg = today's weight - yesterday's weight. Caller must only
 * invoke this when BOTH days actually have a logged entry — no forced comparison from
 * missing data (see generateDailyCoaching in nutrition.ts for how this slots in).
 */
export function assessDailyWeightTip(goal: Goal, deltaKg: number): DailyWeightTip {
  if (deltaKg === 0) {
    return {
      insight: 'Berat kamu sama persis dengan kemarin.',
      action: 'Pertahankan konsistensi pola makan dan aktivitasmu hari ini.',
    }
  }

  if (goal === 'lose_weight') {
    return deltaKg > 0
      ? { insight: 'Berat kamu naik dibanding kemarin.', action: 'Fokus jaga defisit kalori hari ini — kurangi sedikit porsi karbo atau lemak.' }
      : { insight: 'Berat kamu turun dibanding kemarin — progres bagus.', action: 'Pertahankan momentum ini, jangan ubah pola makan drastis.' }
  }

  if (goal === 'gain_muscle') {
    return deltaKg > 0
      ? { insight: 'Berat kamu naik dibanding kemarin — sejalan dengan targetmu.', action: 'Fokus asupan protein dan latihan beban hari ini.' }
      : { insight: 'Berat kamu turun dibanding kemarin, padahal targetmu naik otot.', action: 'Tambah asupan kalori hari ini — jangan skip makan.' }
  }

  // maintain
  if (Math.abs(deltaKg) <= DAILY_MAINTAIN_TOLERANCE_KG) {
    return { insight: 'Berat kamu masih dalam rentang stabil dibanding kemarin.', action: 'Jaga konsistensi pola makan seperti sekarang.' }
  }
  return { insight: 'Berat kamu bergeser cukup jauh dibanding kemarin.', action: 'Lakukan penyesuaian kecil pada asupan kalori hari ini.' }
}
