import { useState, useEffect } from 'react'
import { mockStore } from '../mock/store'

export function useQueueStream(shopId) {
  const [queue, setQueue] = useState(null)

  useEffect(() => {
    if (!shopId) return
    setQueue(mockStore.getQueue(shopId))
    const unsub = mockStore.subscribe(shopId, () => {
      setQueue(mockStore.getQueue(shopId))
    })
    return unsub
  }, [shopId])

  return { queue }
}

export function useEntryStream(entryId) {
  const [entry, setEntry] = useState(null)

  useEffect(() => {
    if (!entryId) return
    const e = mockStore.getEntry(entryId)
    setEntry(e)
    if (!e) return
    const shopId = e.shop_id
    const unsub = mockStore.subscribe(shopId, () => {
      setEntry(mockStore.getEntry(entryId))
    })
    return unsub
  }, [entryId])

  return entry
}
