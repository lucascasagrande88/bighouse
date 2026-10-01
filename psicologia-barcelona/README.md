# Psicología Barcelona — 3 webs

| Carpeta | Web | Netlify | Idiomas |
|---|---|---|---|
| `conjunta/` | Psicoanálisis en Barcelona | https://psicoanalisis-en-barcelona.netlify.app | ES · EN · PT + blog (ES) |
| `sol/` | Sol Galiana · Psicóloga | https://sol-galiana-psicologia.netlify.app | ES · EN |
| `nahuel/` | Nahuel Ponce · Psicólogo | https://nahuel-psicologia-barcelona.netlify.app | ES · PT |

Sitios 100 % estáticos (HTML + CSS + un JS chico), sin dependencias en producción. Las tipografías están autoalojadas en `fonts/` y no se usa ningún CDN externo, así que la CSP es estricta.

## Cómo editar

Los textos **no se editan en el HTML**: se editan en `_build/content/` y después se regenera.

```
_build/
  content/common.py     teléfonos, emails, direcciones, URLs
  content/conjunta.py   textos de la web conjunta (ES / EN / PT)
  content/sol.py        textos de Sol (ES / EN)
  content/nahuel.py     textos de Nahuel (ES / PT)
  content/blog.py       artículos del blog (agregar arriba de la lista)
  content/legal.py      privacidad y 404
  templates/            estructura HTML (Jinja2)
  static/app.js         interacciones compartidas (se copia a cada web)
  build.py              generador
```

```bash
pip install jinja2
cd psicologia-barcelona
python3 _build/build.py            # las 3 webs
python3 _build/build.py sol        # sólo una
```

Los estilos están en `<web>/styles.css`, y las imágenes en `<web>/assets/` (webp, versiones `-lg` y `-sm`).

## Diseño

- **Conjunta — "dos arcos"**: papel cálido, tinta y vino. Los arcos son dos escuchas, una puerta y el marco de cada foto. Instrument Serif + Hanken Grotesk.
- **Sol — "un sol que sale"**: crema, verde bosque (como su jersey), terracota y rubor. Formas orgánicas. Fraunces + Figtree.
- **Nahuel — "gótico fino"**: blanco y negro con grano, numeración romana e inicial blackletter. Cormorant Garamond + UnifrakturMaguntia + Manrope.

## Google Analytics

En `_build/build.py`, completar `'analytics': 'G-XXXXXXX'` en cada web y regenerar. Sólo se carga si la persona acepta el aviso.
Se miden clics en WhatsApp y email (evento `contact_click`).

## Deploy

Cada carpeta se publica tal cual (`publish = "."`, sin build). Desde la carpeta de cada web:

```bash
npx netlify deploy --prod --dir . --site <SITE_ID>
```

Site IDs: conjunta `33329ecf-a346-405d-baf5-f10dee83deb6`, sol `9f47e700-8347-4651-903f-faf8e9350e75`, nahuel `1c70862c-7589-44cc-9184-3cfbebd1e684`.

## Pendiente de confirmar con Sol y Nahuel

- Apellido "Ponce" de Nahuel (sale de su email).
- Números de colegiada/o (COPC), si quieren mostrarlos.
- Qué consultorio usa cada uno (hoy se muestran los dos en las tres webs).
- Revisar los 3 artículos del blog, que están escritos a partir de sus propios textos.
- Instagram de Nahuel, si tiene.
