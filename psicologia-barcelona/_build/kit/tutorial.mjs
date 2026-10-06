// Graba el video tutorial del panel y saca las capturas del manual.
//   node _build/kit/tutorial.mjs <url-local> <password> <carpeta-salida> <web> <texto-ejemplo>
import { createRequire } from 'node:module';
import { mkdir, rename, readdir } from 'node:fs/promises';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');

const [base, password, out, site, example] = process.argv.slice(2);
await mkdir(`${out}/video-${site}`, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: `${out}/video-${site}`, size: { width: 1280, height: 800 } } });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);
let n = 0;
const snap = async (name) => page.screenshot({ path: `${out}/${site}-tut-${String(++n).padStart(2, '0')}-${name}.png` });

async function caption(text) {
  await page.evaluate((t) => {
    let el = document.getElementById('tut-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tut-caption';
      Object.assign(el.style, { position: 'fixed', zIndex: 9999, left: '50%', bottom: '28px', transform: 'translateX(-50%)', maxWidth: '86%', padding: '14px 22px', borderRadius: '14px', background: 'rgba(20,18,16,.92)', color: '#fff', font: '600 20px/1.35 system-ui, sans-serif', boxShadow: '0 10px 30px rgba(0,0,0,.3)', textAlign: 'center', pointerEvents: 'none' });
      document.body.append(el);
    }
    el.textContent = t;
    el.hidden = !t;
  }, text);
}
async function ring(selector, on = true) {
  await page.evaluate(([s, v]) => { const el = document.querySelector(s); if (el) { el.style.outline = v ? '4px solid #f0a500' : ''; el.style.outlineOffset = v ? '3px' : ''; } }, [selector, on]);
}

await page.goto(`${base}/admin/`);
await page.waitForSelector('#login:not([hidden])');
await caption('1 · Entra a la dirección de tu web + /admin y escribe tu contraseña');
await wait(1500);
await page.locator('#password').pressSequentially(password, { delay: 60 });
await snap('entrar');
await wait(800);
await page.click('#login-form button[type=submit]');
await page.waitForSelector('.field');
await wait(1200);
await caption('2 · A la izquierda están los textos. A la derecha, la vista previa de tu web');
await wait(2600);
await snap('panel');

const frame = page.frameLocator('#frame');
await caption('3 · Haz clic en el texto que quieras cambiar…');
await wait(1200);
await frame.locator('.hero-lead').first().hover();
await wait(900);
await snap('clic-en-texto');
await frame.locator('.hero-lead').first().click();
await wait(1400);
const key = await page.evaluate(() => document.activeElement?.closest('.field')?.dataset.key);
await caption('…y se abre su casilla. Escribe: el cambio se ve al instante');
const input = page.locator(`.field[data-key="${key}"] .field-input`);
await input.click();
await page.keyboard.press('Control+A');
await page.keyboard.press('Backspace');
await page.keyboard.type(example, { delay: 25 });
await wait(1200);
await snap('escribir');

await caption('Cursiva y negrita: selecciona una palabra y usa los botones');
const word = example.split(' ').at(-1).replace(/[.,]$/, '');
await input.evaluate((el, w) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node, last = null;
  while ((node = walker.nextNode())) if (node.data.includes(w)) last = node;
  if (!last) return;
  const i = last.data.lastIndexOf(w);
  const r = document.createRange();
  r.setStart(last, i); r.setEnd(last, i + w.length);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
}, word);
await wait(500);
await page.locator(`.field[data-key="${key}"] .field-tools button`, { hasText: 'Cursiva' }).click();
await wait(1600);
await snap('cursiva');

await caption('4 · Cuando termines, pulsa «Guardar y publicar»');
await ring('#save');
await wait(2000);
await snap('guardar');
await page.click('#save');
await page.waitForSelector('#toast:not([hidden])');
await ring('#save', false);
await caption('Listo: la web se actualiza en menos de un minuto');
await wait(2200);
await snap('guardado');

await caption('5 · ¿Quieres volver atrás? «Volver al texto original» en cada casilla…');
await ring(`.field[data-key="${key}"] .link-button`);
await wait(2300);
await snap('volver-original');
await ring(`.field[data-key="${key}"] .link-button`, false);

await caption('…o «Historial» para recuperar cualquier versión guardada');
await page.click('[data-open="history-dialog"]');
await wait(2400);
await snap('historial');
await page.keyboard.press('Escape');

await caption('6 · Elige otra página o idioma en este menú');
await ring('#page-select');
await wait(2200);
await snap('paginas');
await ring('#page-select', false);

await caption('7 · «Contacto»: teléfono, WhatsApp y email cambian en toda la web');
await page.click('#tab-contact');
await wait(2600);
await snap('contacto');

await caption('8 · «Google»: el título y la descripción que aparecen en los buscadores');
await page.click('#tab-seo');
await wait(2600);
await snap('google');

await caption('9 · Cambia tu contraseña cuando quieras desde «Contraseña»');
await page.click('[data-open="password-dialog"]');
await wait(2200);
await snap('contrasena');
await page.keyboard.press('Escape');
await caption('¡Eso es todo! Si algo no sale, escríbenos: Chimichurri');
await page.click('#tab-texts');
await wait(2600);
await caption('');

await ctx.close();
const vids = (await readdir(`${out}/video-${site}`)).filter((f) => f.endsWith('.webm'));
await rename(`${out}/video-${site}/${vids[0]}`, `${out}/tutorial-${site}.webm`);

// Capturas en móvil
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await mob.newPage();
await mp.goto(`${base}/admin/`);
await mp.fill('#password', password);
await mp.click('#login-form button[type=submit]');
await mp.waitForSelector('.field');
await mp.locator('.field-input').nth(3).click();
await mp.waitForTimeout(600);
await mp.screenshot({ path: `${out}/${site}-tut-movil-editar.png` });
await mp.click('.mobile-switch [data-view=preview]');
await mp.waitForTimeout(1000);
await mp.screenshot({ path: `${out}/${site}-tut-movil-vista.png` });
await browser.close();
console.log('ok', site);
