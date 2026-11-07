import express from 'express'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { store, publicEntry, publicShop } from './store.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'
// Built client: client/dist in the repo, or public/ in the Plesk package.
const CLIENT_DIST = resolve(process.env.CLIENT_DIST ||
  [join(import.meta.dirname, '..', 'client', 'dist'), join(import.meta.dirname, '..', 'public')].find(existsSync) ||
  join(import.meta.dirname, '..', 'client', 'dist'))

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', true)
app.use(express.json({ limit: '16kb' }))

// ---------- live updates (Server-Sent Events) ----------
const listeners = new Map() // shopId -> Set<res>

function notify(shopId) {
  const set = listeners.get(shopId)
  if (!set) return
  for (const res of set) res.write(`event: update\ndata: {}\n\n`)
}

setInterval(() => {
  for (const set of listeners.values()) for (const res of set) res.write(': ping\n\n')
}, 25_000).unref()

// ---------- helpers ----------
const api = express.Router()

function notFound(res, what = 'not_found') {
  return res.status(404).json({ error: what })
}

function queueView(q) {
  return {
    shop: publicShop(q.shop),
    serving: publicEntry(q.serving),
    waiting: q.waiting.map(publicEntry),
  }
}

// ---------- shops ----------
api.post('/shops', (req, res) => {
  const shop = store.createShop(req.body?.name)
  res.status(201).json(shop) // includes admin_secret: only the creator sees it
})

api.get('/shops/by-code/:code', (req, res) => {
  const shop = store.getShopByCode(req.params.code)
  if (!shop) return notFound(res)
  res.json(publicShop(shop))
})

api.get('/shops/:id/queue', (req, res) => {
  const q = store.getQueue(req.params.id)
  if (!q) return notFound(res)
  res.json(queueView(q))
})

api.get('/shops/:id/stream', (req, res) => {
  const shopId = req.params.id
  if (!store.getShopById(shopId)) return notFound(res)
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 3000\n\n')
  // Lets the client know events really stream through (some proxies buffer them).
  res.write('event: hello\ndata: {}\n\n')
  if (!listeners.has(shopId)) listeners.set(shopId, new Set())
  listeners.get(shopId).add(res)
  req.on('close', () => {
    const set = listeners.get(shopId)
    set?.delete(res)
    if (set?.size === 0) listeners.delete(shopId)
  })
})

api.post('/shops/by-code/:code/join', (req, res) => {
  const { car_color, car_model, plate, client_token } = req.body || {}
  if (!car_color || !car_model?.trim() || !plate?.trim() || !client_token) {
    return res.status(400).json({ error: 'missing_fields' })
  }
  const entry = store.joinQueue(req.params.code, { car_color, car_model, plate }, client_token)
  if (!entry) return res.status(409).json({ error: 'cannot_join' })
  notify(entry.shop_id)
  res.status(201).json(publicEntry(entry))
})

// ---------- operator (secret in URL) ----------
api.get('/op/:secret', (req, res) => {
  const shop = store.getShopBySecret(req.params.secret)
  if (!shop) return notFound(res)
  res.json(shop)
})

api.post('/op/:secret/advance', (req, res) => {
  const r = store.advance(req.params.secret)
  if (!r) return notFound(res)
  notify(r.shop.id)
  res.json({ done: publicEntry(r.done), serving: publicEntry(r.serving) })
})

api.post('/op/:secret/no-show/:entryId', (req, res) => {
  const shop = store.markNoShow(req.params.secret, req.params.entryId)
  if (!shop) return notFound(res)
  notify(shop.id)
  res.json({ ok: true })
})

api.post('/op/:secret/toggle', (req, res) => {
  const shop = store.toggleAccepting(req.params.secret)
  if (!shop) return notFound(res)
  notify(shop.id)
  res.json({ accepting: shop.accepting })
})

// ---------- tickets ----------
api.get('/entries/:id', (req, res) => {
  const e = store.getEntry(req.params.id)
  if (!e) return notFound(res)
  const token = String(req.query.client_token || '')
  res.json({
    ...publicEntry(e),
    is_mine: !!token && token === e.client_token,
    serving: publicEntry(e.serving),
    shop: publicShop(e.shop),
  })
})

api.post('/entries/:id/cancel', (req, res) => {
  const entry = store.cancelEntry(req.params.id, req.body?.client_token)
  if (!entry) return res.status(409).json({ error: 'cannot_cancel' })
  notify(entry.shop_id)
  res.json({ ok: true })
})

api.use((req, res) => notFound(res))
api.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'server_error' })
})

app.use('/api', api)

// ---------- static client (SPA) ----------
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }))
  app.get('*', (req, res) => res.sendFile(join(CLIENT_DIST, 'index.html')))
} else {
  app.get('/', (req, res) => res.type('text').send('Client not built. Run `npm run build` (or use `npm run dev`).'))
}

app.listen(PORT, HOST, () => {
  console.log(`[jazylu] http://localhost:${PORT}`)
})
