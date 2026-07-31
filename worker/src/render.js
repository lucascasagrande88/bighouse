// Render frame por frame con Playwright.
//
// El truco es no dejar que el navegador anime nada. Se llama window.__seek(t),
// que dibuja el estado exacto de ese instante, y se saca la captura. Como el
// motor es determinista, el frame 372 sale siempre igual — y sale igual que en
// el preview del editor, que usa el mismo código.
//
// Para el export con alfa: omitBackground de Playwright + el stage en modo
// ?alpha=1. Eso da PNG con transparencia real, que es lo que come After Effects.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const STAGE_W = 1080;
const STAGE_H = 1920;

/**
 * @param {object} o
 * @param {object} o.project     el scenes.json completo
 * @param {string} o.stageUrl    URL de engine/stage.html
 * @param {string} o.outDir      dónde escribir los PNG
 * @param {number} o.fps
 * @param {boolean} o.alpha      true = overlay transparente
 * @param {(p:{frame:number,total:number})=>void} [o.onProgress]
 */
export async function renderFrames({ project, stageUrl, outDir, fps = 30, alpha = false, onProgress }) {
  await mkdir(outDir, { recursive: true });

  const duration = Number(project.duration) || 0;
  if (duration <= 0) throw new Error('El proyecto no tiene duración: no hay nada que renderizar.');
  const total = Math.max(1, Math.round(duration * fps));

  const browser = await chromium.launch({
    // Fuera de la imagen Docker (un VPS, un runner con Chromium propio) el
    // binario que trae Playwright puede no estar. CHROMIUM_PATH lo resuelve sin
    // tener que tocar el código.
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      '--font-render-hinting=none',
      '--hide-scrollbars',
      '--autoplay-policy=no-user-gesture-required',
      '--allow-file-access-from-files',
    ],
  });

  const errors = [];
  const warnings = [];
  try {
    const page = await browser.newPage({
      viewport: { width: STAGE_W, height: STAGE_H },
      deviceScaleFactor: 1,
    });
    page.on('pageerror', (e) => errors.push(String(e.message)));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      // El worker renderiza sin red: las fuentes remotas y el favicon fallan
      // siempre, y avisarlo en cada render entrena a ignorar los avisos. Hay que
      // mirar la URL y no el texto, porque el mensaje de consola es sólo
      // "Failed to load resource: net::ERR_CONNECTION_RESET", sin el recurso.
      const url = (m.location() && m.location().url) || '';
      if (/favicon|fonts\.googleapis|fonts\.gstatic/.test(url)) return;
      errors.push(url ? `${m.text()} (${url})` : m.text());
    });

    const url = new URL(stageUrl);
    url.searchParams.set('fit', '0');
    if (alpha) url.searchParams.set('alpha', '1');
    await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 60000 });

    const info = await page.evaluate((p) => window.__load(p), project);
    if (!info || !info.scenes) throw new Error('El stage no pudo cargar el proyecto.');
    await page.evaluate(() => window.__ready());

    const fonts = await page.evaluate(() => window.__fonts());
    if (!fonts.display || !fonts.body) {
      const missing = [!fonts.display && 'Syne', !fonts.body && 'Inter'].filter(Boolean);
      warnings.push(
        `${missing.join(' y ')} ${missing.length > 1 ? 'no están disponibles' : 'no está disponible'} en el worker: ` +
          'el reel se renderiza con la tipografía de sistema. Instalá los .ttf (ver worker/fonts/README.md).'
      );
    }

    const pad = String(total).length + 1;
    const frames = [];

    for (let n = 0; n < total; n++) {
      const t = n / fps;
      await page.evaluate((time) => window.__seek(time), t);
      const file = path.join(outDir, `f_${String(n).padStart(pad, '0')}.png`);
      await page.screenshot({ path: file, omitBackground: alpha, type: 'png' });
      frames.push(file);
      if (onProgress && (n % 15 === 0 || n === total - 1)) onProgress({ frame: n + 1, total });
    }

    return {
      frames: frames.length,
      pattern: path.join(outDir, `f_%0${pad}d.png`),
      fps,
      duration,
      // Los errores de la página no abortan el render, pero se devuelven: un
      // 404 de imagen produce un video con un hueco y hay que poder verlo.
      page_errors: [...new Set(errors)].slice(0, 10),
      warnings,
    };
  } finally {
    await browser.close();
  }
}
