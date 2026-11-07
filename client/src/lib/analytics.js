// Anonymous page-view beacon to our own server (see server/analytics.js).
import { api } from './api'

// Where this visit came from: QR codes link with ?src=qr. Read once per load.
const SRC = (() => {
  try { return new URLSearchParams(window.location.search).get('src') === 'qr' ? 'qr' : 'link' } catch { return 'link' }
})()

export function trackView(page, ids = {}) {
  let lang = 'kk'
  try { lang = localStorage.getItem('tq_lang') || 'kk' } catch {}
  const body = JSON.stringify({ page, visitor: api.getClientToken(), lang, src: SRC, ...ids })
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/e', new Blob([body], { type: 'text/plain' }))) return
  } catch {}
  fetch('/api/e', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {})
}
