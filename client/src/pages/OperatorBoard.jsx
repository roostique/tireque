import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { api } from '../lib/api'
import { appUrl } from '../lib/links'
import { useQueueStream } from '../hooks/useQueueStream'
import { useT } from '../i18n'

const COLOR_HEX = {
  'белый': '#f5f5f5', 'чёрный': '#222222', 'серый': '#888888', 'серебристый': '#c0c0c0',
  'синий': '#2563EB', 'красный': '#DC2626', 'зелёный': '#16A34A', 'жёлтый': '#EAB308',
  'оранжевый': '#F97316', 'коричневый': '#78350F', 'бежевый': '#D4A76A', 'фиолетовый': '#7C3AED',
}

export default function OperatorBoard() {
  const { secret } = useParams()
  const { t, tColor } = useT()
  const [shopId, setShopId] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const { queue } = useQueueStream(shopId)
  const shop = queue?.shop

  useEffect(() => {
    let alive = true
    api.getShopBySecret(secret)
      .then(s => { if (!alive) return; if (s) setShopId(s.id); else setNotFound(true) })
      .catch(() => { if (alive) setNotFound(true) })
    return () => { alive = false }
  }, [secret])

  useEffect(() => {
    if (!shop?.code) return
    const url = appUrl(`/q/${shop.code}`)
    QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#111827' } })
      .then(setQrUrl)
      .catch(() => {})
  }, [shop?.code])

  function handleNext() {
    api.advance(secret).catch(() => {})
  }

  function handleNoShow() {
    if (!queue?.serving) return
    const name = `${tColor(queue.serving.car_color)} ${queue.serving.car_model}`
    if (!window.confirm(t('noShowConfirm', name))) return
    api.markNoShow(secret, queue.serving.id).catch(() => {})
  }

  function handleToggle() {
    api.toggleAccepting(secret).catch(() => {})
  }

  function handleCopyLink() {
    const url = appUrl(`/q/${shop.code}`)
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (notFound) {
    return (
      <div className="page-center">
        <div className="card" style={{ textAlign: 'center', gap: 12 }}>
          <p style={{ fontWeight: 600 }}>{t('panelNotFound')}</p>
          <p className="text-muted small">{t('panelNotFoundHint')}</p>
        </div>
      </div>
    )
  }

  if (!queue) {
    return <div className="page-center"><p className="text-muted">{t('loading')}</p></div>
  }

  const hasWaiting = queue.waiting.length > 0
  const canAdvance = hasWaiting || !!queue.serving
  const clientUrl = appUrl(`/q/${shop.code}`)

  return (
    <div className="op-page">
      <header className="op-header">
        <div>
          <h1>{shop.name}</h1>
          <span className="code-badge">{shop.code}</span>
        </div>
        <button
          className={`toggle-btn ${shop.accepting ? 'open' : ''}`}
          onClick={handleToggle}
        >
          {shop.accepting ? t('accepting') : t('notAcceptingToggle')}
        </button>
      </header>

      {queue.serving ? (
        <div className="serving-card">
          <p className="serving-label">{t('servingNow')}</p>
          <div className="serving-car">
            <span
              className="car-color-dot lg"
              style={{ background: COLOR_HEX[queue.serving.car_color] || '#888' }}
            />
            <div>
              <p className="serving-car-name">
                {tColor(queue.serving.car_color)} {queue.serving.car_model}
              </p>
              <p className="serving-plate">{queue.serving.plate}</p>
            </div>
          </div>
          <button className="btn-no-show" onClick={handleNoShow}>{t('noShow')}</button>
        </div>
      ) : (
        <div className="serving-card empty">
          <p className="text-muted">{t('spotFree')}</p>
        </div>
      )}

      <button
        className="btn-next"
        onClick={handleNext}
        disabled={!canAdvance}
      >
        {t('nextBtn')}
      </button>

      <div className="op-queue-list">
        <h2>{t('waitingTitle', queue.waiting.length)}</h2>
        {queue.waiting.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '16px 0', fontSize: '0.95rem' }}>
            {t('queueEmpty')}
          </p>
        ) : (
          <ul className="entry-list">
            {queue.waiting.map((e, i) => (
              <li key={e.id} className="entry-item">
                <span className="entry-pos">{i + 1}</span>
                <span
                  className="car-color-dot"
                  style={{ background: COLOR_HEX[e.car_color] || '#888' }}
                />
                <div className="entry-info">
                  <span className="entry-car">{tColor(e.car_color)} {e.car_model}</span>
                  <span className="entry-plate">{e.plate}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="qr-section">
        <summary>{t('qrSection')}</summary>
        <div className="qr-content">
          <p className="text-muted text-center">
            {t('codeLabel')} <strong>{shop.code}</strong>
          </p>
          {qrUrl && <img src={qrUrl} alt="QR" className="qr-img" />}
          <p className="qr-url">{clientUrl}</p>
          <button className="btn-secondary" onClick={handleCopyLink}>
            {copiedLink ? t('copied') : t('copyLink')}
          </button>
        </div>
      </details>
    </div>
  )
}
