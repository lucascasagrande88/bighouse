import { json, fail, readJson, requireSession } from './_lib/http.js';
import { getProject } from './_lib/store.js';
import { signSession } from '../../shared/session.mjs';

export const config = { path: '/api/worker/ticket', method: 'POST' };

const TICKET_TTL = 20 * 60; // 20 minutos: alcanza para subir un mp4 y procesarlo
const ACTIONS = ['ingest', 'render', 'image', 'asset', 'status'];

/**
 * Emite un ticket firmado para hablar directo con el worker.
 *
 * Por qué un ticket y no un proxy: un reel de 60 MB no pasa por el body de una
 * función serverless, y aunque pasara, el render tarda minutos y la función se
 * corta. Así que el navegador sube y consulta directo contra el worker, y
 * Netlify sólo decide QUIÉN puede hacerlo.
 *
 * El ticket es HMAC con WORKER_SECRET —compartido con el worker y con nadie
 * más—, dura 20 minutos y está atado al usuario, al proyecto y a la acción.
 */
export default async function ticket(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const workerUrl = process.env.WORKER_URL;
  const secret = process.env.WORKER_SECRET;
  if (!workerUrl || !secret) {
    return fail(503, 'El worker de procesamiento no está configurado (faltan WORKER_URL o WORKER_SECRET).');
  }

  const { action, project_id } = await readJson(request);
  if (!ACTIONS.includes(action)) return fail(400, `Acción inválida. Válidas: ${ACTIONS.join(', ')}.`);

  if (project_id) {
    const project = await getProject(session, project_id);
    if (!project) return fail(404, 'Ese proyecto no existe.');
  }

  const token = await signSession(
    { sub: session.email, action, project_id: project_id || null, scope: 'worker' },
    secret,
    TICKET_TTL
  );

  return json({
    ok: true,
    url: workerUrl.replace(/\/+$/, ''),
    token,
    action,
    expires_in: TICKET_TTL,
  });
}
