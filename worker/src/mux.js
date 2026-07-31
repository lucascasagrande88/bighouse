// Mezcla de audio y codificación de las salidas.

import { ffmpeg, run } from './ffmpeg.js';
import { access } from 'node:fs/promises';
import path from 'node:path';

const SFX_DIR = process.env.SFX_DIR || path.resolve(process.cwd(), 'assets/sfx');

/**
 * Construye la lista de eventos de sonido a partir del storyboard.
 * La fuente de verdad es el mismo scenes.json que usa el preview, así que lo
 * que se escucha en el editor y lo que sale en el MP4 no pueden divergir.
 */
export function sfxEvents(project) {
  const events = [];
  for (const scene of project.scenes || []) {
    const s = scene.sfx || {};
    const dur = Math.max((scene.end || 0) - (scene.start || 0), 0.1);
    if (s.in && s.in !== 'none') events.push({ name: s.in, at: scene.start });
    if (s.accent && s.accent !== 'none') events.push({ name: s.accent, at: scene.start + Math.min(0.4, dur * 0.35) });
    if (s.out && s.out !== 'none') events.push({ name: s.out, at: Math.max(scene.start, scene.end - 0.18) });
  }
  return events;
}

const SFX_FILES = {
  hook: 'hook-riser.mp3', impact_low: 'impact-low.mp3', impact_hard: 'impact-hard.mp3',
  appear: 'appear.mp3', disappear: 'disappear.mp3', transition: 'transition.mp3',
  list_tick: 'list-tick.mp3', pop: 'pop.mp3', click: 'click.mp3', whoosh: 'whoosh.mp3',
  shimmer: 'shimmer.mp3', glitch: 'glitch.mp3', success: 'success.mp3', cta: 'cta.mp3',
  close: 'close.mp3',
};

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mezcla voz + música + efectos en un solo archivo.
 * Devuelve null si no hay nada que mezclar: un reel sin audio se renderiza
 * igual, y es mejor eso que fallar el export por un mp3 que falta.
 */
export async function buildAudio({ project, outFile, voiceFile, musicFile }) {
  const inputs = [];
  const filters = [];
  const labels = [];
  const volumes = project.volumes || {};
  const skipped = [];

  const push = (file, filter) => {
    const idx = inputs.length;
    inputs.push('-i', file);
    const label = `a${idx}`;
    filters.push(`[${idx}:a]${filter}[${label}]`);
    labels.push(`[${label}]`);
  };

  if (voiceFile && (await exists(voiceFile))) {
    push(voiceFile, `volume=${num(volumes.voice, 1)},aresample=48000`);
  }

  if (musicFile && (await exists(musicFile))) {
    // La música se recorta a la duración del reel y baja al final.
    const fadeStart = Math.max(0, project.duration - 1.2);
    push(
      musicFile,
      `volume=${num(volumes.music, 0.22)},aresample=48000,atrim=0:${project.duration},afade=t=out:st=${fadeStart.toFixed(2)}:d=1.2`
    );
  }

  for (const ev of sfxEvents(project)) {
    const file = SFX_FILES[ev.name] ? path.join(SFX_DIR, SFX_FILES[ev.name]) : null;
    if (!file || !(await exists(file))) {
      skipped.push(ev.name);
      continue;
    }
    const ms = Math.max(0, Math.round(ev.at * 1000));
    push(file, `volume=${num(volumes.sfx, 0.6)},aresample=48000,adelay=${ms}|${ms}`);
  }

  if (!labels.length) return { file: null, skipped: [...new Set(skipped)] };

  const mix =
    labels.length === 1
      ? `${labels[0]}apad,atrim=0:${project.duration}[out]`
      : `${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,` +
        `alimiter=limit=0.95,apad,atrim=0:${project.duration}[out]`;

  await ffmpeg([
    '-y',
    ...inputs,
    '-filter_complex', [...filters, mix].join(';'),
    '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    outFile,
  ]);

  return { file: outFile, skipped: [...new Set(skipped)], tracks: labels.length };
}

/** Salida principal: MP4 H.264 1080x1920, listo para subir. */
export async function encodeMp4({ pattern, fps, audioFile, outFile, duration }) {
  // -start_number 0 explícito: el demuxer image2 asume que la secuencia
  // arranca en 1 y sólo encuentra el 0 por sondeo. Los frames se numeran
  // desde 0, así que dejarlo implícito es apostar a una heurística.
  const args = ['-y', '-framerate', String(fps), '-start_number', '0', '-i', pattern];
  if (audioFile) args.push('-i', audioFile);

  args.push(
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-vf', 'format=yuv420p',
    '-r', String(fps),
    '-movflags', '+faststart'
  );

  if (audioFile) {
    args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  } else {
    args.push('-an');
  }
  if (duration) args.push('-t', String(duration));

  args.push(outFile);
  await ffmpeg(args);
  return outFile;
}

/**
 * Overlay con alfa en WebM/VP9. Es el archivo liviano.
 * La secuencia PNG sigue siendo la salida segura para After Effects; esto es
 * para cuando se quiere mover el overlay por WhatsApp sin 900 archivos.
 */
export async function encodeWebmAlpha({ pattern, fps, outFile }) {
  await ffmpeg([
    '-y', '-framerate', String(fps), '-start_number', '0', '-i', pattern,
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-b:v', '0', '-crf', '26',
    '-auto-alt-ref', '0',
    '-row-mt', '1',
    '-an',
    outFile,
  ]);
  return outFile;
}

/**
 * ProRes 4444 con alfa. Es la mejor salida profesional y también la más pesada:
 * un reel de 30 s pasa el gigabyte. Queda detrás de una bandera a propósito.
 */
export async function encodeProRes({ pattern, fps, outFile }) {
  await ffmpeg([
    '-y', '-framerate', String(fps), '-start_number', '0', '-i', pattern,
    '-c:v', 'prores_ks',
    '-profile:v', '4444',
    '-pix_fmt', 'yuva444p10le',
    '-alpha_bits', '16',
    '-vendor', 'ap4h',
    '-an',
    outFile,
  ]);
  return outFile;
}

/**
 * Secuencia PNG comprimida: la salida menos elegante y la más confiable.
 *
 * El zip corre CON cwd en el directorio de frames y comprime "." para que el
 * archivo quede plano —los PNG en la raíz del zip, sin la ruta del servidor
 * adentro—, que es como After Effects espera importar una secuencia.
 * `-1` porque un PNG ya viene comprimido: apretar más sólo gasta CPU.
 */
export async function zipFrames({ dir, outFile }) {
  await run('zip', ['-r', '-q', '-1', outFile, '.'], { timeout: 10 * 60 * 1000, cwd: dir });
  return outFile;
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
