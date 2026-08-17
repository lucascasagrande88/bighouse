import { getStore } from '@netlify/blobs';

const getPin = () => process.env.PRECIOS_PIN || '1234';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type'
};
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS }
  });
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    const fotos = getStore('fotos');
    const url = new URL(req.url);

    // GET ?id=XXX  -> devuelve la imagen
    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'falta id' }, 400);
      const res = await fotos.getWithMetadata(id, { type: 'arrayBuffer' });
      if (!res || !res.data) return new Response('', { status: 404, headers: CORS });
      const ct = (res.metadata && res.metadata.ct) || 'image/jpeg';
      return new Response(res.data, {
        headers: { 'content-type': ct, 'cache-control': 'public, max-age=31536000, immutable', ...CORS }
      });
    }

    // POST  -> subir o borrar foto (valida PIN)
    if (req.method === 'POST') {
      let body = {};
      try { body = await req.json(); } catch (_) {}
      if (body.pin !== getPin()) return json({ error: 'PIN incorrecto' }, 403);
      const id = String(body.id || '');
      if (!id) return json({ error: 'falta id' }, 400);

      const datosStore = getStore('precios');
      const data = (await datosStore.get('data', { type: 'json' })) || { productos: [] };
      const prod = (data.productos || []).find(p => p.id === id);

      if (body.borrar) {
        await fotos.delete(id);
        if (prod) { prod.foto = false; prod.fotoV = Date.now(); }
      } else {
        const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(body.data || '');
        if (!m) return json({ error: 'imagen invalida' }, 400);
        const bytes = Buffer.from(m[2], 'base64');
        if (bytes.length > 3_000_000) return json({ error: 'imagen muy grande' }, 400);
        await fotos.set(id, bytes, { metadata: { ct: m[1] } });
        if (prod) { prod.foto = true; prod.fotoV = Date.now(); }
      }
      await datosStore.setJSON('data', data);
      return json({ ok: true, data });
    }

    return json({ error: 'metodo no permitido' }, 405);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
};

export const config = { path: '/api/foto' };
