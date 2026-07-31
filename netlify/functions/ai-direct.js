import { json, fail, readJson, requireSession } from './_lib/http.js';
import { getProject, putProject } from './_lib/store.js';
import { structured, OpenAIError } from './_lib/openai.js';
import { directorSystem, directorUser } from './_lib/prompts.js';
import { buildProject } from '../../engine/src/validate.js';
import { DEFAULT_WPM } from '../../engine/src/timing.js';
import schema from '../../engine/schema/scenes.schema.json';

export const config = { path: '/api/ai/direct', method: 'POST' };

/**
 * Capa 3: dirección de escenas. El guion entra, el storyboard sale.
 *
 * Dos cosas que no delego al modelo, a propósito:
 *  - Los tiempos. El modelo decide dónde cortar; reflowScenes reparte la
 *    duración según el peso de locución de cada corte. Pedirle start/end a un
 *    modelo da timelines que no cierran.
 *  - Los topes. El schema estricto garantiza la forma pero no las cantidades,
 *    así que buildProject recorta y devuelve las correcciones como warnings
 *    visibles en el editor.
 */
export default async function direct(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const body = await readJson(request);
  const project = body.project_id ? await getProject(session, body.project_id) : null;
  if (!project) return fail(404, 'Ese proyecto no existe.');

  const script = String(body.script || project.script || '').trim();
  if (!script) return fail(400, 'No hay guion para dirigir. Adaptá el reel o escribí el guion a mano.');

  const duration = body.duration || project.adaptation?.estimated_duration || project.target_duration || 30;
  const brief = {
    brand: project.brand,
    objective: project.objective,
    cta: project.cta,
    intensity: project.intensity,
  };

  try {
    const { data, usage, model } = await structured({
      schema,
      system: directorSystem(),
      user: directorUser({ script, brief, analysis: project.analysis, duration }),
      temperature: 0.7,
      timeout: 150000,
    });

    const { project: built, warnings } = buildProject(data, {
      name: project.name,
      skin: project.skin || project.brand,
      intensity: project.intensity,
      speed: project.speed,
      duration,
      cta: project.cta,
      handle: project.handle,
      base_video: project.ingest?.video_url || null,
      wpm: project.analysis?.timing?.wpm || DEFAULT_WPM,
    });

    if (!built) return fail(502, warnings[0] || 'El modelo no devolvió escenas.');

    const saved = await putProject(session, {
      ...project,
      script: data.script || script,
      director_notes: data.director_notes || '',
      duration: built.duration,
      scenes: built.scenes,
      warnings,
      status: 'dirigido',
      ai_meta: { ...(project.ai_meta || {}), direct: { model, usage, at: new Date().toISOString() } },
    });

    return json({ ok: true, project: saved, warnings });
  } catch (err) {
    if (err instanceof OpenAIError) return fail(err.status >= 400 ? err.status : 502, err.message);
    return fail(500, err.message || 'Error inesperado dirigiendo las escenas.');
  }
}
