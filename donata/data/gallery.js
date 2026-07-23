/* ============================================================
   DONATA · GALERÍA
   ------------------------------------------------------------
   ⚠️  Cargar fotos y reels REALES de Donata.
       Mientras 'src' esté vacío, se muestra un slot tipográfico
       claramente identificado (placeholder), NO una foto de stock.

   Cada item:
   - src:    ruta a imagen real (webp/avif/jpg). Vacío = placeholder.
   - label:  qué muestra (se usa como texto del placeholder y alt).
   - span:   tamaño en la grilla editorial: 'tall' | 'wide' | 'sq'
   - kind:   'foto' | 'reel'  (reel = vertical, con ícono de play)
   ============================================================ */

window.DONATA_GALLERY = {
  // Featured / "platos destacados" del carrusel (reutiliza este set).
  featured: [
    { src: '', label: 'Parrillada completa', category: 'Parrilla', desc: 'Para compartir en la mesa.' },
    { src: '', label: 'Milanesa napolitana', category: 'Minutas', desc: 'Grande y gratinada.' },
    { src: '', label: 'Provoleta al fuego', category: 'Para compartir', desc: 'Para arrancar.' },
    { src: '', label: 'Sorrentinos caseros', category: 'Pastas', desc: 'Con salsa a elección.' },
    { src: '', label: 'Flan casero', category: 'Postres', desc: 'Con dulce de leche.' },
  ],

  // Galería editorial (mosaico asimétrico).
  items: [
    { src: '', label: 'La parrilla encendida', span: 'tall', kind: 'foto' },
    { src: '', label: 'Platos que llegan a la mesa', span: 'sq', kind: 'foto' },
    { src: '', label: 'El salón lleno', span: 'sq', kind: 'foto' },
    { src: '', label: 'Corte al punto', span: 'wide', kind: 'foto' },
    { src: '', label: 'Reel: del fuego al plato', span: 'tall', kind: 'reel' },
    { src: '', label: 'La mesa de los domingos', span: 'sq', kind: 'foto' },
    { src: '', label: 'Fachada de Donata', span: 'sq', kind: 'foto' },
    { src: '', label: 'El equipo de la casa', span: 'wide', kind: 'foto' },
  ],
};
