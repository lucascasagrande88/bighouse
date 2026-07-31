#!/usr/bin/env node
// Genera la entrada de FACTORY_USERS para una contraseña.
//
//   npm run hash-password -- lucas@chimichurri.com "mi contraseña"
//
// Pegá la salida en la variable de entorno FACTORY_USERS de Netlify.
// La contraseña en texto plano no queda en ningún archivo del repositorio.

import { scryptSync, randomBytes } from 'node:crypto';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Uso: node scripts/hash-password.mjs <email> <contraseña>');
  process.exit(1);
}

if (password.length < 10) {
  console.error('Error: usá una contraseña de 10 caracteres o más.');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');

const entry = { email: email.toLowerCase().trim(), salt, hash };

console.log('\nFACTORY_USERS (un solo usuario):\n');
console.log(JSON.stringify([entry]));
console.log('\nSi ya tenés usuarios, agregá este objeto al array existente:\n');
console.log(JSON.stringify(entry, null, 2));
console.log('\nGenerá también un SESSION_SECRET si no lo tenés:\n');
console.log(randomBytes(32).toString('hex'));
console.log('');
