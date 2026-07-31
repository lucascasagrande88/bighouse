import { clearCookie } from '../../shared/session.mjs';
import { json } from './_lib/http.js';

export const config = { path: '/api/auth/logout', method: 'POST' };

export default async function logout(request) {
  const host = request.headers.get('host') || '';
  const local = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  return json({ ok: true }, { headers: { 'Set-Cookie': clearCookie({ secure: !local }) } });
}
