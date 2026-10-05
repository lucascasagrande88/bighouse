# ELECTRICOMERCIO — Prompts de imágenes y video

Devolvé cada archivo con **el nombre exacto** de la tabla (PNG o JPG en máxima calidad; yo los paso a WebP/AVIF). Si una imagen sale mal, regenerala con el mismo prompt: el bloque de estilo mantiene la coherencia.

---

## Concepto: "De la caja al encendido"

La web cuenta una instalación de punta a punta mientras scrolleás: el material crudo (rollos, térmicas, cajas), las manos que lo instalan, el tablero que se cierra y al final **la luz que se prende**. Arriba todo es grafito y penumbra; a medida que bajás, el amarillo de la luz va ganando. El amarillo del sitio (#F5B800) es la luz de la obra: no es un color de decoración.

Rasgos que lo hacen local y no stock:
- Código de colores argentino en los cables: **marrón** (fase), **celeste** (neutro) y **verde-amarillo** (tierra).
- Tomas argentinas de **tres patas planas en V** (IRAM 2073) y térmicas en **riel DIN**.
- Paredes de ladrillo hueco y revoque de una obra en Buenos Aires, no un loft yanqui.

## Bloque de estilo (pegalo al principio de CADA prompt de imagen)

```
Fotografía publicitaria fotorrealista, rodada con cámara full frame y lente de 35 mm o 50 mm. Paleta grafito y gris carbón, con un único acento de luz amarillo cálido (amarillo de seguridad, similar a #F5B800). Luz real: tungsteno cálido o luz natural lateral, sombras profundas y suaves, contraste alto pero con detalle en las sombras. Texturas reales: cobre, PVC, metal pintado, ladrillo y revoque, polvo de obra. Ambientación en Buenos Aires, Argentina. Sin logos, sin marcas, sin texto, sin carteles legibles y sin marcas de agua. Sin filtro amarillo general, sin look plástico ni 3D, sin estética de render.
```

Si sale una persona: solo manos y antebrazos, o un plano medio de espaldas o fuera de foco. Nunca un primer plano de cara (evita caras raras y que parezca un cliente real).

---

## 1. Hero (lo primero que ve Pablo)

| Archivo | Formato | Uso |
|---|---|---|
| `hero-desktop.jpg` | 16:9 · 2400×1350 | Fondo del hero en desktop (capa de fondo del parallax) |
| `hero-mobile.jpg` | 9:16 · 1080×1920 | Fondo del hero en mobile |
| `hero-cable-cutout.png` | 1:1 · 1600×1600 · **fondo transparente** | Capa de frente del parallax: se mueve más rápido que el fondo |

**hero-desktop.jpg**
```
[BLOQUE DE ESTILO] Interior de una obra en Buenos Aires al atardecer: pared de ladrillo hueco a medio revocar, con canaletas abiertas y caño corrugado embutido que sube hasta un tablero eléctrico de embutir abierto, con térmicas en riel DIN. Una sola lámpara colgante encendida, de luz amarilla cálida, ilumina la escena desde arriba a la derecha; el resto queda en penumbra grafito. Toda la mitad izquierda del cuadro queda oscura y limpia (pared en sombra) para poner texto encima. Profundidad de campo media, polvo de obra suspendido en el haz de luz. Formato horizontal 16:9.
```

**hero-mobile.jpg**
```
[BLOQUE DE ESTILO] La misma escena de obra al atardecer, compuesta en vertical: arriba, una lámpara colgante encendida con luz amarilla cálida; en el centro, la pared de ladrillo hueco con un caño corrugado embutido que baja hasta un tablero eléctrico abierto, en el tercio inferior. El tercio superior queda en sombra limpia para poner el título. Polvo suspendido en el haz de luz. Formato vertical 9:16.
```

**hero-cable-cutout.png**
```
[BLOQUE DE ESTILO] Un rollo de cable unipolar color marrón, apenas desenrollado, con la punta pelada mostrando el cobre brillante, y a su lado un tramo de cable celeste y otro verde-amarillo enroscados. Fotografía de producto con luz amarilla cálida rasante desde un costado. Aislado sobre FONDO TRANSPARENTE (PNG con canal alfa), sin sombra proyectada en el piso, bordes limpios.
```

---

## 2. Proyectos (Residencial / Comercial / Industrial)

Las tres con la misma luz y la misma cámara, para que se lean como una serie. Una lámpara o luminaria encendida en cada una (el acento amarillo).

| Archivo | Formato | Uso |
|---|---|---|
| `proyecto-residencial.jpg` | 4:5 · 1600×2000 | Fondo de la card Residencial |
| `proyecto-comercial.jpg` | 4:5 · 1600×2000 | Fondo de la card Comercial |
| `proyecto-industrial.jpg` | 4:5 · 1600×2000 | Fondo de la card Industrial |

**proyecto-residencial.jpg**
```
[BLOQUE DE ESTILO] Living de un departamento porteño en reforma: piso de madera cubierto con nylon, pared recién enduida con una caja rectangular de embutir abierta y cables marrón, celeste y verde-amarillo asomando. Al fondo, una ventana con la luz azulada del anochecer; adelante, un portalámpara colgante con una lámpara LED encendida, luz cálida. Atmósfera íntima y doméstica. Encuadre vertical 4:5, con el tercio inferior oscuro para poner texto.
```

**proyecto-comercial.jpg**
```
[BLOQUE DE ESTILO] Local comercial vacío en una avenida de Buenos Aires, de noche, con la persiana a medio subir. En el cielorraso, paneles LED cuadrados recién instalados: uno encendido con luz cálida y los demás apagados. En la pared, un cablecanal blanco que recorre la pared hasta un tablero de aplicar. Piso de cemento alisado. Reflejos suaves en la vidriera. Encuadre vertical 4:5, con el tercio inferior oscuro para poner texto.
```

**proyecto-industrial.jpg**
```
[BLOQUE DE ESTILO] Interior de una nave industrial en el conurbano bonaerense, con estructura metálica y techo de chapa. Una bandeja portacable perforada recorre la parte alta con cables gruesos; abajo, un gabinete estanco metálico abierto con contactores y borneras. Un reflector LED encendido baña una columna con luz cálida; el resto queda en penumbra grafito con un poco de humo o polvo en el aire. Escala imponente. Encuadre vertical 4:5, con el tercio inferior oscuro para poner texto.
```

---

## 3. Rubros (una por categoría del catálogo)

Serie de bodegón de producto: **misma superficie, misma luz y mismo ángulo** en las 8. Superficie de chapa o mesada de taller color grafito, luz principal amarilla cálida rasante desde la izquierda y relleno frío muy suave desde la derecha. Cámara cenital levemente inclinada (unos 60°). Productos genéricos, sin marcas visibles.

Prefijo común para las 8 (va después del bloque de estilo):
```
Bodegón de producto sobre una mesada de taller de chapa color grafito con marcas de uso, cámara a unos 60°, luz principal amarilla cálida rasante desde la izquierda, relleno frío muy suave desde la derecha, fondo que se pierde en sombra. Composición con aire alrededor. Formato 1:1.
```

| Archivo | Formato | Contenido (agregalo después del prefijo) |
|---|---|---|
| `rubro-cables.jpg` | 1:1 · 1400×1400 | `Tres rollos de cable unipolar (marrón, celeste y verde-amarillo) apilados, uno con la punta pelada mostrando el cobre, y un tramo de cable tipo taller gris enroscado adelante.` |
| `rubro-protecciones.jpg` | 1:1 · 1400×1400 | `Un tramo corto de riel DIN con tres interruptores termomagnéticos y un disyuntor diferencial blancos montados, apoyado en diagonal, con una palanca levantada.` |
| `rubro-tomas.jpg` | 1:1 · 1400×1400 | `Módulos de tomacorriente argentinos de tres patas planas en V y módulos de tecla de punto, sueltos y algunos encastrados en un bastidor, junto a una tapa blanca.` |
| `rubro-cajas.jpg` | 1:1 · 1400×1400 | `Cajas rectangulares de embutir de PVC, un tramo de caño corrugado enroscado y una curva de caño rígido, ordenados como una composición geométrica.` |
| `rubro-iluminacion.jpg` | 1:1 · 1400×1400 | `Una lámpara LED de rosca E27 encendida que es la fuente principal de luz de la escena, rodeada de otras lámparas apagadas y un panel LED cuadrado de canto.` |
| `rubro-conectores.jpg` | 1:1 · 1400×1400 | `Borneras para riel DIN, terminales a compresión tipo ojal sueltos y una ficha macho de tres patas planas, en detalle macro con el cobre brillando.` |
| `rubro-fuentes.jpg` | 1:1 · 1400×1400 | `Una fuente switching metálica perforada con su bornera a la vista, y una tira LED enrollada y encendida en luz cálida que ilumina la mesada.` |
| `rubro-herramientas.jpg` | 1:1 · 1400×1400 | `Una pinza amperométrica digital con el display apagado (sin números legibles), un pelacables, un buscapolo y un rollo de cinta aisladora negra.` |

---

## 4. Armá tu lista (sección "Cómo pedir")

| Archivo | Formato | Uso |
|---|---|---|
| `lista-manos.jpg` | 3:2 · 2100×1400 | Imagen de la sección de pasos |

```
[BLOQUE DE ESTILO] Primer plano de las manos de un electricista con un celular en una mano y la otra señalando un tablero abierto. La pantalla del teléfono está apagada o muestra una interfaz de lista borrosa e ilegible, sin logos. Tiene ropa de trabajo gris oscura y la luz cálida del tablero le ilumina los dedos. Fondo de pared de obra fuera de foco. Encuadre horizontal 3:2, con el lado derecho más vacío para poner texto.
```

---

## 5. Bandas de parallax entre secciones (el recorrido)

Tres imágenes panorámicas que separan secciones y avanzan la historia: **apagado → cableando → encendido**. Las tres con el mismo encuadre de una misma pared, cambia solo el estado. Si podés, generá la segunda y la tercera editando la primera, para que coincidan.

| Archivo | Formato | Va entre |
|---|---|---|
| `banda-1-apagado.jpg` | 21:9 · 2520×1080 | Hero → Categorías |
| `banda-2-cableado.jpg` | 21:9 · 2520×1080 | Catálogo → Armá tu lista |
| `banda-3-encendido.jpg` | 21:9 · 2520×1080 | Armá tu lista → Contacto |

**banda-1-apagado.jpg**
```
[BLOQUE DE ESTILO] Panorámica de una pared de obra de ladrillo hueco, en penumbra casi total. Se ven las canaletas abiertas y vacías, una caja de embutir sin cables y un portalámpara colgando apagado. Luz azul fría y tenue entrando desde un costado. Formato panorámico 21:9.
```

**banda-2-cableado.jpg** (edición de la anterior, mismo encuadre)
```
Misma pared, mismo encuadre y misma cámara que la imagen anterior. Ahora por las canaletas corren cables marrón, celeste y verde-amarillo dentro de un caño corrugado, y la caja tiene un módulo de toma a medio colocar. Aparece un primer reflejo de luz cálida desde fuera de cuadro. El resto no cambia.
```

**banda-3-encendido.jpg** (edición de la anterior, mismo encuadre)
```
Misma pared, mismo encuadre y misma cámara. Ahora la pared está terminada, revocada y pintada de gris claro, con la tapa del toma colocada, y el portalámpara tiene una lámpara encendida con luz amarilla cálida que baña toda la escena. Clima cálido y resuelto. El resto no cambia.
```

---

## 6. Contacto

| Archivo | Formato | Uso |
|---|---|---|
| `contacto-mostrador.jpg` | 16:9 · 2400×1350 | Fondo de la sección de contacto |

```
[BLOQUE DE ESTILO] Mostrador de una casa de electricidad de barrio en Buenos Aires: estanterías de fondo con cajas y rollos de cable fuera de foco (sin marcas legibles), y sobre el mostrador de madera gastada una lista de materiales escrita a mano en papel, un rollo de cable y una térmica. Luz cálida de tubos y lámparas, con un clima de atención cercana. Sin personas, o como mucho una mano. Composición horizontal 16:9, con el lado izquierdo oscuro para poner texto.
```

> **Fachada real:** no la generamos, para no inventar el local con su cartel. Si querés mostrar el negocio, conseguí una foto real del frente de Av. Gaona 3307 (del cliente o de Street View) y la sumo en contacto con el mapa.

---

## 7. Videos (loops cortos, mudos)

Generalos con la herramienta de video (Sora / Veo / Kling). Duración de 6 a 8 segundos, en loop limpio (el último cuadro empalma con el primero), sin cortes y sin texto. Yo los comprimo y les pongo un póster de respaldo.

| Archivo | Formato | Uso |
|---|---|---|
| `video-hero-loop.mp4` | 16:9 · 1920×1080 · 6–8 s | Fondo animado del hero en desktop (reemplaza a `hero-desktop.jpg` cuando carga) |
| `video-hero-loop-mobile.mp4` | 9:16 · 1080×1920 · 6–8 s | Hero en mobile |
| `video-encendido.mp4` | 21:9 o 16:9 · 4–6 s | Remate antes del contacto: la luz se prende |

**video-hero-loop.mp4**
```
Usá hero-desktop.jpg como primer cuadro. Sujeto: la lámpara colgante encendida se balancea levemente, como si la moviera una corriente de aire, y el polvo de obra flota despacio dentro del haz de luz cálida. Cámara: travelling lateral muy lento, de derecha a izquierda, unos pocos centímetros, estable, sin zoom. Entorno: la pared y el tablero quedan quietos y la luz parpadea apenas, de forma natural, sin flashes. 8 segundos, en loop perfecto, sin cortes, sin personas, sin texto, fotorrealista.
```

**video-hero-loop-mobile.mp4**
```
Usá hero-mobile.jpg como primer cuadro. El mismo movimiento: la lámpara se balancea levemente, el polvo flota en el haz cálido y la cámara sube en un pedestal muy lento, unos pocos centímetros. 8 segundos, en loop perfecto, sin cortes, sin texto, fotorrealista.
```

**video-encendido.mp4**
```
Usá banda-1-apagado.jpg como primer cuadro y banda-3-encendido.jpg como último. Una mano entra desde fuera de cuadro, baja la palanca de una térmica (fuera de foco, en primer plano) y la lámpara de la pared se enciende: la escena pasa de la penumbra azul fría a la luz amarilla cálida en un segundo, con un leve parpadeo inicial realista. Cámara fija y estable. 5 segundos, sin texto, fotorrealista.
```

---

## Estado (2026-10-05)

Recibidas e integradas: las 19 imágenes. Pendiente: los 3 videos (el código ya los toma solos si aparecen en `media-src/` con su nombre) y, opcional, la foto real de la fachada.

## Checklist para devolver

- [ ] `hero-desktop.jpg`, `hero-mobile.jpg`, `hero-cable-cutout.png` (transparente)
- [ ] `proyecto-residencial.jpg`, `proyecto-comercial.jpg`, `proyecto-industrial.jpg`
- [ ] 8 × `rubro-*.jpg`
- [ ] `lista-manos.jpg`
- [ ] `banda-1-apagado.jpg`, `banda-2-cableado.jpg`, `banda-3-encendido.jpg`
- [ ] `contacto-mostrador.jpg`
- [ ] Videos: `video-hero-loop.mp4`, `video-hero-loop-mobile.mp4`, `video-encendido.mp4`
- [ ] Opcional: foto real de la fachada de Av. Gaona 3307

Total: 19 imágenes + 3 videos. Subilas en un zip y yo armo el rediseño completo: hero con video y parallax por capas, cards de proyecto a sangre, rubros con foto, el recorrido apagado → encendido entre secciones y contacto con imagen, todo publicado en el mismo link.
