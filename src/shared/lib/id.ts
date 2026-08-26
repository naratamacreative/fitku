// crypto.randomUUID() is only defined in secure contexts (HTTPS or localhost) per the
// Web Crypto API spec — it's undefined when FitKu is opened over plain HTTP on a LAN IP
// (e.g. testing on a phone via `vite --host`), which throws inside repository writes.
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
