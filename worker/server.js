// Worker de la Chimi Content Factory.
//
// Hace las tres cosas que Netlify no puede hacer:
//   1. desarmar un mp4 (ffmpeg)
//   2. transcribir con tiempos
//   3. renderizar 900 frames y codificarlos
//
// Se despliega aparte (Railway, Fly, Render, un VPS). El navegador le habla
// directo con un ticket firmado que emite Netlify: el worker no tiene usuarios
// ni contraseñas, sólo valida la firma.

import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, rm } from 'node:fs/promises';

import { auth } from './src/ticket.js';
import { probe, extractAudio, extractFrames, detectCuts, detectSilences, normalizeVertical } from './src/ffmpeg.js';
import { transcribe } from './src/transcribe.js';
import { renderFrames } from './src/render.js';
import { buildAudio, encodeMp4, encodeWebmAlpha, encodeProRes, zipFrames } from './src/mux.js';
import { ROOT, PUBLIC_BASE, projectDir, ensureDir, jobId, publicUrl, writeJson, sweep, safeSegment } from './src/storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const ENGINE_DIR = process.env.ENGINE_DIR || path.resolve(__dirname, '../engine');
const ASSETS_DIR = process.env.ASSETS_DIR || path.resolve(__dirname, '../assets');
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_MB || 220) * 1024 * 1024;

const app = express();
app.use(express.json({ limit: '4mb' }));

// El editor corre en el dominio de Chimichurri y el worker en otro host, así
// que hace falta CORS explícito. Sólo el origen configurado, no un comodín.
const ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', ORIGIN);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const upload = multer({ dest: path.join(ROOT, '_uploads'), limits: { fileSize: MAX_UPLOAD } });

/* Archivos de trabajo y el motor, para que Playwright cargue el stage local. */
app.use(PUBLIC_BASE, express.static(ROOT, { maxAge: '1h' }));
app.use('/engine', express.static(ENGINE_DIR));
app.use('/assets', express.static(ASSETS_DIR));

const jobs = new Map();

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ready: {
      openai: !!process.env.OPENAI_API_KEY,
      secret: !!process.env.WORKER_SECRET,
    },
    jobs: jobs.size,
  });
});

/* ─── 1 · Ingesta ──────────────────────────────────────────────────────────
   Un mp4 entra, el desarmado sale. Se hace en línea porque para un reel de
   menos de un minuto tarda decenas de segundos, no minutos.                */

app.post('/ingest', auth('ingest'), upload.single('file'), async (req, res) => {
  const projectId = safeSegment(req.body.project_id || req.ticket.project_id);
  if (!req.file) return res.status(400).json({ ok: false, error: 'No llegó ningún archivo.' });

  const dir = await ensureDir(path.join(projectDir(projectId), 'source'));
  const kind = req.body.kind || 'video';
  const ext = kind === 'audio' ? '.mp3' : '.mp4';
  const source = path.join(dir, `original${ext}`);

  try {
    await rm(source, { force: true });
    const { rename } = await import('node:fs/promises');
    await rename(req.file.path, source);

    const meta = await probe(source);
    if (!meta.duration) throw new Error('El archivo no tiene duración legible. ¿Es un video válido?');

    const audio = kind === 'audio' ? source : path.join(dir, 'audio.mp3');
    if (kind !== 'audio') {
      if (!meta.has_audio) throw new Error('El video no tiene pista de audio: no hay nada que transcribir.');
      await extractAudio(source, audio);
    }

    const speech = await transcribe(audio, { language: req.body.language || 'es' });

    // Los fotogramas y los cortes sólo existen si hay video.
    let frames = [];
    let cuts = [];
    let baseUrl = null;
    if (kind !== 'audio') {
      const frameDir = path.join(projectDir(projectId), 'frames');
      const shots = await extractFrames(source, frameDir, { count: 8, duration: meta.duration });
      frames = await Promise.all(
        shots.map(async (s) => ({
          t: s.t,
          // Como data URL: el análisis las manda a OpenAI desde Netlify y así
          // no hace falta que el worker sea públicamente accesible.
          url: `data:image/jpeg;base64,${(await readFile(s.file)).toString('base64')}`,
        }))
      );
      cuts = await detectCuts(source);

      const base = path.join(projectDir(projectId), 'base.mp4');
      await normalizeVertical(source, base).catch(() => null);
      baseUrl = publicUrl(base, publicBase(req));
    }

    const silences = await detectSilences(audio);

    const ingest = {
      kind,
      duration: meta.duration,
      meta,
      transcript: speech.transcript,
      segments: speech.segments,
      words: speech.words,
      wpm: speech.wpm,
      pauses: speech.pauses,
      longest_pause: speech.longest_pause,
      silences,
      cuts,
      cut_count: cuts.length,
      avg_shot: cuts.length > 1 ? round(meta.duration / (cuts.length + 1)) : meta.duration,
      frames,
      video_url: baseUrl,
      audio_url: publicUrl(audio, publicBase(req)),
      at: new Date().toISOString(),
    };

    await writeJson(path.join(projectDir(projectId), 'ingest.json'), { ...ingest, frames: frames.length });
    res.json({ ok: true, ingest });
  } catch (err) {
    if (req.file) await rm(req.file.path, { force: true }).catch(() => {});
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─── 2 · Assets ───────────────────────────────────────────────────────────
   Imágenes, voz y música que sube el usuario a mano.                       */

app.post('/asset', auth('asset'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No llegó ningún archivo.' });
  const projectId = safeSegment(req.body.project_id || req.ticket.project_id);
  const slot = safeSegment(req.body.slot || 'asset');

  try {
    const dir = await ensureDir(path.join(projectDir(projectId), 'assets'));
    const ext = path.extname(req.file.originalname || '').toLowerCase().slice(0, 6) || '.bin';
    const dest = path.join(dir, `${slot}_${Date.now().toString(36)}${ext}`);
    const { rename } = await import('node:fs/promises');
    await rename(req.file.path, dest);
    res.json({ ok: true, url: publicUrl(dest, publicBase(req)) });
  } catch (err) {
    await rm(req.file.path, { force: true }).catch(() => {});
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* Generación de imagen. El prompt lo escribió el director de assets en Netlify;
   acá sólo se ejecuta y se guarda, porque el storage vive de este lado. */
app.post('/image', auth('image'), async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'OPENAI_API_KEY no configurada en el worker.' });

  const { prompt, project_id, scene_id } = req.body || {};
  if (!prompt) return res.status(400).json({ ok: false, error: 'Falta el prompt.' });

  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt,
        size: '1024x1536',
        n: 1,
      }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error?.message || `La generación falló (${r.status})`);

    const b64 = body.data?.[0]?.b64_json;
    if (!b64) throw new Error('La respuesta no trajo imagen.');

    const dir = await ensureDir(path.join(projectDir(safeSegment(project_id || req.ticket.project_id)), 'assets'));
    const dest = path.join(dir, `${safeSegment(scene_id || 'scene')}_${Date.now().toString(36)}.png`);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(dest, Buffer.from(b64, 'base64'));
    res.json({ ok: true, url: publicUrl(dest, publicBase(req)) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ─── 3 · Render ───────────────────────────────────────────────────────────
   Asincrónico y con estado: 900 capturas más la codificación no entran en el
   timeout de ninguna request razonable.                                    */

app.post('/render', auth('render'), async (req, res) => {
  const { project, outputs = ['mp4'], fps } = req.body || {};
  if (!project || !Array.isArray(project.scenes) || !project.scenes.length) {
    return res.status(400).json({ ok: false, error: 'Falta el proyecto o no tiene escenas.' });
  }
  if (!project.duration) return res.status(400).json({ ok: false, error: 'El proyecto no tiene duración.' });

  const id = jobId('render');
  const job = {
    id,
    status: 'encolado',
    step: 'preparando',
    progress: 0,
    outputs: [],
    warnings: [],
    error: null,
    started_at: new Date().toISOString(),
  };
  jobs.set(id, job);

  // Se responde ya y se trabaja en segundo plano; el editor consulta /status.
  res.status(202).json({ ok: true, job_id: id, status: job.status });

  runRender({ job, project, outputs, fps: fps || project.fps || 30, base: publicBase(req) }).catch((err) => {
    job.status = 'error';
    job.error = err.message;
    job.finished_at = new Date().toISOString();
  });
});

app.get('/status/:id', auth('status'), (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: 'Ese job no existe (o el worker se reinició).' });
  res.json({ ok: true, job });
});

async function runRender({ job, project, outputs, fps, base }) {
  const projectId = safeSegment(project.id || 'sin-proyecto');
  const dir = await ensureDir(path.join(projectDir(projectId), job.id));
  const wantsAlpha = outputs.some((o) => o.startsWith('alpha') || o === 'prores');
  const wantsFlat = outputs.includes('mp4');

  job.status = 'procesando';

  // El audio se mezcla primero: si falta un archivo conviene enterarse antes
  // de gastar diez minutos de capturas.
  let audioFile = null;
  if (wantsFlat) {
    job.step = 'mezclando audio';
    const mix = await buildAudio({
      project,
      outFile: path.join(dir, 'mix.m4a'),
      voiceFile: localize(project.voice),
      musicFile: localize(project.music),
    });
    audioFile = mix.file;
    if (mix.skipped?.length) {
      job.warnings.push(`Efectos sin archivo en el banco: ${mix.skipped.join(', ')}. Se renderiza sin ellos.`);
    }
    if (!audioFile) job.warnings.push('No había voz, música ni efectos: el MP4 sale sin audio.');
  }

  const stageUrl = process.env.STAGE_URL || `http://127.0.0.1:${PORT}/engine/stage.html`;

  if (wantsFlat) {
    job.step = 'renderizando frames';
    const flatDir = path.join(dir, 'flat');
    const r = await renderFrames({
      project,
      stageUrl,
      outDir: flatDir,
      fps,
      alpha: false,
      onProgress: ({ frame, total }) => {
        job.progress = Math.round((frame / total) * (wantsAlpha ? 45 : 85));
      },
    });
    if (r.page_errors.length) job.warnings.push(`Errores en el stage: ${r.page_errors.join(' · ')}`);
    job.warnings.push(...(r.warnings || []));

    job.step = 'codificando mp4';
    const out = await encodeMp4({
      pattern: r.pattern,
      fps,
      audioFile,
      outFile: path.join(dir, `${slug(project.name)}.mp4`),
      duration: project.duration,
    });
    job.outputs.push({ kind: 'mp4', label: 'Reel completo · MP4 1080×1920', url: publicUrl(out, base) });
    job.progress = wantsAlpha ? 50 : 92;
    await rm(flatDir, { recursive: true, force: true });
  }

  if (wantsAlpha) {
    job.step = 'renderizando overlay con alfa';
    const alphaDir = path.join(dir, 'alpha');
    const r = await renderFrames({
      project,
      stageUrl,
      outDir: alphaDir,
      fps,
      alpha: true,
      onProgress: ({ frame, total }) => {
        job.progress = (wantsFlat ? 50 : 0) + Math.round((frame / total) * (wantsFlat ? 35 : 80));
      },
    });
    if (r.page_errors.length) job.warnings.push(`Errores en el stage (overlay): ${r.page_errors.join(' · ')}`);
    job.warnings.push(...(r.warnings || []));

    if (outputs.includes('alpha_png')) {
      job.step = 'comprimiendo secuencia PNG';
      const zip = await zipFrames({ dir: alphaDir, outFile: path.join(dir, `${slug(project.name)}-overlay-png.zip`) });
      job.outputs.push({ kind: 'alpha_png', label: 'Overlay · secuencia PNG con alfa (After Effects)', url: publicUrl(zip, base) });
    }
    if (outputs.includes('alpha_webm')) {
      job.step = 'codificando WebM con alfa';
      const webm = await encodeWebmAlpha({ pattern: r.pattern, fps, outFile: path.join(dir, `${slug(project.name)}-overlay.webm`) });
      job.outputs.push({ kind: 'alpha_webm', label: 'Overlay · WebM con alfa', url: publicUrl(webm, base) });
    }
    if (outputs.includes('prores')) {
      job.step = 'codificando ProRes 4444';
      const mov = await encodeProRes({ pattern: r.pattern, fps, outFile: path.join(dir, `${slug(project.name)}-overlay.mov`) });
      job.outputs.push({ kind: 'prores', label: 'Overlay · ProRes 4444 con alfa', url: publicUrl(mov, base) });
    }
    if (!outputs.includes('alpha_png')) {
      await rm(alphaDir, { recursive: true, force: true });
    }
  }

  // El proyecto y el guion viajan con el render: sirven para reconstruirlo.
  job.step = 'empaquetando';
  const jsonFile = await writeJson(path.join(dir, 'scenes.json'), project);
  job.outputs.push({ kind: 'json', label: 'scenes.json', url: publicUrl(jsonFile, base) });
  if (project.script) {
    const { writeFile } = await import('node:fs/promises');
    const txt = path.join(dir, 'guion.txt');
    await writeFile(txt, buildScriptDoc(project), 'utf8');
    job.outputs.push({ kind: 'script', label: 'Guion y timeline', url: publicUrl(txt, base) });
  }

  job.progress = 100;
  job.step = 'listo';
  job.status = 'listo';
  // Las dos pasadas de render repiten los mismos avisos.
  job.warnings = [...new Set(job.warnings)];
  job.finished_at = new Date().toISOString();
}

function buildScriptDoc(project) {
  const lines = [
    `${project.name}`,
    `Duración: ${project.duration}s · ${project.scenes.length} escenas · ${project.fps || 30} fps`,
    '',
    'GUION',
    project.script || '(sin guion)',
    '',
    'TIMELINE',
  ];
  for (const s of project.scenes) {
    lines.push(
      `[${pad(s.start)} → ${pad(s.end)}] ${s.id} · ${s.scene_type}`,
      `  voz: ${s.voiceover || '(sin locución)'}`,
      `  pantalla: ${(s.visual_text || []).join(' / ') || '(sin texto)'}`,
      `  sfx: ${[s.sfx?.in, s.sfx?.accent, s.sfx?.out].filter((x) => x && x !== 'none').join(', ') || 'ninguno'} · salida: ${s.transition_out}`,
      ''
    );
  }
  return lines.join('\n');
}

/** Convierte una URL propia del worker en una ruta local del disco. */
function localize(url) {
  if (!url) return null;
  const idx = String(url).indexOf(`${PUBLIC_BASE}/`);
  if (idx < 0) return null;
  const rel = String(url).slice(idx + PUBLIC_BASE.length + 1);
  if (rel.includes('..')) return null;
  return path.join(ROOT, rel);
}

function publicBase(req) {
  return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

function slug(name) {
  return (
    String(name || 'reel')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'reel'
  );
}

const pad = (t) => `${(Number(t) || 0).toFixed(2)}s`.padStart(7, ' ');
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* Barrido periódico del área de trabajo. */
setInterval(() => {
  sweep().catch(() => {});
}, 60 * 60 * 1000).unref();

app.use((err, _req, res, _next) => {
  const tooBig = err && (err.code === 'LIMIT_FILE_SIZE' || /File too large/i.test(err.message || ''));
  res.status(tooBig ? 413 : 500).json({
    ok: false,
    error: tooBig ? `El archivo supera el límite de ${Math.round(MAX_UPLOAD / 1024 / 1024)} MB.` : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`worker escuchando en :${PORT}`);
  console.log(`  área de trabajo: ${ROOT}`);
  console.log(`  stage: ${process.env.STAGE_URL || `http://127.0.0.1:${PORT}/engine/stage.html`}`);
  sweep().catch(() => {});
});
