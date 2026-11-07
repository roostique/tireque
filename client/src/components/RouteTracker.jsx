import { useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { trackView } from '../lib/analytics'

// Maps the current URL to a page name. Raw paths are never sent:
// /op/<secret> must not end up in analytics.
const ROUTES = [
  ['/op/new', 'create'],
  ['/op/:secret', 'operator'],
  ['/q/:code', 'join'],
  ['/t/:entry', 'ticket'],
]

export default function RouteTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    for (const [pattern, page] of ROUTES) {
      const m = matchPath(pattern, pathname)
      if (m) { trackView(page, m.params); return }
    }
  }, [pathname])
  return null
}
