// Genera el hash de una contraseña nueva para el panel (va en la variable CMS_PASSWORD_HASH de Netlify).
//   node _build/tools/hash-password.mjs 'La-Contraseña-Nueva'
import { hashPassword } from '../cms_runtime/netlify/lib/auth.mjs';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Uso: node _build/tools/hash-password.mjs "contraseña de 10 caracteres o más"');
  process.exit(1);
}
console.log(await hashPassword(password));
