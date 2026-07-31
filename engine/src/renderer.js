// Renderer determinista.
//
// Una sola entrada pública: seek(t). Dibuja el estado exacto del reel en el
// segundo t, sin depender de haber sido llamado antes. El preview del editor
// llama seek() desde un requestAnimationFrame; el worker llama seek(n/fps) y
// saca una captura. Mismo código, mismo resultado.

import { clamp, ease, win, transform } from './anim.js';
import { componentFor, resolveType } from './components.js';
import { applySkin } from './skins.js';

/** Duración de una transición entre escenas, en segundos. */
export const TRANSITION = 0.36;

const TRANSITIONS = {
  cut: () => {},

  fast_wipe(p, { fx, scenes }) {
    // Banda de acento que barre la pantalla y se va por el otro lado.
    const cover = ease.outExpo(win(p, 0, 0.5));
    const leave = ease.inOutCubic(win(p, 0.5, 1));
    fx.style.opacity = 1;
    fx.style.background = 'var(--accent)';
    fx.style.transformOrigin = leave > 0 ? 'right center' : 'left center';
    fx.style.transform = `scaleX(${leave > 0 ? 1 - leave : cover})`;
    scenes.style.transform = transform({ x: (1 - Math.abs(p - 0.5) * 2) * -24 });
  },

  flash(p, { fx }) {
    fx.style.opacity = ease.punch(p) * 0.85;
    fx.style.background = 'var(--accent)';
    fx.style.transform = 'none';
  },

  dip_black(p, { fx }) {
    fx.style.opacity = ease.punch(p);
    fx.style.background = '#000';
    fx.style.transform = 'none';
  },

  zoom_punch(p, { fx, scenes }) {
    const k = ease.punch(p);
    scenes.style.transform = transform({ scale: 1 + k * 0.09 });
    fx.style.opacity = k * 0.25;
    fx.style.background = 'var(--accent)';
    fx.style.transform = 'none';
  },

  slide_up(p, { scenes }) {
    scenes.style.transform = transform({ y: -ease.punch(p) * 220 });
  },

  glitch(p, { fx, scenes }) {
    // Desplazamiento pseudoaleatorio pero determinista: depende sólo de p.
    const k = ease.punch(p);
    const jitter = Math.sin(p * 97.3) * 14 * k;
    scenes.style.transform = transform({ x: jitter });
    scenes.style.filter = k > 0.02 ? `saturate(${1 + k * 2}) contrast(${1 + k})` : 'none';
    fx.style.opacity = k * 0.2;
    fx.style.background = 'var(--accent2)';
    fx.style.transform = 'none';
  },
};

export const TRANSITION_NAMES = Object.keys(TRANSITIONS);

function transitionFor(name) {
  return TRANSITIONS[String(name || 'cut').toLowerCase()] || TRANSITIONS.cut;
}

export class Renderer {
  /**
   * @param {HTMLElement} root  el elemento .stage
   * @param {{alpha?: boolean}} opts
   */
  constructor(root, opts = {}) {
    this.root = root;
    this.alpha = !!opts.alpha;
    this.project = null;
    this.mounted = new Map(); // scene.id -> { el, update }
    this.lastSceneId = null;

    this.base = root.querySelector('.stage-base');
    this.scenesEl = root.querySelector('.stage-scenes');
    this.fx = root.querySelector('.stage-fx');
    root.classList.toggle('alpha', this.alpha);
  }

  /** Carga un proyecto. Desmonta todo lo anterior. */
  load(project) {
    this.project = normalizeProject(project);
    this.mounted.clear();
    this.scenesEl.textContent = '';
    this.lastSceneId = null;
    this.skin = applySkin(this.root, this.project.skin);

    if (this.base) {
      const src = this.alpha ? null : this.project.base_video;
      if (src) {
        this.base.src = src;
        this.base.style.display = '';
      } else {
        this.base.removeAttribute('src');
        this.base.style.display = 'none';
      }
    }
    return this.project;
  }

  get duration() {
    return this.project ? this.project.duration : 0;
  }

  /** Contexto global que reciben los componentes. */
  get ctx() {
    const p = this.project;
    return {
      skin: this.skin,
      intensity: p.intensity,
      speed: p.speed,
      cta: p.cta,
      handle: p.handle,
      alpha: this.alpha,
    };
  }

  sceneAt(t) {
    const scenes = this.project.scenes;
    for (let i = 0; i < scenes.length; i++) {
      if (t < scenes[i].end || i === scenes.length - 1) return i;
    }
    return 0;
  }

  mount(scene) {
    if (this.mounted.has(scene.id)) return this.mounted.get(scene.id);
    const comp = componentFor(scene.scene_type);
    const host = document.createElement('div');
    host.className = `scene scene-${resolveType(scene.scene_type)}`;
    host.dataset.sceneId = scene.id;
    this.scenesEl.appendChild(host);
    const update = comp.mount(host, scene, this.ctx);
    const entry = { el: host, update };
    this.mounted.set(scene.id, entry);
    return entry;
  }

  /** Invalida una escena para que se vuelva a construir con datos nuevos. */
  invalidate(sceneId) {
    const entry = this.mounted.get(sceneId);
    if (entry) {
      entry.el.remove();
      this.mounted.delete(sceneId);
    }
  }

  /** Dibuja el reel en el segundo `t`. Determinista. */
  seek(t) {
    if (!this.project || !this.project.scenes.length) return;
    const time = clamp(t, 0, this.project.duration);
    const idx = this.sceneAt(time);
    const scene = this.project.scenes[idx];

    // Reset de lo que las transiciones ensucian.
    this.scenesEl.style.transform = 'none';
    this.scenesEl.style.filter = 'none';
    this.fx.style.opacity = 0;

    const entry = this.mount(scene);
    for (const [id, m] of this.mounted) {
      m.el.style.display = id === scene.id ? '' : 'none';
    }
    this.lastSceneId = scene.id;

    const dur = Math.max(scene.end - scene.start, 0.01);
    entry.update(time - scene.start, dur, this.ctx);

    this.applyTransitions(time, idx);
    return scene;
  }

  /**
   * Las transiciones viven a caballo del corte: la ventana está centrada en el
   * límite entre dos escenas, así el efecto tapa el cambio en vez de anunciarlo.
   */
  applyTransitions(time, idx) {
    const scenes = this.project.scenes;
    const half = TRANSITION / 2;
    const targets = { fx: this.fx, scenes: this.scenesEl, root: this.root };

    for (let i = 0; i < scenes.length - 1; i++) {
      const boundary = scenes[i].end;
      if (time < boundary - half || time > boundary + half) continue;
      const p = clamp((time - (boundary - half)) / TRANSITION);
      transitionFor(scenes[i].transition_out)(p, targets);
      return;
    }
    // Entrada del reel y salida final: siempre un fundido corto desde/hacia negro.
    if (time < 0.18) {
      this.fx.style.background = '#000';
      this.fx.style.transform = 'none';
      this.fx.style.opacity = 1 - ease.outCubic(time / 0.18);
    } else if (time > this.project.duration - 0.24) {
      this.fx.style.background = '#000';
      this.fx.style.transform = 'none';
      this.fx.style.opacity = ease.inQuad(win(time, this.project.duration - 0.24, this.project.duration));
    }
  }

  /**
   * Sincroniza el video base. En preview se deja reproducir solo; en render se
   * fuerza el frame exacto, que es lento pero es la única forma de que el
   * MP4 quede en sincronía real con la locución.
   */
  async syncBase(t, { exact = false } = {}) {
    if (!this.base || !this.project.base_video || this.alpha) return;
    if (!exact) return;
    if (Math.abs(this.base.currentTime - t) < 0.001) return;
    await new Promise((resolve) => {
      const done = () => {
        this.base.removeEventListener('seeked', done);
        resolve();
      };
      this.base.addEventListener('seeked', done, { once: true });
      this.base.currentTime = t;
      // El video puede ser más corto que el reel: no colgarse esperando.
      setTimeout(done, 400);
    });
  }
}

/** Rellena defaults y normaliza tiempos para que el renderer nunca reciba basura. */
export function normalizeProject(input) {
  const p = input || {};
  const scenes = (Array.isArray(p.scenes) ? p.scenes : []).map((s, i) => ({
    id: s.id || `scene_${String(i + 1).padStart(2, '0')}`,
    start: num(s.start, 0),
    end: num(s.end, num(s.start, 0) + num(s.duration, 3)),
    scene_type: resolveType(s.scene_type),
    voiceover: s.voiceover || '',
    visual_message: s.visual_message || '',
    visual_text: Array.isArray(s.visual_text) ? s.visual_text : s.visual_text ? [s.visual_text] : [],
    keywords: Array.isArray(s.keywords) ? s.keywords : [],
    items: Array.isArray(s.items) ? s.items : [],
    stat: s.stat || null,
    comparison: s.comparison || null,
    asset: s.asset || null,
    animation: s.animation || {},
    sfx: s.sfx || {},
    transition_out: s.transition_out || 'cut',
    cta: s.cta || null,
    locked: !!s.locked,
  }));

  const duration = num(p.duration, scenes.length ? scenes[scenes.length - 1].end : 0);

  return {
    id: p.id || null,
    name: p.name || 'Reel sin nombre',
    skin: p.skin || 'chimichurri',
    intensity: typeof p.intensity === 'number' ? p.intensity : 0.6,
    speed: p.speed > 0 ? p.speed : 1,
    fps: p.fps || 30,
    duration,
    base_video: p.base_video || null,
    cta: p.cta || 'Escribinos',
    handle: p.handle || '@chimichurridiseno',
    music: p.music || null,
    voice: p.voice || null,
    scenes,
  };
}

function num(v, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
