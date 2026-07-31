// Banco de sonidos organizado por función, no por nombre de archivo.
//
// El criterio: una escena no pide "whoosh_03.wav", pide "entrada de lista".
// El mapa traduce función → archivo, así se puede cambiar el banco entero sin
// tocar ni un scenes.json.
//
// Los archivos van en /assets/sfx/. Tienen que ser propios, licenciados o
// libres para uso comercial: el sistema no se construye sobre audio arrancado
// de reels ajenos. Si un archivo no está, el bus lo saltea en silencio.

export const SFX_BASE = '/assets/sfx/';

export const SFX_LIBRARY = {
  hook: { file: 'hook-riser.mp3', label: 'Hook', use: 'Arranque del reel' },
  impact_low: { file: 'impact-low.mp3', label: 'Impacto grave', use: 'Palabra que golpea' },
  impact_hard: { file: 'impact-hard.mp3', label: 'Impacto duro', use: 'Remate seco' },
  appear: { file: 'appear.mp3', label: 'Aparición', use: 'Entra un texto' },
  disappear: { file: 'disappear.mp3', label: 'Desaparición', use: 'Sale un texto' },
  transition: { file: 'transition.mp3', label: 'Transición', use: 'Cambio de escena' },
  list_tick: { file: 'list-tick.mp3', label: 'Lista', use: 'Cada ítem de una lista' },
  pop: { file: 'pop.mp3', label: 'Pop', use: 'Ícono o burbuja' },
  click: { file: 'click.mp3', label: 'Click', use: 'Marca de check' },
  whoosh: { file: 'whoosh.mp3', label: 'Whoosh', use: 'Movimiento rápido' },
  shimmer: { file: 'shimmer.mp3', label: 'Shimmer', use: 'Brillo, detalle' },
  glitch: { file: 'glitch.mp3', label: 'Glitch', use: 'Corte agresivo' },
  success: { file: 'success.mp3', label: 'Éxito', use: 'Resultado positivo' },
  cta: { file: 'cta.mp3', label: 'CTA', use: 'Aparece la acción' },
  close: { file: 'close.mp3', label: 'Cierre', use: 'Último frame' },
  none: { file: null, label: 'Sin sonido', use: 'Silencio deliberado' },
};

export const SFX_NAMES = Object.keys(SFX_LIBRARY);

/** Sonido sugerido por tipo de escena, para que el modelo no tenga que adivinar. */
export const SFX_DEFAULTS = {
  kinetic_hook: { in: 'hook', accent: 'impact_low', out: 'transition' },
  camera_words: { in: 'appear', accent: 'none', out: 'none' },
  impact_word: { in: 'impact_hard', accent: 'none', out: 'whoosh' },
  animated_list: { in: 'whoosh', accent: 'list_tick', out: 'transition' },
  comparison: { in: 'appear', accent: 'click', out: 'transition' },
  stat_number: { in: 'shimmer', accent: 'impact_low', out: 'none' },
  concept_image: { in: 'whoosh', accent: 'none', out: 'transition' },
  cta_end: { in: 'cta', accent: 'success', out: 'close' },
};

export function sfxUrl(name) {
  const entry = SFX_LIBRARY[name];
  return entry && entry.file ? SFX_BASE + entry.file : null;
}

/**
 * Bus de audio del preview. El export final no usa esto: el worker mezcla con
 * ffmpeg a partir del mismo scenes.json, así que lo que se escucha acá y lo
 * que sale en el MP4 salen de la misma fuente de verdad.
 */
export class SfxBus {
  constructor() {
    this.cache = new Map();
    this.voice = null;
    this.music = null;
    this.volumes = { voice: 1, music: 0.22, sfx: 0.6 };
    this.muted = false;
  }

  load(project, { muted = false } = {}) {
    this.muted = muted;
    this.stopTracks();
    this.voice = project && project.voice ? this.audio(project.voice) : null;
    this.music = project && project.music ? this.audio(project.music) : null;
    if (this.music) this.music.loop = true;
  }

  audio(url) {
    if (!url) return null;
    if (!this.cache.has(url)) {
      const a = new Audio();
      a.src = url;
      a.preload = 'auto';
      // Un 404 en un efecto no puede tirar abajo el preview.
      a.addEventListener('error', () => this.cache.set(url, null));
      this.cache.set(url, a);
    }
    return this.cache.get(url);
  }

  setVolumes(v) {
    Object.assign(this.volumes, v);
    if (this.voice) this.voice.volume = clamp01(this.volumes.voice);
    if (this.music) this.music.volume = clamp01(this.volumes.music);
  }

  /** Dispara los efectos de entrada de una escena. */
  cue(scene) {
    if (this.muted) return;
    const s = scene.sfx || {};
    const fallback = SFX_DEFAULTS[scene.scene_type] || {};
    this.hit(s.in || fallback.in);
  }

  hit(name) {
    if (this.muted || !name || name === 'none') return;
    const url = sfxUrl(name);
    if (!url) return;
    const a = this.audio(url);
    if (!a) return;
    try {
      const shot = a.cloneNode();
      shot.volume = clamp01(this.volumes.sfx);
      shot.play().catch(() => {});
    } catch {
      /* archivo ausente: silencio, no error */
    }
  }

  play(from = 0) {
    if (this.muted) return;
    this.setVolumes(this.volumes);
    for (const track of [this.voice, this.music]) {
      if (!track) continue;
      try {
        track.currentTime = Math.min(from, track.duration || from);
        track.play().catch(() => {});
      } catch {
        /* ignorar */
      }
    }
  }

  pause() {
    for (const track of [this.voice, this.music]) if (track) track.pause();
  }

  stopTracks() {
    this.pause();
    this.voice = null;
    this.music = null;
  }
}

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
