// Lógica del panel: entrar, leer, guardar, historial y cambio de contraseña.
// Se separa de la función para poder probarla con un almacenamiento en memoria.
import { cleanPlain, isBlockKey, sanitize } from './sanitize.mjs';
import { hashPassword, newSecret, passwordVersion, signSession, verifyPassword, verifySession, SESSION_HOURS } from './auth.mjs';

const KEY_RE = /^[\w.-]{1,120}$/;
const PHONE_RE = /^\+?[0-9][0-9 ]{6,18}[0-9]$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,120}\.[A-Za-z]{2,24}$/;
const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
const MAX_DATA = 900_000;
const HISTORY_KEEP = 30;
const LIMIT_WINDOW = 15 * 60e3;
const LIMIT_FAILS = 8;
const MIN_PASSWORD = 10;

const empty = () => ({ texts: {}, seo: {}, contact: {}, updatedAt: null });

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function createHandler({ store, env, site }) {
  async function getJSON(key) {
    return (await store.get(key, { type: 'json' })) ?? null;
  }

  async function currentHash() {
    const auth = await getJSON('auth');
    return auth?.hash || env('CMS_PASSWORD_HASH') || null;
  }

  async function secret() {
    const fromEnv = env('CMS_SECRET');
    if (fromEnv) return fromEnv;
    let s = await store.get('secret');
    if (!s) {
      s = newSecret();
      await store.set('secret', s);
    }
    return s;
  }

  async function authorized(req) {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const hash = await currentHash();
    if (!token || !hash) return false;
    return verifySession(await secret(), token, passwordVersion(hash));
  }

  async function tooManyFails(ip) {
    const limits = (await getJSON('limits')) || {};
    const entry = limits[ip];
    return entry && Date.now() - entry.t < LIMIT_WINDOW && entry.n >= LIMIT_FAILS;
  }

  async function registerFail(ip, failed) {
    const limits = (await getJSON('limits')) || {};
    const now = Date.now();
    for (const k of Object.keys(limits)) if (now - limits[k].t > LIMIT_WINDOW) delete limits[k];
    if (failed) {
      const e = limits[ip] && now - limits[ip].t < LIMIT_WINDOW ? limits[ip] : { n: 0, t: now };
      limits[ip] = { n: e.n + 1, t: e.t };
    } else {
      delete limits[ip];
    }
    await store.setJSON('limits', limits);
  }

  async function listHistory() {
    const { blobs } = await store.list({ prefix: 'history/' });
    return blobs.map((b) => b.key).sort().reverse();
  }

  async function historySummary() {
    const keys = await listHistory();
    const out = [];
    for (const key of keys) {
      const snap = await getJSON(key);
      if (!snap) continue;
      out.push({
        id: key.slice('history/'.length),
        savedAt: snap.savedAt,
        changes: Object.keys(snap.data?.texts || {}).length + Object.keys(snap.data?.seo || {}).length + Object.keys(snap.data?.contact || {}).length,
      });
    }
    return out;
  }

  async function snapshot(data, reason) {
    const id = `${Date.now()}`.padStart(15, '0');
    await store.setJSON(`history/${id}`, { savedAt: new Date().toISOString(), reason, data });
    const keys = await listHistory();
    for (const old of keys.slice(HISTORY_KEEP)) await store.delete(old);
  }

  function validateContact(id, value) {
    const def = (site.contacts || []).find((c) => c.id === id);
    if (!def) return { error: 'Dato de contacto desconocido.' };
    const v = String(value).trim();
    if (def.type === 'phone') {
      if (!PHONE_RE.test(v)) return { error: `${def.label}: escribe el número con prefijo, por ejemplo +34 600 00 00 00.` };
      return { value: v.replace(/\s+/g, ' ') };
    }
    if (def.type === 'email') {
      if (!EMAIL_RE.test(v)) return { error: `${def.label}: el email no parece válido.` };
      return { value: v };
    }
    if (def.type === 'instagram') {
      const handle = v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '');
      if (!INSTAGRAM_RE.test(handle)) return { error: `${def.label}: usa sólo letras, números, puntos y guiones bajos.` };
      return { value: handle };
    }
    return { error: 'Tipo de dato desconocido.' };
  }

  function merge(data, body) {
    const next = { texts: { ...data.texts }, seo: { ...data.seo }, contact: { ...data.contact } };
    const errors = [];
    for (const [key, value] of Object.entries(body.texts || {})) {
      if (!KEY_RE.test(key)) { errors.push(`Clave inválida: ${key}`); continue; }
      if (value === null) { delete next.texts[key]; continue; }
      const clean = sanitize(String(value), { block: isBlockKey(key) });
      next.texts[key] = clean;
    }
    for (const [page, value] of Object.entries(body.seo || {})) {
      if (!KEY_RE.test(page)) { errors.push(`Página inválida: ${page}`); continue; }
      if (value === null) { delete next.seo[page]; continue; }
      const title = cleanPlain(value.title || '', 90);
      const description = cleanPlain(value.description || '', 300);
      if (!title && !description) delete next.seo[page];
      else next.seo[page] = { ...(title && { title }), ...(description && { description }) };
    }
    for (const [id, value] of Object.entries(body.contact || {})) {
      if (value === null || value === '') { delete next.contact[id]; continue; }
      const res = validateContact(id, value);
      if (res.error) errors.push(res.error);
      else next.contact[id] = res.value;
    }
    return { next, errors };
  }

  return async function handle(req, context = {}) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';

    if (req.method === 'GET') {
      if (!(await authorized(req))) return json(401, { error: 'Tu sesión terminó. Vuelve a entrar.' });
      const data = (await getJSON('data')) || empty();
      return json(200, { data, history: await historySummary() });
    }
    if (req.method !== 'POST') return json(405, { error: 'Método no permitido.' });

    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Pedido inválido.' });
    }

    if (body.action === 'login') {
      const hash = await currentHash();
      if (!hash) return json(503, { error: 'El panel todavía no tiene contraseña configurada.' });
      if (await tooManyFails(ip)) return json(429, { error: 'Demasiados intentos. Espera 15 minutos y vuelve a probar.' });
      const ok = await verifyPassword(String(body.password || ''), hash);
      await registerFail(ip, !ok);
      if (!ok) return json(401, { error: 'Contraseña incorrecta.' });
      return json(200, { token: signSession(await secret(), passwordVersion(hash)), hours: SESSION_HOURS });
    }

    if (!(await authorized(req))) return json(401, { error: 'Tu sesión terminó. Vuelve a entrar.' });

    if (body.action === 'save') {
      const data = (await getJSON('data')) || empty();
      const { next, errors } = merge(data, body);
      if (errors.length) return json(400, { error: errors.join(' ') });
      next.updatedAt = new Date().toISOString();
      if (JSON.stringify(next).length > MAX_DATA) return json(413, { error: 'Hay demasiado texto guardado. Escríbenos para ampliarlo.' });
      await snapshot(data, 'save');
      await store.setJSON('data', next);
      return json(200, { data: next, history: await historySummary() });
    }

    if (body.action === 'restore') {
      const id = String(body.id || '');
      if (!/^\d{1,20}$/.test(id)) return json(400, { error: 'Versión inválida.' });
      const snap = await getJSON(`history/${id}`);
      if (!snap) return json(404, { error: 'Esa versión ya no existe.' });
      const data = (await getJSON('data')) || empty();
      await snapshot(data, 'restore');
      const restored = { ...empty(), ...snap.data, updatedAt: new Date().toISOString() };
      await store.setJSON('data', restored);
      return json(200, { data: restored, history: await historySummary() });
    }

    if (body.action === 'password') {
      const hash = await currentHash();
      if (!(await verifyPassword(String(body.current || ''), hash))) return json(400, { error: 'La contraseña actual no es correcta.' });
      const next = String(body.next || '');
      if (next.length < MIN_PASSWORD) return json(400, { error: `La contraseña nueva tiene que tener al menos ${MIN_PASSWORD} caracteres.` });
      const newHash = await hashPassword(next);
      await store.setJSON('auth', { hash: newHash, changedAt: new Date().toISOString() });
      return json(200, { token: signSession(await secret(), passwordVersion(newHash)), hours: SESSION_HOURS });
    }

    return json(400, { error: 'Acción desconocida.' });
  };
}
