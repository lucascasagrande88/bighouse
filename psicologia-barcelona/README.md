# Psicología Barcelona — 3 webs + panel de control

| Carpeta | Web | Netlify | Idiomas |
|---|---|---|---|
| `conjunta/` | Psicoanálisis en Barcelona | https://psicoanalisis-en-barcelona.netlify.app | ES · EN · PT + blog (ES) |
| `sol/` | Sol Galiana · Psicóloga | https://sol-galiana-psicologia.netlify.app | ES · EN |
| `nahuel/` | Nahuel Ponce · Psicólogo | https://nahuel-psicologia-barcelona.netlify.app | ES · PT |

Cada web tiene un **panel de control en `/admin`** (con contraseña) para que la clienta o el cliente edite todos los textos, los datos de contacto y el título/descripción para Google.

## Estructura de cada web

```
sol/
  public/            la web estática (HTML, CSS, fuentes, imágenes) + public/admin (el panel)
  netlify/
    functions/cms.mjs        API del panel: /api/cms (entrar, guardar, historial, contraseña)
    edge-functions/cms.js    aplica los textos guardados a cada página antes de enviarla
    lib/                     lógica compartida (sanitizado, auth, aplicar cambios, site.mjs generado)
  netlify.toml       publish = "public"
  package.json       única dependencia: @netlify/blobs
```

## Cómo funciona el panel

- El build publica cada texto envuelto en marcadores: `<!--cms:es.hero.lead-->Texto<!--/cms-->`.
- Lo que se guarda en el panel vive en **Netlify Blobs** (store `cms`, clave `data`). No hay base de datos ni servicios externos.
- La **edge function** lee `data` en cada visita y reemplaza el contenido entre marcadores, el `<title>`/descripción de la página y los teléfonos/emails cambiados. Si falla, Netlify sirve la página original (`onError: bypass`).
- El HTML que llega del panel se limpia en el servidor (`netlify/lib/sanitize.mjs`): sólo cursiva, negrita, saltos de línea y enlaces; en los textos largos (`*.body`: artículos y privacidad) también párrafos, subtítulos, listas y citas.
- Cada guardado deja la versión anterior en `history/…` (se conservan 30) y se puede restaurar desde el panel.
- Contraseña: hash scrypt en la variable de entorno `CMS_PASSWORD_HASH` (ya cargada en los 3 sitios, junto con `CMS_SECRET`). Si la clienta cambia la contraseña desde el panel, el nuevo hash se guarda en Blobs (`auth`) y tiene prioridad. Sesiones firmadas de 12 h; 8 intentos fallidos = bloqueo de 15 min por IP.
- `/admin` y `/api` no se indexan (`robots.txt`, `X-Robots-Tag`, `noindex`).

## Publicar (deploy)

Las funciones del panel **no se publican arrastrando un zip** a Netlify: hace falta que Netlify construya el sitio. Dos formas:

**A · Netlify CLI (desde tu computadora, la primera vez pide iniciar sesión):**

```bash
cd psicologia-barcelona/sol         # o conjunta / nahuel
npm install
npx netlify-cli deploy --prod --site <SITE_ID>
```

**B · Conectar el repositorio** (Site configuration → Build & deploy → Link repository): rama la que corresponda, *Base directory* `psicologia-barcelona/<web>`, *Publish directory* `public`, build command vacío. Después cada push publica solo.

Site IDs: conjunta `33329ecf-a346-405d-baf5-f10dee83deb6`, sol `9f47e700-8347-4651-903f-faf8e9350e75`, nahuel `1c70862c-7589-44cc-9184-3cfbebd1e684`.

Después de publicar, comprobar: `https://<web>/admin/` abre el login, se puede entrar con la contraseña y un cambio guardado aparece en la web en menos de un minuto.

## Editar el código o los textos de base

Los textos originales se editan en `_build/content/` y se regenera:

```
_build/
  content/common.py     teléfonos, emails, barrios de los consultorios, datos de contacto editables
  content/conjunta.py   textos de la web conjunta (ES / EN / PT)
  content/sol.py        textos de Sol (ES / EN)
  content/nahuel.py     textos de Nahuel (ES / PT)
  content/blog.py       artículos del blog (agregar arriba de la lista) y textos fijos del blog
  content/legal.py      privacidad y 404
  templates/            estructura HTML (Jinja2)
  static/app.js         interacciones compartidas (se copia a cada web)
  cms.py                marcadores editables
  cms_runtime/          panel (/admin) y funciones de Netlify (se copian a cada web)
  build.py              generador
```

```bash
pip install jinja2
cd psicologia-barcelona
python3 _build/build.py            # las 3 webs
python3 _build/build.py sol        # sólo una
```

Ojo: si se cambia un texto de base que la clienta ya editó en el panel, se sigue viendo la versión del panel (las claves se mantienen). Si se cambia la estructura (por ejemplo, se agrega un párrafo en medio de una lista), las claves de esa lista se corren.

Los estilos están en `<web>/public/styles.css`, y las imágenes en `<web>/public/assets/` (webp, versiones `-lg` y `-sm`).

## Contraseñas del panel

- Generar un hash nuevo: `node _build/tools/hash-password.mjs 'Contraseña-Nueva-123'` y cargarlo en Netlify como `CMS_PASSWORD_HASH` (variable secreta, scope *Functions*).
- Si alguien cambió la contraseña desde el panel y la olvidó: cargar un hash nuevo y después
  `NETLIFY_AUTH_TOKEN=<token personal> node _build/tools/reset-panel-password.mjs <SITE_ID>` (requiere `npm install` en `sol/`).

## Pruebas

```bash
node --test _build/test/panel.test.mjs                 # sanitizado, API, historial, contraseña, bloqueo
node _build/test/devserver.mjs sol 8787                # emula Netlify en local (con CMS_PASSWORD_HASH en el entorno)
node _build/test/e2e.mjs http://localhost:8787 <pass> <carpeta-capturas> sol   # recorrido completo en Chromium
```

`_build/kit/` genera el video tutorial (`tutorial.mjs`) y el manual en PDF (`build_kit.py` + `print_pdf.mjs`).

## Diseño

- **Conjunta — "dos arcos"**: papel cálido, tinta y vino. Instrument Serif + Hanken Grotesk.
- **Sol — "un sol que sale"**: crema, verde bosque, terracota y rubor. Fraunces + Figtree. Las fotos del consultorio están sólo en «Dónde atiendo».
- **Nahuel — "gótico fino"**: blanco y negro con grano, numeración romana e inicial blackletter. Cormorant Garamond + UnifrakturMaguntia + Manrope.

## Privacidad

Las webs no publican direcciones exactas: sólo el barrio (Gràcia, Sants) y la nota «Dirección exacta al confirmar la cita». El schema.org sólo declara Barcelona.

## Google Analytics

En `_build/build.py`, completar `'analytics': 'G-XXXXXXX'` en cada web y regenerar. Sólo se carga si la persona acepta el aviso. Se miden clics en WhatsApp y email (evento `contact_click`).

## Pendiente de confirmar con Sol y Nahuel

- Apellido "Ponce" de Nahuel (sale de su email).
- Números de colegiada/o (COPC), si quieren mostrarlos.
- Qué consultorio usa cada uno (hoy se muestran los dos barrios en las tres webs; se puede cambiar desde el panel).
- Revisar los 3 artículos del blog, que están escritos a partir de sus propios textos.
- Instagram de Nahuel, si tiene.
