// Transcripción con tiempos.
//
// Se usa whisper-1 y no un modelo más nuevo por una razón concreta: es el que
// devuelve verbose_json con timestamps por palabra y por segmento, que es
// justamente lo que necesita el análisis de ritmo. Un texto corrido sin tiempos
// no sirve para medir pausas ni para saber dónde cortar.
// Configurable por si mañana otro modelo expone lo mismo.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribe(audioFile, { language = 'es' } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY no está configurada en el worker.');

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  const buf = await readFile(audioFile);

  const form = new FormData();
  form.append('file', new Blob([buf], { type: 'audio/mpeg' }), path.basename(audioFile));
  form.append('model', model);
  form.append('language', language);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');
  form.append('timestamp_granularities[]', 'word');

  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = `La transcripción falló (${res.status})`;
    try {
      const body = JSON.parse(text);
      if (body.error?.message) msg = body.error.message;
    } catch {
      /* respuesta no-JSON: queda el mensaje genérico */
    }
    throw new Error(msg);
  }

  const data = JSON.parse(text);
  const segments = (data.segments || []).map((s) => ({
    start: round(s.start),
    end: round(s.end),
    text: String(s.text || '').trim(),
  }));
  const words = (data.words || []).map((w) => ({
    start: round(w.start),
    end: round(w.end),
    word: w.word,
  }));

  return {
    transcript: String(data.text || '').trim(),
    duration: round(data.duration || (segments.length ? segments[segments.length - 1].end : 0)),
    segments,
    words,
    model,
    ...deriveRhythm(words, segments),
  };
}

/**
 * Ritmo real medido sobre los tiempos, no estimado. Las pausas entre palabras
 * son lo que distingue un reel nervioso de uno que respira, y es un dato que el
 * modelo no puede sacar del texto.
 */
function deriveRhythm(words, segments) {
  const source = words.length ? words : segments;
  if (source.length < 2) return { wpm: null, pauses: [], longest_pause: 0 };

  const spoken = source[source.length - 1].end - source[0].start;
  const count = words.length || segments.reduce((a, s) => a + s.text.split(/\s+/).length, 0);

  const pauses = [];
  for (let i = 1; i < source.length; i++) {
    const gap = round(source[i].start - source[i - 1].end);
    if (gap >= 0.25) pauses.push({ at: round(source[i - 1].end), gap });
  }

  return {
    wpm: spoken > 0 ? Math.round((count / spoken) * 60) : null,
    pauses,
    longest_pause: pauses.reduce((max, p) => Math.max(max, p.gap), 0),
  };
}

function round(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
