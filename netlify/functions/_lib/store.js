// Persistencia sobre Netlify Blobs.
//
// Un proyecto es un JSON: metadatos + análisis + adaptación + storyboard +
// referencias a assets. Los archivos pesados (mp4 original, imágenes, renders)
// viven en el storage del worker, acá sólo se guardan sus URLs.

import { getStore } from '@netlify/blobs';

const PROJECTS = 'reel-projects';
const META = 'reel-index';
const RATE = 'reel-rate';

function store(name) {
  return getStore({ name, consistency: 'strong' });
}

function userKey(session) {
  // Todo va namespaceado por usuario: un usuario no puede leer proyectos de otro.
  return String(session.sub || session.email || 'anon').toLowerCase();
}

export function projectKey(session, id) {
  return `${userKey(session)}/${id}.json`;
}

export async function listProjects(session) {
  const s = store(PROJECTS);
  const prefix = `${userKey(session)}/`;
  const { blobs } = await s.list({ prefix });
  const items = await Promise.all(
    blobs.map(async (b) => {
      const p = await s.get(b.key, { type: 'json' });
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        objective: p.objective,
        status: p.status,
        duration: p.duration,
        scenes: Array.isArray(p.scenes) ? p.scenes.length : 0,
        updated_at: p.updated_at,
        created_at: p.created_at,
        thumb_scene: p.scenes && p.scenes[0] ? p.scenes[0].scene_type : null,
      };
    })
  );
  return items.filter(Boolean).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}

export async function getProject(session, id) {
  if (!isSafeId(id)) return null;
  return store(PROJECTS).get(projectKey(session, id), { type: 'json' });
}

export async function putProject(session, project) {
  const now = new Date().toISOString();
  const record = {
    ...project,
    id: project.id,
    owner: userKey(session),
    created_at: project.created_at || now,
    updated_at: now,
  };
  await store(PROJECTS).setJSON(projectKey(session, record.id), record);
  return record;
}

export async function deleteProject(session, id) {
  if (!isSafeId(id)) return false;
  await store(PROJECTS).delete(projectKey(session, id));
  return true;
}

export function newProjectId() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function isSafeId(id) {
  return typeof id === 'string' && /^[a-z0-9_-]{4,48}$/i.test(id);
}

/* ─── control de intentos de login ─── */

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function checkRate(bucket) {
  const s = store(RATE);
  const key = `attempt/${bucket}`;
  const rec = (await s.get(key, { type: 'json' })) || { count: 0, first: Date.now() };
  if (Date.now() - rec.first > WINDOW_MS) return { allowed: true, remaining: MAX_ATTEMPTS };
  return { allowed: rec.count < MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - rec.count) };
}

export async function noteFailure(bucket) {
  const s = store(RATE);
  const key = `attempt/${bucket}`;
  const rec = (await s.get(key, { type: 'json' })) || { count: 0, first: Date.now() };
  if (Date.now() - rec.first > WINDOW_MS) {
    await s.setJSON(key, { count: 1, first: Date.now() });
  } else {
    await s.setJSON(key, { count: rec.count + 1, first: rec.first });
  }
}

export async function clearFailures(bucket) {
  await store(RATE).delete(`attempt/${bucket}`);
}

/* ─── metadatos varios (banco de assets del usuario) ─── */

export async function putMeta(session, key, value) {
  await store(META).setJSON(`${userKey(session)}/${key}.json`, value);
}

export async function getMeta(session, key) {
  return store(META).get(`${userKey(session)}/${key}.json`, { type: 'json' });
}
