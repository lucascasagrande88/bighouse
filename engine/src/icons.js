// Íconos SVG inline. Nada de fuentes de íconos ni CDN: el worker renderiza
// sin red y una request que falla es un frame vacío en el video final.

const P = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const ICONS = {
  check: P('<path d="M20 6 9 17l-5-5"/>'),
  cross: P('<path d="M18 6 6 18M6 6l12 12"/>'),
  arrow: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowUp: P('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  arrowDown: P('<path d="M12 5v14M18 13l-6 6-6-6"/>'),
  bolt: P('<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>'),
  target: P('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  eye: P('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
  cart: P('<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12h11L21 7H6"/>'),
  money: P('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>'),
  chat: P('<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.4-4.6A8 8 0 1 1 21 12Z"/>'),
  phone: P('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  chart: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  trend: P('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  star: P('<path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17.2 6.4 20l1.2-6.1L3 9.6l6.3-.8Z"/>'),
  fire: P('<path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1.5-.6-2.4-.6-2.4S18 11 18 15a6 6 0 0 1-12 0C6 8.5 12 8 12 2Z"/>'),
  lock: P('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  users: P('<circle cx="9" cy="8" r="3.4"/><path d="M2 20c0-3.4 3.1-5.4 7-5.4s7 2 7 5.4"/><path d="M17 8.2a3.4 3.4 0 0 1 0 6.5M18.5 20c0-2.3-.9-3.9-2.3-4.8"/>'),
  store: P('<path d="M3 9 5 4h14l2 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>'),
  camera: P('<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.6"/>'),
  warning: P('<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5"/><circle cx="12" cy="17.4" r="0.9" fill="currentColor"/>'),
  question: P('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><circle cx="12" cy="17" r="0.9" fill="currentColor"/>'),
  dot: P('<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>'),
};

export const ICON_NAMES = Object.keys(ICONS);

export function icon(name) {
  return ICONS[name] || ICONS.dot;
}

/**
 * Elige un ícono por palabra clave. El modelo devuelve un nombre; si devuelve
 * cualquier otra cosa, esto adivina antes de caer al bullet genérico.
 */
const GUESS = [
  [/vent|compr|cobr|plata|precio|pesos|caro/i, 'money'],
  [/client|gente|público|seguidor/i, 'users'],
  [/local|negocio|comercio|tienda/i, 'store'],
  [/consulta|mensaje|whatsapp|escrib/i, 'chat'],
  [/tiempo|hora|día|rápido|demor/i, 'clock'],
  [/crec|sub|mejor|aument/i, 'trend'],
  [/dato|métric|número|estadístic/i, 'chart'],
  [/objetivo|meta|foco/i, 'target'],
  [/ver|mir|atenci|visib/i, 'eye'],
  [/error|problema|mal|nunca|no /i, 'cross'],
  [/list|correct|sí|bien|hac/i, 'check'],
  [/instagram|red|post|reel|conten/i, 'phone'],
  [/energ|rápid|impact/i, 'bolt'],
];

export function guessIcon(text, fallback = 'dot') {
  if (!text) return fallback;
  for (const [re, name] of GUESS) if (re.test(text)) return name;
  return fallback;
}
