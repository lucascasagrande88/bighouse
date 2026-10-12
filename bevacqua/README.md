# Bevacqua — Look & More

La web de Bevacqua: experiencia, turnera por ciudad (Buenos Aires / Bariloche), lista de precios, coworking (por hora, día o mes) y panel de administración.

- `public/`: el sitio estático. `index.html` es la home y `admin/` es el panel.
- `netlify/functions/api.mjs`: la API. Guarda configuración, turnos, alquileres, mensajes y archivos subidos en Netlify Blobs.
- `PROMPTS-IMAGENES.md`: los prompts para generar las imágenes con ChatGPT, en dos tandas.
- `public/img/`: las imágenes de la web. La tanda 1 ya está cargada; los lugares de la tanda 2 usan imágenes de la tanda 1 hasta que lleguen las definitivas (ver estado en `PROMPTS-IMAGENES.md`). Para cambiarlas, reemplazá el archivo con el mismo nombre o subilas desde `/admin` → *Imágenes de la web*.

## Deploy (Netlify)

**Opción rápida (Netlify CLI, desde esta carpeta):**

```bash
npm install
npx netlify-cli login
npx netlify-cli link --id 8d5bfd18-14cc-4200-a6fd-f90dae7fe742   # proyecto bevacqua-look-and-more
npx netlify-cli deploy --prod
```

> No uses "arrastrar y soltar" (Netlify Drop): sube solo lo estático y deja afuera la API, así que las reservas y el panel no funcionarían.
> Si deployás en un proyecto nuevo, creá la variable `ADMIN_PASSWORD` en *Project configuration → Environment variables*.

**Opción Git:**

Proyecto: `bevacqua-look-and-more` → https://bevacqua-look-and-more.netlify.app

Para conectarlo al repo en Netlify:

1. **Project configuration → Build & deploy → Link repository**, elegí `lucascasagrande88/bighouse`.
2. Base directory: `bevacqua`. Los demás campos se toman de `netlify.toml`.
3. Variable de entorno `ADMIN_PASSWORD`: ya está cargada en el proyecto. Es la contraseña del panel `/admin`.

## Desarrollo local

```bash
cd bevacqua
npm install
ADMIN_PASSWORD=dev npm run dev   # http://localhost:8888  (panel: /admin, pass "dev")
```

## API

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/public` | Datos públicos: agenda, servicios, contenido y ocupación |
| POST | `/api/book` | Reserva un turno con uno o varios servicios (y su largo). Valida que el horario siga libre |
| POST | `/api/pro-book` | Pide un puesto de coworking (hora, día, semana o mes). Queda pendiente hasta que el admin lo apruebe |
| POST | `/api/contact` | Formulario de contacto |
| GET | `/api/media/:id` | Sirve las fotos y videos subidos (soporta Range) |
| * | `/api/admin/*` | Panel. Requiere el header `x-admin-key` |
