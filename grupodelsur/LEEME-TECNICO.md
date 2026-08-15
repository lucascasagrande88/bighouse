# Grupo Cementera del Sur — Catálogos con precios dinámicos

Guía técnica (para Lucas). El manual simple para el dueño está en
**`TUTORIAL-PRECIOS.pdf`**.

---

## Qué se resolvió

**El problema:** las versiones anteriores guardaban los precios editados en
`localStorage`, que es **local al navegador del dueño**. Es decir: el dueño
cambiaba un precio en su celular y solo lo veía él. Los clientes seguían viendo
los precios viejos. Por eso "no andaba".

**La solución:** ahora los precios viven en un único archivo **`precios.json`**
dentro del repositorio. Las dos webs lo leen de ahí. El dueño edita ese archivo
(desde la web o desde GitHub) y, al guardarlo, **Netlify actualiza las dos webs
automáticamente para todos los clientes** en ~1 minuto. Sin mover HTMLs a mano.

---

## Estructura

```
grupodelsur/
├── index.html            ← UNA sola página que sirve las dos webs
│                            (detecta mayorista/minorista sola)
├── precios.json          ← LA fuente de verdad (lo que edita el dueño)
├── TUTORIAL-PRECIOS.pdf  ← manual simple para el dueño
├── tutorial.html         ← fuente del PDF (por si hay que regenerarlo)
└── LEEME-TECNICO.md      ← este archivo
```

### `precios.json`
```json
{
  "negocio": "Grupo Cementera del Sur",
  "actualizado": "2026-08-15",
  "productos": [
    { "id": "001", "cat": "Cementos y Bases", "cod": "36892",
      "nom": "Cemento Loma Negra", "sub": "Bolsa x 50kg",
      "min": 6943, "may": 5950 }
  ]
}
```
- `min` = precio minorista · `may` = precio mayorista.
- Un precio puede ser un número (`6943`) o el texto `"Consultá"`.
- `actualizado` en formato `AAAA-MM-DD` (se muestra como "15 de agosto de 2026").

### `index.html`
- Detecta la lista por el **dominio**: si el hostname contiene `mayor` → mayorista
  (acento verde); si contiene `minor` → minorista (acento naranja). Se puede
  forzar con `?tier=may` o `?tier=min`.
- Al cargar hace `fetch('precios.json')`. Si por algún motivo falla, usa una
  **copia de respaldo embebida** dentro del propio HTML, así la web **nunca**
  queda en blanco.
- Modo admin: `?admin=1` + PIN. Genera el `precios.json` completo listo para pegar.

---

## Conectar los sitios de Netlify al repositorio (una sola vez)

Hoy las webs se suben a mano. Para que se actualicen solas hay que linkearlas al
repo. Para **cada** sitio (`grupodelsurcementera-minorista` y
`grupodelsurcementera-mayorista`):

1. Netlify → el sitio → **Site configuration → Build & deploy → Link repository**
   (o "Import an existing project" si lo creás de cero) → GitHub →
   repo **`lucascasagrande88/bighouse`**.
2. **Branch to deploy:** `claude/dynamic-pricing-setup-xfh64e`
   (o la rama a la que lo mergees).
3. **Base directory / Publish directory:** `grupodelsur`  ← IMPORTANTE.
   (No dejar la raíz: la raíz es el sitio de Chimichurri, no el catálogo.)
4. Build command: **vacío** (es HTML estático). Deploy.

Las dos webs publican **la misma carpeta `grupodelsur`**; cada una se muestra
como mayorista o minorista sola, según su dominio. Como los nombres ya contienen
"mayorista"/"minorista", funciona sin configurar nada más.

> Si algún día usás un dominio propio **sin** esas palabras, agregá `?tier=may`
> / `?tier=min` a la URL, o hardcodeá el tier en `detectarTier()`.

Al quedar linkeado: cada vez que se commitea `precios.json`, Netlify redeploya
las dos webs solo.

---

## Que el dueño pueda editar

El dueño necesita poder commitear `precios.json`. Opciones:

- **Colaborador (recomendado):** GitHub → repo → **Settings → Collaborators →
  Add people** con el usuario del dueño. Con eso puede usar el botón
  "Abrir GitHub" del modo admin y confirmar cambios.
- **Sin cuenta del dueño:** que use el editor visual, toque *Copiar* y te mande
  el texto por WhatsApp; vos lo pegás y commiteás.

---

## Configuración (arriba de todo en `index.html`)

```js
const REPO         = "lucascasagrande88/bighouse";
const RAMA         = "claude/dynamic-pricing-setup-xfh64e"; // = rama que deploya Netlify
const ARCHIVO_JSON = "grupodelsur/precios.json";
const ADMIN_PIN    = "1234";     // cambialo por uno propio
const WA_NUMBER    = "5491150271178";
```
- `RAMA` se usa para el botón **"Abrir GitHub"**. Debe coincidir con la rama que
  deploya Netlify. Si mergeás a otra rama, actualizá este valor.
- Para cambiar el PIN, editá `ADMIN_PIN` (y avisale al dueño).

---

## Upgrade futuro (opcional)

Si querés que el dueño edite sin ver nada de GitHub, se puede sumar
**Decap CMS** (ex Netlify CMS) con Netlify Identity + Git Gateway: login con
email y un formulario que commitea `precios.json` por atrás. Es más setup y más
piezas que pueden fallar; el sistema actual ya cumple "el dueño cambia el precio
y se actualiza para todos".
