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
- **Backend:** función en `/api/precios`.
  - `GET` → devuelve el catálogo (de Netlify Blobs; si está vacío, la semilla).
  - `POST {accion:'verificar', pin}` → valida el PIN (server-side).
  - `POST {accion:'guardar', pin, data}` → si el PIN es correcto, escribe en Blobs.
- **PIN:** `process.env.PRECIOS_PIN` (si no está, usa `1234`). Cambialo con una
  env var en Netlify (Site configuration → Environment variables).
- **Front:** `index.html` lee de `/api/precios` (con respaldo a `precios.json` y
  a una copia embebida, en 2 fases: pinta al instante y refresca). Guarda por
  POST. Detecta mayorista/minorista por el dominio (`?tier=may|min` para forzar;
  los zips ya vienen forzados con `TIER_FORZADO`).
- **Blobs:** cada sitio tiene su propio store (no hace falta compartir: el dueño
  edita la lista de cada web por separado, que es como trabaja).

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
