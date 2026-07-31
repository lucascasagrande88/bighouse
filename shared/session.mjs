// Sesión firmada. Sólo Web Crypto y sólo APIs estándar, para que el mismo
// archivo corra en las funciones (Node) y en el edge (Deno) sin bifurcarse.
//
// El token va en una cookie HttpOnly + Secure + SameSite=Lax. El navegador no
// puede leerla desde JavaScript, y el payload va firmado con HMAC-SHA256: se
// puede leer pero no falsificar sin el SESSION_SECRET.

export const COOKIE_NAME = 'chimi_session';
export const MAX_AGE = 60 * 60 * 12; // 12 horas

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

/** Firma un payload y devuelve el token de sesión. */
export async function signSession(payload, secret, maxAge = MAX_AGE) {
  if (!secret) throw new Error('SESSION_SECRET no está configurado');
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + maxAge };
  const data = b64urlEncode(enc.encode(JSON.stringify(body)));
  const sig = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(data));
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** Verifica firma y expiración. Devuelve el payload o null. Nunca tira. */
export async function verifySession(token, secret) {
  try {
    if (!token || !secret) return null;
    const [data, sig] = String(token).split('.');
    if (!data || !sig) return null;
    const ok = await crypto.subtle.verify('HMAC', await key(secret), b64urlDecode(sig), enc.encode(data));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlDecode(data)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Lee una cookie del header `Cookie`. */
export function readCookie(cookieHeader, name = COOKIE_NAME) {
  if (!cookieHeader) return null;
  for (const part of String(cookieHeader).split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function setCookie(token, { maxAge = MAX_AGE, secure = true } = {}) {
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) flags.push('Secure');
  return flags.join('; ');
}

export function clearCookie({ secure = true } = {}) {
  const flags = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) flags.push('Secure');
  return flags.join('; ');
}

/** Sesión del request, o null. Es la única puerta: toda función la llama. */
export async function sessionFrom(request, secret) {
  const token = readCookie(request.headers.get('cookie'), COOKIE_NAME);
  return verifySession(token, secret);
}
