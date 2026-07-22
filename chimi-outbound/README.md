# CHIMI Outbound

Prototipo funcional de un agente comercial para Chimichurri. Permite gestionar
prospectos, crear campañas, configurar secuencias y generar mensajes
personalizados desde una interfaz responsive.

## Ejecutar localmente

Requisitos: Node.js 22.13 o superior.

```bash
npm ci
npm run dev
```

Para verificar una versión de producción:

```bash
npm run build
```

## Estado actual

- Dashboard con métricas y actividad del agente.
- ABM de prospectos, búsqueda y filtros.
- Importación de prospectos desde CSV (archivo o pegado), con deduplicación
  por email y reporte de filas inválidas.
- Exportación de campañas a CSV desde el panel de funnel.
- Wizard de creación de campañas en cuatro pasos.
- Campañas activas/pausadas y simulación de resultados.
- Secuencia editable de email y LinkedIn.
- Laboratorio de plantillas con personalización por prospecto.
- Persistencia local en el navegador.
- Interfaz responsive para escritorio y celular.
- Tests de flujo sobre la lógica pura (`npm run test:unit`).

La versión actual es un prototipo operativo. No envía emails ni mensajes reales
y todavía no utiliza una base de datos remota.

## Estructura principal

- `app/page.tsx`: estado de la aplicación y composición de vistas.
- `lib/types.ts`: tipos del dominio.
- `lib/data.ts`: datos demo y constantes de UI.
- `lib/logic.ts`: lógica pura (campañas, prospectos, secuencias, métricas).
- `lib/csv.ts`: parser CSV, importación de prospectos y exportación de campañas.
- `lib/storage.ts`: persistencia en `localStorage`.
- `components/`: una vista o modal por archivo.
- `tests/`: tests de flujo (`logic`, `csv`) y de HTML renderizado.
- `app/globals.css`: sistema visual completo y responsive.
- `app/layout.tsx`: metadata y configuración base.
- `CLAUDE.md`: contexto técnico y plan de continuidad para Claude Code.

## Versión publicada

https://lucas-ai-ad-studio.lucasbighouse.chatgpt.site
