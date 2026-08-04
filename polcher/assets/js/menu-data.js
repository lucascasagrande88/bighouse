/* ============================================================
   PÖLCHER — FUENTE ÚNICA DE LA CARTA
   La usan tanto la web (index.html) como la app de pedidos (/pedidos/).
   ------------------------------------------------------------
   ⚠️ CONTENIDO DE EJEMPLO / EDITABLE.
   Según el Brand OS de Pölcher no se inventan precios, ingredientes,
   IBU, graduación ni variedades: reemplazá estos datos por los reales
   antes de publicar. Los precios son PLACEHOLDER para que la app de
   pedidos funcione — cambialos por los de verdad.
   ------------------------------------------------------------
   Campos:
   - price: número en pesos (o null si todavía no lo cargás)
   - img:   ruta a la foto del producto (o null → se muestra un
            placeholder de marca). Poné fotos en assets/img/menu/.
   Birras:
   - style:  estilo (Golden, IPA, Stout, etc.)
   - abv:    graduación alcohólica en % (número o null)
   - ibu:    amargor real en IBU (número o null)
   - bitter: amargor en escala visual 1–5 (para la barrita)
   - body:   cuerpo en escala visual 1–5
   - notes:  notas de cata / descripción corta
   - pairing: con qué marida
   ============================================================ */
window.POLCHER_MENU = {
  burgers: [
    { id: "clasica",  name: "La Clásica",    price: 6500, img: null,
      tag: "La de siempre",  desc: "La que nunca falla. Simple, directa, al punto." },
    { id: "doble",    name: "La Doble",      price: 8200, img: null,
      tag: "Doble medallón", desc: "Doble motivo para venir. Para el hambre en serio." },
    { id: "barrio",   name: "La del Barrio", price: 8900, img: null,
      tag: "La especial",    desc: "Nuestra especial de la casa. La que te hace volver." },
    { id: "veggie",   name: "La Veggie",     price: 7200, img: null,
      tag: "Sin carne",      desc: "Sin carne y con toda la actitud Pölcher." },
    { id: "smash",    name: "Smash",         price: 7400, img: null,
      tag: "Bien crocante",  desc: "Medallón smasheado, bordes crocantes, puro sabor." },
    { id: "papas",    name: "Papas Pölcher", price: 4200, img: null,
      tag: "Para compartir", desc: "Papas y para picar, ideales para bajar la birra." }
  ],

  birras: [
    { id: "golden", name: "Rubia / Golden", price: 3500, img: null,
      style: "Golden Ale", abv: 4.8, ibu: 18, bitter: 1, body: 2,
      notes: "Fresca y suave. La puerta de entrada a la birra.",
      pairing: "La Clásica o papas." },
    { id: "amber",  name: "Roja / Amber",   price: 3800, img: null,
      style: "Amber Ale",  abv: 5.2, ibu: 26, bitter: 2, body: 3,
      notes: "Maltosa, con cuerpo y caramelo. Para la sobremesa.",
      pairing: "La Doble o La del Barrio." },
    { id: "ipa",    name: "IPA",            price: 4200, img: null,
      style: "India Pale Ale", abv: 6.5, ibu: 55, bitter: 4, body: 3,
      notes: "Lupulada, aromática e intensa. Para los que buscan más.",
      pairing: "Smash o algo bien sabroso." },
    { id: "stout",  name: "Negra / Stout",  price: 4200, img: null,
      style: "Dry Stout",  abv: 5.6, ibu: 40, bitter: 3, body: 5,
      notes: "Tostada, cremosa, con notas a café y cacao.",
      pairing: "Postre o sobremesa larga." },
    { id: "weiss",  name: "Trigo / Weiss",  price: 3800, img: null,
      style: "Hefeweizen", abv: 5.0, ibu: 12, bitter: 1, body: 2,
      notes: "Suave y frutada, con notas a banana y clavo de olor.",
      pairing: "La Veggie o para arrancar la noche." },
    { id: "rotativa", name: "Barril rotativo", price: 4000, img: null,
      style: "Cambia siempre", abv: null, ibu: null, bitter: 3, body: 3,
      notes: "Preguntá qué hay tirado hoy. Siempre hay algo nuevo.",
      pairing: "Lo que te recomiende el barman." }
  ]
};
