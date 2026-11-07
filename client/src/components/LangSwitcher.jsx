import { useState, useEffect, useRef } from 'react'
import { Globe } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useT } from '../i18n'

const LANGS = [
  { code: 'kk', label: 'Қазақша' },
  { code: 'ru', label: 'Русский' },
]

export default function LangSwitcher() {
  const { pathname } = useLocation()
  return pathname.startsWith('/s/') ? null : <LangMenu />
}

function LangMenu() {
  const { lang, setLang } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  return (
    <div ref={ref} style={{ position: 'fixed', top: 14, right: 16, zIndex: 200 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '8px 14px',
          fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
          color: 'var(--text)', cursor: 'pointer',
        }}
      >
        <Globe size={15} strokeWidth={1.75} />
        {current.label}
        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', marginLeft: 1 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 8, overflow: 'hidden', minWidth: 130,
        }}>
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '11px 16px',
                background: lang === l.code ? 'var(--bg)' : 'none',
                border: 'none',
                borderBottom: i < LANGS.length - 1 ? '1px solid var(--border)' : 'none',
                fontFamily: 'inherit', fontSize: '0.9rem',
                color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              {l.label}
              {lang === l.code && (
                <span style={{ color: 'var(--brand)', fontSize: '0.85rem', fontWeight: 700 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
