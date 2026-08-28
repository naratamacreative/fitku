// Loads the Midtrans Snap.js loader script once and resolves with `window.snap`.
// Sandbox URL only — matches api/midtrans/create-transaction.ts, which creates
// transactions against the Sandbox Snap API. Going to production is a coordinated
// change on both sides, not something either file does alone.
const SNAP_SRC = 'https://app.sandbox.midtrans.com/snap/snap.js'

export interface SnapPayResult {
  order_id: string
  transaction_status: string
}

export interface SnapCallbacks {
  onSuccess: (result: SnapPayResult) => void
  onPending: (result: SnapPayResult) => void
  onError: (result: unknown) => void
  onClose: () => void
}

interface MidtransSnap {
  pay: (token: string, callbacks: SnapCallbacks) => void
}

declare global {
  interface Window {
    snap?: MidtransSnap
  }
}

let loadPromise: Promise<MidtransSnap> | null = null

export function loadSnap(clientKey: string): Promise<MidtransSnap> {
  if (window.snap) return Promise.resolve(window.snap)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SNAP_SRC
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => {
      if (window.snap) resolve(window.snap)
      else reject(new Error('Snap.js loaded but window.snap is missing'))
    }
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap.js'))
    document.head.appendChild(script)
  })
  return loadPromise
}
