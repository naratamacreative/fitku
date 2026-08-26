import { useState } from 'react'
import type { FoodReportReason } from '../../../data/types/foodReport.types'
import { FOOD_REPORT_REASONS } from '../../../domain/foodReport'
import { Button } from '../../../shared/components/Button'

interface ReportFoodSheetProps {
  foodName: string
  initial?: { reasons: FoodReportReason[]; note?: string }
  onCancel: () => void
  onSubmit: (reasons: FoodReportReason[], note: string) => void
}

export function ReportFoodSheet({ foodName, initial, onCancel, onSubmit }: ReportFoodSheetProps) {
  const [reasons, setReasons] = useState<FoodReportReason[]>(initial?.reasons ?? [])
  const [note, setNote] = useState(initial?.note ?? '')

  const toggleReason = (value: FoodReportReason) => {
    setReasons((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]))
  }

  const canSubmit = reasons.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onCancel}>
      <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-base font-semibold text-ink">⚠️ Laporkan Makanan</p>
        <p className="mt-0.5 text-xs text-ink-dim">
          Ada masalah dengan <b className="text-ink">{foodName}</b>?
        </p>

        <p className="mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Apa masalahnya?</p>
        <div className="flex flex-col gap-2">
          {FOOD_REPORT_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={reasons.includes(r.value)}
                onChange={() => toggleReason(r.value)}
                className="h-4 w-4 accent-accent"
              />
              {r.label}
            </label>
          ))}
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-ink-dim">Catatan (opsional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jelaskan lebih detail kalau perlu…"
            rows={2}
            className="resize-none rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-dim"
          />
        </label>

        <p className="mt-3 text-[10.5px] leading-relaxed text-ink-dim">
          Laporan tersimpan di perangkat ini. Makanan yang kamu laporkan tidak akan muncul lagi di tab Favorit.
        </p>

        <div className="mt-4">
          <Button onClick={() => onSubmit(reasons, note)} disabled={!canSubmit}>
            {initial ? 'Perbarui Laporan' : 'Kirim Laporan'}
          </Button>
        </div>
      </div>
    </div>
  )
}
