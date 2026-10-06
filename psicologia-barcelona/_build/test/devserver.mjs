// Servidor local que imita Netlify para probar el panel sin publicar:
//   node _build/test/devserver.mjs <web> [puerto]
// Sirve <web>/public, la API /api/cms (con almacenamiento en memoria) y aplica los textos como la edge function.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const key = process.argv[2] || 'sol';
const port = Number(process.argv[3] || 8787);
const siteDir = path.join(ROOT, key);
const lib = (f) => pathToFileURL(path.join(siteDir, 'netlify/lib', f)).href;
const { createHandler } = await import(lib('handler.mjs'));
const { applyCms } = await import(lib('apply.mjs'));
const { SITE } = await import(lib('site.mjs'));

export function memoryStore() {
  const m = new Map();
  return {
    async get(k, opts = {}) { if (!m.has(k)) return null; const v = m.get(k); return opts.type === 'json' ? JSON.parse(v) : v; },
    async set(k, v) { m.set(k, String(v)); },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ key: k })) }; },
    _map: m,
  };
}

const store = memoryStore();
const env = (name) => process.env[name];
const handle = createHandler({ store, env, site: SITE });
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

async function resolveFile(p) {
  let file = path.join(siteDir, 'public', decodeURIComponent(p));
  if (!file.startsWith(path.join(siteDir, 'public'))) return null;
  try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); await stat(file); return file; } catch { return null; }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname === '/api/cms') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const response = await handle(request, { ip: req.socket.remoteAddress });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  const file = await resolveFile(url.pathname);
  if (!file) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(siteDir, 'public/404.html'))); return; }
  const ext = path.extname(file);
  let body = await readFile(file);
  if (ext === '.html' && !url.pathname.startsWith('/admin') && url.searchParams.get('cms') !== 'original') {
    const data = await store.get('data', { type: 'json' });
    body = applyCms(body.toString('utf8'), data, SITE);
  }
  res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(body);
}).listen(port, () => console.log(`${key} en http://localhost:${port}`));
