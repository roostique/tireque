import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useQueueStream } from '../hooks/useQueueStream'
import { estimateWait } from '../lib/eta'
import { useT } from '../i18n'

const COLORS = [
  'белый', 'чёрный', 'серый', 'серебристый',
  'синий', 'красный', 'зелёный', 'жёлтый',
  'оранжевый', 'коричневый', 'бежевый', 'фиолетовый',
]

export default function JoinQueue() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t, tColor } = useT()
  const [shopId, setShopId] = useState(null)
  const [shopName, setShopName] = useState('')
  const [shopAccepting, setShopAccepting] = useState(true)
  const [avgMin, setAvgMin] = useState(20)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState({ car_color: '', car_model: '', plate: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { queue } = useQueueStream(shopId)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const shop = await api.getShopByCode(code)
        if (!alive) return
        if (!shop) { setNotFound(true); return }

        const myId = api.getMyEntryId(code)
        if (myId) {
          const entry = await api.getEntry(myId)
          if (!alive) return
          if (entry && ['waiting', 'serving'].includes(entry.status)) {
            navigate(`/t/${myId}`, { replace: true })
            return
          }
        }

        setShopId(shop.id)
        setShopName(shop.name)
        setShopAccepting(shop.accepting)
        setAvgMin(shop.avg_service_min)
      } catch {
        if (alive) setNotFound(true)
      }
    })()
    return () => { alive = false }
  }, [code, navigate])

  useEffect(() => {
    if (queue?.shop) {
      setShopAccepting(queue.shop.accepting)
    }
  }, [queue?.shop?.accepting])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.car_color) { setError(t('errColor')); return }
    if (!form.car_model.trim()) { setError(t('errModel')); return }
    if (!form.plate.trim()) { setError(t('errPlate')); return }

    setLoading(true)
    setError('')
    let entry = null
    try {
      entry = await api.joinQueue(code, {
        car_color: form.car_color,
        car_model: form.car_model.trim(),
        plate: form.plate.trim(),
      })
    } catch {}

    if (!entry) {
      setError(t('errJoin'))
      setLoading(false)
      return
    }

    api.setMyEntryId(code, entry.id)
    navigate(`/t/${entry.id}`)
  }

  if (notFound) {
    return (
      <div className="page-center">
        <div className="card" style={{ textAlign: 'center', gap: 12 }}>
          <p style={{ fontWeight: 600 }}>{t('queueNotFound')}</p>
          <p className="text-muted small">{t('queueNotFoundHint')}</p>
        </div>
      </div>
    )
  }

  if (!shopId) return <div className="page-center"><p className="text-muted">{t('loading')}</p></div>

  if (!shopAccepting) {
    return (
      <div className="page-center">
        <div className="card" style={{ textAlign: 'center', gap: 12 }}>
          <h2>{shopName}</h2>
          <p className="text-muted">{t('notAccepting')}</p>
          <p className="text-muted small">{t('notAcceptingHint')}</p>
        </div>
      </div>
    )
  }

  const waitingCount = queue?.waiting?.length ?? 0
  const eta = estimateWait(waitingCount + 1, avgMin)

  return (
    <div className="page">
      <header className="page-header">
        <h1>{shopName}</h1>
        <p className="text-muted small">{t('codeLabel')} {code.toUpperCase()}</p>
      </header>

      <div className="queue-info-banner">
        <span className="queue-count">
          {waitingCount === 0 ? t('queueFree') : t('queueCount', waitingCount)}
        </span>
        <span className="queue-eta">{t('etaMin', eta)}</span>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t('joinTitle')}</h2>

        <div className="field">
          <label>{t('colorLabel')}</label>
          <div className="color-grid">
            {COLORS.map(c => (
              <button
                type="button" key={c}
                className={`color-chip ${form.car_color === c ? 'selected' : ''}`}
                onClick={() => { setForm(f => ({ ...f, car_color: c })); setError('') }}
              >
                {tColor(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="model">{t('modelLabel')}</label>
          <input
            id="model" type="text" placeholder="Toyota Camry"
            value={form.car_model}
            onChange={e => setForm(f => ({ ...f, car_model: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="plate">{t('plateLabel')}</label>
          <input
            id="plate" type="text" placeholder="А 777 АА 01"
            value={form.plate}
            onChange={e => setForm(f => ({ ...f, plate: e.target.value }))}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn-primary btn-lg" disabled={loading}>
          {loading ? t('joining') : t('joinBtn')}
        </button>
      </form>
    </div>
  )
}
