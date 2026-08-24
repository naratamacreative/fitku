import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Last-resort safety net: without this, ANY uncaught render error (React
// bug, a bad Dexie read, anything) white-screens the whole app with no way
// back except manually clearing site data. This happened once already
// (the bulkAdd/StrictMode crash) before it was caught by hand-testing —
// this catches the *next* one for the user instead of for a developer.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('FitKu crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <p className="font-display text-lg font-bold text-ink">Terjadi kesalahan</p>
          <p className="max-w-xs text-sm text-ink-dim">
            FitKu mengalami masalah tak terduga. Coba muat ulang halaman — datamu tetap tersimpan di
            perangkat ini.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="grad-hero rounded-2xl px-6 py-3 text-sm font-bold text-white"
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
