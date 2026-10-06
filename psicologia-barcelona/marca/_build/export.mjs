// Exporta cada logo SVG a PDF vectorial y PNG transparente de 4000 px de ancho.
//   node marca/_build/export.mjs      (PLAYWRIGHT_PATH y CHROME opcionales)
import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const manifest = JSON.parse(await readFile(path.join(HERE, 'logos.json'), 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
let n = 0;
for (const brand of Object.values(manifest)) {
  const base = path.join(ROOT, brand.folder, 'logos');
  await mkdir(path.join(base, 'pdf'), { recursive: true });
  await mkdir(path.join(base, 'png'), { recursive: true });
  for (const it of brand.items) {
    const svg = await readFile(path.join(base, 'svg', it.file), 'utf8');
    const w = Math.ceil(it.w), h = Math.ceil(it.h);
    const html = `<!doctype html><html><head><style>@page{size:${w}px ${h}px;margin:0}html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}</style></head><body>${svg}</body></html>`;
    const scale = 4000 / w;
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(html);
    const stem = it.file.replace(/\.svg$/, '');
    await page.screenshot({ path: path.join(base, 'png', `${stem}.png`), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.pdf({ path: path.join(base, 'pdf', `${stem}.pdf`), width: `${w}px`, height: `${h}px`, printBackground: false, pageRanges: '1' });
    await page.close();
    n++;
  }
}
await browser.close();
console.log('exportados', n);
