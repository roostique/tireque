import { randomUUID, randomInt } from 'node:crypto'
import { db } from './db.js'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ACTIVE = ['waiting', 'serving']

function randomCode(len = 6) {
  let s = ''
  for (let i = 0; i < len; i++) s += CODE_CHARS[randomInt(CODE_CHARS.length)]
  return s
}

const now = () => new Date().toISOString()

function rowToShop(row) {
  if (!row) return null
  return { ...row, accepting: !!row.accepting }
}

// Never send other customers' tokens to clients
export function publicEntry(e) {
  if (!e) return null
  const { client_token, ...rest } = e
  return rest
}

export function publicShop(s) {
  if (!s) return null
  const { admin_secret, ...rest } = s
  return rest
}

const q = {
  insertShop: db.prepare(`INSERT INTO shops (id, name, code, admin_secret, accepting, avg_service_min, created_at)
                          VALUES (?, ?, ?, ?, 1, 20, ?)`),
  shopById: db.prepare('SELECT * FROM shops WHERE id = ?'),
  shopByCode: db.prepare('SELECT * FROM shops WHERE code = ?'),
  shopBySecret: db.prepare('SELECT * FROM shops WHERE admin_secret = ?'),
  setAccepting: db.prepare('UPDATE shops SET accepting = ? WHERE id = ?'),

  insertEntry: db.prepare(`INSERT INTO entries (id, shop_id, car_color, car_model, plate, status, client_token, created_at)
                           VALUES (?, ?, ?, ?, ?, 'waiting', ?, ?)`),
  entryById: db.prepare('SELECT * FROM entries WHERE id = ?'),
  waiting: db.prepare(`SELECT * FROM entries WHERE shop_id = ? AND status = 'waiting' ORDER BY created_at, rowid`),
  serving: db.prepare(`SELECT * FROM entries WHERE shop_id = ? AND status = 'serving' LIMIT 1`),
  setStatus: db.prepare('UPDATE entries SET status = ?, ended_at = ? WHERE id = ?'),
  callEntry: db.prepare(`UPDATE entries SET status = 'serving', called_at = ? WHERE id = ?`),
}

function tx(fn) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const r = fn()
    db.exec('COMMIT')
    return r
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export const store = {
  createShop(name) {
    const id = randomUUID()
    const admin_secret = randomUUID()
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = randomCode(6)
      if (q.shopByCode.get(code)) continue
      q.insertShop.run(id, (name || '').trim().slice(0, 80) || 'Шиномонтаж', code, admin_secret, now())
      return rowToShop(q.shopById.get(id))
    }
    throw new Error('Could not generate unique code')
  },

  getShopById(id) {
    return rowToShop(q.shopById.get(id))
  },

  getShopByCode(code) {
    return rowToShop(q.shopByCode.get(String(code).toUpperCase()))
  },

  getShopBySecret(secret) {
    return rowToShop(q.shopBySecret.get(secret))
  },

  joinQueue(shopCode, { car_color, car_model, plate }, clientToken) {
    const shop = this.getShopByCode(shopCode)
    if (!shop || !shop.accepting) return null
    const id = randomUUID()
    q.insertEntry.run(
      id, shop.id,
      String(car_color).slice(0, 40),
      String(car_model).trim().slice(0, 80),
      String(plate).toUpperCase().replace(/\s/g, '').slice(0, 20),
      String(clientToken).slice(0, 64),
      now(),
    )
    return q.entryById.get(id)
  },

  getEntry(id) {
    const entry = q.entryById.get(id)
    if (!entry) return null
    const shop = rowToShop(q.shopById.get(entry.shop_id))
    let position = 0
    if (entry.status === 'waiting') {
      position = q.waiting.all(entry.shop_id).findIndex(e => e.id === id) + 1
    }
    const serving = q.serving.get(entry.shop_id) || null
    return { ...entry, position, serving, shop }
  },

  getQueue(shopId) {
    const shop = this.getShopById(shopId)
    if (!shop) return null
    return {
      shop,
      serving: q.serving.get(shopId) || null,
      waiting: q.waiting.all(shopId),
    }
  },

  advance(secret) {
    const shop = this.getShopBySecret(secret)
    if (!shop) return null
    return tx(() => {
      const current = q.serving.get(shop.id) || null
      if (current) q.setStatus.run('done', now(), current.id)
      const next = q.waiting.all(shop.id)[0] || null
      if (next) q.callEntry.run(now(), next.id)
      return { shop, done: current, serving: next }
    })
  },

  markNoShow(secret, entryId) {
    const shop = this.getShopBySecret(secret)
    if (!shop) return null
    const entry = q.entryById.get(entryId)
    if (!entry || entry.shop_id !== shop.id) return null
    q.setStatus.run('no_show', now(), entryId)
    return shop
  },

  cancelEntry(entryId, clientToken) {
    const entry = q.entryById.get(entryId)
    if (!entry || entry.client_token !== clientToken) return null
    if (!ACTIVE.includes(entry.status)) return null
    q.setStatus.run('cancelled', now(), entryId)
    return entry
  },

  toggleAccepting(secret) {
    const shop = this.getShopBySecret(secret)
    if (!shop) return null
    q.setAccepting.run(shop.accepting ? 0 : 1, shop.id)
    return this.getShopById(shop.id)
  },
}
