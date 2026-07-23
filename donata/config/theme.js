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
    // ── Base (burdeos profundo / casi negro cálido)
    carbon:  '#120708',   // Fondo principal
    carbon2: '#1C0B0D',   // Superficies
    carbon3: '#2A1013',   // Superficie elevada

    // ── Marca (parrilla clásica: vino + dorado)
    // PENDIENTE: confirmar el rojo/dorado exactos desde el logo real.
    rojo:    '#9E2B25',   // Rojo vino (botones / acentos / activo)
    rojoDim: '#6E1C18',
    fuego:   '#C9A24B',   // Dorado Donata (acento elegante principal)
    brasa:   '#E8702E',   // Naranja brasa (partículas / brillo del fuego)

    // ── Neutros cálidos
    crema:   '#EDE3CE',   // Crema cálido (texto sobre oscuro)
    blanco:  '#FFFFFF',
    humo:    '#9C8E7C',   // Gris cálido (texto secundario)
    borde:   'rgba(237, 227, 206, 0.12)',
  },

  fonts: {
    // Titulares: serif inscripcional elegante (estilo parrilla clásica)
    display: "'Cinzel', 'Playfair Display', Georgia, serif",
    // Navegación, botones y etiquetas: sans limpia y legible
    condensed: "'Inter', system-ui, -apple-system, sans-serif",
    // Acentos serif elegantes (nombres de plato, blurbs)
    serif: "'Cormorant Garamond', Georgia, serif",
    // Cuerpo: sans limpia
    body: "'Inter', system-ui, -apple-system, sans-serif",
    // Detalle serif itálico
    script: "'Cormorant Garamond', Georgia, serif",
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
  r.setProperty('--f-serif', t.fonts.serif);
  r.setProperty('--f-body', t.fonts.body);
  r.setProperty('--f-script', t.fonts.script);
  r.setProperty('--r-sm', t.radius.sm);
  r.setProperty('--r-md', t.radius.md);
  r.setProperty('--r-lg', t.radius.lg);
  r.setProperty('--r-pill', t.radius.pill);
})();
