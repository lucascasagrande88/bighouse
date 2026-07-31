// Todo lo que toca el archivo de video pasa por acá.
//
// Nada de librerías que envuelven ffmpeg: los comandos son cortos, se leen y se
// pueden pegar en una terminal para depurar cuando algo sale raro.

import { spawn } from 'node:child_process';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

export function run(bin, args, { timeout = 15 * 60 * 1000, cwd } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, cwd ? { cwd } : undefined);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`${bin} se colgó y fue cortado a los ${Math.round(timeout / 1000)}s`));
    }, timeout);

    proc.stdout.on('data', (d) => (stdout += d));
    // ffmpeg escribe todo su log por stderr, incluido lo que necesitamos parsear.
    proc.stderr.on('data', (d) => (stderr += d));
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar ${bin}: ${err.message}`));
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`${bin} falló (código ${code}):\n${stderr.split('\n').slice(-12).join('\n')}`));
    });
  });
}

export const ffmpeg = (args, opts) => run(FFMPEG, args, opts);

/** Metadatos del archivo: duración, resolución, fps, si tiene audio. */
export async function probe(file) {
  const { stdout } = await run(FFPROBE, [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    file,
  ]);
  const info = JSON.parse(stdout);
  const video = (info.streams || []).find((s) => s.codec_type === 'video');
  const audio = (info.streams || []).find((s) => s.codec_type === 'audio');

  return {
    duration: round(parseFloat(info.format?.duration) || 0),
    size: parseInt(info.format?.size || '0', 10),
    width: video?.width || 0,
    height: video?.height || 0,
    fps: parseFps(video?.r_frame_rate),
    has_audio: !!audio,
    video_codec: video?.codec_name || null,
    audio_codec: audio?.codec_name || null,
  };
}

/**
 * Extrae el audio a mp3 mono 16 kHz: es lo que le sirve a la transcripción y
 * pesa una fracción del original, que importa porque se sube por HTTP.
 */
export async function extractAudio(input, output) {
  await ffmpeg([
    '-y', '-i', input,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-c:a', 'libmp3lame', '-q:a', '5',
    output,
  ]);
  return output;
}

/**
 * Fotogramas repartidos a lo largo del reel. Se envían al modelo multimodal
 * como imágenes: es la forma que funciona de "analizar el video", porque no hay
 * ningún modelo que lea un mp4 y entienda el encuadre por arte de magia.
 */
export async function extractFrames(input, dir, { count = 8, duration } = {}) {
  await mkdir(dir, { recursive: true });
  const fps = duration > 0 ? Math.max(count / duration, 0.05) : 1;
  await ffmpeg([
    '-y', '-i', input,
    '-vf', `fps=${fps.toFixed(4)},scale=540:-2`,
    '-frames:v', String(count + 2),
    '-q:v', '4',
    path.join(dir, 'frame_%03d.jpg'),
  ]);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.jpg')).sort();
  return files.map((f, i) => ({
    file: path.join(dir, f),
    name: f,
    // Tiempo aproximado del fotograma dentro del reel.
    t: round(duration > 0 ? Math.min(duration, i / fps) : i),
  }));
}

/**
 * Cortes visuales, vía el filtro de detección de escena de ffmpeg.
 * Un umbral de 0,4 es conservador: prefiere no contar un corte antes que
 * inventar diez porque alguien movió la cámara.
 */
export async function detectCuts(input, threshold = 0.4) {
  try {
    const { stderr } = await ffmpeg([
      '-i', input,
      '-filter:v', `select='gt(scene,${threshold})',showinfo`,
      '-f', 'null', '-',
    ]);
    const times = [...stderr.matchAll(/pts_time:([0-9.]+)/g)].map((m) => round(parseFloat(m[1])));
    return [...new Set(times)].sort((a, b) => a - b);
  } catch {
    // La detección de cortes es información de apoyo: si falla, el análisis
    // sigue con la transcripción y los fotogramas.
    return [];
  }
}

/** Silencios largos: dicen tanto del ritmo como las palabras. */
export async function detectSilences(input, { noise = '-32dB', min = 0.35 } = {}) {
  try {
    const { stderr } = await ffmpeg([
      '-i', input,
      '-af', `silencedetect=noise=${noise}:d=${min}`,
      '-f', 'null', '-',
    ]);
    const out = [];
    const re = /silence_start:\s*([0-9.-]+)[\s\S]*?silence_end:\s*([0-9.]+)/g;
    for (const m of stderr.matchAll(re)) {
      out.push({ start: round(parseFloat(m[1])), end: round(parseFloat(m[2])) });
    }
    return out;
  } catch {
    return [];
  }
}

/** Normaliza el video de entrada a 1080x1920 para usarlo como capa base. */
export async function normalizeVertical(input, output) {
  await ffmpeg([
    '-y', '-i', input,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-movflags', '+faststart',
    output,
  ]);
  return output;
}

function parseFps(rate) {
  if (!rate) return 0;
  const [a, b] = String(rate).split('/').map(Number);
  return b ? round(a / b) : round(a);
}

function round(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
