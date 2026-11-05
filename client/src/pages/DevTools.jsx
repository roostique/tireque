import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'

function loadData() {
  try {
    return JSON.parse(localStorage.getItem('tq_v1')) || { shops: {}, entries: {} }
  } catch {
    return { shops: {}, entries: {} }
  }
}

function getClientToken() {
  return localStorage.getItem('tq_client_token') || null
}

function getMyEntries() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('tq_my_')) keys.push(k)
  }
  return keys
}

export default function DevTools() {
  const navigate = useNavigate()
  const { t } = useT()
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(n => n + 1)

  const data = loadData()
  const shops = Object.values(data.shops)
  const clientToken = getClientToken()
  const myEntryKeys = getMyEntries()

  function handleSwitchClient() {
    localStorage.removeItem('tq_client_token')
    myEntryKeys.forEach(k => localStorage.removeItem(k))
    refresh()
  }

  function handleDeleteShop(shop) {
    const raw = loadData()
    delete raw.shops[shop.id]
    Object.keys(raw.entries).forEach(id => {
      if (raw.entries[id].shop_id === shop.id) delete raw.entries[id]
    })
    localStorage.setItem('tq_v1', JSON.stringify(raw))
    localStorage.removeItem(`tq_my_${shop.code}`)
    refresh()
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dev Tools</h1>
        <p className="text-muted small">{t('devHint')}</p>
      </header>

      <div className="card" style={{ gap: 12 }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
          {t('clientSession')}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t('tokenLabel')}</p>
            <p className="text-muted small" style={{ fontFamily: 'monospace' }}>
              {clientToken ? clientToken.slice(0, 8) + '…' : '—'}
            </p>
            {myEntryKeys.length > 0 && (
              <p className="text-muted small">{t('activeEntries', myEntryKeys.length)}</p>
            )}
          </div>
          <button
            className="btn-secondary"
            onClick={handleSwitchClient}
            style={{ whiteSpace: 'nowrap' }}
          >
            {t('switchClient')}
          </button>
        </div>
        <p className="text-muted small">{t('switchClientHint')}</p>
      </div>

      <div className="card" style={{ gap: 12 }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
          {t('myQueues', shops.length)}
        </h2>

        {shops.length === 0 ? (
          <p className="text-muted small">{t('noQueues')}</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shops.map(shop => (
              <li key={shop.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{shop.name}</p>
                    <p className="text-muted small" style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                      {shop.code}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteShop(shop)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer' }}
                  >
                    {t('delete')}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '0.875rem', padding: '8px 12px' }}
                    onClick={() => navigate(`/op/${shop.admin_secret}`)}
                  >
                    {t('operatorPanel')}
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '0.875rem', padding: '8px 12px' }}
                    onClick={() => navigate(`/q/${shop.code}`)}
                  >
                    {t('joinQueue')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          className="btn-primary"
          onClick={() => navigate('/op/new')}
        >
          {t('createNew')}
        </button>
      </div>
    </div>
  )
}
