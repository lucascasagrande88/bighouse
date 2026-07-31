// Modelo de tiempos. Se usa igual en el navegador y en las funciones del backend.
//
// El punto crítico del producto: el timing del reel original es *referencia*,
// no una cárcel. Una frase nueva puede tardar más o menos que la original.
// Nunca se fuerza una frase de 4 s dentro de un hueco de 2 s, porque eso
// produce reels imposibles de locutar.

/** Palabras por minuto por defecto de una locución cómoda en español. */
export const DEFAULT_WPM = 155;

/** Elasticidad permitida sobre el ritmo original antes de reescribir. */
export const ELASTICITY = 0.15;

/** Piso y techo de duración de una escena, en segundos. */
export const MIN_SCENE = 1.1;
export const MAX_SCENE = 7.0;

export const MAX_SCENES = 10;

export function countWords(text) {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Duración estimada de locución. Suma el tiempo de las palabras más una
 * pausa por signo de puntuación fuerte, que es lo que hace que las
 * estimaciones por WPM puro siempre queden cortas.
 */
export function estimateDuration(text, wpm = DEFAULT_WPM) {
  const words = countWords(text);
  if (!words) return 0;
  const base = (words / wpm) * 60;
  const hardStops = (String(text).match(/[.!?…]/g) || []).length;
  const softStops = (String(text).match(/[,;:]/g) || []).length;
  return round(base + hardStops * 0.28 + softStops * 0.12);
}

/** Ritmo del reel original, en palabras por minuto. */
export function measureWpm(text, duration) {
  const words = countWords(text);
  if (!words || !duration) return DEFAULT_WPM;
  return Math.round((words / duration) * 60);
}

/**
 * ¿El guion nuevo entra en la duración objetivo?
 * Devuelve el veredicto y, si no entra, cuántas palabras hay que recortar,
 * que es la instrucción concreta que se le devuelve al modelo para reescribir.
 */
export function fitsTarget(script, targetDuration, wpm = DEFAULT_WPM) {
  const estimated = estimateDuration(script, wpm);
  const ceiling = targetDuration * (1 + ELASTICITY);
  const floor = targetDuration * (1 - ELASTICITY);
  const fits = estimated <= ceiling && estimated >= floor;
  let advice = null;
  if (estimated > ceiling) {
    const excess = estimated - targetDuration;
    advice = { action: 'shorten', seconds: round(excess), words: Math.ceil((excess / 60) * wpm) };
  } else if (estimated < floor) {
    const gap = targetDuration - estimated;
    advice = { action: 'extend', seconds: round(gap), words: Math.ceil((gap / 60) * wpm) };
  }
  return { fits, estimated, target: round(targetDuration), floor: round(floor), ceiling: round(ceiling), advice };
}

/**
 * Reparte la duración total entre escenas según el peso de locución de cada
 * una, respetando pisos y techos, y devuelve start/end absolutos y contiguos.
 *
 * Esto corre DESPUÉS de que el modelo decidió los cortes: el modelo decide
 * dónde cortar, el motor decide cuánto dura cada corte. Si el modelo devuelve
 * tiempos incoherentes (se solapan, dejan huecos, suman otra cosa), esto los
 * arregla en vez de romper el render.
 */
export function reflowScenes(scenes, totalDuration, wpm = DEFAULT_WPM) {
  if (!scenes.length) return [];

  const weights = scenes.map((s) => {
    const spoken = estimateDuration(s.voiceover, wpm);
    // Una escena sin locución (imagen conceptual, remate visual) igual necesita aire.
    return Math.max(spoken, MIN_SCENE * 0.8);
  });

  // Los límites de escena se relajan cuando la duración total los vuelve
  // imposibles: 3 escenas en 24 segundos no pueden durar 7 como máximo, y 2
  // escenas en 1,2 segundos no pueden durar 1,1 como mínimo. Antes que
  // deformar el reparto —y dejar una escena de 0,1 s— se corre el límite y se
  // reparte parejo, que es lo que un editor haría a mano.
  const share = totalDuration / scenes.length;
  const max = Math.max(MAX_SCENE, share);
  const min = Math.min(MIN_SCENE, share);
  const bound = (d) => round(Math.min(max, Math.max(min, d)));

  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const durations = weights.map((w) => bound((w / sum) * totalDuration));

  // Repartir la diferencia que dejaron los topes, proporcionalmente y en
  // pasadas, sobre las escenas que todavía tienen margen para moverse.
  for (let pass = 0; pass < 12; pass++) {
    const current = durations.reduce((a, b) => a + b, 0);
    const delta = totalDuration - current;
    if (Math.abs(delta) < 0.01) break;
    const movable = durations
      .map((d, i) => ({ i, room: delta > 0 ? max - d : d - min }))
      .filter((m) => m.room > 0.001);
    if (!movable.length) break;
    const roomSum = movable.reduce((a, m) => a + m.room, 0);
    for (const m of movable) {
      durations[m.i] = bound(durations[m.i] + delta * (m.room / roomSum));
    }
  }

  let cursor = 0;
  return scenes.map((scene, i) => {
    const start = cursor;
    // La última escena cierra en la duración total para que el timeline no
    // arrastre el error acumulado del redondeo.
    const end = i === scenes.length - 1 ? round(totalDuration) : round(cursor + durations[i]);
    cursor = end;
    const dur = round(Math.max(end - start, 0.2));
    return {
      ...scene,
      start: round(start),
      end,
      duration: dur,
      // Señal honesta para la UI: esta escena no alcanza para lo que se dice.
      tight: estimateDuration(scene.voiceover, wpm) > dur * (1 + ELASTICITY),
    };
  });
}

/** Recalcula start/end tras un cambio manual de duración en el editor. */
export function resequence(scenes) {
  let cursor = 0;
  const out = scenes.map((s) => {
    const dur = clampScene(s.duration ?? (s.end - s.start) ?? MIN_SCENE);
    const scene = { ...s, start: round(cursor), end: round(cursor + dur), duration: round(dur) };
    cursor = scene.end;
    return scene;
  });
  return { scenes: out, duration: round(cursor) };
}

export function clampScene(d) {
  return round(Math.min(MAX_SCENE, Math.max(MIN_SCENE, d)));
}

export function round(n) {
  return Math.round(n * 100) / 100;
}

export function formatTime(t) {
  const s = Math.max(0, t);
  return `${String(Math.floor(s)).padStart(2, '0')}.${String(Math.floor((s % 1) * 10))}s`;
}
