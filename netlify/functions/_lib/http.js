// Utilidades comunes a todas las funciones.

import { sessionFrom } from '../../../shared/session.mjs';

export const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { ...JSON_HEADERS, ...(init.headers || {}) },
  });
}

export function fail(status, message, extra = {}) {
  return json({ ok: false, error: message, ...extra }, { status });
}

/**
 * Puerta única. Toda función que toque datos o la API de OpenAI empieza acá.
 * El gate del edge protege el HTML; esto protege lo que importa.
 */
export async function requireSession(request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return { error: fail(500, 'SESSION_SECRET no está configurado en el entorno.') };
  }
  const session = await sessionFrom(request, secret);
  if (!session) {
    return { error: fail(401, 'Sesión vencida o inexistente.') };
  }
  return { session };
}

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  return missing.length ? missing : null;
}

/** IP del cliente, para el control de intentos de login. */
export function clientIp(request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  );
}
