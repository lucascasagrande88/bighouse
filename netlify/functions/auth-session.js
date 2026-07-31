import { json, requireSession } from './_lib/http.js';

export const config = { path: '/api/auth/session', method: 'GET' };

/** Ping de sesión. El frontend lo usa para saber si sigue adentro. */
export default async function session(request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  return json({
    ok: true,
    email: session.email,
    expires_at: session.exp,
    // Qué capacidades están realmente disponibles según el entorno.
    // Mejor que la UI ofrezca lo que existe y no botones que fallan.
    features: {
      ai: !!process.env.OPENAI_API_KEY,
      worker: !!process.env.WORKER_URL,
    },
  });
}
