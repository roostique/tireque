import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { api } from '../lib/api'
import { appUrl } from '../lib/links'
import { useT } from '../i18n'

export default function CreateQueue() {
  const navigate = useNavigate()
  const { t } = useT()
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    setError('')
    let shop
    try {
      shop = await api.createShop(name.trim() || t('defaultShopName'))
    } catch {
      setError(t('errNetwork'))
      setCreating(false)
      return
    }
    const clientUrl = appUrl(`/q/${shop.code}?src=qr`)
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
            <h1>Jazylu</h1>
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

          {error && <p className="error">{error}</p>}

          <button className="btn-primary btn-lg" onClick={handleCreate} disabled={creating}>
            {t('createBtn')}
          </button>
        </div>
      </div>
    )
  }

  const adminUrl = appUrl(`/op/${created.admin_secret}`)

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
