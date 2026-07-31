import { json, fail, readJson, requireSession } from './_lib/http.js';
import { getProject, putProject } from './_lib/store.js';
import { plain, OpenAIError } from './_lib/openai.js';
import { imagePromptSystem, imagePromptUser } from './_lib/prompts.js';

export const config = { path: '/api/ai/image-prompt', method: 'POST' };

/**
 * Director de assets, escena por escena. Devuelve concepto + prompt.
 *
 * La generación de la imagen es un paso aparte a propósito: el prompt se lee,
 * se corrige y se vuelve a pedir sin gastar una generación cada vez.
 */
export default async function imagePrompt(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { project_id, scene_id, hint } = await readJson(request);
  const project = project_id ? await getProject(session, project_id) : null;
  if (!project) return fail(404, 'Ese proyecto no existe.');

  const idx = (project.scenes || []).findIndex((s) => s.id === scene_id);
  if (idx < 0) return fail(404, 'Esa escena no existe.');
  const scene = project.scenes[idx];

  try {
    const { text } = await plain({
      system: imagePromptSystem(),
      user: imagePromptUser({ scene, brief: project }) + (hint ? `\n\nAJUSTE PEDIDO: ${hint}` : ''),
      temperature: 0.9,
    });

    const parsed = parseBlocks(text);
    if (!parsed.prompt) return fail(502, 'El modelo no devolvió un prompt usable.');

    const scenes = [...project.scenes];
    scenes[idx] = {
      ...scene,
      asset: {
        kind: scene.asset?.kind && scene.asset.kind !== 'none' ? scene.asset.kind : 'image',
        concept: parsed.concept || scene.asset?.concept || '',
        prompt: parsed.prompt,
        url: scene.asset?.url || null,
        status: scene.asset?.url ? 'ready' : 'pending',
      },
    };

    const saved = await putProject(session, { ...project, scenes });
    return json({ ok: true, asset: scenes[idx].asset, project: saved });
  } catch (err) {
    if (err instanceof OpenAIError) return fail(err.status >= 400 ? err.status : 502, err.message);
    return fail(500, err.message || 'Error inesperado generando el prompt.');
  }
}

function parseBlocks(text) {
  const concept = /CONCEPTO\s*:\s*([\s\S]*?)(?:\n\s*PROMPT\s*:|$)/i.exec(text);
  const prompt = /PROMPT\s*:\s*([\s\S]*)$/i.exec(text);
  return {
    concept: concept ? concept[1].trim() : '',
    // Si el modelo ignoró el formato, se usa todo el texto antes que fallar.
    prompt: prompt ? prompt[1].trim() : text.trim(),
  };
}
