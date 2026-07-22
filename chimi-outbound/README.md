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
- Wizard de creación de campañas en cuatro pasos.
- Campañas activas/pausadas y simulación de resultados.
- Secuencia editable de email y LinkedIn.
- Laboratorio de plantillas con personalización por prospecto.
- Persistencia local en el navegador.
- Interfaz responsive para escritorio y celular.

La versión actual es un prototipo operativo. No envía emails ni mensajes reales
y todavía no utiliza una base de datos remota.

## Estructura principal

- `app/page.tsx`: lógica, estado y vistas del producto.
- `app/globals.css`: sistema visual completo y responsive.
- `app/layout.tsx`: metadata y configuración base.
- `CLAUDE.md`: contexto técnico y plan de continuidad para Claude Code.

## Versión publicada

https://lucas-ai-ad-studio.lucasbighouse.chatgpt.site
