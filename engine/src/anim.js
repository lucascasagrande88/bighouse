// Primitivas de animación deterministas.
//
// Regla del motor: nada de animaciones CSS, nada de estado acumulado.
// Todo valor animado es una función pura del tiempo local de la escena.
// Eso es lo que permite que el worker renderice el frame 372 y obtenga
// exactamente lo mismo que el preview del navegador en el segundo 12,4.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix = (a, b, t) => lerp(a, b, clamp(t));

/** Progreso normalizado de una ventana [from, to] dentro del tiempo local. */
export function win(local, from, to) {
  if (to <= from) return local >= to ? 1 : 0;
  return clamp((local - from) / (to - from));
}

export const ease = {
  linear: (t) => t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuad: (t) => t * t,
  // Overshoot corto, para golpes tipográficos.
  outBack: (t) => {
    const c = 1.7;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  // Rebote amortiguado en forma cerrada: determinista, sin simulación.
  outSpring: (t) => {
    if (t >= 1) return 1;
    return 1 - Math.pow(2, -9 * t) * Math.cos(t * 13.5);
  },
  // Golpe: sube rápido, se pasa, vuelve. Devuelve 0→1→0.
  punch: (t) => Math.sin(clamp(t) * Math.PI) * (1 - clamp(t) * 0.35),
};

/**
 * Ventana temporal para el elemento `i` de una lista de `n`.
 * Devuelve el progreso 0..1 de su entrada.
 */
export function stagger(local, i, n, { start = 0, step = 0.12, dur = 0.5, speed = 1 } = {}) {
  const s = start + (i * step) / speed;
  return win(local, s, s + dur / speed);
}

/** Entrada/salida estándar de escena: 0 fuera, 1 en pantalla plena. */
export function envelope(local, dur, { inDur = 0.35, outDur = 0.28 } = {}) {
  const enter = win(local, 0, inDur);
  const exit = 1 - win(local, dur - outDur, dur);
  return Math.min(ease.outCubic(enter), ease.inQuad(exit) === 0 ? 0 : exit);
}

/** Interpolación de un número con formato (para count-up de estadísticas). */
export function countTo(value, progress, decimals = 0) {
  const n = value * ease.outExpo(clamp(progress));
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}

/** Movimiento sutil constante: evita que una escena quieta se sienta muerta. */
export function drift(local, amount = 6, period = 8) {
  return Math.sin((local / period) * Math.PI * 2) * amount;
}

/** Escala de "respiración" lenta para fondos e imágenes (efecto Ken Burns). */
export function kenBurns(local, dur, from = 1.04, to = 1.12) {
  return mix(from, to, dur > 0 ? local / dur : 0);
}

export function px(v) {
  return `${Math.round(v * 1000) / 1000}px`;
}

export function transform({ x = 0, y = 0, scale = 1, rotate = 0 } = {}) {
  return `translate3d(${px(x)}, ${px(y)}, 0) scale(${scale}) rotate(${rotate}deg)`;
}
