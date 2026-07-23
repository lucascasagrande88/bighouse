/* ============================================================
   DONATA · TEMA VISUAL
   ------------------------------------------------------------
   Punto único para cambiar la identidad visual del sitio.
   Estos valores se inyectan como variables CSS (:root) al
   cargar la página. Cambiando este archivo, se re-tematiza
   TODO el sitio sin tocar componentes.

   Reutilizable para otros restaurantes de Chimichurri:
   copiá /donata, reemplazá /config y /data, y listo.
   ============================================================ */

window.DONATA_THEME = {
  colors: {
    // ── Base
    carbon:  '#0B0B0B',   // Negro carbón (fondo principal)
    carbon2: '#141210',   // Carbón cálido (superficies)
    carbon3: '#1D1A17',   // Superficie elevada

    // ── Marca
    // PENDIENTE: confirmar el rojo exacto desde el logo real de Donata.
    rojo:    '#C1272D',   // Rojo Donata (placeholder desde gráfica de parrilla)
    rojoDim: '#8E1B20',
    fuego:   '#F5B700',   // Amarillo fuego (acento cálido / brasa)
    brasa:   '#FF6A2B',   // Naranja brasa (partículas / detalles de fuego)

    // ── Neutros cálidos
    crema:   '#F2E8D5',   // Crema cálido (texto sobre oscuro / fondos claros)
    blanco:  '#FFFFFF',
    humo:    '#77736D',   // Gris humo (texto secundario)
    borde:   'rgba(242, 232, 213, 0.10)',
  },

  fonts: {
    // Titulares: sans condensada, pesada y expresiva
    display: "'Anton', 'Barlow Condensed', Impact, sans-serif",
    // Subtítulos / kickers condensados
    condensed: "'Barlow Condensed', 'Anton', sans-serif",
    // Cuerpo y navegación: sans limpia
    body: "'Inter', system-ui, -apple-system, sans-serif",
    // Detalle manuscrito (solo microdetalles, nunca texto importante)
    script: "'Caveat', cursive",
  },

  radius: {
    sm: '4px',
    md: '10px',
    lg: '18px',
    pill: '999px',
  },
};

/* Inyecta el tema como variables CSS. Se ejecuta apenas se carga el script. */
(function applyTheme() {
  var t = window.DONATA_THEME;
  var r = document.documentElement.style;
  var c = t.colors;
  r.setProperty('--carbon', c.carbon);
  r.setProperty('--carbon-2', c.carbon2);
  r.setProperty('--carbon-3', c.carbon3);
  r.setProperty('--rojo', c.rojo);
  r.setProperty('--rojo-dim', c.rojoDim);
  r.setProperty('--fuego', c.fuego);
  r.setProperty('--brasa', c.brasa);
  r.setProperty('--crema', c.crema);
  r.setProperty('--blanco', c.blanco);
  r.setProperty('--humo', c.humo);
  r.setProperty('--borde', c.borde);
  r.setProperty('--f-display', t.fonts.display);
  r.setProperty('--f-condensed', t.fonts.condensed);
  r.setProperty('--f-body', t.fonts.body);
  r.setProperty('--f-script', t.fonts.script);
  r.setProperty('--r-sm', t.radius.sm);
  r.setProperty('--r-md', t.radius.md);
  r.setProperty('--r-lg', t.radius.lg);
  r.setProperty('--r-pill', t.radius.pill);
})();
