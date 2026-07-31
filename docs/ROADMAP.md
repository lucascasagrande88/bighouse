# Roadmap

## Estado del MVP

Los 18 puntos del MVP definido, uno por uno:

| # | Punto | Estado |
| --- | --- | --- |
| 1 | Login privado | ✅ scrypt + cookie firmada + gate en el edge |
| 2 | Dashboard de proyectos | ✅ |
| 3 | Carga de MP4 | ✅ directo al worker con ticket firmado |
| 4 | Extracción de audio | ✅ ffmpeg → mp3 mono 16 kHz |
| 5 | Transcripción con timestamps | ✅ palabra y segmento |
| 6 | Extracción de frames | ✅ 8 repartidos, como data URL |
| 7 | Análisis de estructura | ✅ las cinco capas, schema estricto |
| 8 | Adaptación a la marca | ✅ con control de duración y una reescritura |
| 9 | Guion final | ✅ editable antes de dirigir |
| 10 | Hasta 10 escenas | ✅ tope aplicado del lado del servidor |
| 11 | Ocho componentes maestros | ✅ + 16 alias narrativos |
| 12 | Prompts de imágenes | ✅ concepto + prompt por escena |
| 13 | Carga manual de imágenes | ✅ |
| 14 | Preview HTML animada | ✅ el mismo motor que el render |
| 15 | Timeline de voz y efectos | ✅ 5 pistas |
| 16 | Exportación MP4 | ✅ escrito; falta la primera corrida con ffmpeg completo |
| 17 | Exportación PNG con alfa | ✅ transparencia verificada a nivel de píxel |
| 18 | Guardado del proyecto | ✅ autoguardado en Netlify Blobs |

Se adelantaron dos cosas de la v2 porque salían casi gratis: la **generación de
imágenes** dentro de la Factory (el worker ya tenía el storage) y la
**regeneración de una sola escena**, que en la práctica va a ser la operación más
usada del editor.

## Antes de usarla en producción

Cosas que faltan y no son código:

1. **Los `.ttf` de Syne e Inter** en `worker/fonts/`. Sin eso el reel se
   renderiza con la tipografía de sistema. El worker lo avisa, pero mejor
   evitarlo. Ver `worker/fonts/README.md`.
2. **El banco de sonidos** en `assets/sfx/`. 15 archivos, licenciados para uso
   comercial. Sin ellos el reel sale callado, no roto. Ver `assets/sfx/README.md`.
3. **Las variables de entorno.** `.env.example` las lista todas.
4. **Correr el worker una vez con ffmpeg completo** y confirmar que el MP4 y el
   WebM con alfa salen bien. Es la única parte del sistema que no se pudo
   verificar en este repositorio (ver el final de `ARCHITECTURE.md`).

## Deuda que dejé anotada, no escondida

- **Los jobs de render viven en memoria.** Si el worker se reinicia en medio de
  un render, el job se pierde (los archivos ya escritos quedan). Para una persona
  usando la herramienta alcanza; para varios en paralelo hay que mover el estado
  a Redis o a una tabla.
- **Los tokens de la marca están duplicados** entre `assets/css/style.css` y
  `content-factory/assets/factory.css`. Un cambio de color hay que hacerlo en
  dos lugares. Se resuelve extrayendo un `tokens.css` que importen los dos.
- **Una sola instancia del worker.** Dos renders simultáneos se pelean por la CPU.
- **El video base se sincroniza frame a frame**, que es lento. Es la única forma
  de que la capa de cámara quede en sincronía real.
- **No hay recuperación de contraseña por email.** Se regenera desde el servidor
  con `npm run hash-password`. Implementarla necesita un proveedor de email; el
  login lo dice explícitamente en vez de mostrar un link que no funciona.
- **`wa.me/5491100000000` sigue siendo el placeholder** en las 5 páginas
  públicas, y los tres PDF de catálogos linkeados en el footer no existen. Es
  deuda anterior a este cambio, pero hay tres 404 en producción ahora mismo.

## Segunda versión

En orden de cuánto tiempo ahorra por lo que cuesta implementarla:

1. **Render incremental.** Sólo volver a renderizar las escenas que cambiaron.
   Hoy tocar una palabra en la escena 07 cuesta el reel entero. Es la mejora que
   más cambia el uso diario.
2. **Detección de beat de la música** para alinear los cortes. El ritmo es la
   mitad de un buen reel.
3. **Más skins de marca**, para clientes con paleta propia.
4. **Encuadre automático según el rostro** en las escenas de cámara.
5. **Biblioteca de efectos más profunda** y variantes por skin.
6. **Más transiciones**, hoy hay 7.
7. **Procesamiento en lote**: cinco reels de una referencia.
8. **Integración más fina con After Effects**: un `.jsx` que importe la secuencia
   y arme la comp con los tiempos ya puestos.

## Lo que NO entra todavía, y por qué

- **Un editor comparable con After Effects.** Ese no es el producto. El producto
  ahorra las horas de dirección y diseño; el ajuste fino se hace en After Effects
  con el overlay.
- **HTML arbitrario generado por IA.** Es la decisión de diseño más importante
  del sistema y no se revisa.
- **Cien tipos de escenas.** Ocho bien hechos rinden más que cuarenta a medias.
- **Descargador interno de Instagram.** Frágil, se rompe cuando cambian el sitio,
  y agrega problemas legales y operativos. Bajás el reel y lo subís.
- **Generación automática de música.** Otra fábrica, otro problema.
- **Colaboración multiusuario.** Los proyectos ya están namespaceados por usuario;
  la edición concurrente es un rediseño, no una feature.
- **Render 4K.** Instagram entrega 1080×1920. Renderizar 4K es cuadruplicar el
  tiempo para que la plataforma lo recomprima.
- **Avatar hablando y publicación automática en redes.** Fuera del alcance.

## Las otras fábricas

`02 Carrusel`, `03 Campaign` y `04 Case Study` están en el índice como
*Próximamente*. La estructura que dejó esta primera —schema estricto, componentes
maestros, worker de render, tickets firmados— es la que van a reusar: lo que
cambia es el motor de composición y los prompts, no la arquitectura.
