import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Owner-only analytics. Reached via the hidden link /s/<STATS_KEY>; Russian only.
const PERIODS = [[1, 'Сегодня'], [7, '7 дней'], [30, '30 дней']]

const fmtMin = m => m == null ? '—' : m < 60 ? `${Math.round(m)} мин` : `${Math.floor(m / 60)} ч ${Math.round(m % 60)} мин`
const pct = (a, b) => b ? `${Math.round((a / b) * 100)}%` : '—'
const dayLabel = d => { const [, m, dd] = d.split('-'); return `${+dd}.${m}` }

export default function Stats() {
  const { key } = useParams()
  const [days, setDays] = useState(() => { try { return +sessionStorage.getItem('jz_stats_days') || 7 } catch { return 7 } })
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    fetch(`/api/stats/${encodeURIComponent(key)}?days=${days}`)
      .then(r => r.status === 404 ? null : r.ok ? r.json() : Promise.reject())
      .then(d => { if (!alive) return; if (!d) setState('nf'); else { setData(d); setState('ok') } })
      .catch(() => alive && setState('err'))
    try { sessionStorage.setItem('jz_stats_days', String(days)) } catch {}
    return () => { alive = false }
  }, [key, days])

  useEffect(() => { document.title = 'Jazylu — аналитика' }, [])

  if (state === 'nf') return <div className="page-center"><p className="text-muted">Не найдено</p></div>
  if (!data) return <div className="page-center"><p className="text-muted">{state === 'err' ? 'Нет связи с сервером' : 'Загрузка…'}</p></div>

  const T = data.totals
  const maxDaily = Math.max(1, ...data.daily.map(d => d.views))
  const maxJoin = Math.max(1, ...data.daily.map(d => d.joins))
  const maxHour = Math.max(1, ...data.hours)
  const funnel = [
    ['Открыли страницу очереди', data.funnel.joinVisitors],
    ['Встали в очередь', data.funnel.joined],
    ['Вызваны мастером', data.funnel.called],
    ['Обслужены', data.funnel.served],
  ]
  const maxF = Math.max(1, ...funnel.map(f => f[1]))

  return (
    <div className="stats">
      <header className="stats-head">
        <div>
          <h1>Jazylu · аналитика</h1>
          <p className="text-muted small">с {dayLabel(data.since)} · время Казахстана</p>
        </div>
        <div className="seg">
          {PERIODS.map(([d, label]) => (
            <button key={d} className={d === days ? 'on' : ''} onClick={() => setDays(d)}>{label}</button>
          ))}
        </div>
      </header>

      <section className="tiles">
        <Tile label="Посещения" value={T.views} />
        <Tile label="Уникальные посетители" value={T.visitors} sub={T.returning ? `${T.returning} вернулись` : null} />
        <Tile label="Встали в очередь" value={T.joined} />
        <Tile label="Обслужено" value={T.served} />
        <Tile label="Среднее ожидание" value={fmtMin(T.avgWait)} />
        <Tile label="Среднее обслуживание" value={fmtMin(T.avgService)} />
        <Tile label="Не приехали" value={pct(T.noShow, T.called)} sub={`${T.noShow} из ${T.called} вызванных`} />
        <Tile label="Вышли из очереди" value={pct(T.cancelled, T.joined)} sub={`${T.cancelled} из ${T.joined}`} />
        <Tile label="Новые шиномонтажи" value={T.shopsNew} />
        <Tile label="Активные шиномонтажи" value={T.shopsActive} sub="были клиенты" />
      </section>

      {data.days > 1 && (
        <Card title="По дням">
          <div className="legend"><i className="c1" /> посещения <i className="c2" /> в очередь</div>
          <div className="daily">
            {data.daily.map(d => (
              <div key={d.day} className="dcol" title={`${dayLabel(d.day)}: ${d.views} посещений, ${d.visitors} уник., ${d.joins} в очередь`}>
                <div className="dbars">
                  <span className="b1" style={{ height: `${(d.views / maxDaily) * 100}%` }} />
                  <span className="b2" style={{ height: `${(d.joins / Math.max(maxDaily, maxJoin)) * 100}%` }} />
                </div>
                <span className="dlab">{data.days <= 7 || +d.day.slice(8) % 5 === 1 ? dayLabel(d.day) : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Воронка">
        {funnel.map(([label, n], i) => (
          <div key={label} className="frow">
            <div className="ftext"><span>{label}</span><b>{n}{i > 0 && funnel[i - 1][1] ? <em> · {pct(n, funnel[i - 1][1])}</em> : null}</b></div>
            <div className="fbar"><span style={{ width: `${(n / maxF) * 100}%` }} /></div>
          </div>
        ))}
      </Card>

      <Card title="Пиковые часы (встали в очередь)">
        <div className="hours">
          {data.hours.map((n, h) => (
            <div key={h} className="hcol" title={`${h}:00 — ${n}`}>
              <span style={{ height: `${(n / maxHour) * 100}%` }} />
              <i>{h % 3 === 0 ? h : ''}</i>
            </div>
          ))}
        </div>
      </Card>

      <div className="split">
        <Card title="Откуда пришли"><Breakdown map={data.src} names={{ qr: 'QR-код', link: 'Ссылка' }} /></Card>
        <Card title="Устройства"><Breakdown map={data.device} names={{ mobile: 'Телефон', desktop: 'Компьютер' }} /></Card>
        <Card title="Язык"><Breakdown map={data.lang} names={{ kk: 'Қазақша', ru: 'Русский' }} /></Card>
      </div>

      <Card title={`Шиномонтажи (${data.shops.length})`}>
        {data.shops.length === 0 ? <p className="text-muted small">За этот период пусто</p> : (
          <div className="shops">
            <div className="srow shead"><span>Название</span><span>В очередь</span><span>Обслуж.</span><span>Ожидание</span></div>
            {data.shops.map(s => (
              <div key={s.code} className="srow">
                <span><b>{s.name}</b><em>{s.code}</em></span>
                <span>{s.joins}</span><span>{s.served || 0}</span><span>{fmtMin(s.avg_wait)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-muted small stats-foot">
        Анонимно: без IP, cookies и персональных данных. Посетитель — случайный ID браузера. Просмотры хранятся 180 дней.
      </p>
    </div>
  )
}

function Tile({ label, value, sub }) {
  return <div className="tile"><span className="tl">{label}</span><b className="tv">{value}</b>{sub && <span className="ts">{sub}</span>}</div>
}

function Card({ title, children }) {
  return <section className="scard"><h2>{title}</h2>{children}</section>
}

function Breakdown({ map, names }) {
  const total = Object.values(map).reduce((a, b) => a + b, 0)
  const keys = Object.keys(names)
  if (!total) return <p className="text-muted small">Нет данных</p>
  return (
    <div className="bd">
      {keys.map(k => (
        <div key={k} className="bdrow">
          <span>{names[k]}</span>
          <div className="fbar"><span style={{ width: `${((map[k] || 0) / total) * 100}%` }} /></div>
          <b>{pct(map[k] || 0, total)}</b>
        </div>
      ))}
    </div>
  )
}
