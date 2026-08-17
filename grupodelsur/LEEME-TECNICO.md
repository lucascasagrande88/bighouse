# Grupo Cementera del Sur — Catálogos con precios dinámicos

Guía técnica (para Lucas). El manual simple del dueño está en
**`TUTORIAL-PRECIOS.pdf`**.

## Qué hace
El dueño entra con `?admin=1` + PIN, cambia precios y toca **Guardar**. Se
guarda en el backend (**Netlify Functions + Netlify Blobs**, dentro de tu
propia cuenta de Netlify) y queda actualizado al instante para todos. **Sin
GitHub para el dueño, sin copiar/pegar, sin cuentas externas, sin Supabase.**

## Estructura
```
grupodelsur/
├── index.html                    ← una sola web sirve las dos listas (detecta por dominio)
├── netlify.toml                  ← config de build (publish + functions)
├── netlify/functions/precios.mjs ← BACKEND: GET lee, POST guarda (valida PIN), usa Blobs
├── precios.json                  ← semilla + respaldo de lectura
├── deploy-zips/                  ← zips listos para arrastrar a Netlify (con la función)
├── hacer-zips.sh                 ← regenera los zips
├── TUTORIAL-PRECIOS.pdf / tutorial.html
└── LEEME-TECNICO.md
```

## Cómo funciona
- **Backend (2 funciones):**
  - `/api/precios` → `GET` devuelve el catálogo (Netlify Blobs `precios`; si está
    vacío, la semilla). `POST {accion:'verificar',pin}` valida PIN.
    `POST {accion:'guardar',pin,data}` guarda toda la lista (con altas, bajas,
    ediciones y flags de foto).
  - `/api/foto` → `GET ?id=` devuelve la imagen (Blobs `fotos`).
    `POST {pin,id,data}` sube (data = dataURL jpeg, ya redimensionada en el
    navegador ~1000px). `POST {pin,id,borrar:true}` la elimina. También marca
    `foto`/`fotoV` en el producto.
- **UNA lista + fotos para las DOS webs:** el sitio **minorista** es el backend;
  el **mayorista** le pega a esa misma API (constante `MINORISTA_URL` +
  `API_BASE`). Así, agregar/quitar/editar/foto se ve en las dos, y cada web
  muestra su propio precio (`min`/`may`). CORS habilitado en las funciones.
- **PIN:** `process.env.PRECIOS_PIN` (si no está, usa `1234`). Cambialo con una
  env var en Netlify (Site configuration → Environment variables).
- **Front:** `index.html` lee de `/api/precios` (respaldo a `precios.json` y a una
  copia embebida, en 2 fases). En admin: cada fila es editable (nombre,
  categoría, detalle, precio) + foto (📷 / ✕) + borrar (🗑) + botón **Agregar
  producto**. Detecta tier por dominio (`?tier=` para forzar; los zips vienen
  forzados con `TIER_FORZADO`).

> Importante: si cambiás el nombre del sitio minorista, actualizá `MINORISTA_URL`
> en `index.html` (es de donde la mayorista lee la lista y las fotos).

## Deploy (elegí una)

**A) Git-link (recomendado, 100% confiable para la función):**
En cada sitio de Netlify → link al repo `lucascasagrande88/bighouse`,
**Base directory = `grupodelsur`**, rama de deploy la que quieras. Netlify
buildea y bundlea la función sola. Cada commit redeploya.

**B) Zip (arrastrar y soltar):**
`deploy-zips/grupodelsur-minorista.zip` → sitio **minorista**;
`grupodelsur-mayorista.zip` → sitio **mayorista**. Netlify → sitio → pestaña
**Deploys** → arrastrás el zip. El zip incluye `netlify.toml` + la función.

> Nota: el deploy automático desde este entorno está **bloqueado por la política
> de egress** (el host de subida de Netlify no está permitido acá), por eso el
> deploy lo hacés vos con A o B. Toda la app y el backend ya están listos.

## Probar
Entrá a la web (o `?admin=1`), PIN `1234`, cambiá un número, **Guardar**.
Recargá: el precio quedó. Para verificar el backend a mano:
`GET https://<tu-sitio>.netlify.app/api/precios` debe devolver el JSON.

## Cambiar el PIN
Netlify → sitio → Environment variables → `PRECIOS_PIN` = tu nuevo PIN. Redeploy.
