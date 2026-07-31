import { scryptSync, timingSafeEqual } from 'node:crypto';
import { signSession, setCookie, MAX_AGE } from '../../shared/session.mjs';
import { json, fail, readJson, clientIp } from './_lib/http.js';
import { checkRate, noteFailure, clearFailures } from './_lib/store.js';

export const config = { path: '/api/auth/login', method: 'POST' };

/**
 * Los usuarios viven en la variable de entorno FACTORY_USERS, como array de
 * { email, salt, hash }. El hash se genera con scripts/hash-password.mjs.
 * Nunca hay una contraseña en el repositorio ni en el JavaScript del cliente.
 */
function loadUsers() {
  try {
    const parsed = JSON.parse(process.env.FACTORY_USERS || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function verifyPassword(user, password) {
  try {
    const expected = Buffer.from(user.hash, 'hex');
    const actual = scryptSync(password, user.salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export default async function login(request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return fail(500, 'SESSION_SECRET no está configurado en el entorno.');

  const users = loadUsers();
  if (!users.length) {
    return fail(500, 'No hay usuarios configurados. Corré `npm run hash-password` y cargá FACTORY_USERS.');
  }

  const { email, password } = await readJson(request);
  if (!email || !password) return fail(400, 'Faltan el email o la contraseña.');

  const bucket = `${clientIp(request)}|${String(email).toLowerCase().trim()}`;
  const rate = await checkRate(bucket);
  if (!rate.allowed) {
    return fail(429, 'Demasiados intentos fallidos. Esperá 15 minutos.');
  }

  const user = users.find((u) => u.email === String(email).toLowerCase().trim());
  // Se corre scrypt igual cuando el usuario no existe, así el tiempo de
  // respuesta no revela qué emails están dados de alta.
  const ok = user
    ? verifyPassword(user, password)
    : verifyPassword({ hash: '00'.repeat(64), salt: 'decoy' }, password) && false;

  if (!ok) {
    await noteFailure(bucket);
    return fail(401, 'Email o contraseña incorrectos.', { remaining: rate.remaining - 1 });
  }

  await clearFailures(bucket);
  const token = await signSession({ sub: user.email, email: user.email }, secret, MAX_AGE);

  return json(
    { ok: true, email: user.email, expires_in: MAX_AGE },
    { headers: { 'Set-Cookie': setCookie(token, { secure: !isLocal(request) }) } }
  );
}

function isLocal(request) {
  const host = request.headers.get('host') || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}
