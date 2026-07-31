// Los 8 componentes maestros.
//
// La IA no escribe HTML. Elige uno de estos y lo configura. Cada componente
// monta su DOM una vez y expone `update(local, dur)`, que es una función pura
// del tiempo: no guarda estado, no usa transiciones CSS, no depende de haber
// sido llamado antes. Por eso el worker puede saltar al frame que quiera.

import { clamp, ease, envelope, stagger, win, countTo, transform, drift, kenBurns, mix } from './anim.js';
import { icon, guessIcon } from './icons.js';
import { intensityCurve } from './skins.js';

/* ─── helpers de DOM ─── */

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

/** Resalta las palabras clave dentro de una linea de texto. */
// Centinelas fuera del rango imprimible: se insertan sobre el texto ya
// escapado y se cambian por etiquetas al final, asi una palabra clave no
// puede inyectar HTML.
const KW_OPEN = '\u0001';
const KW_CLOSE = '\u0002';

function mark(line, keywords) {
  const list = Array.isArray(keywords) ? keywords.filter(Boolean) : [];
  let out = escapeHtml(line);
  if (!list.length) return out;
  // Mas largas primero: evita que "vender" gane sobre "vender mas".
  const sorted = [...list].sort((a, b) => String(b).length - String(a).length);
  for (const kw of sorted) {
    const safe = escapeHtml(kw).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!safe) continue;
    out = out.replace(new RegExp(`(${safe})`, 'gi'), (m, g1, offset, whole) => {
      // No re-marcar lo que ya esta dentro de un centinela.
      const before = whole.slice(0, offset);
      const open = before.lastIndexOf(KW_OPEN);
      const close = before.lastIndexOf(KW_CLOSE);
      if (open > close) return m;
      return KW_OPEN + g1 + KW_CLOSE;
    });
  }
  return out.split(KW_OPEN).join('<em class="kw">').split(KW_CLOSE).join('</em>');
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function textLines(scene) {
  const t = scene.visual_text;
  if (Array.isArray(t) && t.length) return t.filter((l) => String(l).trim());
  if (typeof t === 'string' && t.trim()) return [t];
  return [];
}

function assetUrl(scene) {
  return scene.asset && scene.asset.url ? scene.asset.url : null;
}

function speedOf(scene) {
  const s = scene.animation && scene.animation.speed;
  return s && s > 0 ? s : 1;
}

function intensityOf(scene, ctx) {
  const own = scene.animation && typeof scene.animation.intensity === 'number' ? scene.animation.intensity : null;
  return intensityCurve(own ?? ctx.intensity);
}

/* ─── 01 · Hook tipográfico ─────────────────────────────────────────────
   Abre el reel. Líneas grandes que entran una atrás de la otra con golpe.  */

const kineticHook = {
  id: 'kinetic_hook',
  label: 'Hook tipográfico',
  hint: 'Arranque. 2 a 4 líneas cortas, la última es la que golpea.',
  mount(root, scene, ctx) {
    const lines = textLines(scene).slice(0, 4);
    const glow = el('div', 'sc-glow');
    const stack = el('div', 'sc-stack sc-hook');
    const nodes = lines.map((l) => {
      const line = el('div', 'sc-line');
      line.appendChild(el('span', 'sc-line-inner', mark(l, scene.keywords)));
      stack.appendChild(line);
      return line.firstChild;
    });
    root.append(glow, stack);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      const env = envelope(local, dur);
      stack.style.opacity = env;
      glow.style.opacity = ease.outCubic(win(local, 0, 0.8)) * 0.9;
      nodes.forEach((n, i) => {
        const p = stagger(local, i, nodes.length, { step: 0.13, dur: 0.52, speed: sp });
        const e = ease.outBack(p);
        n.style.opacity = ease.outQuad(clamp(p * 1.4));
        n.style.transform = transform({
          y: (1 - e) * I.travel * 0.55,
          scale: mix(1 - I.scalePop * 0.5, 1, e),
        });
      });
    };
  },
};

/* ─── 02 · Cámara + palabras ────────────────────────────────────────────
   El video base manda. El texto acompaña abajo, sobre una barra.
   Es el componente que más se usa en modo overlay con alfa.           */

const cameraWords = {
  id: 'camera_words',
  label: 'Cámara + palabras',
  hint: 'Se ve el video original. El texto refuerza, no repite todo.',
  mount(root, scene, ctx) {
    const lines = textLines(scene).slice(0, 3);
    const wrap = el('div', 'sc-lower');
    const bar = el('div', 'sc-lower-bar');
    const box = el('div', 'sc-lower-box');
    const nodes = lines.map((l) => {
      const n = el('div', 'sc-lower-line', mark(l, scene.keywords));
      box.appendChild(n);
      return n;
    });
    wrap.append(bar, box);
    root.appendChild(wrap);
    root.classList.add('sc-transparent');

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      const env = envelope(local, dur, { inDur: 0.3, outDur: 0.24 });
      wrap.style.opacity = env;
      const grow = ease.outExpo(win(local, 0, 0.42 / sp));
      bar.style.transform = transform({ scale: 1 }) + ` scaleX(${grow})`;
      nodes.forEach((n, i) => {
        const p = stagger(local, i, nodes.length, { start: 0.12, step: 0.1, dur: 0.4, speed: sp });
        n.style.opacity = ease.outQuad(p);
        n.style.transform = transform({ y: (1 - ease.outCubic(p)) * I.travel * 0.3 });
      });
    };
  },
};

/* ─── 03 · Palabra impacto ──────────────────────────────────────────────
   Una sola palabra o dos. Bloque de color detrás. Se usa para remarcar. */

const impactWord = {
  id: 'impact_word',
  label: 'Palabra impacto',
  hint: 'Una palabra. Máximo dos. Si necesitás tres, es otra escena.',
  mount(root, scene, ctx) {
    const word = (textLines(scene)[0] || scene.visual_message || '').toUpperCase();
    const block = el('div', 'sc-impact-block');
    const holder = el('div', 'sc-impact');
    const label = el('div', 'sc-impact-word', escapeHtml(word));
    holder.appendChild(label);
    root.append(block, holder);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      const p = ease.outSpring(win(local, 0, 0.5 / sp));
      const out = 1 - win(local, dur - 0.22, dur);
      const hit = ease.punch(win(local, 0, 0.34 / sp));
      block.style.transform = `scaleY(${ease.outExpo(win(local, 0, 0.3 / sp))})`;
      block.style.opacity = out;
      holder.style.opacity = ease.outQuad(clamp(p * 2)) * out;
      label.style.transform = transform({
        scale: mix(1 - I.scalePop, 1, p) + hit * I.scalePop * 0.6,
        y: (1 - p) * I.travel * 0.2,
      });
    };
  },
};

/* ─── 04 · Lista animada ────────────────────────────────────────────────
   Cuando el guion enumera, aparece una lista. Con íconos, en cascada.  */

const animatedList = {
  id: 'animated_list',
  label: 'Lista animada',
  hint: 'Cuando el guion enumera. Hasta 5 ítems, cascada de abajo hacia arriba.',
  mount(root, scene, ctx) {
    const title = textLines(scene)[0] || null;
    const items = (scene.items || []).slice(0, 5);
    const wrap = el('div', 'sc-list-wrap');
    if (title) wrap.appendChild(el('div', 'sc-list-title', mark(title, scene.keywords)));
    const list = el('div', 'sc-list');
    const nodes = items.map((it) => {
      const row = el('div', 'sc-list-row');
      const ic = el('div', 'sc-list-icon', icon(it.icon || guessIcon(it.text)));
      const tx = el('div', 'sc-list-text', mark(it.text, scene.keywords));
      row.append(ic, tx);
      list.appendChild(row);
      return row;
    });
    wrap.appendChild(list);
    root.appendChild(wrap);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      const env = envelope(local, dur);
      wrap.style.opacity = env;
      if (title) {
        const tp = ease.outCubic(win(local, 0, 0.36 / sp));
        wrap.firstChild.style.opacity = tp;
        wrap.firstChild.style.transform = transform({ y: (1 - tp) * 24 });
      }
      const step = Math.min(0.34, (dur * 0.62) / Math.max(nodes.length, 1));
      nodes.forEach((n, i) => {
        const p = stagger(local, i, nodes.length, { start: title ? 0.22 : 0.08, step, dur: 0.46, speed: sp });
        const e = ease.outBack(p);
        n.style.opacity = ease.outQuad(clamp(p * 1.6));
        n.style.transform = transform({ y: (1 - e) * I.travel * 0.45, x: (1 - e) * 12 });
      });
    };
  },
};

/* ─── 05 · Comparación ──────────────────────────────────────────────────
   Cuando el guion compara. Un lado se apaga, el otro se enciende.      */

const comparison = {
  id: 'comparison',
  label: 'Comparación',
  hint: 'Antes/después, mal/bien, ellos/vos. Dos columnas, una gana.',
  mount(root, scene, ctx) {
    const c = scene.comparison || {};
    const wrap = el('div', 'sc-cmp');
    const build = (side, label, items) => {
      const col = el('div', `sc-cmp-col sc-cmp-${side}`);
      col.appendChild(el('div', 'sc-cmp-label', escapeHtml(label || (side === 'left' ? 'Antes' : 'Después'))));
      const box = el('div', 'sc-cmp-items');
      (items || []).slice(0, 4).forEach((t) => {
        const row = el('div', 'sc-cmp-row');
        row.appendChild(el('span', 'sc-cmp-ico', icon(side === 'left' ? 'cross' : 'check')));
        row.appendChild(el('span', null, mark(t, scene.keywords)));
        box.appendChild(row);
      });
      col.appendChild(box);
      wrap.appendChild(col);
      return { col, rows: [...box.children] };
    };
    const L = build('left', c.left_label, c.left_items);
    const divider = el('div', 'sc-cmp-divider');
    wrap.appendChild(divider);
    const R = build('right', c.right_label, c.right_items);
    root.appendChild(wrap);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      wrap.style.opacity = envelope(local, dur);
      const lp = ease.outCubic(win(local, 0, 0.4 / sp));
      const rp = ease.outCubic(win(local, 0.34 / sp, 0.78 / sp));
      L.col.style.transform = transform({ x: (1 - lp) * -I.travel * 0.5 });
      L.col.style.opacity = mix(0, 0.55, lp);
      R.col.style.transform = transform({ x: (1 - rp) * I.travel * 0.5 });
      R.col.style.opacity = rp;
      divider.style.transform = `scaleY(${ease.outExpo(win(local, 0.2 / sp, 0.6 / sp))})`;
      L.rows.forEach((n, i) => {
        const p = stagger(local, i, L.rows.length, { start: 0.14, step: 0.08, dur: 0.32, speed: sp });
        n.style.opacity = p;
        n.style.transform = transform({ y: (1 - ease.outCubic(p)) * 16 });
      });
      R.rows.forEach((n, i) => {
        const p = stagger(local, i, R.rows.length, { start: 0.48, step: 0.1, dur: 0.36, speed: sp });
        n.style.opacity = p;
        n.style.transform = transform({ y: (1 - ease.outBack(p)) * 20 });
      });
    };
  },
};

/* ─── 06 · Número / estadística ─────────────────────────────────────────
   Cuando el guion menciona una cifra, aparece el número contando.      */

const statNumber = {
  id: 'stat_number',
  label: 'Número o estadística',
  hint: 'Cuando se dice una cifra. El número cuenta hasta el valor.',
  mount(root, scene, ctx) {
    const st = scene.stat || {};
    const raw = String(st.value ?? textLines(scene)[0] ?? '0');
    const numeric = parseFloat(String(raw).replace(',', '.').replace(/[^\d.\-]/g, ''));
    const decimals = /[.,]\d/.test(raw) ? 1 : 0;
    const wrap = el('div', 'sc-stat');
    const row = el('div', 'sc-stat-row');
    if (st.prefix) row.appendChild(el('span', 'sc-stat-fix', escapeHtml(st.prefix)));
    const num = el('span', 'sc-stat-n', escapeHtml(raw));
    row.appendChild(num);
    if (st.suffix) row.appendChild(el('span', 'sc-stat-fix', escapeHtml(st.suffix)));
    wrap.appendChild(row);
    const label = el('div', 'sc-stat-label', mark(st.label || textLines(scene)[1] || '', scene.keywords));
    wrap.appendChild(label);
    const bar = el('div', 'sc-stat-bar');
    wrap.appendChild(bar);
    root.appendChild(wrap);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      wrap.style.opacity = envelope(local, dur);
      const cp = win(local, 0.05, Math.min(dur * 0.6, 1.15 / sp));
      if (Number.isFinite(numeric)) num.textContent = countTo(numeric, cp, decimals);
      const pop = ease.outSpring(win(local, 0, 0.5 / sp));
      row.style.transform = transform({ scale: mix(1 - I.scalePop * 0.8, 1, pop) });
      const lp = ease.outCubic(win(local, 0.4 / sp, 0.85 / sp));
      label.style.opacity = lp;
      label.style.transform = transform({ y: (1 - lp) * 22 });
      bar.style.transform = `scaleX(${ease.outExpo(win(local, 0.25 / sp, 0.9 / sp))})`;
    };
  },
};

/* ─── 07 · Imagen conceptual ────────────────────────────────────────────
   Cuando el guion describe una situación, aparece una imagen.          */

const conceptImage = {
  id: 'concept_image',
  label: 'Imagen conceptual',
  hint: 'Cuando el guion describe una situación. Imagen a sangre + texto abajo.',
  mount(root, scene, ctx) {
    const url = assetUrl(scene);
    const holder = el('div', 'sc-img-holder');
    if (url) {
      const img = el('img', 'sc-img');
      img.src = url;
      img.alt = '';
      holder.appendChild(img);
    } else {
      holder.appendChild(el('div', 'sc-img-empty', `<span>${escapeHtml(
        (scene.asset && scene.asset.prompt) || scene.visual_message || 'Falta la imagen de esta escena'
      )}</span>`));
    }
    const scrim = el('div', 'sc-img-scrim');
    const box = el('div', 'sc-img-text');
    const nodes = textLines(scene).slice(0, 3).map((l) => {
      const n = el('div', 'sc-img-line', mark(l, scene.keywords));
      box.appendChild(n);
      return n;
    });
    root.append(holder, scrim, box);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      const env = envelope(local, dur, { inDur: 0.45, outDur: 0.3 });
      root.style.opacity = env;
      const k = kenBurns(local, dur, 1.05, 1.05 + 0.09 * (0.4 + I.shake * 0.6));
      holder.style.transform = transform({ scale: k, x: drift(local, I.drift * 0.6, dur * 2 || 8) });
      scrim.style.opacity = ease.outCubic(win(local, 0.1, 0.6));
      nodes.forEach((n, i) => {
        const p = stagger(local, i, nodes.length, { start: 0.3, step: 0.11, dur: 0.44, speed: sp });
        n.style.opacity = ease.outQuad(p);
        n.style.transform = transform({ y: (1 - ease.outBack(p)) * I.travel * 0.35 });
      });
    };
  },
};

/* ─── 08 · Remate / CTA ─────────────────────────────────────────────────
   Cierra. Frase final, marca y la acción concreta.                     */

const ctaEnd = {
  id: 'cta_end',
  label: 'Remate / CTA',
  hint: 'Última escena. Frase de cierre + la acción concreta.',
  mount(root, scene, ctx) {
    const lines = textLines(scene).slice(0, 3);
    const wrap = el('div', 'sc-cta');
    const glow = el('div', 'sc-glow sc-glow-bottom');
    const box = el('div', 'sc-cta-box');
    const nodes = lines.map((l) => {
      const n = el('div', 'sc-cta-line', mark(l, scene.keywords));
      box.appendChild(n);
      return n;
    });
    const btn = el('div', 'sc-cta-btn');
    btn.append(el('span', 'sc-cta-dot'), el('span', null, escapeHtml(scene.cta || ctx.cta || 'Escribinos')));
    const brand = el('div', 'sc-cta-brand', escapeHtml(ctx.handle || '@chimichurridiseno'));
    wrap.append(box, btn, brand);
    root.append(glow, wrap);

    return (local, dur) => {
      const sp = speedOf(scene);
      const I = intensityOf(scene, ctx);
      wrap.style.opacity = envelope(local, dur, { inDur: 0.4, outDur: 0.2 });
      glow.style.opacity = ease.outCubic(win(local, 0, 0.9));
      nodes.forEach((n, i) => {
        const p = stagger(local, i, nodes.length, { step: 0.12, dur: 0.5, speed: sp });
        n.style.opacity = ease.outQuad(clamp(p * 1.4));
        n.style.transform = transform({ y: (1 - ease.outBack(p)) * I.travel * 0.4 });
      });
      const bp = ease.outSpring(win(local, 0.42 / sp, 1.0 / sp));
      btn.style.opacity = clamp(bp * 1.5);
      btn.style.transform = transform({ scale: mix(0.86, 1, bp) });
      const brp = ease.outCubic(win(local, 0.7 / sp, 1.15 / sp));
      brand.style.opacity = brp * 0.75;
    };
  },
};

/* ─── registro ─── */

export const COMPONENTS = {
  kinetic_hook: kineticHook,
  camera_words: cameraWords,
  impact_word: impactWord,
  animated_list: animatedList,
  comparison,
  stat_number: statNumber,
  concept_image: conceptImage,
  cta_end: ctaEnd,
};

export const SCENE_TYPES = Object.keys(COMPONENTS);

/**
 * Mapa de los 12 recursos narrativos de la biblioteca a los 8 maestros.
 * Los alias existen para que el modelo pueda hablar en términos narrativos y
 * el motor siga ejecutando componentes probados.
 */
export const SCENE_ALIASES = {
  hook: 'kinetic_hook',
  kinetic_text: 'kinetic_hook',
  camera: 'camera_words',
  talking_head: 'camera_words',
  impact: 'impact_word',
  list: 'animated_list',
  icon_list: 'animated_list',
  compare: 'comparison',
  before_after: 'comparison',
  stat: 'stat_number',
  number: 'stat_number',
  image: 'concept_image',
  screenshot: 'concept_image',
  diagram: 'concept_image',
  punchline: 'cta_end',
  cta: 'cta_end',
};

export function resolveType(type) {
  if (COMPONENTS[type]) return type;
  const alias = SCENE_ALIASES[String(type || '').toLowerCase()];
  return alias || 'kinetic_hook';
}

export function componentFor(type) {
  return COMPONENTS[resolveType(type)];
}
