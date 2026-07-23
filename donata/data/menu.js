/* ============================================================
   DONATA · MENÚ
   ------------------------------------------------------------
   ⚠️  CONTENIDO DE EJEMPLO — CONFIRMAR CON DONATA
       Los platos de abajo son representativos de una parrilla
       y minutas de barrio, cargados como PLACEHOLDER editable.
       Reemplazá nombres, descripciones y precios por los
       reales de Donata antes de publicar. Ver /donata/PENDIENTE.md

   Reglas de datos:
   - price: dejar '' (vacío) si NO está confirmado. No se muestra.
   - tags disponibles: 'destacado' | 'compartir' | 'veggie'
   - img: ruta a foto real (opcional). Vacío = tarjeta tipográfica.

   Cada categoría se renderiza como una pestaña del menú.
   ============================================================ */

window.DONATA_MENU = {
  // Nota que se muestra discreta arriba del menú.
  note: 'Carta de referencia. Consultá disponibilidad y precios del día.',

  // Botón secundario para descargar la carta completa (opcional).
  // PENDIENTE: subir PDF real a /donata/assets/ y activar.
  pdfUrl: '',

  categories: [
    {
      id: 'parrilla',
      name: 'Parrilla',
      blurb: 'Del asador a la mesa.',
      items: [
        { name: 'Asado de tira', desc: 'Tira ancha a la parrilla, cocción lenta.', price: '', tags: ['destacado'] },
        { name: 'Vacío', desc: 'Jugoso, con su borde crocante.', price: '', tags: [] },
        { name: 'Bife de chorizo', desc: 'Corte grueso, bien sellado.', price: '', tags: [] },
        { name: 'Entraña', desc: 'Tierna y sabrosa, punto a elección.', price: '', tags: ['destacado'] },
        { name: 'Pollo a la parrilla', desc: 'Con piel dorada y jugo propio.', price: '', tags: [] },
        { name: 'Achuras', desc: 'Chinchulín, molleja, riñón y chorizo.', price: '', tags: ['compartir'] },
        { name: 'Parrillada para compartir', desc: 'Surtido de la parrilla para la mesa.', price: '', tags: ['compartir', 'destacado'] },
      ],
    },
    {
      id: 'minutas',
      name: 'Minutas',
      blurb: 'Rápido, abundante, de siempre.',
      items: [
        { name: 'Milanesa napolitana', desc: 'Con jamón, salsa y queso gratinado.', price: '', tags: ['destacado'] },
        { name: 'Suprema de pollo', desc: 'Crocante por fuera, tierna por dentro.', price: '', tags: [] },
        { name: 'Bife a caballo', desc: 'Con dos huevos fritos.', price: '', tags: [] },
        { name: 'Milanesa a caballo', desc: 'Clásica, con papas fritas.', price: '', tags: [] },
        { name: 'Lomo completo', desc: 'Sándwich cargado, como tiene que ser.', price: '', tags: [] },
      ],
    },
    {
      id: 'pastas',
      name: 'Pastas',
      blurb: 'Hechas para el domingo.',
      items: [
        { name: 'Ravioles', desc: 'Con la salsa que elijas.', price: '', tags: [] },
        { name: 'Ñoquis', desc: 'Caseros, bien abundantes.', price: '', tags: [] },
        { name: 'Sorrentinos', desc: 'Rellenos, con salsa a elección.', price: '', tags: ['destacado'] },
        { name: 'Tallarines', desc: 'Al pesto, tuco o crema.', price: '', tags: [] },
      ],
    },
    {
      id: 'compartir',
      name: 'Para compartir',
      blurb: 'Para arrancar la mesa.',
      items: [
        { name: 'Provoleta', desc: 'A la parrilla, con orégano y aceite.', price: '', tags: ['compartir', 'veggie'] },
        { name: 'Tabla de fiambres', desc: 'Surtido para picar entre todos.', price: '', tags: ['compartir'] },
        { name: 'Empanadas', desc: 'Carne, pollo, jamón y queso.', price: '', tags: ['compartir'] },
        { name: 'Rabas', desc: 'Crocantes, con limón.', price: '', tags: ['compartir'] },
        { name: 'Papas Donata', desc: 'Con cheddar y verdeo.', price: '', tags: ['compartir', 'destacado'] },
      ],
    },
    {
      id: 'postres',
      name: 'Postres',
      blurb: 'El final feliz.',
      items: [
        { name: 'Flan casero', desc: 'Con dulce de leche y crema.', price: '', tags: ['destacado'] },
        { name: 'Panqueque de dulce', desc: 'Con dulce de leche, tibio.', price: '', tags: [] },
        { name: 'Helado', desc: 'Dos bochas, sabores a elección.', price: '', tags: ['veggie'] },
      ],
    },
    {
      id: 'bebidas',
      name: 'Bebidas',
      blurb: 'Para acompañar.',
      items: [
        { name: 'Gaseosas y aguas', desc: 'Línea completa, bien fría.', price: '', tags: [] },
        { name: 'Cerveza', desc: 'Tirada y en botella.', price: '', tags: [] },
        { name: 'Vinos', desc: 'Carta de tintos y blancos.', price: '', tags: [] },
      ],
    },
    {
      id: 'especiales',
      name: 'Especiales',
      blurb: 'De la casa.',
      items: [
        { name: 'Menú del día', desc: 'Preguntá por la propuesta de hoy.', price: '', tags: ['destacado'] },
        { name: 'Menú para eventos', desc: 'Propuestas para grupos y celebraciones.', price: '', tags: ['compartir'] },
      ],
    },
  ],
};
