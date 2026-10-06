// Borra la contraseña que la clienta/el cliente puso desde el panel, para que vuelva a valer CMS_PASSWORD_HASH.
// Úsalo si se olvidaron la contraseña: primero carga un hash nuevo en Netlify (hash-password.mjs) y después corre:
//   NETLIFY_AUTH_TOKEN=<token personal> node _build/tools/reset-panel-password.mjs <SITE_ID>
// (requiere `npm install` dentro de la carpeta de cualquier web para tener @netlify/blobs)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteID = process.argv[2];
const token = process.env.NETLIFY_AUTH_TOKEN;
if (!siteID || !token) {
  console.error('Uso: NETLIFY_AUTH_TOKEN=... node _build/tools/reset-panel-password.mjs <SITE_ID>');
  process.exit(1);
}
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '../../sol/package.json'));
const { getStore } = await import(require.resolve('@netlify/blobs'));
const store = getStore({ name: 'cms', siteID, token });
await store.delete('auth');
console.log('Listo: el panel vuelve a usar la contraseña de CMS_PASSWORD_HASH.');
