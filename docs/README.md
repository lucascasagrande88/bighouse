# Chimi Content Factory

Herramienta interna de Chimichurri Diseño. Vive en
`chimichurridiseno.com/content-factory`, detrás de login.

## Fábrica 01 · Reel Rebuilder

No copia un reel. Le extrae la lógica comunicacional y de edición para construir
una pieza nueva.

```
subís un reel  →  se desarma  →  se adapta a la marca  →  se dirigen escenas
               →  se edita     →  sale un MP4 y un overlay con alfa
```

El principio que separa esto de otra app de subtítulos:

> **No subtitular el reel. Interpretarlo visualmente.**

Cuando el guion enumera, aparece una lista. Cuando compara, aparece una
comparación. Cuando menciona una cifra, aparece un número. Cuando describe una
situación, aparece una imagen. Cuando golpea con una idea, domina la tipografía.
Cuando no hace falta nada, se deja respirar la escena.

## Documentos

| Documento | Qué contiene |
| --- | --- |
| [`AUDIT.md`](AUDIT.md) | Qué había en el repositorio, qué se reutilizó y qué se descartó |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Cómo funciona, por qué son tres piezas, seguridad, y qué quedó sin verificar |
| [`ROADMAP.md`](ROADMAP.md) | Estado del MVP punto por punto, deuda técnica, y la v2 |
| [`../worker/README.md`](../worker/README.md) | Deploy y operación del worker |

## Arrancar en local

```bash
npm install
cp .env.example .env          # y completá los valores
npm run hash-password -- tu@email.com "una contraseña larga"
npm run dev                   # netlify dev en :8888

# En otra terminal, el worker:
cd worker && npm install
WORKER_SECRET=<el mismo que en .env> OPENAI_API_KEY=<...> npm start
```

## Verificar

```bash
npm run check                 # 24 chequeos del motor. Sin API, sin navegador.
cd worker && npm run verify   # 14 chequeos con Chromium: determinismo y alfa.
```

Los dos corren sin claves y sin red. Si tocaste el motor, los componentes o el
CSS del stage, corré el segundo: verifica que `seek(t)` siga siendo determinista
y que el overlay siga saliendo transparente, que son las dos propiedades de las
que depende todo el diseño.

## Estructura

```
content-factory/     frontend privado (login, dashboard, pipeline, editor)
engine/              motor de animación — compartido por el preview y el render
  schema/            los contratos con el modelo (JSON Schema estricto)
  src/components.js  los 8 componentes maestros
  stage.html         la superficie 1080×1920 que expone window.__seek(t)
netlify/functions/   auth, proyectos, y las 4 llamadas a OpenAI
netlify/edge-functions/gate.js   bloquea el shell sin sesión
shared/session.mjs   firma de sesión (Web Crypto: corre en Node y en Deno)
worker/              ffmpeg + Chromium + codificación. Se despliega aparte.
docs/                esto
```
