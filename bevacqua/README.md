# Bevacqua — Look & More

La web de Bevacqua: contenido editorial, calendario de Esteban, turnos para clientes, alquiler de puestos para profesionales y panel de administración.

- `public/`: el sitio estático. `index.html` es la home y `admin/` es el panel.
- `netlify/functions/api.mjs`: la API. Guarda configuración, turnos, alquileres, mensajes y archivos subidos en Netlify Blobs.
- `PROMPTS.md`: los prompts para generar imágenes con ChatGPT.

## Deploy (Netlify)

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
| POST | `/api/book` | Reserva un turno de cliente. Valida que el horario siga libre |
| POST | `/api/pro-book` | Pide un puesto de profesional. Queda pendiente hasta que el admin lo apruebe |
| POST | `/api/contact` | Formulario de contacto |
| GET | `/api/media/:id` | Sirve las fotos y videos subidos (soporta Range) |
| * | `/api/admin/*` | Panel. Requiere el header `x-admin-key` |
