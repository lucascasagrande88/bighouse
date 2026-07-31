// Skins de marca. Los valores de `chimichurri` son exactamente los tokens de
// assets/css/style.css, así que el reel sale con el mismo color y la misma
// tipografía que la web. Si cambia la marca en la web, cambia acá.

export const SKINS = {
  chimichurri: {
    label: 'Chimichurri',
    accent: '#D4FF00',
    accent2: '#FF7A3D',
    bg: '#080808',
    surface: '#0f0f0f',
    surface2: '#161616',
    text: '#f2f2f2',
    muted: '#6e6e6e',
    display: "'Syne', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    displayWeight: 800,
    tracking: '-0.03em',
    onAccent: '#000000',
  },
  lucas: {
    label: 'Lucas',
    accent: '#38BDF8',
    accent2: '#D4FF00',
    bg: '#07090c',
    surface: '#0d1117',
    surface2: '#151b23',
    text: '#f4f7fa',
    muted: '#68727d',
    display: "'Syne', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    displayWeight: 800,
    tracking: '-0.03em',
    onAccent: '#00131c',
  },
  cliente: {
    label: 'Cliente',
    accent: '#FF7A3D',
    accent2: '#A78BFA',
    bg: '#0b0908',
    surface: '#141110',
    surface2: '#1c1817',
    text: '#f6f2f0',
    muted: '#7a7069',
    display: "'Syne', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    displayWeight: 800,
    tracking: '-0.025em',
    onAccent: '#180800',
  },
};

export function getSkin(name) {
  return SKINS[name] || SKINS.chimichurri;
}

/** Aplica el skin como variables CSS sobre el stage. */
export function applySkin(el, name) {
  const s = getSkin(name);
  const map = {
    '--accent': s.accent,
    '--accent2': s.accent2,
    '--bg': s.bg,
    '--surface': s.surface,
    '--surface2': s.surface2,
    '--text': s.text,
    '--muted': s.muted,
    '--display': s.display,
    '--body': s.body,
    '--tracking': s.tracking,
    '--on-accent': s.onAccent,
  };
  for (const [k, v] of Object.entries(map)) el.style.setProperty(k, v);
  return s;
}

/** Escala de intensidad visual: cuánto se mueve todo. 0 = sobrio, 1 = agresivo. */
export function intensityCurve(intensity) {
  const i = Math.max(0, Math.min(1, intensity ?? 0.6));
  return {
    travel: 40 + i * 120, // px de desplazamiento en las entradas
    overshoot: i,          // cuánto se pasa el golpe
    scalePop: 0.04 + i * 0.16,
    drift: i * 8,
    shake: i,
  };
}
