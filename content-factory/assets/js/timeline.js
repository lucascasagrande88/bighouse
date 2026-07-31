// Timeline del editor. Cuatro pistas: voz, escenas visuales, efectos y transiciones.
//
// Dibuja lo que hay en el proyecto, no una animación aparte: si el timeline y el
// preview no coinciden, es que el proyecto cambió y no se redibujó.

import { escapeHtml } from './ui.js';

const SFX_SHORT = {
  hook: 'hook', impact_low: 'imp', impact_hard: 'IMP', appear: 'in', disappear: 'out',
  transition: 'trs', list_tick: 'tick', pop: 'pop', click: 'clk', whoosh: 'wsh',
  shimmer: 'shm', glitch: 'gli', success: 'ok', cta: 'cta', close: 'fin',
};

export class Timeline {
  constructor(host, { onSeek, onSelect } = {}) {
    this.host = host;
    this.onSeek = onSeek;
    this.onSelect = onSelect;
    this.project = null;
    this.selected = null;
    this.head = null;
  }

  render(project, selectedId) {
    this.project = project;
    this.selected = selectedId;
    const dur = Math.max(project.duration || 0, 0.1);

    this.host.innerHTML = `
      <div class="tl-ruler">${this.ticks(dur)}</div>
      ${this.row('Voz', this.voiceBlocks(project, dur))}
      ${this.row('Visual', this.sceneBlocks(project, dur))}
      ${this.row('SFX', this.sfxDots(project, dur))}
      ${this.row('Transición', this.transitionDots(project, dur))}
      ${this.row('Música', project.music
        ? `<div class="tl-block" style="left:0;width:100%">${escapeHtml(project.music.split('/').pop())}</div>`
        : `<div class="tl-block" style="left:0;width:100%;opacity:0.4">sin música</div>`)}
    `;

    this.head = document.createElement('div');
    this.head.className = 'tl-head';
    const firstTrack = this.host.querySelector('.tl-track');
    if (firstTrack) firstTrack.parentElement.style.position = 'relative';

    this.host.querySelectorAll('.tl-track').forEach((track) => {
      track.addEventListener('click', (ev) => {
        const rect = track.getBoundingClientRect();
        const t = ((ev.clientX - rect.left) / rect.width) * dur;
        if (this.onSeek) this.onSeek(Math.max(0, Math.min(dur, t)));
      });
    });

    this.host.querySelectorAll('[data-scene]').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (this.onSelect) this.onSelect(el.dataset.scene);
      });
    });
  }

  /** Sólo mueve el cabezal: redibujar todo el timeline en cada frame es tirar CPU. */
  setTime(t) {
    if (!this.project) return;
    const pct = (t / Math.max(this.project.duration, 0.1)) * 100;
    this.host.querySelectorAll('.tl-track').forEach((track) => {
      let head = track.querySelector('.tl-head');
      if (!head) {
        head = document.createElement('div');
        head.className = 'tl-head';
        track.appendChild(head);
      }
      head.style.left = `${Math.min(100, Math.max(0, pct))}%`;
    });
  }

  row(label, content) {
    return `<div class="tl-row">
      <div class="tl-label">${escapeHtml(label)}</div>
      <div class="tl-track">${content}</div>
    </div>`;
  }

  ticks(dur) {
    const stepChoices = [1, 2, 5, 10, 15];
    const step = stepChoices.find((s) => dur / s <= 12) || 20;
    let out = '';
    for (let t = 0; t <= dur; t += step) {
      out += `<span class="tl-tick" style="left:${(t / dur) * 100}%">${t}s</span>`;
    }
    return out;
  }

  sceneBlocks(project, dur) {
    return (project.scenes || [])
      .map((s) => {
        const left = (s.start / dur) * 100;
        const width = Math.max(((s.end - s.start) / dur) * 100, 1.2);
        const sel = s.id === this.selected ? ' sel' : '';
        return `<div class="tl-block${sel}" data-scene="${escapeHtml(s.id)}"
          style="left:${left}%;width:${width}%"
          title="${escapeHtml(s.scene_type)} · ${s.start}s–${s.end}s">${escapeHtml(shortType(s.scene_type))}</div>`;
      })
      .join('');
  }

  voiceBlocks(project, dur) {
    return (project.scenes || [])
      .filter((s) => s.voiceover)
      .map((s) => {
        const left = (s.start / dur) * 100;
        const width = Math.max(((s.end - s.start) / dur) * 100, 1.2);
        return `<div class="tl-block voice" data-scene="${escapeHtml(s.id)}"
          style="left:${left}%;width:${width}%"
          title="${escapeHtml(s.voiceover)}">${escapeHtml(s.voiceover.slice(0, 40))}</div>`;
      })
      .join('');
  }

  sfxDots(project, dur) {
    let out = '';
    for (const s of project.scenes || []) {
      const span = Math.max(s.end - s.start, 0.1);
      const events = [
        [s.sfx?.in, s.start],
        [s.sfx?.accent, s.start + Math.min(0.4, span * 0.35)],
        [s.sfx?.out, Math.max(s.start, s.end - 0.18)],
      ];
      for (const [name, at] of events) {
        if (!name || name === 'none') continue;
        out += `<span class="tl-dot" style="left:${(at / dur) * 100}%" title="${escapeHtml(name)} · ${at.toFixed(2)}s"></span>`;
      }
    }
    return out;
  }

  transitionDots(project, dur) {
    const scenes = project.scenes || [];
    return scenes
      .slice(0, -1)
      .filter((s) => s.transition_out && s.transition_out !== 'cut')
      .map(
        (s) =>
          `<div class="tl-block" style="left:${((s.end - 0.18) / dur) * 100}%;width:${(0.36 / dur) * 100}%"
            title="${escapeHtml(s.transition_out)}">${escapeHtml(s.transition_out.slice(0, 4))}</div>`
      )
      .join('');
  }
}

function shortType(type) {
  return (
    {
      kinetic_hook: 'HOOK',
      camera_words: 'CÁMARA',
      impact_word: 'IMPACTO',
      animated_list: 'LISTA',
      comparison: 'COMPARA',
      stat_number: 'NÚMERO',
      concept_image: 'IMAGEN',
      cta_end: 'CTA',
    }[type] || type
  );
}

export { SFX_SHORT };
