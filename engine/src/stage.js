// Bootstrap del stage. Expone dos interfaces sobre el mismo renderer:
//
//   window.__seek(t)   →  la que usa el worker de render (await + captura)
//   postMessage        →  la que usa el editor (preview en vivo)

import { Renderer } from './renderer.js';
import { SfxBus } from './sfx.js';

const q = new URLSearchParams(location.search);
const ALPHA = q.get('alpha') === '1';
const FIT = q.get('fit') !== '0';

const stageEl = document.getElementById('stage');
const fitEl = document.getElementById('fit');
const baseVideo = document.getElementById('stageBase');

if (ALPHA) {
  // Los dos: el <html> también pinta fondo y arruinaría la transparencia.
  document.documentElement.classList.add('alpha-page');
  document.body.classList.add('alpha-page');
}
if (q.get('safe') === '1') stageEl.classList.add('show-safe');

const renderer = new Renderer(stageEl, { alpha: ALPHA });
const sfx = new SfxBus();

let playing = false;
let playhead = 0;
let clockOrigin = 0;
let rafId = null;
let lastSceneId = null;

/* ─── escalado ─── */

function fit() {
  if (!FIT) {
    stageEl.style.transform = 'none';
    return;
  }
  const scale = Math.min(fitEl.clientWidth / 1080, fitEl.clientHeight / 1920);
  stageEl.style.transform = `scale(${scale})`;
  // Reservar el espacio real para que el flex centre bien el lienzo escalado.
  stageEl.style.margin = `${(1920 * scale - 1920) / 2}px ${(1080 * scale - 1080) / 2}px`;
}
window.addEventListener('resize', fit);
fit();

/* ─── API para el worker ─── */

window.__load = function (project) {
  const p = renderer.load(project);
  sfx.load(p, { muted: true });
  playhead = 0;
  return { duration: p.duration, scenes: p.scenes.length };
};

/**
 * Dibuja el frame en el segundo t y no resuelve hasta que todo lo asincrónico
 * (fuentes, imágenes, seek del video base) terminó. El worker hace
 * `await page.evaluate(t => window.__seek(t), t)` y después la captura.
 */
window.__seek = async function (t, opts = {}) {
  const scene = renderer.seek(t);
  await renderer.syncBase(t, { exact: opts.exact !== false });
  await settle();
  return scene ? scene.id : null;
};

window.__ready = async function () {
  await document.fonts.ready;
  await settle();
  return true;
};

/**
 * ¿Las tipografías de la marca están realmente disponibles?
 *
 * El worker renderiza sin red, así que el <link> a Google Fonts puede fallar en
 * silencio y Chromium cae a system-ui. El reel sale igual y con otra letra, y
 * eso no se descubre hasta ver el MP4 terminado.
 *
 * No sirve document.fonts.check(): para una familia que no existe devuelve true,
 * porque informa sobre las fuentes que efectivamente va a usar —el fallback— y
 * no sobre la que se pidió. La única medición confiable es dibujar el mismo
 * texto con la familia pedida y con el genérico solo: si mide igual, la familia
 * no se aplicó.
 */
function fontAvailable(family, weight = 400) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const probe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 mmmiiillw';

  const measure = (spec) => {
    ctx.font = spec;
    return ctx.measureText(probe).width;
  };

  // Contra dos genéricos distintos: si la familia no existe, cada medición cae
  // exactamente en su genérico y ninguna de las dos difiere.
  return ['monospace', 'serif'].some(
    (generic) => Math.abs(measure(`${weight} 72px "${family}", ${generic}`) - measure(`${weight} 72px ${generic}`)) > 0.5
  );
}

window.__fonts = function () {
  return {
    display: fontAvailable('Syne', 800),
    body: fontAvailable('Inter', 600),
  };
};

window.__duration = () => renderer.duration;

/** Espera a que el navegador haya aplicado layout y decodificado imágenes. */
async function settle() {
  const imgs = [...stageEl.querySelectorAll('img')].filter((i) => !i.complete);
  if (imgs.length) {
    await Promise.all(
      imgs.map(
        (i) =>
          new Promise((res) => {
            i.addEventListener('load', res, { once: true });
            i.addEventListener('error', res, { once: true });
            setTimeout(res, 3000);
          })
      )
    );
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

/* ─── preview: loop y transporte ─── */

function tick(now) {
  if (!playing) return;
  const t = (now - clockOrigin) / 1000;
  if (t >= renderer.duration) {
    seekTo(renderer.duration);
    pause();
    post({ type: 'ended' });
    return;
  }
  draw(t);
  rafId = requestAnimationFrame(tick);
}

function draw(t) {
  playhead = t;
  const scene = renderer.seek(t);
  if (scene && scene.id !== lastSceneId) {
    lastSceneId = scene.id;
    post({ type: 'scene', id: scene.id });
    if (playing) sfx.cue(scene);
  }
  post({ type: 'time', t, sceneId: scene ? scene.id : null });
}

function play(from) {
  const start = typeof from === 'number' ? from : playhead >= renderer.duration ? 0 : playhead;
  playing = true;
  clockOrigin = performance.now() - start * 1000;
  lastSceneId = null;
  sfx.play(start);
  if (baseVideo.src && !ALPHA) {
    baseVideo.currentTime = Math.min(start, baseVideo.duration || start);
    baseVideo.play().catch(() => {});
  }
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
  post({ type: 'playing', playing: true });
}

function pause() {
  playing = false;
  cancelAnimationFrame(rafId);
  sfx.pause();
  if (baseVideo.src) baseVideo.pause();
  post({ type: 'playing', playing: false });
}

function seekTo(t) {
  pauseIfPlaying();
  draw(t);
  if (baseVideo.src && !ALPHA && Number.isFinite(baseVideo.duration)) {
    baseVideo.currentTime = Math.min(t, baseVideo.duration);
  }
}

function pauseIfPlaying() {
  if (playing) pause();
}

/* ─── puente con el editor ─── */

function post(msg) {
  if (window.parent !== window) window.parent.postMessage({ source: 'chimi-stage', ...msg }, '*');
}

window.addEventListener('message', async (ev) => {
  const msg = ev.data;
  if (!msg || msg.target !== 'chimi-stage') return;

  switch (msg.type) {
    case 'load': {
      const info = window.__load(msg.project);
      sfx.load(renderer.project, { muted: false });
      draw(typeof msg.t === 'number' ? msg.t : 0);
      post({ type: 'loaded', ...info });
      break;
    }
    case 'update': {
      // Cambio de propiedades sin perder el playhead.
      const t = playhead;
      renderer.load(msg.project);
      sfx.load(renderer.project, { muted: false });
      draw(Math.min(t, renderer.duration));
      post({ type: 'loaded', duration: renderer.duration, scenes: renderer.project.scenes.length });
      break;
    }
    case 'seek':
      seekTo(msg.t);
      break;
    case 'play':
      play(msg.t);
      break;
    case 'pause':
      pause();
      break;
    case 'toggle':
      playing ? pause() : play();
      break;
    case 'safe':
      stageEl.classList.toggle('show-safe', !!msg.on);
      break;
    case 'volume':
      sfx.setVolumes(msg.volumes || {});
      break;
    default:
      break;
  }
});

await document.fonts.ready.catch(() => {});
post({ type: 'ready' });
