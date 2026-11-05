const DATA_KEY = 'tq_v1'

// EventTarget for same-tab notifications (BroadcastChannel doesn't fire for the sender)
const emitter = new EventTarget()

let channel
try {
  channel = new BroadcastChannel('tirequeue')
} catch {
  channel = { postMessage: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY)) || { shops: {}, entries: {} }
  } catch {
    return { shops: {}, entries: {} }
  }
}

function save(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

function broadcast(shopId) {
  emitter.dispatchEvent(new CustomEvent('tq_update', { detail: { shop_id: shopId } }))
  try { channel.postMessage({ shop_id: shopId }) } catch {}
}

function randomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length])
    .join('')
}

export const mockStore = {
  createShop(name) {
    const data = load()
    const id = crypto.randomUUID()
    const code = randomCode(6)
    const admin_secret = crypto.randomUUID()
    const shop = {
      id, name: name || 'Шиномонтаж', code, admin_secret,
      accepting: true, avg_service_min: 20,
      created_at: new Date().toISOString(),
    }
    data.shops[id] = shop
    save(data)
    return shop
  },

  getShopByCode(code) {
    const data = load()
    return Object.values(data.shops).find(s => s.code === code.toUpperCase()) || null
  },

  getShopBySecret(secret) {
    const data = load()
    return Object.values(data.shops).find(s => s.admin_secret === secret) || null
  },

  joinQueue(shopCode, { car_color, car_model, plate }, clientToken) {
    const data = load()
    const shop = Object.values(data.shops).find(s => s.code === shopCode.toUpperCase())
    if (!shop || !shop.accepting) return null
    const id = crypto.randomUUID()
    const entry = {
      id, shop_id: shop.id, car_color, car_model,
      plate: plate.toUpperCase().replace(/\s/g, ''),
      status: 'waiting', client_token: clientToken,
      created_at: new Date().toISOString(),
      called_at: null, ended_at: null,
    }
    data.entries[id] = entry
    save(data)
    broadcast(shop.id)
    return entry
  },

  getEntry(id) {
    const data = load()
    const entry = data.entries[id]
    if (!entry) return null
    const shop = data.shops[entry.shop_id] || null
    const waiting = Object.values(data.entries)
      .filter(e => e.shop_id === entry.shop_id && e.status === 'waiting')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const position = entry.status === 'waiting'
      ? waiting.findIndex(e => e.id === id) + 1
      : 0
    const serving = Object.values(data.entries)
      .find(e => e.shop_id === entry.shop_id && e.status === 'serving') || null
    return { ...entry, position, serving, shop }
  },

  getQueue(shopId) {
    const data = load()
    const shop = data.shops[shopId]
    if (!shop) return null
    const all = Object.values(data.entries).filter(e => e.shop_id === shopId)
    const serving = all.find(e => e.status === 'serving') || null
    const waiting = all
      .filter(e => e.status === 'waiting')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    return { shop, serving, waiting }
  },

  advance(secret) {
    const data = load()
    const shop = Object.values(data.shops).find(s => s.admin_secret === secret)
    if (!shop) return null
    const current = Object.values(data.entries).find(
      e => e.shop_id === shop.id && e.status === 'serving'
    )
    if (current) {
      data.entries[current.id].status = 'done'
      data.entries[current.id].ended_at = new Date().toISOString()
    }
    const next = Object.values(data.entries)
      .filter(e => e.shop_id === shop.id && e.status === 'waiting')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
    if (next) {
      data.entries[next.id].status = 'serving'
      data.entries[next.id].called_at = new Date().toISOString()
    }
    save(data)
    broadcast(shop.id)
    return { done: current || null, serving: next || null }
  },

  markNoShow(secret, entryId) {
    const data = load()
    const shop = Object.values(data.shops).find(s => s.admin_secret === secret)
    if (!shop) return
    const entry = data.entries[entryId]
    if (!entry || entry.shop_id !== shop.id) return
    data.entries[entryId].status = 'no_show'
    data.entries[entryId].ended_at = new Date().toISOString()
    save(data)
    broadcast(shop.id)
  },

  cancelEntry(entryId, clientToken) {
    const data = load()
    const entry = data.entries[entryId]
    if (!entry || entry.client_token !== clientToken) return false
    if (!['waiting', 'serving'].includes(entry.status)) return false
    data.entries[entryId].status = 'cancelled'
    data.entries[entryId].ended_at = new Date().toISOString()
    save(data)
    broadcast(entry.shop_id)
    return true
  },

  toggleAccepting(secret) {
    const data = load()
    const shop = Object.values(data.shops).find(s => s.admin_secret === secret)
    if (!shop) return
    data.shops[shop.id].accepting = !data.shops[shop.id].accepting
    save(data)
    broadcast(shop.id)
  },

  subscribe(shopId, callback) {
    function handleLocal(e) {
      if (e.detail.shop_id === shopId) callback()
    }
    function handleCrossTab(e) {
      if (e.data?.shop_id === shopId) callback()
    }
    emitter.addEventListener('tq_update', handleLocal)
    channel.addEventListener('message', handleCrossTab)
    return () => {
      emitter.removeEventListener('tq_update', handleLocal)
      channel.removeEventListener('message', handleCrossTab)
    }
  },

  getClientToken() {
    let token = localStorage.getItem('tq_client_token')
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem('tq_client_token', token)
    }
    return token
  },

  getMyEntryId(shopCode) {
    return localStorage.getItem(`tq_my_${shopCode.toUpperCase()}`) || null
  },

  setMyEntryId(shopCode, entryId) {
    localStorage.setItem(`tq_my_${shopCode.toUpperCase()}`, entryId)
  },

  clearMyEntryId(shopCode) {
    localStorage.removeItem(`tq_my_${shopCode.toUpperCase()}`)
  },
}
