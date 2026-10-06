// HTML → PDF (tamaño definido por @page) + PNG de vista previa de cada página.
//   node marca/_build/render.mjs entrada.html salida.pdf [carpeta-previas] [escala]
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');

const [input, output, previews, scale = '2'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ deviceScaleFactor: Number(scale) });
await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await mkdir(path.dirname(path.resolve(output)), { recursive: true });
await page.pdf({ path: output, printBackground: true, preferCSSPageSize: true });
if (previews) {
  await mkdir(previews, { recursive: true });
  const sheets = page.locator('.sheet');
  const n = await sheets.count();
  const stem = path.basename(output, '.pdf');
  for (let i = 0; i < n; i++) await sheets.nth(i).screenshot({ path: path.join(previews, `${stem}-${String(i + 1).padStart(2, '0')}.png`) });
}
await browser.close();
console.log('pdf', path.basename(output));
