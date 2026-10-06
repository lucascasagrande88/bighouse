// Aplica los textos del panel de control a cada página HTML antes de enviarla.
// Si algo falla, Netlify sirve la página original (onError: 'bypass').
import { getStore } from '@netlify/blobs';
import { applyCms } from '../lib/apply.mjs';
import { SITE } from '../lib/site.mjs';

export default async (request, context) => {
  const url = new URL(request.url);
  // El panel pide la versión original (sin cambios) para la vista previa.
  if (url.searchParams.get('cms') === 'original') return context.next();

  // Sin ETag de la versión estática: si no, el navegador podría quedarse con una copia vieja.
  const headers = new Headers(request.headers);
  headers.delete('if-none-match');
  headers.delete('if-modified-since');
  const response = await context.next(new Request(request, { headers }));
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response;

  const data = await getStore('cms').get('data', { type: 'json' });
  if (!data) return response;

  const html = applyCms(await response.text(), data, SITE);
  const out = new Headers(response.headers);
  out.delete('content-length');
  out.delete('etag');
  out.delete('last-modified');
  out.set('cache-control', 'public, max-age=0, must-revalidate');
  return new Response(html, { status: response.status, headers: out });
};

export const config = {
  path: '/*',
  excludedPath: ['/admin/*', '/api/*', '/assets/*', '/fonts/*', '/*.css', '/*.js', '/*.svg', '/*.png', '/*.jpg', '/*.webp', '/*.xml', '/*.txt', '/*.woff2', '/*.json'],
  onError: 'bypass',
};
