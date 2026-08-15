# Grupo Cementera del Sur — Catálogos con precios dinámicos

Guía técnica (para Lucas). El manual simple para el dueño está en
**`TUTORIAL-PRECIOS.pdf`**. El setup del backend está en **`SUPABASE-SETUP.md`**.

---

## Qué hace

El dueño entra con `?admin=1` + PIN, cambia precios y toca **Guardar**. Se
guardan en **Supabase** y se actualizan al instante en las **dos** webs
(mayorista y minorista), para todos los clientes. **Sin GitHub, sin
copiar/pegar, sin re-subir nada.**

> Antes se usaba `localStorage`, que era local al navegador del dueño (por eso
> "no andaba": el cliente nunca veía los cambios). Ahora la fuente de verdad es
> una base de datos compartida (Supabase).

---

## Estructura

```
grupodelsur/
├── index.html            ← una sola página sirve las dos webs (detecta el tier)
├── supabase.sql          ← se pega en Supabase: crea tablas, seguridad y carga los 80 productos
├── precios.json          ← SEMILLA + respaldo (si Supabase no responde, la web muestra esto)
├── SUPABASE-SETUP.md      ← setup del backend, paso a paso (~5 min)
├── TUTORIAL-PRECIOS.pdf   ← manual del dueño (PIN → editar → Guardar)
├── tutorial.html          ← fuente del PDF
├── deploy-zips/           ← zips para subir a Netlify a mano (arrastrar y soltar)
├── hacer-zips.sh          ← regenera los zips desde index.html
└── LEEME-TECNICO.md       ← este archivo
```

## Cómo funciona (arquitectura)

- **Fuente de verdad:** tabla `precios_config` en Supabase (una fila, `data`
  jsonb con todo el catálogo: `{negocio, actualizado, productos:[{id,cat,cod,
  nom,sub,min,may}]}`).
- **Lectura:** `index.html` hace `GET .../rest/v1/precios_config` con la
  `anon key`. Carga en **2 fases**: pinta al instante con la copia local/
  embebida y refresca con lo que hay en Supabase. Nunca queda en blanco.
- **Guardar:** llama a la función `actualizar_precios(p_pin, p_data)` por RPC.
  La función **valida el PIN en el servidor** y actualiza la fila. RLS impide
  escribir la tabla directamente. El PIN no está en la página.
- **Tier:** una sola página; detecta mayorista/minorista por el dominio
  (`?tier=may|min` para forzar; los zips ya vienen forzados con `TIER_FORZADO`).

## Config (arriba de `index.html`)

```js
const SUPABASE_URL = "https://xxxx.supabase.co";  // Project URL
const SUPABASE_KEY = "eyJ...";                      // anon key (pública, OK)
```
Mientras estén en `PEGAR_...`, la web muestra precios del respaldo y el botón
Guardar avisa que falta configurar. Ver `SUPABASE-SETUP.md`.

> La `anon key` es pública por diseño (va en clientes web). **Nunca** commitees
> la `service_role` key.

---

## Deploy en Netlify (una vez)

Los dos sitios (`grupodelsurcementera-minorista` y `-mayorista`) publican la
**misma carpeta `grupodelsur`** y cada uno se muestra según su dominio.

**Opción A — Link al repo (recomendado):** en cada sitio, Netlify → link al
repo `lucascasagrande88/bighouse`, rama de deploy, **Publish directory =
`grupodelsur`**, sin build command. Cada commit redeploya solo.

**Opción B — Zip (arrastrar y soltar):** corré `./hacer-zips.sh` (después de
pegar las credenciales de Supabase) y arrastrá cada zip de `deploy-zips/` a la
pestaña **Deploys** del sitio que corresponda.

## Actualizar precios sin app aparte

Como los precios están en Supabase, editar en `index.html` o en `precios.json`
**no** cambia los precios en vivo (esos son solo respaldo/semilla). Los precios
en vivo se cambian desde el botón **Guardar** de la web (o desde el Table
Editor de Supabase, tabla `precios_config`).

## Cambiar el PIN

Supabase → Table Editor → tabla `ajustes` → fila `pin` → editar `valor`.
