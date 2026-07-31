// Almacenamiento en disco, por proyecto y por job.
//
// El worker es efímero por definición, así que esto es un área de trabajo, no
// un archivo histórico. Lo que hay que conservar se descarga o se sube a un
// bucket. Los jobs viejos se barren solos: sin eso, el disco se llena en una
// semana de uso.

import { mkdir, rm, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = process.env.WORK_DIR || path.resolve(process.cwd(), 'work');
export const PUBLIC_BASE = '/files';
const MAX_AGE_MS = Number(process.env.WORK_TTL_HOURS || 48) * 60 * 60 * 1000;

export function safeSegment(value, fallback = 'anon') {
  const clean = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  return clean.slice(0, 48) || fallback;
}

export function projectDir(projectId) {
  return path.join(ROOT, safeSegment(projectId, 'sin-proyecto'));
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
  return dir;
}

export function jobId(prefix = 'job') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** URL pública de un archivo del área de trabajo. */
export function publicUrl(absPath, baseUrl) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join('/');
  const base = (baseUrl || process.env.PUBLIC_URL || '').replace(/\/+$/, '');
  return `${base}${PUBLIC_BASE}/${rel}`;
}

export async function writeJson(file, data) {
  await ensureDir(path.dirname(file));
  await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  return file;
}

/** Borra directorios de trabajo más viejos que WORK_TTL_HOURS. */
export async function sweep() {
  const removed = [];
  let entries;
  try {
    entries = await readdir(ROOT, { withFileTypes: true });
  } catch {
    return removed;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(ROOT, entry.name);
    try {
      const info = await stat(dir);
      if (Date.now() - info.mtimeMs > MAX_AGE_MS) {
        await rm(dir, { recursive: true, force: true });
        removed.push(entry.name);
      }
    } catch {
      /* si no se puede leer, se deja para la próxima pasada */
    }
  }
  return removed;
}

export async function dirSize(dir) {
  let total = 0;
  const walk = async (d) => {
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else {
        try {
          total += (await stat(full)).size;
        } catch {
          /* ignorar */
        }
      }
    }
  };
  await walk(dir);
  return total;
}
