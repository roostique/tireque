import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEntryStream } from '../hooks/useQueueStream'
import { api } from '../lib/api'
import { estimateWait } from '../lib/eta'
import { useT } from '../i18n'
import { colorDot } from '../lib/colors'


export default function TicketStatus() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, tColor } = useT()
  const entry = useEntryStream(id)
  const prevStatusRef = useRef(null)
  const prevPositionRef = useRef(null)

  useEffect(() => {
    if (!entry) return
    const prevStatus = prevStatusRef.current
    const prevPos = prevPositionRef.current

    if (entry.status === 'waiting' && entry.position === 1 && prevPos !== null && prevPos > 1) {
      playBeep()
    }
    if (entry.status === 'serving' && prevStatus !== 'serving' && prevStatus !== null) {
      playBeep()
    }

    prevStatusRef.current = entry.status
    prevPositionRef.current = entry.position
  }, [entry?.status, entry?.position])

  async function handleCancel() {
    if (!window.confirm(t('cancelConfirm'))) return
    const success = await api.cancelEntry(id)
    if (success && entry?.shop?.code) {
      api.clearMyEntryId(entry.shop.code)
    }
    navigate('/', { replace: true })
  }

  if (entry === undefined) {
    return <div className="page-center"><p className="text-muted">{t('loading')}</p></div>
  }

  if (!entry) {
    return (
      <div className="page-center">
        <div className="card" style={{ textAlign: 'center', gap: 12 }}>
          <p style={{ fontWeight: 600 }}>{t('ticketNotFound')}</p>
          <p className="text-muted small">{t('ticketNotFoundHint')}</p>
        </div>
      </div>
    )
  }

  const shop = entry.shop
  const isMyTicket = entry.is_mine
  const canCancel = isMyTicket && ['waiting', 'serving'].includes(entry.status)
  const avg = shop?.avg_service_min || 20

  return (
    <div className="page">
      <header className="page-header">
        <h1>{shop?.name || t('defaultShopName')}</h1>
        <p className="text-muted small">{t('codeLabel')} {shop?.code || '—'}</p>
      </header>

      <div className={`status-card status-${entry.status}`}>
        <div className="car-label">
          <span
            className="car-color-dot"
            style={{ background: colorDot(entry.car_color) }}
          />
          <span className="car-name">{tColor(entry.car_color)} {entry.car_model}</span>
        </div>
        <div className="plate-badge">{entry.plate}</div>

        {entry.status === 'waiting' && entry.position === 1 && (
          <>
            <div className="status-message warn">{t('youreNext')}</div>
            <div className="eta-line">{t('etaMin', estimateWait(1, avg))}</div>
          </>
        )}

        {entry.status === 'waiting' && entry.position > 1 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="position-num">{entry.position - 1}</span>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                {t('carsAhead', entry.position - 1)}
              </span>
            </div>
            <div className="eta-line">{t('etaMin', estimateWait(entry.position, avg))}</div>
          </>
        )}

        {entry.status === 'serving' && (
          <div className="status-message success">{t('driveIn')}</div>
        )}

        {entry.status === 'done' && (
          <div className="status-message muted">{t('done')}</div>
        )}

        {entry.status === 'cancelled' && (
          <div className="status-message muted">{t('cancelledStatus')}</div>
        )}

        {entry.status === 'no_show' && (
          <div className="status-message danger">{t('noShowStatus')}</div>
        )}
      </div>

      {entry.serving && entry.status === 'waiting' && (
        <div className="now-serving-card">
          <span className="text-muted small">{t('nowServing')}</span>
          <div className="car-info">
            <span
              className="car-color-dot"
              style={{ background: colorDot(entry.serving.car_color) }}
            />
            <span>{tColor(entry.serving.car_color)} {entry.serving.car_model}</span>
          </div>
        </div>
      )}

      {canCancel && (
        <div className="actions">
          <button className="btn-danger" onClick={handleCancel}>{t('cancelTicket')}</button>
        </div>
      )}

      {['waiting', 'serving'].includes(entry.status) && (
        <p className="ticket-hint">
          {t('keepPageOpen')}<br />
          {t('willBeep')}
        </p>
      )}
    </div>
  )
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.7)
    setTimeout(() => ctx.close(), 800)
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
  } catch {}
}
