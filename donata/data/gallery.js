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
  // Featured / "platos destacados" del carrusel.
  featured: [
    { src: 'assets/ojo-de-bife.webp',    label: 'Ojo de bife',           category: 'Parrilla', desc: 'A la parrilla, con romero.' },
    { src: 'assets/bife-roquefort.webp', label: 'Bife a la roquefort',   category: 'Parrilla', desc: 'Con papas fritas caseras.' },
    { src: 'assets/sorrentinos.webp',    label: 'Sorrentinos a la crema',category: 'Pastas',   desc: 'Caseros, con parmesano.' },
    { src: 'assets/suprema.webp',        label: 'Suprema a la portuguesa',category:'Minutas',  desc: 'Con champiñones y papas.' },
    { src: 'assets/canelones.webp',      label: 'Canelones de verdura',  category: 'Pastas',   desc: 'Con salsa blanca y jamón.' },
  ],

  // Galería editorial (mosaico asimétrico) — fotos reales de Donata.
  items: [
    { src: 'assets/salon.webp',           label: 'El salón',              span: 'tall', kind: 'foto' },
    { src: 'assets/hero.webp',            label: 'A la parrilla',         span: 'sq',   kind: 'foto' },
    { src: 'assets/bar.webp',             label: 'La barra y la cocina',  span: 'sq',   kind: 'foto' },
    { src: 'assets/carne-salsa.webp',     label: 'Carne con salsa',       span: 'wide', kind: 'foto' },
    { src: 'assets/bife-roquefort-2.webp',label: 'Bife a la roquefort',   span: 'tall', kind: 'foto' },
    { src: 'assets/canelones.webp',       label: 'Canelones caseros',     span: 'sq',   kind: 'foto' },
    { src: 'assets/suprema.webp',         label: 'Suprema con champiñones',span: 'sq',  kind: 'foto' },
    { src: 'assets/sorrentinos.webp',     label: 'Pastas de la casa',     span: 'wide', kind: 'foto' },
  ],
};
