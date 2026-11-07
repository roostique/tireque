import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export function useQueueStream(shopId) {
  const [queue, setQueue] = useState(null)

  useEffect(() => {
    if (!shopId) return
    let alive = true
    const load = () => api.getQueue(shopId).then(q => { if (alive) setQueue(q) }).catch(() => {})
    load()
    const unsub = api.subscribe(shopId, load)
    return () => { alive = false; unsub() }
  }, [shopId])

  return { queue }
}

// Returns undefined while loading, null if not found, or the entry.
export function useEntryStream(entryId) {
  const [entry, setEntry] = useState(undefined)

  useEffect(() => {
    if (!entryId) return
    let alive = true
    let unsub = () => {}
    const load = () => api.getEntry(entryId).then(e => { if (alive) setEntry(e) }).catch(() => {})
    api.getEntry(entryId).then(e => {
      if (!alive) return
      setEntry(e)
      if (e) unsub = api.subscribe(e.shop_id, load)
    }).catch(() => { if (alive) setEntry(null) })
    return () => { alive = false; unsub() }
  }, [entryId])

  return entry
}
