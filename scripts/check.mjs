#!/usr/bin/env node
// Chequeo del motor sin navegador y sin claves de API.
//
//   npm run check
//
// Verifica lo que se puede verificar de este lado: que los schemas sean válidos
// para el modo estricto de OpenAI, que el saneado recorte lo que tiene que
// recortar, y que el reparto de tiempos cierre.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
let failed = 0;

function check(name, fn) {
  try {
    const detail = fn();
    results.push(['ok', name, detail || '']);
  } catch (err) {
    failed++;
    results.push(['FALLA', name, err.message]);
  }
}

const { buildProject, LIMITS } = await import(path.join(root, 'engine/src/validate.js'));
const timing = await import(path.join(root, 'engine/src/timing.js'));
const { COMPONENTS, resolveType, SCENE_ALIASES } = await import(path.join(root, 'engine/src/components.js'));
const { TRANSITION_NAMES } = await import(path.join(root, 'engine/src/renderer.js'));
const { SFX_DEFAULTS, SFX_LIBRARY } = await import(path.join(root, 'engine/src/sfx.js'));

const json = async (p) => JSON.parse(await readFile(path.join(root, p), 'utf8'));
const scenesSchema = await json('engine/schema/scenes.schema.json');
const analysisSchema = await json('engine/schema/analysis.schema.json');
const adaptationSchema = await json('engine/schema/adaptation.schema.json');
const demo = await json('engine/demo/demo-project.json');

/* ─── schemas ─── */

/**
 * El modo estricto de OpenAI exige que cada objeto tenga additionalProperties
 * en false y que TODAS sus propiedades estén en required. Es el error más fácil
 * de cometer editando un schema y el más molesto de diagnosticar en producción,
 * porque la API lo rechaza recién en la primera llamada real.
 */
function auditStrict(node, trail = '$') {
  const problems = [];
  if (!node || typeof node !== 'object') return problems;

  const types = Array.isArray(node.type) ? node.type : [node.type];
  if (types.includes('object')) {
    if (node.additionalProperties !== false) problems.push(`${trail}: falta additionalProperties:false`);
    const props = Object.keys(node.properties || {});
    const req = node.required || [];
    const missing = props.filter((p) => !req.includes(p));
    if (missing.length) problems.push(`${trail}: faltan en required → ${missing.join(', ')}`);
    for (const [k, v] of Object.entries(node.properties || {})) problems.push(...auditStrict(v, `${trail}.${k}`));
  }
  if (types.includes('array') && node.items) problems.push(...auditStrict(node.items, `${trail}[]`));

  // Palabras clave que el modo estricto no soporta y silenciosamente invalidan.
  for (const bad of ['minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'default', 'oneOf', 'allOf']) {
    if (bad in node) problems.push(`${trail}: "${bad}" no está soportado en modo estricto`);
  }
  return problems;
}

for (const [name, schema] of [
  ['scenes', scenesSchema],
  ['analysis', analysisSchema],
  ['adaptation', adaptationSchema],
]) {
  check(`schema ${name} compatible con strict`, () => {
    const problems = auditStrict(schema.schema);
    if (problems.length) throw new Error(problems.join(' | '));
    return `${Object.keys(schema.schema.properties).length} campos raíz`;
  });
}

check('los scene_type del schema existen en el motor', () => {
  const declared = scenesSchema.schema.properties.scenes.items.properties.scene_type.enum;
  const missing = declared.filter((t) => !COMPONENTS[t]);
  if (missing.length) throw new Error(`el schema declara componentes que no existen: ${missing.join(', ')}`);
  const extra = Object.keys(COMPONENTS).filter((t) => !declared.includes(t));
  if (extra.length) throw new Error(`el motor tiene componentes que el schema no ofrece: ${extra.join(', ')}`);
  return `${declared.length} componentes`;
});

check('las transiciones del schema existen en el renderer', () => {
  const declared = scenesSchema.schema.properties.scenes.items.properties.transition_out.enum;
  const missing = declared.filter((t) => !TRANSITION_NAMES.includes(t));
  if (missing.length) throw new Error(`transiciones inexistentes: ${missing.join(', ')}`);
  return `${declared.length} transiciones`;
});

check('los efectos del schema existen en el banco', () => {
  const declared = scenesSchema.schema.properties.scenes.items.properties.sfx.properties.in.enum;
  const missing = declared.filter((s) => !SFX_LIBRARY[s]);
  if (missing.length) throw new Error(`efectos inexistentes: ${missing.join(', ')}`);
  return `${declared.length} efectos`;
});

check('todo componente tiene un sonido por defecto', () => {
  const missing = Object.keys(COMPONENTS).filter((c) => !SFX_DEFAULTS[c]);
  if (missing.length) throw new Error(`sin default de sfx: ${missing.join(', ')}`);
  return 'ok';
});

check('los alias narrativos resuelven a componentes reales', () => {
  const bad = Object.entries(SCENE_ALIASES).filter(([, target]) => !COMPONENTS[target]);
  if (bad.length) throw new Error(`alias roto: ${bad.map(([k]) => k).join(', ')}`);
  return `${Object.keys(SCENE_ALIASES).length} alias`;
});

/* ─── tiempos ─── */

check('estimateDuration suma las pausas de puntuación', () => {
  const plain = timing.estimateDuration('uno dos tres cuatro cinco seis siete ocho nueve diez');
  const punct = timing.estimateDuration('uno dos tres. cuatro cinco seis. siete ocho nueve diez.');
  if (!(punct > plain)) throw new Error('la puntuación no agregó tiempo');
  return `${plain}s sin puntuación vs ${punct}s con puntuación`;
});

check('reflowScenes da más tiempo a la escena con más texto', () => {
  const scenes = [
    { voiceover: 'Una frase corta.' },
    { voiceover: 'Una frase bastante más larga que la anterior, con varias palabras encadenadas.' },
    { voiceover: 'Cierre.' },
  ];
  // 12s entre 3 escenas: promedio de 4s, holgado contra el techo de 7s, así que
  // hay margen real para que el reparto sea proporcional.
  const out = timing.reflowScenes(scenes, 12);
  const total = out[out.length - 1].end;
  if (Math.abs(total - 12) > 0.02) throw new Error(`la suma dio ${total} en vez de 12`);
  for (let i = 1; i < out.length; i++) {
    if (Math.abs(out[i].start - out[i - 1].end) > 0.001) throw new Error(`hueco entre ${out[i - 1].end} y ${out[i].start}`);
  }
  const durations = out.map((s) => s.end - s.start);
  if (!(durations[1] > durations[0] && durations[0] > durations[2])) {
    throw new Error(`el orden de duraciones no sigue al texto: ${durations.join(' / ')}`);
  }
  if (durations.some((d) => d > timing.MAX_SCENE + 0.01 || d < timing.MIN_SCENE - 0.01)) {
    throw new Error(`una escena quedó fuera de los límites: ${durations.join(' / ')}`);
  }
  return durations.map((d) => `${d.toFixed(1)}s`).join(' + ');
});

check('reflowScenes reparte parejo cuando el techo es imposible', () => {
  // 24s entre 3 escenas fuerza 8s cada una: el techo de 7s no se puede cumplir,
  // y estirar una escena a 10s para respetarlo en las otras sería peor.
  const out = timing.reflowScenes(
    [{ voiceover: 'Corta.' }, { voiceover: 'Una frase mucho más larga que las demás, con bastante texto.' }, { voiceover: 'Cierre.' }],
    24
  );
  const durations = out.map((s) => s.end - s.start);
  const spread = Math.max(...durations) - Math.min(...durations);
  if (spread > 0.05) throw new Error(`debería quedar parejo y quedó ${durations.join(' / ')}`);
  if (Math.abs(out[out.length - 1].end - 24) > 0.02) throw new Error('no cierra en 24s');
  return `${durations.map((d) => d.toFixed(1)).join(' + ')} = 24s`;
});

check('reflowScenes reparte parejo cuando el piso es imposible', () => {
  // 1,2s entre 2 escenas: el piso de 1,1s no entra. Antes esto dejaba una
  // escena de 1,1s y otra de 0,1s, que es un frame y medio.
  const out = timing.reflowScenes([{ voiceover: 'a' }, { voiceover: 'b' }], 1.2);
  const durations = out.map((s) => s.end - s.start);
  if (Math.min(...durations) < 0.5) throw new Error(`una escena quedó en ${Math.min(...durations)}s`);
  if (Math.max(...durations) - Math.min(...durations) > 0.05) throw new Error(`quedó desparejo: ${durations.join(' / ')}`);
  return durations.map((d) => `${d.toFixed(2)}s`).join(' + ');
});

check('reflowScenes marca las escenas apretadas', () => {
  const out = timing.reflowScenes(
    [{ voiceover: 'Esta frase tiene bastantes palabras y no va a entrar nunca en el tiempo que le toca.' }, { voiceover: 'Ok.' }],
    3
  );
  if (!out.some((s) => s.tight)) throw new Error('no marcó ninguna escena como apretada');
  return 'avisa cuando la locución no entra';
});

check('resequence recalcula sin dejar huecos', () => {
  const { scenes, duration } = timing.resequence([{ duration: 3 }, { duration: 2 }, { duration: 4 }]);
  if (Math.abs(duration - 9) > 0.01) throw new Error(`duró ${duration} en vez de 9`);
  if (scenes[2].start !== 5) throw new Error(`la tercera arranca en ${scenes[2].start} en vez de 5`);
  return `${duration}s`;
});

check('fitsTarget pide recortar cuando sobra texto', () => {
  const long = 'palabra '.repeat(140);
  const fit = timing.fitsTarget(long, 20);
  if (fit.fits) throw new Error('dijo que entra y no entra');
  if (fit.advice.action !== 'shorten') throw new Error('no pidió acortar');
  if (!(fit.advice.words > 0)) throw new Error('no dijo cuántas palabras sacar');
  return `pide sacar ${fit.advice.words} palabras`;
});

/* ─── saneado ─── */

check('buildProject recorta a 10 escenas', () => {
  const raw = { script: 'x', scenes: Array.from({ length: 14 }, () => scene('kinetic_hook')) };
  const { project, warnings } = buildProject(raw, { duration: 30 });
  if (project.scenes.length !== LIMITS.scenes) throw new Error(`quedaron ${project.scenes.length}`);
  if (!warnings.some((w) => w.includes('14'))) throw new Error('no avisó del recorte');
  return `14 → ${project.scenes.length}`;
});

check('buildProject recorta listas de más de 5 ítems', () => {
  const raw = {
    script: 'x',
    scenes: [{ ...scene('animated_list'), items: Array.from({ length: 9 }, (_, i) => ({ text: `item ${i}`, icon: 'check' })) }],
  };
  const { project, warnings } = buildProject(raw, { duration: 10 });
  if (project.scenes[0].items.length !== LIMITS.listItems) throw new Error(`quedaron ${project.scenes[0].items.length}`);
  if (!warnings.length) throw new Error('no avisó');
  return `9 → ${project.scenes[0].items.length}`;
});

check('buildProject corrige un scene_type inventado', () => {
  const raw = { script: 'x', scenes: [{ ...scene('lo_que_se_le_ocurrio'), visual_text: ['hola'] }] };
  const { project } = buildProject(raw, { duration: 5 });
  if (!COMPONENTS[project.scenes[0].scene_type]) throw new Error('quedó un tipo inválido');
  return `→ ${project.scenes[0].scene_type}`;
});

check('buildProject respeta los alias narrativos', () => {
  const { project } = buildProject({ script: 'x', scenes: [scene('before_after')] }, { duration: 5 });
  if (project.scenes[0].scene_type !== 'comparison') throw new Error(`resolvió a ${project.scenes[0].scene_type}`);
  return 'before_after → comparison';
});

check('buildProject descarta campos que el componente no usa', () => {
  const raw = {
    script: 'x',
    scenes: [{ ...scene('impact_word'), visual_text: ['BASTA'], items: [{ text: 'fantasma', icon: 'dot' }], stat: { value: '9' } }],
  };
  const { project } = buildProject(raw, { duration: 5 });
  const s = project.scenes[0];
  if (s.items.length || s.stat) throw new Error('arrastró campos de otro componente');
  return 'sólo queda lo que se dibuja';
});

check('buildProject normaliza velocidad e intensidad fuera de rango', () => {
  const raw = { script: 'x', scenes: [{ ...scene('kinetic_hook'), visual_text: ['a'], animation: { speed: 99, intensity: -4 } }] };
  const { project } = buildProject(raw, { duration: 5 });
  const a = project.scenes[0].animation;
  if (a.speed > 1.8 || a.intensity < 0) throw new Error(`quedó speed ${a.speed} / intensity ${a.intensity}`);
  return `speed ${a.speed} · intensity ${a.intensity}`;
});

check('buildProject avisa cuando una lista viene vacía', () => {
  const { warnings } = buildProject({ script: 'x', scenes: [scene('animated_list')] }, { duration: 5 });
  if (!warnings.some((w) => w.includes('sin ítems'))) throw new Error('no avisó de la lista vacía');
  return 'avisa';
});

/* ─── proyecto de demostración ─── */

check('el proyecto de demo es coherente', () => {
  if (demo.scenes.length > LIMITS.scenes) throw new Error('tiene más de 10 escenas');
  for (let i = 0; i < demo.scenes.length; i++) {
    const s = demo.scenes[i];
    if (!COMPONENTS[s.scene_type]) throw new Error(`${s.id}: componente inexistente`);
    if (!TRANSITION_NAMES.includes(s.transition_out)) throw new Error(`${s.id}: transición inexistente`);
    for (const key of ['in', 'accent', 'out']) {
      if (!SFX_LIBRARY[s.sfx[key]]) throw new Error(`${s.id}: efecto "${s.sfx[key]}" inexistente`);
    }
    if (i > 0 && Math.abs(s.start - demo.scenes[i - 1].end) > 0.001) throw new Error(`${s.id}: no es contiguo`);
  }
  const last = demo.scenes[demo.scenes.length - 1];
  if (Math.abs(last.end - demo.duration) > 0.01) throw new Error('la última escena no cierra la duración');
  return `${demo.scenes.length} escenas · ${demo.duration}s`;
});

check('el guion de la demo se reparte en sus escenas', () => {
  const joined = demo.scenes.map((s) => s.voiceover).join(' ').replace(/\s+/g, ' ').trim();
  const script = demo.script.replace(/\s+/g, ' ').trim();
  if (joined !== script) throw new Error('la suma de los voiceover no da el guion completo');
  return `${joined.split(' ').length} palabras`;
});

function scene(type) {
  return {
    scene_type: type,
    voiceover: 'Una frase de prueba para la escena.',
    visual_message: 'algo',
    visual_text: [],
    keywords: [],
    items: [],
    stat: null,
    comparison: null,
    asset: null,
    animation: { speed: 1, intensity: 0.6 },
    sfx: { in: 'none', accent: 'none', out: 'none' },
    transition_out: 'cut',
  };
}

/* ─── salida ─── */

const width = Math.max(...results.map(([, name]) => name.length));
for (const [status, name, detail] of results) {
  const mark = status === 'ok' ? '  ✓' : '  ✗';
  console.log(`${mark} ${name.padEnd(width)}  ${detail}`);
}
console.log(`\n${results.length - failed}/${results.length} chequeos pasados\n`);
process.exit(failed ? 1 : 0);
