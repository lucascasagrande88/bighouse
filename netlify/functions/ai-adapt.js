import { json, fail, readJson, requireSession } from './_lib/http.js';
import { getProject, putProject } from './_lib/store.js';
import { structured, OpenAIError } from './_lib/openai.js';
import { adapterSystem, adapterUser } from './_lib/prompts.js';
import { fitsTarget, estimateDuration, DEFAULT_WPM } from '../../engine/src/timing.js';
import schema from '../../engine/schema/adaptation.schema.json';

export const config = { path: '/api/ai/adapt', method: 'POST' };

/**
 * Capa 2: la adaptación creativa. Devuelve los tres niveles —idea original,
 * aplicación a la marca y guion nuevo— y ADEMÁS controla que el guion entre en
 * la duración pedida.
 *
 * El control de duración importa: un guion que estimado dura 48 s no sirve para
 * un reel de 30 s, y el modelo no tiene forma de sentir eso. Se mide, y si no
 * entra se le pide reescribir con una instrucción concreta ("sacá 34 palabras"),
 * una sola vez. Si el segundo intento tampoco entra, se devuelve igual con el
 * aviso visible en la UI: mejor un guion largo y avisado que un guion mutilado.
 */
export default async function adapt(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const body = await readJson(request);
  const project = body.project_id ? await getProject(session, body.project_id) : null;
  if (!project) return fail(404, 'Ese proyecto no existe.');
  if (!project.analysis) return fail(400, 'Primero hay que analizar el reel de referencia.');

  const brief = {
    brand: project.brand,
    objective: project.objective,
    cta: project.cta,
    duration: body.duration || project.target_duration || 30,
    intensity: project.intensity,
    notes: body.notes || project.notes || '',
  };

  const wpm = project.analysis?.timing?.wpm || DEFAULT_WPM;

  try {
    let attempt = await run(brief, project.analysis, null);
    let fit = fitsTarget(attempt.data.script, brief.duration, wpm);
    let retried = false;

    if (!fit.fits && fit.advice) {
      retried = true;
      const advice =
        fit.advice.action === 'shorten'
          ? `El guion anterior duraba ${fit.estimated}s y el objetivo es ${brief.duration}s. Sacá alrededor de ${fit.advice.words} palabras SIN perder el hook ni el CTA. Recortá desarrollo, no la estructura.`
          : `El guion anterior duraba ${fit.estimated}s y el objetivo es ${brief.duration}s. Agregá alrededor de ${fit.advice.words} palabras: un ejemplo concreto más, no relleno.`;
      attempt = await run(brief, project.analysis, advice);
      fit = fitsTarget(attempt.data.script, brief.duration, wpm);
    }

    const adaptation = {
      ...attempt.data,
      // La estimación propia manda sobre la del modelo: está medida.
      estimated_duration: estimateDuration(attempt.data.script, wpm),
      fit: { ...fit, wpm, retried },
    };

    const saved = await putProject(session, {
      ...project,
      adaptation,
      script: adaptation.script,
      status: 'adaptado',
      // Un guion nuevo invalida el storyboard anterior: son de otro guion.
      scenes: [],
      duration: 0,
      warnings: [],
      ai_meta: {
        ...(project.ai_meta || {}),
        adapt: { model: attempt.model, usage: attempt.usage, at: new Date().toISOString(), retried },
      },
    });

    return json({ ok: true, adaptation, project: saved });
  } catch (err) {
    if (err instanceof OpenAIError) return fail(err.status >= 400 ? err.status : 502, err.message);
    return fail(500, err.message || 'Error inesperado adaptando el guion.');
  }
}

function run(brief, analysis, retryAdvice) {
  const user = adapterUser({ analysis, brief });
  return structured({
    schema,
    system: adapterSystem(),
    user: retryAdvice ? `${user}\n\nCORRECCIÓN OBLIGATORIA:\n${retryAdvice}` : user,
    temperature: 0.85,
  });
}
