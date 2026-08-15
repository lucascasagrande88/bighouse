# Setup de Supabase (una sola vez, ~5 min) — para Lucas

Con esto, el dueño entra con el PIN, cambia precios y toca **Guardar**: se
guardan en la nube y se actualizan al instante en las dos webs, para todos.
**Sin GitHub, sin copiar/pegar.** Es gratis.

## Paso 1 — Crear el proyecto Supabase
1. Entrá a https://supabase.com → **Sign in** (con GitHub o email).
2. **New project**. Nombre: `grupodelsur`. Poné una contraseña de base de datos
   (guardala). Región: **South America (São Paulo)**. **Create new project**.
3. Esperá ~2 minutos a que quede listo.

## Paso 2 — Cargar la base y los precios (un solo pegado)
1. En el proyecto: menú izquierdo → **SQL Editor** → **New query**.
2. Abrí el archivo **`supabase.sql`** (está en esta misma carpeta), copiá
   **todo** el contenido y pegalo.
3. Tocá **Run** (o Ctrl/Cmd + Enter).

Eso crea la tabla, la seguridad, el PIN y **carga los 80 productos actuales**.

## Paso 3 — Copiar las 2 credenciales
En el proyecto: **Project Settings** (el engranaje) → **API**. Copiá:
- **Project URL** → ej. `https://abcdxyz.supabase.co`
- **Project API keys → `anon` `public`** → un texto largo `eyJ...`

> La `anon key` es **pública** (va en la página, es lo normal). **Nunca** uses
> ni pegues la `service_role` key.

## Paso 4 — Pegarlas en la web
En **`index.html`**, arriba de todo (líneas ~14-15), reemplazá:
```js
const SUPABASE_URL = "PEGAR_URL_DE_SUPABASE";   // ← poné tu Project URL
const SUPABASE_KEY = "PEGAR_ANON_KEY";          // ← poné tu anon key
```
Guardá / commiteá el cambio.

## Paso 5 — Publicar
Cualquiera de las dos:
- **Linkeás Netlify al repo** (recomendado): cada commit redeploya solo.
  Publish directory = `grupodelsur` (ver `LEEME-TECNICO.md`).
- **O** corrés `./hacer-zips.sh` y subís los zips de `deploy-zips/` a Netlify
  (arrastrar y soltar). Importante: corré el script **después** de pegar las
  credenciales, así quedan dentro del zip.

**Listo.** Probá: entrá a la web con `?admin=1`, PIN `1234`, cambiá un número,
**Guardar**. Recargá: el precio quedó. 🎉

---

## Cambiar el PIN
Supabase → **Table Editor** → tabla **`ajustes`** → fila `pin` → editá `valor`.
(No hay que tocar código.)

## Cómo queda la seguridad
- La web (con la `anon key`) **solo puede leer** precios y **llamar** a dos
  funciones: `verificar_pin` y `actualizar_precios`.
- **No se puede escribir** en la tabla directamente (RLS lo bloquea).
- Guardar exige el **PIN**, que se valida **en el servidor** (no está en la
  página). Sin el PIN correcto, no se guarda nada.

## Si Supabase no está configurado todavía
La web funciona igual: muestra los precios del respaldo (`precios.json` del
repo / copia embebida). Solo el botón **Guardar** queda a la espera de las
credenciales.
