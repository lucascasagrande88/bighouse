// Validación y saneado de lo que devuelve el modelo.
//
// El JSON Schema estricto de OpenAI garantiza la *forma* (tipos, enums, claves
// presentes) pero no puede expresar límites de cantidad: nada le impide
// devolver 14 escenas o una lista de 9 ítems. Estos topes se aplican acá,
// del lado del servidor, antes de que el storyboard llegue al motor.

import { MAX_SCENES, reflowScenes, estimateDuration, DEFAULT_WPM, round } from './timing.js';
import { resolveType } from './components.js';
import { SFX_NAMES, SFX_DEFAULTS } from './sfx.js';
import { ICON_NAMES, guessIcon } from './icons.js';
import { TRANSITION_NAMES } from './renderer.js';

export const LIMITS = {
  scenes: MAX_SCENES,
  linesPerScene: 4,
  wordsPerLine: 5,
  listItems: 5,
  comparisonItems: 4,
  keywords: 3,
};

/**
 * Convierte la respuesta cruda del modelo en un proyecto que el motor puede
 * renderizar sin sorpresas. Devuelve también las correcciones aplicadas: si el
 * modelo se pasó de la raya conviene verlo en la UI, no taparlo.
 */
export function buildProject(raw, opts = {}) {
  const warnings = [];
  const wpm = opts.wpm || DEFAULT_WPM;

  let scenes = Array.isArray(raw && raw.scenes) ? raw.scenes : [];
  if (!scenes.length) {
    return { project: null, warnings: ['El modelo no devolvió ninguna escena.'] };
  }

  if (scenes.length > LIMITS.scenes) {
    warnings.push(`El modelo devolvió ${scenes.length} escenas; se recortó a ${LIMITS.scenes}.`);
    scenes = scenes.slice(0, LIMITS.scenes);
  }

  const cleaned = scenes.map((s, i) => sanitizeScene(s, i, warnings));

  const targetDuration = round(
    opts.duration || raw.estimated_duration || estimateDuration(raw.script || cleaned.map((s) => s.voiceover).join(' '), wpm)
  );

  const withTimes = reflowScenes(cleaned, targetDuration, wpm);
  for (const s of withTimes) {
    if (s.tight) {
      warnings.push(`${s.id}: la locución no entra cómoda en ${s.duration}s. Acortá el texto o alargá la escena.`);
    }
  }

  const project = {
    name: opts.name || 'Reel sin nombre',
    skin: opts.skin || 'chimichurri',
    intensity: typeof opts.intensity === 'number' ? opts.intensity : 0.6,
    speed: opts.speed || 1,
    fps: opts.fps || 30,
    duration: targetDuration,
    cta: opts.cta || 'Escribinos',
    handle: opts.handle || '@chimichurridiseno',
    base_video: opts.base_video || null,
    script: raw.script || '',
    director_notes: raw.director_notes || '',
    scenes: withTimes,
  };

  return { project, warnings };
}

function sanitizeScene(s, i, warnings) {
  const id = `scene_${String(i + 1).padStart(2, '0')}`;
  const type = resolveType(s.scene_type);
  if (type !== s.scene_type) {
    warnings.push(`${id}: scene_type "${s.scene_type}" no existe, se usó "${type}".`);
  }

  const visual_text = trimLines(s.visual_text, id, warnings);
  const keywords = asArray(s.keywords).map(str).filter(Boolean).slice(0, LIMITS.keywords);

  const scene = {
    id,
    scene_type: type,
    voiceover: str(s.voiceover),
    visual_message: str(s.visual_message),
    visual_text,
    keywords,
    items: [],
    stat: null,
    comparison: null,
    asset: sanitizeAsset(s.asset),
    animation: {
      speed: clampNum(s.animation && s.animation.speed, 0.6, 1.8, 1),
      intensity: clampNum(s.animation && s.animation.intensity, 0, 1, 0.6),
    },
    sfx: sanitizeSfx(s.sfx, type),
    transition_out: TRANSITION_NAMES.includes(s.transition_out) ? s.transition_out : 'cut',
    locked: false,
  };

  // Sólo se conservan los campos que el componente elegido realmente usa.
  // Así una escena no arrastra una comparación fantasma que nadie va a dibujar.
  if (type === 'animated_list') {
    const items = asArray(s.items);
    if (items.length > LIMITS.listItems) {
      warnings.push(`${id}: ${items.length} ítems en la lista; se recortó a ${LIMITS.listItems}.`);
    }
    scene.items = items.slice(0, LIMITS.listItems).map((it) => ({
      text: str(it && it.text),
      icon: ICON_NAMES.includes(it && it.icon) ? it.icon : guessIcon(it && it.text),
    })).filter((it) => it.text);
    if (!scene.items.length) {
      warnings.push(`${id}: es una lista pero vino sin ítems.`);
    }
  }

  if (type === 'stat_number') {
    const st = s.stat || {};
    scene.stat = {
      value: str(st.value) || (visual_text[0] || '0'),
      prefix: st.prefix ? str(st.prefix) : null,
      suffix: st.suffix ? str(st.suffix) : null,
      label: str(st.label) || visual_text[1] || '',
    };
  }

  if (type === 'comparison') {
    const c = s.comparison || {};
    scene.comparison = {
      left_label: str(c.left_label) || 'Antes',
      left_items: asArray(c.left_items).map(str).filter(Boolean).slice(0, LIMITS.comparisonItems),
      right_label: str(c.right_label) || 'Después',
      right_items: asArray(c.right_items).map(str).filter(Boolean).slice(0, LIMITS.comparisonItems),
    };
    if (!scene.comparison.left_items.length || !scene.comparison.right_items.length) {
      warnings.push(`${id}: es una comparación con un lado vacío.`);
    }
  }

  if (type === 'concept_image' && (!scene.asset || scene.asset.kind === 'none')) {
    warnings.push(`${id}: es una escena de imagen y no trae asset. Va a renderizar el placeholder.`);
  }

  if (!scene.visual_text.length && ['kinetic_hook', 'impact_word', 'cta_end'].includes(type)) {
    warnings.push(`${id}: escena tipográfica sin texto en pantalla.`);
  }

  return scene;
}

function trimLines(input, id, warnings) {
  const lines = asArray(input).map(str).filter((l) => l.trim());
  let out = lines;
  if (out.length > LIMITS.linesPerScene) {
    warnings.push(`${id}: ${out.length} líneas en pantalla; se recortó a ${LIMITS.linesPerScene}.`);
    out = out.slice(0, LIMITS.linesPerScene);
  }
  return out.map((l) => {
    const words = l.trim().split(/\s+/);
    if (words.length > LIMITS.wordsPerLine) {
      warnings.push(`${id}: "${l}" tiene ${words.length} palabras. Una línea así no se lee en un reel.`);
    }
    return l.trim();
  });
}

function sanitizeAsset(a) {
  if (!a || !a.kind || a.kind === 'none') return null;
  const kinds = ['image', 'background', 'screenshot', 'diagram'];
  return {
    kind: kinds.includes(a.kind) ? a.kind : 'image',
    concept: str(a.concept),
    prompt: str(a.prompt),
    url: a.url ? str(a.url) : null,
    status: a.url ? 'ready' : 'pending',
  };
}

function sanitizeSfx(s, type) {
  const d = SFX_DEFAULTS[type] || { in: 'none', accent: 'none', out: 'none' };
  const pick = (v, fallback) => (SFX_NAMES.includes(v) ? v : fallback);
  return {
    in: pick(s && s.in, d.in),
    accent: pick(s && s.accent, d.accent),
    out: pick(s && s.out, d.out),
  };
}

function asArray(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function str(v) {
  return v == null ? '' : String(v);
}

function clampNum(v, min, max, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
