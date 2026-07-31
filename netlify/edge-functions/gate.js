// Bloquea el shell de la Factory en el borde: sin sesión válida no se sirve ni
// el HTML. No es la única defensa —cada función verifica la sesión por su
// cuenta— pero evita que las pantallas internas queden colgando en internet.

import { sessionFrom } from '../../shared/session.mjs';

export default async function gate(request, context) {
  const url = new URL(request.url);

  // El login tiene que ser accesible, obvio.
  if (url.pathname === '/content-factory/' || url.pathname === '/content-factory' || url.pathname === '/content-factory/index.html') {
    return context.next();
  }

  const session = await sessionFrom(request, Deno.env.get('SESSION_SECRET'));
  if (session) return context.next();

  const to = new URL('/content-factory/', url.origin);
  to.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(to.toString(), 302);
}

export const config = { path: '/content-factory/*' };
