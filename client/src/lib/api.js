// Talks to the TireQueue server. Per-device bits (who am I, which ticket is mine)
// stay in localStorage on purpose.

async function request(method, path, body, headers = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

const enc = encodeURIComponent

function safeGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}
function safeRemove(key) {
  try { localStorage.removeItem(key) } catch {}
}

export const api = {
  createShop: name => request('POST', '/shops', { name }),
  getShopByCode: code => request('GET', `/shops/by-code/${enc(code)}`),
  getShopBySecret: secret => request('GET', `/op/${enc(secret)}`),
  getQueue: shopId => request('GET', `/shops/${enc(shopId)}/queue`),
  getEntry: id => request('GET', `/entries/${enc(id)}?client_token=${enc(api.getClientToken())}`),

  async joinQueue(code, fields) {
    try {
      return await request('POST', `/shops/by-code/${enc(code)}/join`, {
        ...fields, client_token: api.getClientToken(),
      })
    } catch (err) {
      if (err.status === 409) return null
      throw err
    }
  },

  async cancelEntry(id) {
    try {
      await request('POST', `/entries/${enc(id)}/cancel`, { client_token: api.getClientToken() })
      return true
    } catch {
      return false
    }
  },

  advance: secret => request('POST', `/op/${enc(secret)}/advance`),
  markNoShow: (secret, entryId) => request('POST', `/op/${enc(secret)}/no-show/${enc(entryId)}`),
  toggleAccepting: secret => request('POST', `/op/${enc(secret)}/toggle`),

  // Live updates via SSE. Some proxies (e.g. Cloudflare quick tunnels) hold the
  // stream back, so until the server's "hello" actually arrives we poll instead.
  subscribe(shopId, callback) {
    let streaming = false
    const es = new EventSource(`/api/shops/${enc(shopId)}/stream`)
    es.addEventListener('hello', () => { streaming = true })
    es.addEventListener('update', () => { streaming = true; callback() })
    // After a reconnect we may have missed updates: refetch.
    es.addEventListener('open', callback)
    es.addEventListener('error', () => { streaming = false })

    const poll = setInterval(() => {
      if (!streaming && document.visibilityState === 'visible') callback()
    }, 3000)
    // Phone woke up / tab came back: catch up right away.
    const onVisible = () => { if (document.visibilityState === 'visible') callback() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      es.close()
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  },

  // ----- per-device -----
  getClientToken() {
    let token = safeGet('tq_client_token')
    if (!token) {
      token = crypto.randomUUID()
      safeSet('tq_client_token', token)
    }
    return token
  },
  getMyEntryId: code => safeGet(`tq_my_${code.toUpperCase()}`),
  setMyEntryId: (code, id) => safeSet(`tq_my_${code.toUpperCase()}`, id),
  clearMyEntryId: code => safeRemove(`tq_my_${code.toUpperCase()}`),
}
