export interface SnapResult {
  status_code: string
  status_message: string
  transaction_id: string
  order_id: string
  gross_amount: string
  payment_type: string
  transaction_time: string
  transaction_status: string
  fraud_status?: string
  finish_redirect_url?: string
  pdf_url?: string
}

export interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void
  onPending?: (result: SnapResult) => void
  onError?: (result: SnapResult) => void
  onClose?: () => void
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: SnapCallbacks) => void
      embed?: (token: string, options: { embedId: string }) => void
    }
  }
}

let loadPromise: Promise<void> | null = null

export function loadMidtransSnap(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.snap) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || ''

    const existingScript = document.querySelector(`script[src="${snapUrl}"]`)
    if (existingScript) {
      if (window.snap) {
        resolve()
      } else {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', (e) => reject(e))
      }
      return
    }

    const script = document.createElement('script')
    script.src = snapUrl
    script.type = 'text/javascript'
    if (clientKey) {
      script.setAttribute('data-client-key', clientKey)
    }
    script.async = true
    script.onload = () => resolve()
    script.onerror = (err) => reject(err)

    document.body.appendChild(script)
  })

  return loadPromise
}
