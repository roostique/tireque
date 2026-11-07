import { createContext, useContext, useState } from 'react'

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return few
  return many
}

const ru = {
  loading: 'Загрузка…',

  colorLabel: 'Цвет машины',
  modelLabel: 'Марка машины',
  plateLabel: 'Номер машины',
  platePh: '777 ABA 02',
  otherColor: 'Другой',
  otherColorPh: 'Какой цвет?',
  joinTitle: 'Встать в очередь',
  joinBtn: 'Встать в очередь',
  joining: 'Секунду…',
  queueNotFound: 'Такой очереди нет',
  queueNotFoundHint: 'Проверьте код или спросите у мастера',
  notAccepting: 'Сейчас приём закрыт',
  notAcceptingHint: 'Загляните чуть позже',
  queueFree: 'Очереди нет — подъезжайте',
  queueCount: (n) => `В очереди: ${n} ${plural(n, 'машина', 'машины', 'машин')}`,
  etaMin: (n) => `≈ ${n} мин`,
  codeLabel: 'Код:',
  errColor: 'Выберите цвет машины',
  errModel: 'Напишите марку',
  errPlate: 'Напишите номер',
  errJoin: 'Не получилось встать в очередь. Возможно, приём сейчас закрыт.',

  ticketNotFound: 'Талон не найден',
  ticketNotFoundHint: 'Возможно, вы вышли из очереди',
  youreNext: 'Вы следующий — далеко не уходите',
  driveIn: 'Заезжайте!',
  done: 'Готово! Счастливого пути',
  cancelledStatus: 'Вы вышли из очереди',
  noShowStatus: 'Вас вызвали, но вы не подъехали',
  carsAhead: (n) => `${n} ${plural(n, 'машина', 'машины', 'машин')} перед вами`,
  nowServing: 'Сейчас в работе',
  cancelTicket: 'Выйти из очереди',
  cancelConfirm: 'Выйти из очереди?',
  keepPageOpen: 'Не закрывайте страницу —',
  willBeep: 'телефон пикнет, когда подойдёт очередь.',

  panelNotFound: 'Панель не найдена',
  panelNotFoundHint: 'Проверьте ссылку или откройте новую очередь',
  servingNow: 'Сейчас в работе',
  spotFree: 'Бокс свободен',
  nextBtn: 'Следующий',
  noShow: 'Не приехал',
  noShowConfirm: (name) => `Отметить, что ${name} не приехал?`,
  accepting: 'Приём открыт',
  notAcceptingToggle: 'Приём закрыт',
  waitingTitle: (n) => n > 0 ? `В очереди (${n})` : 'В очереди',
  queueEmpty: 'Пока никого',
  qrSection: 'QR-код и ссылка для клиентов',
  copyLink: 'Скопировать ссылку',
  copied: '✓ Скопировано',

  appDesc: 'Электронная очередь для шиномонтажа',
  nameLabel: 'Название шиномонтажа',
  nameOptional: '(необязательно)',
  namePlaceholder: 'Саня шиномонтаж',
  defaultShopName: 'Шиномонтаж',
  createBtn: 'Открыть очередь',
  createdTitle: 'Очередь открыта!',
  codeHint: 'Код очереди — скажите клиентам',
  codeOrQr: 'или дайте отсканировать QR, или скиньте ссылку',
  printHint: 'Распечатайте и повесьте на видное место',
  adminLinkLabel: 'Ваша ссылка управления:',
  adminLinkWarning: '⚠ Сохраните эту ссылку прямо сейчас — только по ней вы управляете очередью.',
  openPanel: 'Открыть панель управления →',

  errNetwork: 'Похоже, пропал интернет. Попробуйте ещё раз.',

  colorNames: {
    'белый': 'Белый', 'чёрный': 'Чёрный', 'серый': 'Серый', 'серебристый': 'Серебристый',
    'синий': 'Синий', 'красный': 'Красный', 'зелёный': 'Зелёный', 'жёлтый': 'Жёлтый',
    'оранжевый': 'Оранжевый', 'коричневый': 'Коричневый', 'бежевый': 'Бежевый', 'фиолетовый': 'Фиолетовый',
  },
}

const kk = {
  loading: 'Жүктеліп жатыр…',

  colorLabel: 'Көліктің түсі',
  modelLabel: 'Көлік маркасы',
  plateLabel: 'Көлік нөмірі',
  platePh: '777 ABA 02',
  otherColor: 'Басқа',
  otherColorPh: 'Қандай түс?',
  joinTitle: 'Кезекке жазылу',
  joinBtn: 'Кезекке жазылу',
  joining: 'Бір секунд…',
  queueNotFound: 'Мұндай кезек жоқ',
  queueNotFoundHint: 'Кодты тексеріңіз немесе шеберден сұраңыз',
  notAccepting: 'Қазір қабылдау жабық',
  notAcceptingHint: 'Сәлден кейін қайта кіріп көріңіз',
  queueFree: 'Кезек жоқ — келе беріңіз',
  queueCount: (n) => `Кезекте: ${n} көлік`,
  etaMin: (n) => `≈ ${n} мин`,
  codeLabel: 'Код:',
  errColor: 'Көліктің түсін таңдаңыз',
  errModel: 'Маркасын жазыңыз',
  errPlate: 'Нөмірін жазыңыз',
  errJoin: 'Кезекке жазыла алмадық. Мүмкін, қабылдау қазір жабық.',

  ticketNotFound: 'Талон табылмады',
  ticketNotFoundHint: 'Мүмкін, кезектен шығып кеткен шығарсыз',
  youreNext: 'Келесі сізсіз — алысқа кетпеңіз',
  driveIn: 'Кіре беріңіз!',
  done: 'Дайын! Жолыңыз болсын',
  cancelledStatus: 'Сіз кезектен шықтыңыз',
  noShowStatus: 'Шақырдық, бірақ келмедіңіз',
  carsAhead: (n) => `Алдыңызда ${n} көлік`,
  nowServing: 'Қазір жасалып жатыр',
  cancelTicket: 'Кезектен шығу',
  cancelConfirm: 'Кезектен шығасыз ба?',
  keepPageOpen: 'Бұл бетті жаппаңыз —',
  willBeep: 'кезегіңіз келгенде телефон дыбыс береді.',

  panelNotFound: 'Панель табылмады',
  panelNotFoundHint: 'Сілтемені тексеріңіз немесе жаңа кезек ашыңыз',
  servingNow: 'Қазір жасалып жатыр',
  spotFree: 'Бокс бос',
  nextBtn: 'Келесі',
  noShow: 'Келмеді',
  noShowConfirm: (name) => `${name} келмеді деп белгілейміз бе?`,
  accepting: 'Қабылдау ашық',
  notAcceptingToggle: 'Қабылдау жабық',
  waitingTitle: (n) => n > 0 ? `Кезекте (${n})` : 'Кезекте',
  queueEmpty: 'Әзірге ешкім жоқ',
  qrSection: 'QR код және клиентке сілтеме',
  copyLink: 'Сілтемені көшіру',
  copied: '✓ Көшірілді',

  appDesc: 'Шиномонтажға арналған электрондық кезек',
  nameLabel: 'Шиномонтаждың аты',
  nameOptional: '(міндетті емес)',
  namePlaceholder: 'Бека шиномонтажы',
  defaultShopName: 'Шиномонтаж',
  createBtn: 'Кезек ашу',
  createdTitle: 'Кезек ашылды!',
  codeHint: 'Кезек коды — клиенттерге айтыңыз',
  codeOrQr: 'немесе QR-ды сканерлетіңіз, не сілтемені жіберіңіз',
  printHint: 'Басып шығарып, көрінетін жерге іліп қойыңыз',
  adminLinkLabel: 'Басқару сілтемеңіз:',
  adminLinkWarning: '⚠ Бұл сілтемені қазір сақтап қойыңыз — кезекті тек осы арқылы басқарасыз.',
  openPanel: 'Басқару панелін ашу →',

  errNetwork: 'Интернет жоқ сияқты. Қайта көріңізші.',

  colorNames: {
    'белый': 'Ақ', 'чёрный': 'Қара', 'серый': 'Сұр', 'серебристый': 'Күміс',
    'синий': 'Көк', 'красный': 'Қызыл', 'зелёный': 'Жасыл', 'жёлтый': 'Сары',
    'оранжевый': 'Қызғылт сары', 'коричневый': 'Қоңыр', 'бежевый': 'Беж', 'фиолетовый': 'Күлгін',
  },
}

const translations = { ru, kk }

const I18nContext = createContext({ lang: 'kk', setLang: () => {} })

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('tq_lang') || 'kk')

  function changeLang(l) {
    setLang(l)
    localStorage.setItem('tq_lang', l)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  const { lang, setLang } = useContext(I18nContext)
  const dict = translations[lang] || translations.kk

  function t(key, arg) {
    const val = dict[key] ?? translations.kk[key] ?? key
    if (typeof val === 'function') return val(arg)
    return val
  }

  function tColor(ruKey) {
    return dict.colorNames?.[ruKey] ?? ruKey
  }

  return { t, tColor, lang, setLang }
}
