// Recorrido completo del panel en Chromium: node _build/test/e2e.mjs <url> <password> <carpeta-capturas> [prefijo]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
import assert from 'node:assert/strict';

const [base, password, shots, prefix = 'panel'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'https://example.com' : undefined));
const shot = (name) => page.screenshot({ path: `${shots}/${prefix}-${name}.png` });
const step = (s) => console.log('·', s);

step('login incorrecto');
await page.goto(`${base}/admin/`);
await page.waitForSelector('#login:not([hidden])');
await shot('01-login');
await page.fill('#password', 'equivocada');
await page.click('#login-form button[type=submit]');
await page.waitForSelector('#login-error:not([hidden])');
assert.match(await page.textContent('#login-error'), /incorrecta/);

step('login correcto');
await page.fill('#password', password);
await page.click('#login-form button[type=submit]');
await page.waitForSelector('#app:not([hidden])');
await page.waitForSelector('.field');
const frame = page.frameLocator('#frame');
await page.waitForTimeout(800);
await shot('02-panel');
const fieldCount = await page.locator('.field').count();
console.log('  campos en la portada:', fieldCount);
assert.ok(fieldCount > 50);

step('clic en un texto de la vista previa abre su campo');
const lead = frame.locator('.hero-lead').first();
await lead.click();
await page.waitForTimeout(500);
const activeKey = await page.evaluate(() => document.activeElement?.closest('.field')?.dataset.key);
console.log('  campo activo:', activeKey);
assert.match(activeKey, /\.hero\.lead$/);

step('editar texto: se ve al instante en la vista previa');
const NEW = 'Texto de prueba editado desde el panel.';
const input = page.locator(`.field[data-key="${activeKey}"] .field-input`);
await input.fill(NEW);
await page.waitForTimeout(300);
assert.equal((await lead.textContent()).trim(), NEW);
assert.match(await page.textContent('#status'), /1 cambio sin guardar/);
await shot('03-editando');

step('cursiva');
const kickerKey = await page.locator('.field').nth(1).getAttribute('data-key');
const kicker = page.locator(`.field[data-key="${kickerKey}"] .field-input`);
await kicker.click();
await page.keyboard.press('End');
await page.keyboard.press('Shift+Home');
await page.locator(`.field[data-key="${kickerKey}"] .field-tools button`, { hasText: 'Cursiva' }).click();
assert.match(await kicker.innerHTML(), /<i>|<em>/);

step('guardar');
await page.click('#save');
await page.waitForSelector('#toast:not([hidden])');
assert.match(await page.textContent('#toast'), /Guardado/);
assert.match(await page.textContent('#status'), /Todo guardado/);
await shot('04-guardado');
const live = await (await fetch(`${base}/`)).text();
assert.ok(live.includes(NEW), 'la web publicada muestra el texto nuevo');

step('contacto');
await page.click('#tab-contact');
const firstContact = page.locator('#contact-fields input').first();
await firstContact.fill('+34 611 22 33 44');
await shot('05-contacto');
await page.click('#save');
await page.waitForSelector('#toast:not([hidden])');
const live2 = await (await fetch(`${base}/`)).text();
assert.ok(live2.includes('+34 611 22 33 44') || live2.includes('34611223344'), 'teléfono nuevo publicado');

step('Google (SEO)');
await page.click('#tab-seo');
await page.fill('#seo-title', 'Título de prueba para Google');
await shot('06-google');
await page.click('#save');
await page.waitForSelector('#toast:not([hidden])');
const live3 = await (await fetch(`${base}/`)).text();
assert.ok(live3.includes('<title>Título de prueba para Google</title>'));

step('historial: volver a la versión original');
await page.click('[data-open="history-dialog"]');
await page.waitForSelector('#history-list li');
await shot('07-historial');
const items = await page.locator('#history-list li').count();
assert.ok(items >= 3);
await page.locator('#history-list li').last().locator('button').click();
await page.waitForSelector('#toast:not([hidden])');
await page.waitForTimeout(600);
const live4 = await (await fetch(`${base}/`)).text();
assert.ok(!live4.includes(NEW), 'restaurado al original');
assert.ok(!live4.includes('Título de prueba para Google'));

step('cambiar de página');
const options = await page.locator('#page-select option').evaluateAll((os) => os.map((o) => o.value));
const other = options.find((v) => v !== '/' && v !== '/privacidad/') || '/privacidad/';
await page.selectOption('#page-select', other);
await page.waitForTimeout(1200);
assert.ok((await page.locator('.field').count()) > 5);
await shot('08-otra-pagina');

step('diálogo de contraseña');
await page.click('[data-open="password-dialog"]');
await shot('09-contrasena');
await page.keyboard.press('Escape');

step('móvil');
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await mob.newPage();
mp.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`));
await mp.goto(`${base}/admin/`);
await mp.fill('#password', password);
await mp.click('#login-form button[type=submit]');
await mp.waitForSelector('.field');
await mp.screenshot({ path: `${shots}/${prefix}-10-movil-editar.png` });
await mp.click('.mobile-switch [data-view=preview]');
await mp.waitForTimeout(800);
await mp.screenshot({ path: `${shots}/${prefix}-11-movil-vista.png` });

await browser.close();
const real = errors.filter((e) => !/favicon|401 \(Unauthorized\)/.test(e));
if (real.length) { console.log('ERRORES:', real); process.exit(1); }
console.log('OK — recorrido completo sin errores');
