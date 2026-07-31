// Verificación de los tickets que emite Netlify. Misma función de firma que el
// resto del sistema: shared/session.mjs, sin duplicar criptografía.

import { verifySession } from '../../shared/session.mjs';

export function auth(requiredAction) {
  return async (req, res, next) => {
    const secret = process.env.WORKER_SECRET;
    if (!secret) return res.status(500).json({ ok: false, error: 'WORKER_SECRET no configurado en el worker.' });

    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
    const payload = await verifySession(token, secret);

    if (!payload || payload.scope !== 'worker') {
      return res.status(401).json({ ok: false, error: 'Ticket inválido o vencido.' });
    }
    if (requiredAction && payload.action !== requiredAction) {
      return res.status(403).json({ ok: false, error: `Este ticket no habilita "${requiredAction}".` });
    }

    req.ticket = payload;
    next();
  };
}
