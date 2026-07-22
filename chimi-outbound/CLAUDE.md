# Contexto para Claude Code — CHIMI Outbound

## Objetivo

Continuar el desarrollo de **CHIMI Outbound**, una alternativa propia y más
simple a Artisan: un agente comercial que recibe prospectos, investiga su
contexto, selecciona una estrategia, personaliza mensajes y controla campañas.

El producto pertenece a Chimichurri, agencia dirigida por Lucas Casagrande. La
marca usa negro, blanco y naranja. Todo el contenido visible debe mantenerse en
español rioplatense, con tono directo y profesional.

## Qué ya funciona

La aplicación es una SPA cliente implementada en `app/page.tsx`:

1. **Pulse**: dashboard con métricas, campaña principal, actividad en vivo,
   funnel y preview de mensajes.
2. **Prospectos**: búsqueda, filtros, alta manual y acceso a personalización.
3. **Campañas**: listado, filtros, pausa/reanudación y métricas por campaña.
4. **Secuencias**: pasos editables, activación/desactivación, alta y borrado.
5. **Plantillas**: selección de contacto, variantes de copy y copiado.
6. **Wizard de campaña**: segmento, canales, mensaje, revisión y activación.
7. **Persistencia**: contactos, campañas y secuencias se guardan en
   `localStorage` con la clave `chimi-outbound-state`.
8. **Responsive**: sidebar en desktop y navegación inferior en mobile.

## Stack

- Next.js 16.2.6
- React 19.2.6
- TypeScript 5.9
- Tailwind CSS 4 importado, aunque el diseño usa CSS propio
- Vinext/Vite para build y despliegue en Sites
- Node.js 22.13+

Comandos:

```bash
npm ci
npm run dev
npm run build
npm test
```

## Archivos que importan

- `app/page.tsx`: tipos, datos demo, estado, vistas e interacciones.
- `app/globals.css`: tokens, componentes y breakpoints.
- `app/layout.tsx`: metadata, idioma y fuentes.
- `.openai/hosting.json`: identidad del proyecto publicado. No alterar el
  `project_id` si se sigue desplegando sobre el mismo sitio.

## Decisiones visuales que deben conservarse

- Paleta: `#17130f`, `#f7f5f1`, `#ffffff`, `#ff5b22`.
- UI editorial y compacta, con tarjetas blancas y bordes suaves.
- Sidebar oscura y naranja reservado para acciones y estados importantes.
- Evitar gradientes genéricos, glassmorphism decorativo y estética de template.
- Mantener densidad profesional: la app debe sentirse como una herramienta,
  no como una landing page.

## Limitaciones reales de la versión actual

- Los datos se guardan sólo en el dispositivo del usuario.
- No existe autenticación ni permisos.
- No hay importación CSV ni conexión a Airtable, Notion, Sheets o CRM.
- No se investiga automáticamente a los prospectos.
- La personalización de mensajes usa reglas locales, no un modelo de IA.
- La ejecución de campañas es simulada.
- No se envían emails, mensajes de LinkedIn ni WhatsApp.
- No se rastrean aperturas, respuestas o reuniones reales.

No describir estas funciones como reales hasta implementar sus integraciones.

## Próxima arquitectura recomendada

Implementar de manera incremental, sin romper el prototipo:

1. Extraer datos, reducers y vistas de `app/page.tsx` a módulos separados.
2. Incorporar persistencia real: PostgreSQL/Supabase o D1.
3. Agregar autenticación y organización/workspace.
4. Crear importación CSV y una primera fuente externa, preferentemente Google
   Sheets o Airtable.
5. Implementar envío de email con Resend, Gmail API o proveedor equivalente.
6. Incorporar jobs/colas, límites diarios, ventanas horarias y cancelación al
   detectar respuesta.
7. Añadir generación de mensajes con salida estructurada y aprobación humana.
8. Añadir webhooks para entregas, rebotes, respuestas y reuniones.
9. Reemplazar las métricas demo por eventos agregados reales.
10. Agregar tests de flujo para creación, pausa y ejecución de campañas.

La automatización de LinkedIn debe tratarse con cautela: puede incumplir
términos de servicio y poner cuentas en riesgo. Priorizar email real antes de
automatizar LinkedIn.

## Criterios de aceptación para cambios

- `npm run build` debe terminar sin errores.
- Desktop y mobile deben conservar navegación usable.
- Botones y formularios visibles deben ejecutar una acción o quedar marcados
  explícitamente como pendientes; no sumar controles decorativos falsos.
- No eliminar datos demo hasta que exista un onboarding o estado vacío claro.
- Mantener accesibilidad básica: labels, estados de foco y nombres de botones.

## Deploy actual

https://lucas-ai-ad-studio.lucasbighouse.chatgpt.site
