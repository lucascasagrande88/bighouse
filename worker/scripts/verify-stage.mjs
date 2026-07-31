#!/usr/bin/env node
// Smoke test del motor de render, sin claves de API y sin ffmpeg.
//
//   cd worker && node scripts/verify-stage.mjs
//
// Verifica las dos propiedades de las que depende todo el diseño:
//
//   1. DETERMINISMO — seek(t) dibuja lo mismo siempre, sin importar por dónde
//      se pasó antes. Si esto se rompe, el MP4 deja de coincidir con el preview
//      y el editor se vuelve una mentira.
//   2. TRANSPARENCIA REAL — el modo alfa produce PNG con alfa 0 en las zonas
//      vacías. Un visor de imágenes compone la transparencia sobre negro, así
//      que mirar el archivo no prueba nada: hay que leer los píxeles.
//
// Correlo después de tocar el motor, los componentes o el CSS del stage.
//
// En un entorno donde el Chromium de Playwright no esté disponible, apuntá
// CHROMIUM_PATH a un binario chrome-headless-shell.

import http from 'node:http';
import path from 'node:path';
import { readFile, rm, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.join(REPO, 'worker/work/_verify');

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

let pass = 0;
let fail = 0;
const notes = [];
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? `  ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

/**
 * Aviso, no falla. Se usa para condiciones del entorno —fuentes sin instalar,
 * sin red— que no son defectos del motor. Si esto hiciera fallar el script,
 * verificar el motor en una máquina sin las tipografías sería imposible.
 */
const note = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '!'} ${name}${detail ? `  ${detail}` : ''}`);
  if (ok) pass++;
  else notes.push(`${name}: ${detail}`);
};

/* Servidor mínimo para que el stage cargue por http:// y no por file://. */
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.includes('..')) throw new Error('nope');
    const body = await readFile(path.join(REPO, rel));
    res.writeHead(200, { 'Content-Type': MIME[path.extname(rel)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const project = JSON.parse(await readFile(path.join(REPO, 'engine/demo/demo-project.json'), 'utf8'));
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });

const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

async function open(alpha) {
  await page.goto(`${base}/engine/stage.html?fit=0${alpha ? '&alpha=1' : ''}`, { waitUntil: 'load' });
  const info = await page.evaluate((p) => window.__load(p), project);
  await page.evaluate(() => window.__ready());
  return info;
}

const shot = async (alpha) => page.screenshot({ type: 'png', omitBackground: !!alpha });
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);

console.log('\nMotor de render\n');

const info = await open(false);
check('el stage carga el proyecto', info && info.scenes === project.scenes.length, `${info?.scenes} escenas · ${info?.duration}s`);

/* ─── una escena de cada tipo dibuja algo ─── */

const hashes = {};
const seen = new Set();
for (const s of project.scenes) {
  const t = s.start + (s.end - s.start) * 0.6;
  await page.evaluate((time) => window.__seek(time), t);
  const buf = await shot(false);
  hashes[s.id] = hash(buf);
  const drawn = await page.evaluate(() => {
    const active = [...document.querySelectorAll('.scene')].find((el) => el.style.display !== 'none');
    if (!active) return { text: 0, nodes: 0 };
    return { text: active.textContent.trim().length, nodes: active.querySelectorAll('*').length };
  });
  check(`${s.scene_type.padEnd(14)} dibuja contenido`, drawn.nodes > 0, `${drawn.nodes} nodos · ${drawn.text} caracteres · ${hashes[s.id]}`);
  seen.add(s.scene_type);
}

/* Dos escenas distintas no pueden salir idénticas: sería un componente que
   no lee sus propios datos. */
const unique = new Set(Object.values(hashes));
check('cada escena produce un frame distinto', unique.size === Object.keys(hashes).length, `${unique.size}/${Object.keys(hashes).length} únicos`);

/* ─── determinismo ─── */

let deterministic = true;
for (const s of project.scenes) {
  const t = s.start + (s.end - s.start) * 0.6;
  // Llegar al mismo instante por un camino distinto: saltos hacia adelante y
  // hacia atrás, que es lo que hace un usuario arrastrando el cabezal.
  await page.evaluate((d) => window.__seek(d), project.duration);
  await page.evaluate(() => window.__seek(0));
  await page.evaluate((d) => window.__seek(d / 2), project.duration);
  await page.evaluate((time) => window.__seek(time), t);
  if (hash(await shot(false)) !== hashes[s.id]) deterministic = false;
}
check('seek(t) es determinista viniendo de cualquier lado', deterministic, `${project.scenes.length} escenas comprobadas`);

/* ─── transparencia real ─── */

await open(true);
await page.evaluate((t) => window.__seek(t), project.scenes[3].start + 1.5);
const alphaPng = await shot(true);
const opaquePngPath = path.join(OUT, 'opaco.png');
await open(false);
await page.evaluate((t) => window.__seek(t), project.scenes[3].start + 1.5);
const opaquePng = await shot(false);

const pixels = await page.evaluate(
  async ([a, b]) => {
    const read = async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      let transparent = 0;
      let total = 0;
      for (let y = 4; y < c.height; y += 16) {
        for (let x = 4; x < c.width; x += 16) {
          if (ctx.getImageData(x, y, 1, 1).data[3] === 0) transparent++;
          total++;
        }
      }
      return { corner: [...ctx.getImageData(8, 8, 1, 1).data], transparent, total };
    };
    return { alpha: await read(a), opaque: await read(b) };
  },
  [alphaPng.toString('base64'), opaquePng.toString('base64')]
);

const pct = ((pixels.alpha.transparent / pixels.alpha.total) * 100).toFixed(1);
check('el overlay tiene transparencia real', pixels.alpha.corner[3] === 0 && pixels.alpha.transparent > 0, `${pct}% de la superficie es transparente`);
check('el reel completo es opaco', pixels.opaque.corner[3] === 255, `esquina RGBA ${pixels.opaque.corner.join(',')}`);

/* ─── tipografías ─── */

const fonts = await page.evaluate(() => window.__fonts());
note(
  'las tipografías de la marca están disponibles',
  fonts.display && fonts.body,
  fonts.display && fonts.body ? 'Syne + Inter' : `Syne=${fonts.display} Inter=${fonts.body} — el render usaría la tipografía de sistema`
);

/* ─── velocidad ─── */

const t0 = Date.now();
const N = 20;
for (let n = 0; n < N; n++) {
  await page.evaluate((t) => window.__seek(t), 10 + n / 30);
  await shot(false);
}
const perFrame = (Date.now() - t0) / N;
console.log(
  `\n  velocidad: ${perFrame.toFixed(0)} ms/frame → un reel de ${project.duration}s a 30 fps tarda ` +
    `~${((project.duration * 30 * perFrame) / 1000 / 60).toFixed(1)} min por pasada`
);

check('sin errores de JavaScript en la página', pageErrors.length === 0, pageErrors.join(' · '));

await browser.close();
server.close();
await rm(OUT, { recursive: true, force: true });

console.log(`\n${pass}/${pass + fail + notes.length} chequeos pasados`);
if (notes.length) console.log(`\navisos del entorno (no fallan el motor):\n  ${notes.join('\n  ')}`);
console.log('');
process.exit(fail ? 1 : 0);
