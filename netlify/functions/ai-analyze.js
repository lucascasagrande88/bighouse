import { json, fail, readJson, requireSession } from './_lib/http.js';
import { getProject, putProject } from './_lib/store.js';
import { structured, OpenAIError } from './_lib/openai.js';
import { analystSystem, analystUser } from './_lib/prompts.js';
import { measureWpm, countWords, round } from '../../engine/src/timing.js';
import schema from '../../engine/schema/analysis.schema.json';

export const config = { path: '/api/ai/analyze', method: 'POST' };

const MAX_FRAMES = 8;

/**
 * Capa 1 del flujo: desarmar el reel de referencia.
 *
 * La ingesta (extraer audio, transcribir, sacar fotogramas, detectar cortes) la
 * hizo el worker. Acá se cruza todo eso y se le pide al modelo la lectura
 * estructural. Mandar el .mp4 entero a "una IA" y esperar magia no funciona:
 * lo que funciona es transcripción con tiempos + fotogramas concretos.
 */
export default async function analyze(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { project_id, ingest } = await readJson(request);
  const project = project_id ? await getProject(session, project_id) : null;
  if (!project) return fail(404, 'Ese proyecto no existe.');

  const data = ingest || project.ingest;
  if (!data) return fail(400, 'Todavía no hay ingesta. Subí el reel y procesalo antes de analizar.');
  if (!data.transcript && !(data.frames || []).length) {
    return fail(400, 'La ingesta vino vacía: sin transcripción ni fotogramas no hay nada que analizar.');
  }

  // Los fotogramas se limitan a MAX_FRAMES repartidos parejo: 60 imágenes no
  // mejoran el análisis, sólo multiplican el costo por token.
  const frames = pickEvenly(data.frames || [], MAX_FRAMES);

  try {
    const { data: analysis, usage, model } = await structured({
      schema,
      system: analystSystem(),
      user: analystUser({
        transcript: data.transcript,
        segments: data.segments,
        duration: data.duration,
        cutCount: data.cut_count,
        frameCount: frames.length,
      }),
      images: frames.map((f) => f.url || f),
      temperature: 0.4,
    });

    // Los números medidos por ffmpeg ganan sobre los estimados por el modelo.
    if (data.duration) analysis.timing.duration = round(data.duration);
    if (data.transcript) {
      analysis.timing.words = countWords(data.transcript);
      if (data.duration) analysis.timing.wpm = measureWpm(data.transcript, data.duration);
    }
    if (typeof data.cut_count === 'number') analysis.timing.cut_count = data.cut_count;

    const saved = await putProject(session, {
      ...project,
      ingest: data,
      analysis,
      status: 'analizado',
      ai_meta: { ...(project.ai_meta || {}), analyze: { model, usage, at: new Date().toISOString() } },
    });

    return json({ ok: true, analysis, project: saved });
  } catch (err) {
    return handle(err);
  }
}

function pickEvenly(arr, n) {
  if (arr.length <= n) return arr;
  const step = (arr.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}

function handle(err) {
  if (err instanceof OpenAIError) return fail(err.status >= 400 ? err.status : 502, err.message);
  return fail(500, err.message || 'Error inesperado analizando el reel.');
}
