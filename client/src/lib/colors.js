// Car colors. Keys are stored in the DB as-is (Russian, lowercase) and
// translated for display with tColor(). A custom color typed via «Басқа»
// is stored as the user's own text.
export const COLORS = [
  'белый', 'чёрный', 'серый', 'серебристый',
  'синий', 'красный', 'зелёный', 'жёлтый',
  'оранжевый', 'коричневый', 'бежевый', 'фиолетовый',
]

export const COLOR_HEX = {
  'белый': '#f5f5f5', 'чёрный': '#222222', 'серый': '#888888', 'серебристый': '#c0c0c0',
  'синий': '#2563EB', 'красный': '#DC2626', 'зелёный': '#16A34A', 'жёлтый': '#EAB308',
  'оранжевый': '#F97316', 'коричневый': '#78350F', 'бежевый': '#D4A76A', 'фиолетовый': '#7C3AED',
}

const CUSTOM_DOT = 'conic-gradient(#DC2626, #EAB308, #16A34A, #2563EB, #7C3AED, #DC2626)'

// CSS background for the little color dot next to a car.
export function colorDot(color) {
  return COLOR_HEX[color] || CUSTOM_DOT
}

// "алтын  " -> "Алтын"
export function normalizeCustomColor(text) {
  const s = text.trim().replace(/\s+/g, ' ')
  return s ? s[0].toLocaleUpperCase() + s.slice(1) : ''
}
