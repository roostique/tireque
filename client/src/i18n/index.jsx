import { createContext, useContext, useState } from 'react'

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return few
  return many
}

const ru = {
  loading: 'Загрузка…',

  colorLabel: 'Цвет автомобиля',
  modelLabel: 'Марка и модель',
  plateLabel: 'Гос. номер',
  joinTitle: 'Встать в очередь',
  joinBtn: 'Встать в очередь',
  joining: 'Секунду…',
  queueNotFound: 'Очередь не найдена',
  queueNotFoundHint: 'Проверьте код или попросите у сотрудника',
  notAccepting: 'Запись временно приостановлена',
  notAcceptingHint: 'Попробуйте чуть позже или подойдите к сотруднику',
  queueFree: 'Очередь свободна',
  queueCount: (n) => `В очереди: ${n} ${plural(n, 'машина', 'машины', 'машин')}`,
  etaMin: (n) => `≈ ${n} мин`,
  codeLabel: 'Код:',
  errColor: 'Выберите цвет автомобиля',
  errModel: 'Укажите марку и модель',
  errPlate: 'Укажите гос. номер',
  errJoin: 'Не удалось встать в очередь. Возможно, приём приостановлен.',

  ticketNotFound: 'Талон не найден',
  ticketNotFoundHint: 'Возможно, запись была отменена',
  youreNext: 'Вы следующие — будьте рядом',
  driveIn: 'Заезжайте!',
  done: 'Обслуживание завершено',
  cancelledStatus: 'Запись отменена',
  noShowStatus: 'Вы не явились',
  carsAhead: (n) => `${n} ${plural(n, 'машина', 'машины', 'машин')} перед вами`,
  nowServing: 'Сейчас обслуживается',
  cancelTicket: 'Отменить запись',
  cancelConfirm: 'Отменить запись?',
  keepPageOpen: 'Держите страницу открытой.',
  willBeep: 'Прозвучит сигнал, когда подойдёт ваша очередь.',

  panelNotFound: 'Панель не найдена',
  panelNotFoundHint: 'Проверьте ссылку или создайте новую очередь',
  servingNow: 'Сейчас обслуживается',
  spotFree: 'Пост свободен',
  nextBtn: 'Следующий',
  noShow: 'Не явился',
  noShowConfirm: (name) => `Отметить "${name}" как не явившегося?`,
  accepting: 'Приём открыт',
  notAcceptingToggle: 'Приём закрыт',
  waitingTitle: (n) => n > 0 ? `Ожидают (${n})` : 'Ожидают',
  queueEmpty: 'Очередь пуста',
  qrSection: 'QR-код и ссылка для клиентов',
  copyLink: 'Скопировать ссылку',
  copied: '✓ Скопировано',

  appDesc: 'Электронная очередь для шиномонтажа',
  nameLabel: 'Название точки',
  nameOptional: '(необязательно)',
  namePlaceholder: 'Саня шиномонтаж',
  createBtn: 'Создать очередь',
  createdTitle: 'Очередь создана',
  codeHint: 'Код очереди — скажите клиентам',
  codeOrQr: 'или отправьте ссылку / дайте отсканировать QR',
  printHint: 'Распечатайте и наклейте на стену / стойку',
  adminLinkLabel: 'Ваша ссылка управления:',
  adminLinkWarning: '⚠ Сохраните ссылку прямо сейчас — это единственный способ управлять очередью.',
  openPanel: 'Открыть панель управления →',

  errNetwork: 'Нет связи с сервером. Попробуйте ещё раз.',

  colorNames: {
    'белый': 'белый', 'чёрный': 'чёрный', 'серый': 'серый', 'серебристый': 'серебристый',
    'синий': 'синий', 'красный': 'красный', 'зелёный': 'зелёный', 'жёлтый': 'жёлтый',
    'оранжевый': 'оранжевый', 'коричневый': 'коричневый', 'бежевый': 'бежевый', 'фиолетовый': 'фиолетовый',
  },
}

const kk = {
  loading: 'Жүктелуде…',

  colorLabel: 'Көліктің түсі',
  modelLabel: 'Маркасы мен моделі',
  plateLabel: 'Мемлекеттік нөмір',
  joinTitle: 'Кезекке тұру',
  joinBtn: 'Кезекке тұру',
  joining: 'Күте тұрыңыз…',
  queueNotFound: 'Кезек табылмады',
  queueNotFoundHint: 'Кодты тексеріңіз немесе қызметкерден сұраңыз',
  notAccepting: 'Қабылдау уақытша тоқтатылды',
  notAcceptingHint: 'Кейінірек көріңіз немесе қызметкерге хабарласыңыз',
  queueFree: 'Кезек бос',
  queueCount: (n) => `Кезекте: ${n} көлік`,
  etaMin: (n) => `≈ ${n} мин`,
  codeLabel: 'Код:',
  errColor: 'Автомобиль түсін таңдаңыз',
  errModel: 'Маркасы мен моделін көрсетіңіз',
  errPlate: 'Мемлекеттік нөмірді көрсетіңіз',
  errJoin: 'Кезекке тұру мүмкін болмады. Мүмкін, қабылдау тоқтатылған.',

  ticketNotFound: 'Талон табылмады',
  ticketNotFoundHint: 'Жазылым болдырылған болуы мүмкін',
  youreNext: 'Сіз келесісіз — жақын жерде болыңыз',
  driveIn: 'Кіріңіз!',
  done: 'Қызмет аяқталды',
  cancelledStatus: 'Жазылым болдырылмады',
  noShowStatus: 'Сіз келмедіңіз',
  carsAhead: (n) => `${n} көлік сізден алда`,
  nowServing: 'Қазір қызмет көрсетілуде',
  cancelTicket: 'Жазылымды болдырмау',
  cancelConfirm: 'Жазылымды болдырмау?',
  keepPageOpen: 'Бетті ашық ұстаңыз.',
  willBeep: 'Кезегіңіз келгенде дыбыс береді.',

  panelNotFound: 'Панель табылмады',
  panelNotFoundHint: 'Сілтемені тексеріңіз немесе жаңа кезек жасаңыз',
  servingNow: 'Қазір қызмет көрсетілуде',
  spotFree: 'Орын бос',
  nextBtn: 'Келесі',
  noShow: 'Келмеді',
  noShowConfirm: (name) => `"${name}" келмеді деп белгілеу?`,
  accepting: 'Қабылдау ашық',
  notAcceptingToggle: 'Қабылдау жабық',
  waitingTitle: (n) => n > 0 ? `Күтуде (${n})` : 'Күтуде',
  queueEmpty: 'Кезек бос',
  qrSection: 'QR коды мен клиент сілтемесі',
  copyLink: 'Сілтемені көшіру',
  copied: '✓ Көшірілді',

  appDesc: 'Шиномонтаж үшін электрондық кезек',
  nameLabel: 'Нүктенің атауы',
  nameOptional: '(міндетті емес)',
  namePlaceholder: 'Бека шиномонтажы',
  createBtn: 'Кезек жасау',
  createdTitle: 'Кезек жасалды',
  codeHint: 'Кезек коды — клиенттерге айтыңыз',
  codeOrQr: 'немесе сілтеме жіберіңіз / QR сканерлетіңіз',
  printHint: 'Басып шығарып, қабырғаға / стендке жапсырыңыз',
  adminLinkLabel: 'Басқару сілтемеңіз:',
  adminLinkWarning: '⚠ Сілтемені қазір сақтаңыз — кезекті басқарудың жалғыз жолы.',
  openPanel: 'Басқару панелін ашу →',

  errNetwork: 'Сервермен байланыс жоқ. Қайталап көріңіз.',

  colorNames: {
    'Белый': 'Ақ', 'Чёрный': 'Қара', 'Серый': 'Сұр', 'Серебристый': 'Күміс',
    'Синий': 'Көк', 'Красный': 'Қызыл', 'Зелёный': 'Жасыл', 'Жёлтый': 'Сары',
    'Оранжевый': 'Қызғылт ары', 'Коричневый': 'Қоңыр', 'Бежевый': 'Бежевый', 'Фиолетовый': 'Күлгін',
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
