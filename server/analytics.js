// First-party analytics. Stored in our own SQLite (Kazakhstan hosting).
// No IPs, no user agents, no personal data: the visitor is the random
// per-browser token the app already uses.
import { db } from './db.js'

const PAGES = new Set(['home', 'create', 'join', 'ticket', 'operator'])
const TZ = '+5 hours' // Kazakhstan time (UTC+5)
const KEEP_DAYS = 180

const insert = db.prepare(`INSERT INTO events (ts, type, page, visitor, shop_id, src, device, lang)
                           VALUES (?, 'view', ?, ?, ?, ?, ?, ?)`)
const recent = new Map() // visitor|page -> ms, throttles double-fires

export function recordView({ page, visitor, shopId, src, userAgent, lang }) {
  if (!PAGES.has(page)) return false
  visitor = String(visitor || '').slice(0, 64)
  if (!/^[\w-]{8,64}$/.test(visitor)) return false
  const k = visitor + '|' + page + '|' + (shopId || ''), now = Date.now()
  if (now - (recent.get(k) || 0) < 2000) return false
  recent.set(k, now)
  if (recent.size > 5000) for (const [kk, t] of recent) if (now - t > 10000) recent.delete(kk)
  insert.run(
    new Date().toISOString(), page, visitor, shopId || null,
    src === 'qr' ? 'qr' : 'link',
    /Mobi|Android|iPhone|iPad/i.test(String(userAgent || '')) ? 'mobile' : 'desktop',
    lang === 'ru' ? 'ru' : 'kk',
  )
  return true
}

export function pruneOld() {
  db.prepare(`DELETE FROM events WHERE ts < ?`).run(new Date(Date.now() - KEEP_DAYS * 864e5).toISOString())
}

const one = (sql, ...a) => db.prepare(sql).get(...a)
const all = (sql, ...a) => db.prepare(sql).all(...a)
const round = (x, d = 1) => x == null ? null : Math.round(x * 10 ** d) / 10 ** d

// days = 1 means "today" (Kazakhstan time), otherwise the last N days incl. today.
export function stats(days) {
  days = Math.min(Math.max(parseInt(days) || 7, 1), 90)
  // start of the window, in UTC ISO, aligned to local midnight
  const startDay = one(`SELECT date('now', '${TZ}', ?) AS d`, `-${days - 1} days`).d
  const since = new Date(new Date(startDay + 'T00:00:00+05:00').getTime()).toISOString()

  const views = one(`SELECT COUNT(*) n, COUNT(DISTINCT visitor) u FROM events WHERE ts >= ?`, since)
  const ent = one(`
    SELECT COUNT(*) joined,
      SUM(called_at IS NOT NULL) called,
      SUM(status = 'done' OR (status IN ('serving') AND called_at IS NOT NULL)) served,
      SUM(status = 'no_show') no_show,
      SUM(status = 'cancelled') cancelled,
      AVG(CASE WHEN called_at IS NOT NULL THEN (julianday(called_at) - julianday(created_at)) * 1440 END) avg_wait,
      AVG(CASE WHEN status = 'done' AND ended_at IS NOT NULL THEN (julianday(ended_at) - julianday(called_at)) * 1440 END) avg_service
    FROM entries WHERE created_at >= ?`, since)
  const shopsNew = one(`SELECT COUNT(*) n FROM shops WHERE created_at >= ?`, since).n
  const shopsActive = one(`SELECT COUNT(DISTINCT shop_id) n FROM entries WHERE created_at >= ?`, since).n

  // daily series (fill gaps)
  const dv = Object.fromEntries(all(`SELECT date(ts, '${TZ}') d, COUNT(*) n, COUNT(DISTINCT visitor) u FROM events WHERE ts >= ? GROUP BY d`, since).map(r => [r.d, r]))
  const dj = Object.fromEntries(all(`SELECT date(created_at, '${TZ}') d, COUNT(*) n FROM entries WHERE created_at >= ? GROUP BY d`, since).map(r => [r.d, r.n]))
  const daily = []
  for (let i = 0; i < days; i++) {
    const d = one(`SELECT date(?, ?) d`, startDay, `+${i} days`).d
    daily.push({ day: d, views: dv[d]?.n || 0, visitors: dv[d]?.u || 0, joins: dj[d] || 0 })
  }

  const hours = Array(24).fill(0)
  for (const r of all(`SELECT CAST(strftime('%H', created_at, '${TZ}') AS INTEGER) h, COUNT(*) n FROM entries WHERE created_at >= ? GROUP BY h`, since)) hours[r.h] = r.n

  const breakdown = col => Object.fromEntries(all(`SELECT ${col} k, COUNT(DISTINCT visitor) n FROM events WHERE ts >= ? GROUP BY k`, since).map(r => [r.k, r.n]))
  const pages = Object.fromEntries(all(`SELECT page k, COUNT(*) n, COUNT(DISTINCT visitor) u FROM events WHERE ts >= ? GROUP BY k`, since).map(r => [r.k, { views: r.n, visitors: r.u }]))
  const joinVisitors = one(`SELECT COUNT(DISTINCT visitor) n FROM events WHERE ts >= ? AND page = 'join'`, since).n
  const returning = one(`SELECT COUNT(*) n FROM (SELECT visitor FROM events WHERE ts >= ? GROUP BY visitor HAVING COUNT(DISTINCT date(ts, '${TZ}')) > 1)`, since).n

  const shops = all(`
    SELECT s.name, s.code, s.created_at,
      COUNT(e.id) joins,
      SUM(e.status = 'done') served,
      AVG(CASE WHEN e.called_at IS NOT NULL THEN (julianday(e.called_at) - julianday(e.created_at)) * 1440 END) avg_wait,
      MAX(e.created_at) last_join
    FROM shops s LEFT JOIN entries e ON e.shop_id = s.id AND e.created_at >= ?
    GROUP BY s.id
    HAVING joins > 0 OR s.created_at >= ?
    ORDER BY joins DESC, s.created_at DESC LIMIT 100`, since, since)
    .map(s => ({ ...s, avg_wait: round(s.avg_wait) }))

  return {
    days, since: startDay,
    totals: {
      views: views.n, visitors: views.u, returning,
      shopsNew, shopsActive,
      joined: ent.joined || 0, called: ent.called || 0, served: ent.served || 0,
      noShow: ent.no_show || 0, cancelled: ent.cancelled || 0,
      avgWait: round(ent.avg_wait), avgService: round(ent.avg_service),
    },
    funnel: { joinVisitors, joined: ent.joined || 0, called: ent.called || 0, served: ent.served || 0 },
    daily, hours, pages,
    src: breakdown('src'), device: breakdown('device'), lang: breakdown('lang'),
    shops,
  }
}
