// Pruebas del panel: node --test _build/test/   (desde psicologia-barcelona/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lib = (site, f) => import(pathToFileURL(path.join(ROOT, site, 'netlify/lib', f)).href);
const { sanitize } = await lib('sol', 'sanitize.mjs');
const { applyCms } = await lib('sol', 'apply.mjs');
const { createHandler } = await lib('sol', 'handler.mjs');
const { hashPassword } = await lib('sol', 'auth.mjs');
const { SITE } = await lib('sol', 'site.mjs');

function memoryStore() {
  const m = new Map();
  return {
    async get(k, o = {}) { if (!m.has(k)) return null; const v = m.get(k); return o.type === 'json' ? JSON.parse(v) : v; },
    async set(k, v) { m.set(k, String(v)); },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); },
    async delete(k) { m.delete(k); },
    async list({ prefix = '' } = {}) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  };
}

const PASSWORD = 'clave-de-prueba-123';
async function setup() {
  const hash = await hashPassword(PASSWORD);
  const store = memoryStore();
  const handle = createHandler({ store, env: (n) => (n === 'CMS_PASSWORD_HASH' ? hash : undefined), site: SITE });
  const call = async (method, body, token, ip = '1.1.1.1') => {
    const res = await handle(new Request('http://x/api/cms', {
      method, headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    }), { ip });
    return { status: res.status, body: await res.json() };
  };
  return { store, call };
}

test('sanitize deja sólo formato simple', () => {
  assert.equal(sanitize('Hola <em>mundo</em>'), 'Hola <em>mundo</em>');
  assert.equal(sanitize('<script>alert(1)</script>Hola'), 'Hola');
  assert.equal(sanitize('<img src=x onerror=alert(1)>Hola'), 'Hola');
  assert.equal(sanitize('<b onclick="x">a</b><i>b</i>'), '<strong>a</strong><em>b</em>');
  assert.equal(sanitize('<a href="javascript:alert(1)">x</a>'), 'x');
  assert.equal(sanitize('<a href="https://ej.com">x</a>'), '<a href="https://ej.com" target="_blank" rel="noopener">x</a>');
  assert.equal(sanitize('a < b & c'), 'a &lt; b &amp; c');
  assert.equal(sanitize('&nbsp;Hola&amp;'), '&nbsp;Hola&amp;');
  assert.equal(sanitize('<em>sin cerrar'), '<em>sin cerrar</em>');
  assert.equal(sanitize('<p>Uno</p><h2>Dos</h2>'), 'UnoDos'.replace('Dos', '<br>Dos'));
  assert.equal(sanitize('<p>Uno</p><h2>Dos</h2><ul><li>a</li></ul>', { block: true }), '<p>Uno</p><h2>Dos</h2><ul><li>a</li></ul>');
  assert.equal(sanitize('<!--cms:x-->a<!--/cms-->'), 'a');
  assert.equal(sanitize('x<style>body{}</style><iframe src=x></iframe>'), 'x');
});

test('applyCms reemplaza textos, SEO y contacto', async () => {
  const html = await readFile(path.join(ROOT, 'sol/public/index.html'), 'utf8');
  const out = applyCms(html, {
    texts: { 'es.hero.lead': 'Nuevo <em>texto</em>', 'places.0.zone': 'Eixample' },
    seo: { 'home.es': { title: 'Título "nuevo"', description: 'Desc <b>' } },
    contact: { sol_phone: '+34 611 22 33 44', sol_email: 'nuevo@ejemplo.com', sol_instagram: 'sol.nueva' },
  }, SITE);
  assert.match(out, /<!--cms:es\.hero\.lead-->Nuevo <em>texto<\/em><!--\/cms-->/);
  assert.match(out, /<!--cms:places\.0\.zone-->Eixample<!--\/cms-->/);
  assert.match(out, /<title>Título &quot;nuevo&quot;<\/title>/);
  assert.match(out, /<meta name="description" content="Desc &lt;b&gt;">/);
  assert.ok(!out.includes('605 69 56 03') && !out.includes('34605695603'));
  assert.ok(out.includes('wa.me/34611223344') && out.includes('+34 611 22 33 44'));
  assert.ok(!out.includes('solgaliana@gmail.com') && out.includes('nuevo@ejemplo.com'));
  assert.ok(!out.includes('lic.solgaliana') && out.includes('instagram.com/sol.nueva') && out.includes('@sol.nueva'));
  assert.equal(applyCms(html, null, SITE), html);
});

test('login, guardar, historial, restaurar y contraseña', async () => {
  const { call } = await setup();
  assert.equal((await call('GET')).status, 401);
  assert.equal((await call('POST', { action: 'login', password: 'mala' })).status, 401);
  const login = await call('POST', { action: 'login', password: PASSWORD });
  assert.equal(login.status, 200);
  const token = login.body.token;
  assert.equal((await call('GET', null, token + 'x')).status, 401);

  const saved = await call('POST', { action: 'save', texts: { 'es.hero.lead': '<script>x</script>Hola <em>sí</em>' }, seo: { 'home.es': { title: 'T', description: '' } } }, token);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.data.texts['es.hero.lead'], 'Hola <em>sí</em>');
  assert.deepEqual(saved.body.data.seo['home.es'], { title: 'T' });
  assert.equal(saved.body.history.length, 1);

  const bad = await call('POST', { action: 'save', contact: { sol_phone: '<b>', sol_email: 'no-es-email' } }, token);
  assert.equal(bad.status, 400);
  const badKey = await call('POST', { action: 'save', texts: { 'a b': 'x' } }, token);
  assert.equal(badKey.status, 400);
  const unknown = await call('POST', { action: 'save', contact: { nahuel_phone: '+34 600 000 000' } }, token);
  assert.equal(unknown.status, 400);

  const second = await call('POST', { action: 'save', texts: { 'es.hero.lead': null }, contact: { sol_instagram: '@sol.nueva' } }, token);
  assert.equal(second.body.data.texts['es.hero.lead'], undefined);
  assert.equal(second.body.data.contact.sol_instagram, 'sol.nueva');
  assert.equal(second.body.history.length, 2);

  const oldest = second.body.history.at(-1).id; // versión original (vacía)
  const prev = second.body.history[0].id; // versión con 'Hola sí'
  const restored = await call('POST', { action: 'restore', id: prev }, token);
  assert.equal(restored.body.data.texts['es.hero.lead'], 'Hola <em>sí</em>');
  assert.ok(oldest);

  assert.equal((await call('POST', { action: 'password', current: 'mala', next: 'nueva-clave-segura' }, token)).status, 400);
  assert.equal((await call('POST', { action: 'password', current: PASSWORD, next: 'corta' }, token)).status, 400);
  const changed = await call('POST', { action: 'password', current: PASSWORD, next: 'nueva-clave-segura' }, token);
  assert.equal(changed.status, 200);
  assert.equal((await call('GET', null, token)).status, 401, 'la sesión vieja deja de servir');
  assert.equal((await call('GET', null, changed.body.token)).status, 200);
  assert.equal((await call('POST', { action: 'login', password: PASSWORD })).status, 401);
  assert.equal((await call('POST', { action: 'login', password: 'nueva-clave-segura' })).status, 200);
});

test('bloqueo tras muchos intentos fallidos', async () => {
  const { call } = await setup();
  for (let i = 0; i < 8; i++) assert.equal((await call('POST', { action: 'login', password: 'x' }, null, '9.9.9.9')).status, 401);
  assert.equal((await call('POST', { action: 'login', password: PASSWORD }, null, '9.9.9.9')).status, 429);
  assert.equal((await call('POST', { action: 'login', password: PASSWORD }, null, '8.8.8.8')).status, 200);
});

test('sin contraseña configurada no se puede entrar', async () => {
  const handle = createHandler({ store: memoryStore(), env: () => undefined, site: SITE });
  const res = await handle(new Request('http://x/api/cms', { method: 'POST', body: JSON.stringify({ action: 'login', password: 'x' }) }), {});
  assert.equal(res.status, 503);
});
