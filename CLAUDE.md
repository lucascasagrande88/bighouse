# CLAUDE.md — Chimichurri Diseño

Este repo es el hub de Chimichurri y de sus demos para clientes (cada demo vive en su propia carpeta: `/electricomercio`, `/gimnasio`, etc.).

## Lo que vendemos (no negociable)

A Chimichurri no lo contratan por "una página que vende tornillos": lo contratan por el **diseño**. Un catálogo funcional con tipografía y cards queda como plantilla de WordPress, y eso **no se entrega**.

Toda landing o demo lleva este valor agregado:

1. **Imágenes en todo el recorrido.** La web se cuenta con imágenes de punta a punta, no solo con texto y cajas:
   - hero / landing (desktop 16:9 y mobile 9:16),
   - una imagen por rubro o categoría,
   - imagen por proyecto o segmento (si hay),
   - imagen de contacto / ubicación,
   - bandas o transiciones entre secciones que acompañen el scroll.
2. **Movimiento.** Las imágenes se animan con parallax (capas fondo / medio / frente, con recortes PNG transparentes cuando haga falta) y reveals al scroll. Respetar `prefers-reduced-motion`.
3. **Video.** Por lo menos un loop de video en el hero o en una sección clave (corto, mudo, en loop, liviano, con póster de respaldo).
4. **Dirección de arte propia por cliente.** Concepto visual reconocible, paleta y tratamiento de imagen coherentes en todas las piezas. Nada de look genérico de IA (gradientes violeta, glass, tríos de cards porque sí, stock sin contexto local).

## Flujo de imágenes (cómo trabajamos siempre)

Claude no genera imágenes. El flujo es:

1. **Antes de diseñar**, Claude entrega un `IMAGE_PROMPTS.md` en la carpeta del demo con:
   - el concepto visual y un bloque de estilo fijo (para que todas las imágenes salgan coherentes),
   - un prompt por imagen y por video, con **nombre de archivo, formato, proporción y uso** (qué sección, qué capa de parallax).
2. Lucas genera las imágenes en GPT (y los videos en la herramienta de video) y las devuelve con esos nombres de archivo.
3. Claude integra todo: optimiza (WebP/AVIF + `srcset`, videos MP4/WebM livianos con póster), arma parallax y reveals, y hace QA en desktop y en 375 px.

No esperar a que Lucas pida la lista: si un demo no tiene imágenes, el primer entregable es la lista de prompts.

## Reglas de integridad

- No inventar precios, stock, testimonios, logos oficiales, certificaciones ni datos de contacto.
- No generar una fachada o un local con el cartel del cliente: eso se presenta como real y no lo es. Para la fachada, usar una foto real (del cliente o de Street View, con permiso) o una escena genérica sin marca.
- Las imágenes generadas no llevan texto, logos ni marcas comerciales.

## Antes de entregar

- QA real con navegador en 1440 / 1024 / 768 / 375: sin errores de consola, sin assets rotos, sin scroll horizontal.
- Revisar con ojo de director de arte: si parece plantilla, no está terminado.
- Demo nuevo = carpeta nueva y deploy nuevo. Nunca pisar el sitio de otro cliente ni el principal.
