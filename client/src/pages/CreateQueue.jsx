import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { mockStore } from '../mock/store'
import { useT } from '../i18n'

export default function CreateQueue() {
  const navigate = useNavigate()
  const { t } = useT()
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    const shop = mockStore.createShop(name.trim() || 'Шиномонтаж')
    const base = window.location.href.split('#')[0]
    const clientUrl = `${base}#/q/${shop.code}`
    try {
      const url = await QRCode.toDataURL(clientUrl, { width: 300, margin: 2, color: { dark: '#111827' } })
      setQrUrl(url)
    } catch {}
    setCreated(shop)
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!created) {
    return (
      <div className="page-center-v">
        <div className="card">
          <div className="logo-area">
            <h1>TireQueue</h1>
            <p className="text-muted">{t('appDesc')}</p>
          </div>

          <div className="field">
            <label htmlFor="name">
              {t('nameLabel')} <span className="text-muted">{t('nameOptional')}</span>
            </label>
            <input
              id="name" type="text" placeholder={t('namePlaceholder')}
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <button className="btn-primary btn-lg" onClick={handleCreate}>
            {t('createBtn')}
          </button>
        </div>
      </div>
    )
  }

  const base = window.location.href.split('#')[0]
  const clientUrl = `${base}#/q/${created.code}`
  const adminUrl = `${base}#/op/${created.admin_secret}`

  return (
    <div className="page">
      <div className="card" style={{ textAlign: 'center', gap: 20 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t('createdTitle')}</h2>

        <div className="code-display">
          <span className="text-muted small">{t('codeHint')}</span>
          <span className="big-code">{created.code}</span>
          <span className="text-muted small">{t('codeOrQr')}</span>
        </div>

        {qrUrl && (
          <div className="qr-block">
            <img src={qrUrl} alt="QR code" className="qr-img" />
            <p className="text-muted small">{t('printHint')}</p>
          </div>
        )}

        <div className="admin-link-block" style={{ textAlign: 'left' }}>
          <p className="text-muted small" style={{ fontWeight: 600 }}>{t('adminLinkLabel')}</p>
          <div className="link-row">
            <span className="link-text">{adminUrl}</span>
            <button className="btn-copy" onClick={() => handleCopy(adminUrl)}>
              {copied ? t('copied') : t('copyLink')}
            </button>
          </div>
          <p className="warning-text">{t('adminLinkWarning')}</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate(`/op/${created.admin_secret}`)}
        >
          {t('openPanel')}
        </button>
      </div>
    </div>
  )
}
