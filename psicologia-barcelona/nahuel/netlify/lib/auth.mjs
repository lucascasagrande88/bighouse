// Contraseña del panel (scrypt) y sesiones firmadas (HMAC). Sin dependencias externas.
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const N = 32768;
export const SESSION_HOURS = 12;

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export async function hashPassword(password, salt = randomBytes(16)) {
  const key = await scrypt(password.normalize('NFC'), salt, 32, { N, r: 8, p: 1, maxmem: 128 * N * 8 * 2 });
  return `scrypt$${N}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const [kind, n, saltB64, hashB64] = stored.split('$');
  if (kind !== 'scrypt' || !saltB64 || !hashB64) return false;
  const cost = Number(n);
  const expected = Buffer.from(hashB64, 'base64');
  const key = await scrypt(password.normalize('NFC'), Buffer.from(saltB64, 'base64'), expected.length,
    { N: cost, r: 8, p: 1, maxmem: 128 * cost * 8 * 2 });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

// La versión cambia con cada contraseña nueva: así las sesiones viejas dejan de servir.
export function passwordVersion(stored) {
  return createHmac('sha256', 'version').update(stored).digest('base64url').slice(0, 16);
}

export function signSession(secret, version, hours = SESSION_HOURS) {
  const payload = b64url(JSON.stringify({ exp: Date.now() + hours * 3600e3, v: version }));
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySession(secret, token, version) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.exp > Date.now() && data.v === version;
  } catch {
    return false;
  }
}

export function newSecret() {
  return randomBytes(32).toString('base64url');
}
