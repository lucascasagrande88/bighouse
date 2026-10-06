// Imprime HTML a PDF A4 con Chromium: node _build/kit/print_pdf.mjs entrada.html salida.pdf [captura-portada.png]
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');

const [input, output, preview] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true });
if (preview) await page.screenshot({ path: preview, fullPage: true });
await browser.close();
console.log('pdf', output);
