# Worker de ingesta y render.
#
# La imagen de Playwright ya trae Chromium y sus dependencias de sistema, que es
# la parte molesta de instalar a mano. Encima se agregan ffmpeg y zip.

FROM mcr.microsoft.com/playwright:v1.47.0-jammy

ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    WORK_DIR=/data/work \
    PORT=8080

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg zip fontconfig \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Fuentes de la marca. El stage las pide por nombre ('Syne', 'Inter'); si no
# están instaladas, Chromium cae a system-ui y el reel sale con otra tipografía.
# Los .ttf van en worker/fonts/ (ver worker/fonts/README.md).
COPY fonts/ /usr/share/fonts/truetype/chimichurri/
RUN fc-cache -f

COPY worker/package*.json ./
RUN npm install --omit=dev

# El motor se copia dentro de la imagen: el worker sirve su propio stage.html en
# localhost y así el render no depende de que el sitio público esté arriba.
COPY engine/ /app/engine/
COPY shared/ /app/shared/
COPY assets/ /app/assets/
COPY worker/ /app/

ENV ENGINE_DIR=/app/engine \
    ASSETS_DIR=/app/assets \
    SFX_DIR=/app/assets/sfx

RUN mkdir -p /data/work
VOLUME ["/data/work"]

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
