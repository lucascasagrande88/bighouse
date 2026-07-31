import { json, fail, readJson, requireSession } from './_lib/http.js';
import { getProject, putProject } from './_lib/store.js';
import { structured, OpenAIError } from './_lib/openai.js';
import { directorSystem } from './_lib/prompts.js';
import { buildProject } from '../../engine/src/validate.js';
import schema from '../../engine/schema/scenes.schema.json';

export const config = { path: '/api/ai/scene', method: 'POST' };

/**
 * Regenera UNA escena sin tocar el resto.
 *
 * Es la operación más usada del editor: el guion está bien, la escena 04 quedó
 * fea. Volver a dirigir todo por eso sería absurdo —y perdería los ajustes
 * manuales de las otras nueve—, así que se le pide una escena sola, con el
 * contexto de las vecinas y respetando su duración ya asignada.
 */
export default async function scene(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { project_id, scene_id, hint } = await readJson(request);
  const project = project_id ? await getProject(session, project_id) : null;
  if (!project) return fail(404, 'Ese proyecto no existe.');

  const idx = (project.scenes || []).findIndex((s) => s.id === scene_id);
  if (idx < 0) return fail(404, 'Esa escena no existe.');

  const target = project.scenes[idx];
  if (target.locked) return fail(409, 'La escena está bloqueada. Desbloqueala primero.');

  const prev = project.scenes[idx - 1];
  const next = project.scenes[idx + 1];
  const duration = Number((target.end - target.start).toFixed(2));

  const user = `Rehacé UNA sola escena de un reel que ya está dirigido.

LOCUCIÓN DE ESTA ESCENA (no se cambia, es la que se va a grabar):
${target.voiceover || '(sin locución: es una escena visual)'}

DURACIÓN ASIGNADA: ${duration} segundos
TIPO ACTUAL: ${target.scene_type} — el que quedó feo. Podés cambiarlo.

ESCENA ANTERIOR: ${prev ? `${prev.scene_type} — "${(prev.visual_text || []).join(' / ')}"` : '(es la primera del reel)'}
ESCENA SIGUIENTE: ${next ? `${next.scene_type} — "${(next.visual_text || []).join(' / ')}"` : '(es la última del reel)'}

CONTEXTO
Marca: ${project.brand} · Objetivo: ${project.objective} · CTA: ${project.cta}
Guion completo del reel, para que no repitas lo que ya se dijo:
${project.script}
${hint ? `\nLO QUE PIDE EL EDITOR: ${hint}` : ''}

Devolvé el storyboard con EXACTAMENTE UNA escena en el array. No repitas el
tipo de la escena anterior ni el de la siguiente si podés evitarlo. Si es la
primera del reel tiene que ser kinetic_hook o impact_word; si es la última,
cta_end.`;

  try {
    const { data, usage, model } = await structured({
      schema,
      system: directorSystem(),
      user,
      temperature: 0.9,
    });

    // Se reusa el mismo saneado que la dirección completa y después se
    // devuelve la escena a su lugar con su id y sus tiempos originales.
    const { project: built, warnings } = buildProject(
      { ...data, scenes: data.scenes.slice(0, 1) },
      { duration, skin: project.skin, intensity: project.intensity, speed: project.speed }
    );
    if (!built || !built.scenes.length) return fail(502, warnings[0] || 'El modelo no devolvió la escena.');

    const fresh = {
      ...built.scenes[0],
      id: target.id,
      start: target.start,
      end: target.end,
      duration,
      locked: false,
      // Una imagen ya subida no se tira porque cambió el texto de la escena.
      asset: built.scenes[0].asset && target.asset?.url
        ? { ...built.scenes[0].asset, url: target.asset.url, status: 'ready' }
        : built.scenes[0].asset,
    };

    const scenes = [...project.scenes];
    scenes[idx] = fresh;

    const saved = await putProject(session, {
      ...project,
      scenes,
      warnings: [...(project.warnings || []).filter((w) => !w.startsWith(target.id)), ...warnings],
      ai_meta: { ...(project.ai_meta || {}), scene: { model, usage, at: new Date().toISOString() } },
    });

    return json({ ok: true, scene: fresh, project: saved, warnings });
  } catch (err) {
    if (err instanceof OpenAIError) return fail(err.status >= 400 ? err.status : 502, err.message);
    return fail(500, err.message || 'Error inesperado regenerando la escena.');
  }
}
