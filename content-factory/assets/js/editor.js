// Editor del reel: escenas, preview, propiedades, timeline y exportación.
//
// El preview es un iframe con /engine/stage.html — el MISMO motor que usa el
// worker para renderizar. No es una maqueta parecida al resultado: es el
// resultado, a menor escala.

import { api } from './api.js';
import { toast, escapeHtml, withBusy, wireLogout, requireSessionOrRedirect } from './ui.js';
import { Timeline } from './timeline.js';
import { resequence, MIN_SCENE, MAX_SCENE, estimateDuration, DEFAULT_WPM } from '/engine/src/timing.js';
import { COMPONENTS } from '/engine/src/components.js';
import { TRANSITION_NAMES } from '/engine/src/renderer.js';
import { SFX_LIBRARY } from '/engine/src/sfx.js';
import { ICON_NAMES } from '/engine/src/icons.js';
import { SKINS } from '/engine/src/skins.js';

const id = new URLSearchParams(location.search).get('id');
const stage = document.getElementById('stage');

let project = null;
let selectedId = null;
let showGlobals = false;
let playing = false;
let saveTimer = null;
let stageReady = false;

const timeline = new Timeline(document.getElementById('timeline'), {
  onSeek: (t) => send({ type: 'seek', t }),
  onSelect: (sceneId) => select(sceneId),
});

const session = await api.session().catch(() => null);
if (!requireSessionOrRedirect(session)) throw new Error('sin sesión');
wireLogout(api);

if (!id) {
  toast('Falta el id del proyecto.', 'error');
} else {
  await load();
}

async function load() {
  try {
    const res = await api.getProject(id);
    project = res.project;
    if (!project.scenes?.length) {
      location.replace(`/content-factory/reel/project.html?id=${encodeURIComponent(id)}`);
      return;
    }
    document.getElementById('crumbName').textContent = project.name;
    document.getElementById('backPipeline').href = `/content-factory/reel/project.html?id=${encodeURIComponent(id)}`;
    selectedId = project.scenes[0].id;
    renderAll();
    if (stageReady) pushToStage();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ─── puente con el stage ─── */

function send(msg) {
  stage.contentWindow?.postMessage({ target: 'chimi-stage', ...msg }, '*');
}

function pushToStage(type = 'update') {
  if (!project) return;
  send({ type, project: stageProject() });
}

/** El stage recibe sólo lo que sabe dibujar. */
function stageProject() {
  return {
    id: project.id,
    name: project.name,
    skin: project.skin || project.brand,
    intensity: project.intensity,
    speed: project.speed,
    fps: project.fps || 30,
    duration: project.duration,
    base_video: project.use_base_video ? project.ingest?.video_url || null : null,
    cta: project.cta,
    handle: project.handle,
    voice: project.voice || null,
    music: project.music || null,
    scenes: project.scenes,
  };
}

window.addEventListener('message', (ev) => {
  const msg = ev.data;
  if (!msg || msg.source !== 'chimi-stage') return;

  switch (msg.type) {
    case 'ready':
      stageReady = true;
      if (project) {
        pushToStage('load');
        send({ type: 'volume', volumes: project.volumes || {} });
      }
      break;
    case 'time': {
      const scrub = document.getElementById('scrub');
      if (document.activeElement !== scrub) scrub.value = msg.t;
      document.getElementById('time').textContent =
        `${msg.t.toFixed(1)}s / ${Number(project?.duration || 0).toFixed(1)}s`;
      timeline.setTime(msg.t);
      const sc = project?.scenes.find((s) => s.id === msg.sceneId);
      document.getElementById('sceneNow').textContent = sc
        ? `${String(project.scenes.indexOf(sc) + 1).padStart(2, '0')} · ${sc.scene_type.replace(/_/g, ' ')}`
        : '';
      break;
    }
    case 'playing':
      playing = msg.playing;
      document.getElementById('play').textContent = playing ? '❚❚' : '▶';
      break;
    case 'ended':
      playing = false;
      document.getElementById('play').textContent = '▶';
      break;
    default:
      break;
  }
});

/* ─── transporte ─── */

document.getElementById('play').addEventListener('click', () => send({ type: 'toggle' }));
document.getElementById('scrub').addEventListener('input', (ev) => send({ type: 'seek', t: Number(ev.target.value) }));

let safeOn = false;
document.getElementById('safeBtn').addEventListener('click', (ev) => {
  safeOn = !safeOn;
  ev.currentTarget.classList.toggle('btn-primary', safeOn);
  send({ type: 'safe', on: safeOn });
});

document.addEventListener('keydown', (ev) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (ev.code === 'Space') {
    ev.preventDefault();
    send({ type: 'toggle' });
  }
  if (ev.key === 'ArrowDown') move(1);
  if (ev.key === 'ArrowUp') move(-1);
});

function move(delta) {
  const i = project.scenes.findIndex((s) => s.id === selectedId);
  const next = project.scenes[i + delta];
  if (next) select(next.id);
}

/* ─── render de la UI ─── */

function renderAll() {
  renderSceneList();
  renderProps();
  timeline.render(project, selectedId);
  document.getElementById('sceneCount').textContent =
    `${project.scenes.length}/10 · ${Number(project.duration).toFixed(1)}s`;
  renderWarnings();
}

function renderWarnings() {
  const host = document.getElementById('warnings');
  const list = project.warnings || [];
  if (!list.length) return (host.innerHTML = '');
  host.innerHTML = `<div class="notice notice-warn" style="margin-bottom:10px;font-size:0.74rem">
    <div><strong>${list.length} aviso(s) de dirección</strong><br>${list.map(escapeHtml).join('<br>')}</div>
  </div>`;
}

function renderSceneList() {
  const host = document.getElementById('sceneList');
  host.innerHTML = project.scenes
    .map((s, i) => {
      const text = (s.visual_text || []).join(' · ') || s.visual_message || s.voiceover || '(vacía)';
      return `<div class="scene-item${s.id === selectedId ? ' sel' : ''}${s.tight ? ' tight' : ''}${s.locked ? ' locked' : ''}"
          data-id="${escapeHtml(s.id)}" role="button" tabindex="0"
          ${s.tight ? 'title="La locución no entra cómoda en esta escena"' : ''}>
        <span class="idx">${String(i + 1).padStart(2, '0')}</span>
        <div class="info">
          <div class="kind">${escapeHtml(s.scene_type.replace(/_/g, ' '))}</div>
          <div class="txt">${escapeHtml(text)}</div>
        </div>
        <span class="dur mono">${(s.end - s.start).toFixed(1)}s</span>
      </div>`;
    })
    .join('');

  host.querySelectorAll('[data-id]').forEach((el) => {
    el.addEventListener('click', () => select(el.dataset.id));
  });
}

function select(sceneId) {
  selectedId = sceneId;
  showGlobals = false;
  const scene = current();
  if (scene) send({ type: 'seek', t: scene.start + 0.01 });
  renderAll();
}

function current() {
  return project.scenes.find((s) => s.id === selectedId) || null;
}

document.getElementById('globalBtn').addEventListener('click', () => {
  showGlobals = !showGlobals;
  renderProps();
});

/* ─── propiedades ─── */

function renderProps() {
  const host = document.getElementById('props');
  document.getElementById('propTitle').textContent = showGlobals ? 'Globales' : 'Escena';
  host.innerHTML = showGlobals ? globalPropsHtml() : scenePropsHtml();
  showGlobals ? wireGlobalProps() : wireSceneProps();
}

function globalPropsHtml() {
  const v = project.volumes || {};
  return `
    <div class="prop-group">
      <h4>Marca</h4>
      <div class="prop-stack">
        <div class="field">
          <label for="gSkin">Skin visual</label>
          <select id="gSkin">${Object.entries(SKINS)
            .map(([k, s]) => `<option value="${k}"${(project.skin || project.brand) === k ? ' selected' : ''}>${escapeHtml(s.label)}</option>`)
            .join('')}</select>
        </div>
        <div class="field">
          <label for="gCta">Texto del CTA</label>
          <input type="text" id="gCta" value="${escapeHtml(project.cta || '')}" maxlength="60">
        </div>
        <div class="field">
          <label for="gHandle">Usuario en pantalla</label>
          <input type="text" id="gHandle" value="${escapeHtml(project.handle || '')}" maxlength="40">
        </div>
      </div>
    </div>

    <div class="prop-group">
      <h4>Movimiento</h4>
      <div class="prop-stack">
        ${rangeRow('gSpeed', 'Velocidad general', project.speed ?? 1, 0.6, 1.6, 0.05)}
        ${rangeRow('gIntensity', 'Intensidad de animación', project.intensity ?? 0.6, 0, 1, 0.05)}
      </div>
      <span class="help">Afecta a todas las escenas que no tengan su propio valor.</span>
    </div>

    <div class="prop-group">
      <h4>Audio</h4>
      <div class="prop-stack">
        ${rangeRow('gVoice', 'Volumen de voz', v.voice ?? 1, 0, 1.5, 0.05)}
        ${rangeRow('gMusic', 'Volumen de música', v.music ?? 0.22, 0, 1, 0.02)}
        ${rangeRow('gSfx', 'Volumen de efectos', v.sfx ?? 0.6, 0, 1.5, 0.05)}
        <div class="scene-tools">
          <button class="btn btn-sm" data-upload="voice">${project.voice ? 'Cambiar voz' : 'Subir voz'}</button>
          <button class="btn btn-sm" data-upload="music">${project.music ? 'Cambiar música' : 'Subir música'}</button>
        </div>
        ${project.voice || project.music
          ? `<span class="help">${project.voice ? 'Voz cargada. ' : ''}${project.music ? 'Música cargada.' : ''}</span>`
          : `<span class="help">Sin voz cargada el MP4 sale con los efectos solos.</span>`}
      </div>
    </div>

    <div class="prop-group">
      <h4>Video base</h4>
      <div class="prop-inline">
        <label for="gBase">Usar el reel original de fondo</label>
        <input type="checkbox" id="gBase"${project.use_base_video ? ' checked' : ''}
          ${project.ingest?.video_url ? '' : ' disabled'}>
      </div>
      <span class="help">${project.ingest?.video_url
        ? 'Las escenas de tipo cámara lo dejan ver. Hace el render bastante más lento.'
        : 'No hay video base: el proyecto arrancó de texto o de audio.'}</span>
    </div>

    <div class="prop-group">
      <h4>Timeline</h4>
      <div class="prop-inline"><label>Duración total</label><span class="val">${Number(project.duration).toFixed(1)}s</span></div>
      <div class="prop-inline"><label>Escenas</label><span class="val">${project.scenes.length}</span></div>
      <span class="help">La duración total es la suma de las escenas. Para cambiarla,
        cambiá la duración de las escenas.</span>
    </div>`;
}

function scenePropsHtml() {
  const s = current();
  if (!s) return '<p class="dim">No hay escena seleccionada.</p>';
  const i = project.scenes.indexOf(s);
  const dur = s.end - s.start;
  const spoken = estimateDuration(s.voiceover, project.analysis?.timing?.wpm || DEFAULT_WPM);

  return `
    <div class="prop-group">
      <h4>Escena ${String(i + 1).padStart(2, '0')}</h4>
      <div class="chips" style="margin-bottom:12px">
        ${Object.entries(COMPONENTS)
          .map(([k, c]) => `<button class="chip${s.scene_type === k ? ' on' : ''}" data-type="${k}" title="${escapeHtml(c.hint)}">${escapeHtml(c.label)}</button>`)
          .join('')}
      </div>
      <span class="help">${escapeHtml(COMPONENTS[s.scene_type]?.hint || '')}</span>
    </div>

    <div class="prop-group">
      <h4>Locución</h4>
      <div class="field">
        <textarea id="pVoice" rows="3">${escapeHtml(s.voiceover)}</textarea>
        <span class="help">${spoken}s de locución en una escena de ${dur.toFixed(1)}s.
          ${spoken > dur * 1.15 ? '<strong style="color:var(--warn)">No entra cómoda.</strong>' : ''}</span>
      </div>
    </div>

    <div class="prop-group">
      <h4>Texto en pantalla</h4>
      <div class="field">
        <textarea id="pText" rows="4" placeholder="Una línea por renglón">${escapeHtml((s.visual_text || []).join('\n'))}</textarea>
        <span class="help">Máximo 4 líneas de 5 palabras. No es el subtítulo: es lo que hay que leer.</span>
      </div>
      <div class="field" style="margin-top:10px">
        <label for="pKeywords">Palabras clave</label>
        <input type="text" id="pKeywords" value="${escapeHtml((s.keywords || []).join(', '))}" placeholder="separadas por coma">
        <span class="help">Se pintan con el color de la marca. Una o dos.</span>
      </div>
    </div>

    ${s.scene_type === 'animated_list' ? listPropsHtml(s) : ''}
    ${s.scene_type === 'stat_number' ? statPropsHtml(s) : ''}
    ${s.scene_type === 'comparison' ? comparePropsHtml(s) : ''}
    ${['concept_image', 'camera_words'].includes(s.scene_type) || s.asset ? assetPropsHtml(s) : ''}

    <div class="prop-group">
      <h4>Tiempo y movimiento</h4>
      <div class="prop-stack">
        ${rangeRow('pDur', 'Duración', dur, MIN_SCENE, MAX_SCENE, 0.1, 's')}
        <div class="scene-tools">
          <button class="btn btn-sm" data-nudge="-0.3">Más rápida</button>
          <button class="btn btn-sm" data-nudge="0.3">Más lenta</button>
        </div>
        ${rangeRow('pSpeed', 'Velocidad de entrada', s.animation?.speed ?? 1, 0.6, 1.8, 0.05)}
        ${rangeRow('pInt', 'Intensidad', s.animation?.intensity ?? project.intensity ?? 0.6, 0, 1, 0.05)}
      </div>
    </div>

    <div class="prop-group">
      <h4>Sonido y transición</h4>
      <div class="prop-stack">
        ${sfxSelect('pSfxIn', 'Efecto de entrada', s.sfx?.in)}
        ${sfxSelect('pSfxAccent', 'Efecto interno', s.sfx?.accent)}
        ${sfxSelect('pSfxOut', 'Efecto de salida', s.sfx?.out)}
        <div class="field">
          <label for="pTrans">Transición de salida</label>
          <select id="pTrans">${TRANSITION_NAMES.map(
            (t) => `<option value="${t}"${s.transition_out === t ? ' selected' : ''}>${t.replace(/_/g, ' ')}</option>`
          ).join('')}</select>
        </div>
      </div>
    </div>

    <div class="prop-group">
      <h4>Acciones</h4>
      <div class="scene-tools">
        <button class="btn btn-sm" data-act="up"${i === 0 ? ' disabled' : ''}>↑ Subir</button>
        <button class="btn btn-sm" data-act="down"${i === project.scenes.length - 1 ? ' disabled' : ''}>↓ Bajar</button>
        <button class="btn btn-sm" data-act="dup"${project.scenes.length >= 10 ? ' disabled' : ''}>Duplicar</button>
        <button class="btn btn-sm" data-act="lock">${s.locked ? 'Desbloquear' : 'Bloquear'}</button>
        <button class="btn btn-sm" data-act="regen"${s.locked ? ' disabled' : ''}>Regenerar</button>
        <button class="btn btn-sm btn-danger" data-act="del"${project.scenes.length <= 1 ? ' disabled' : ''}>Eliminar</button>
      </div>
      <span class="help">Bloquear evita que "Regenerar" la toque.</span>
    </div>`;
}

function listPropsHtml(s) {
  const items = s.items?.length ? s.items : [{ text: '', icon: 'dot' }];
  return `<div class="prop-group">
    <h4>Ítems de la lista</h4>
    <div class="prop-stack" id="itemRows">
      ${items
        .map(
          (it, n) => `<div style="display:flex;gap:5px">
            <select data-item-icon="${n}" style="width:88px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px">
              ${ICON_NAMES.map((ic) => `<option value="${ic}"${it.icon === ic ? ' selected' : ''}>${ic}</option>`).join('')}
            </select>
            <input type="text" data-item-text="${n}" value="${escapeHtml(it.text)}" placeholder="Texto del ítem"
              style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 10px">
            <button class="btn btn-sm btn-icon btn-danger" data-item-del="${n}">×</button>
          </div>`
        )
        .join('')}
    </div>
    <button class="btn btn-sm btn-block" data-item-add style="margin-top:8px"${items.length >= 5 ? ' disabled' : ''}>+ Ítem</button>
  </div>`;
}

function statPropsHtml(s) {
  const st = s.stat || {};
  return `<div class="prop-group">
    <h4>Número</h4>
    <div class="prop-stack">
      <div class="row" style="gap:8px">
        <div class="field"><label for="pStatPrefix">Prefijo</label><input type="text" id="pStatPrefix" value="${escapeHtml(st.prefix || '')}" maxlength="3"></div>
        <div class="field"><label for="pStatValue">Valor</label><input type="text" id="pStatValue" value="${escapeHtml(st.value || '')}" maxlength="8"></div>
      </div>
      <div class="field"><label for="pStatSuffix">Sufijo</label><input type="text" id="pStatSuffix" value="${escapeHtml(st.suffix || '')}" maxlength="3"></div>
      <div class="field"><label for="pStatLabel">Qué mide</label><input type="text" id="pStatLabel" value="${escapeHtml(st.label || '')}"></div>
    </div>
    <span class="help">El número cuenta desde cero hasta el valor.</span>
  </div>`;
}

function comparePropsHtml(s) {
  const c = s.comparison || {};
  return `<div class="prop-group">
    <h4>Comparación</h4>
    <div class="prop-stack">
      <div class="field"><label for="pCmpLL">Lado que pierde</label><input type="text" id="pCmpLL" value="${escapeHtml(c.left_label || 'Antes')}"></div>
      <div class="field"><textarea id="pCmpLI" rows="3" placeholder="Un ítem por renglón">${escapeHtml((c.left_items || []).join('\n'))}</textarea></div>
      <div class="field"><label for="pCmpRL">Lado que gana</label><input type="text" id="pCmpRL" value="${escapeHtml(c.right_label || 'Después')}"></div>
      <div class="field"><textarea id="pCmpRI" rows="3" placeholder="Un ítem por renglón">${escapeHtml((c.right_items || []).join('\n'))}</textarea></div>
    </div>
  </div>`;
}

function assetPropsHtml(s) {
  const a = s.asset || {};
  return `<div class="prop-group">
    <h4>Imagen</h4>
    ${a.url ? `<img class="asset-preview" src="${escapeHtml(a.url)}" alt="" style="margin-bottom:10px">` : ''}
    <div class="field" style="margin-bottom:10px">
      <label for="pPrompt">Prompt de generación</label>
      <textarea id="pPrompt" rows="5" placeholder="Todavía sin prompt">${escapeHtml(a.prompt || '')}</textarea>
      ${a.concept ? `<span class="help">${escapeHtml(a.concept)}</span>` : ''}
    </div>
    <div class="scene-tools">
      <button class="btn btn-sm" data-asset="prompt">Regenerar prompt</button>
      <button class="btn btn-sm" data-asset="upload">Subir mi imagen</button>
      <button class="btn btn-sm btn-block" data-asset="generate"${a.prompt ? '' : ' disabled'} style="grid-column:1/-1">Generar imagen</button>
    </div>
    <span class="help">Si no hay imagen, la escena renderiza un placeholder con el concepto escrito.</span>
  </div>`;
}

function rangeRow(inputId, label, value, min, max, step, unit = '') {
  return `<div>
    <div class="prop-inline">
      <label for="${inputId}">${escapeHtml(label)}</label>
      <span class="val mono" id="${inputId}Val">${Number(value).toFixed(step < 0.1 ? 2 : 1)}${unit}</span>
    </div>
    <input type="range" id="${inputId}" min="${min}" max="${max}" step="${step}" value="${value}">
  </div>`;
}

function sfxSelect(inputId, label, value) {
  return `<div class="field">
    <label for="${inputId}">${escapeHtml(label)}</label>
    <select id="${inputId}">
      ${Object.entries(SFX_LIBRARY)
        .map(([k, v]) => `<option value="${k}"${value === k ? ' selected' : ''}>${escapeHtml(v.label)} — ${escapeHtml(v.use)}</option>`)
        .join('')}
    </select>
  </div>`;
}

/* ─── cableado de propiedades ─── */

function wireGlobalProps() {
  bind('gSkin', 'change', (el) => patchProject({ skin: el.value }));
  bind('gCta', 'input', (el) => patchProject({ cta: el.value }, true));
  bind('gHandle', 'input', (el) => patchProject({ handle: el.value }, true));
  liveRange('gSpeed', (v) => patchProject({ speed: v }), 2);
  liveRange('gIntensity', (v) => patchProject({ intensity: v }), 2);
  liveRange('gVoice', (v) => patchVolumes({ voice: v }), 2);
  liveRange('gMusic', (v) => patchVolumes({ music: v }), 2);
  liveRange('gSfx', (v) => patchVolumes({ sfx: v }), 2);
  bind('gBase', 'change', (el) => patchProject({ use_base_video: el.checked }));

  document.querySelectorAll('[data-upload]').forEach((btn) =>
    btn.addEventListener('click', () => pickFile(btn.dataset.upload === 'voice' ? 'audio/*' : 'audio/*', async (file) => {
      await withBusy(btn, 'Subiendo…', async () => {
        try {
          const res = await api.uploadAsset(project.id, file, btn.dataset.upload);
          patchProject({ [btn.dataset.upload]: res.url });
          toast('Audio cargado.', 'ok');
          renderProps();
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    }))
  );
}

function wireSceneProps() {
  const s = current();
  if (!s) return;

  document.querySelectorAll('[data-type]').forEach((btn) =>
    btn.addEventListener('click', () => patchScene(s.id, { scene_type: btn.dataset.type }, { rebuild: true }))
  );

  bind('pVoice', 'input', (el) => patchScene(s.id, { voiceover: el.value }, { quiet: true }));
  bind('pText', 'input', (el) =>
    patchScene(s.id, { visual_text: el.value.split('\n').map((l) => l.trim()).filter(Boolean) }, { quiet: true })
  );
  bind('pKeywords', 'input', (el) =>
    patchScene(s.id, { keywords: el.value.split(',').map((k) => k.trim()).filter(Boolean) }, { quiet: true })
  );

  liveRange('pDur', (v) => setDuration(s.id, v), 1, 's');
  document.querySelectorAll('[data-nudge]').forEach((btn) =>
    btn.addEventListener('click', () => setDuration(s.id, s.end - s.start + Number(btn.dataset.nudge)))
  );
  liveRange('pSpeed', (v) => patchScene(s.id, { animation: { ...s.animation, speed: v } }), 2);
  liveRange('pInt', (v) => patchScene(s.id, { animation: { ...s.animation, intensity: v } }), 2);

  bind('pSfxIn', 'change', (el) => patchScene(s.id, { sfx: { ...s.sfx, in: el.value } }));
  bind('pSfxAccent', 'change', (el) => patchScene(s.id, { sfx: { ...s.sfx, accent: el.value } }));
  bind('pSfxOut', 'change', (el) => patchScene(s.id, { sfx: { ...s.sfx, out: el.value } }));
  bind('pTrans', 'change', (el) => patchScene(s.id, { transition_out: el.value }));

  // lista
  bind('pStatPrefix', 'input', (el) => patchScene(s.id, { stat: { ...s.stat, prefix: el.value } }, { quiet: true }));
  bind('pStatValue', 'input', (el) => patchScene(s.id, { stat: { ...s.stat, value: el.value } }, { quiet: true }));
  bind('pStatSuffix', 'input', (el) => patchScene(s.id, { stat: { ...s.stat, suffix: el.value } }, { quiet: true }));
  bind('pStatLabel', 'input', (el) => patchScene(s.id, { stat: { ...s.stat, label: el.value } }, { quiet: true }));

  bind('pCmpLL', 'input', (el) => patchCompare(s, { left_label: el.value }));
  bind('pCmpRL', 'input', (el) => patchCompare(s, { right_label: el.value }));
  bind('pCmpLI', 'input', (el) => patchCompare(s, { left_items: lines(el.value) }));
  bind('pCmpRI', 'input', (el) => patchCompare(s, { right_items: lines(el.value) }));

  document.querySelectorAll('[data-item-text]').forEach((el) =>
    el.addEventListener('input', () => patchItems(s, Number(el.dataset.itemText), { text: el.value }))
  );
  document.querySelectorAll('[data-item-icon]').forEach((el) =>
    el.addEventListener('change', () => patchItems(s, Number(el.dataset.itemIcon), { icon: el.value }))
  );
  document.querySelectorAll('[data-item-del]').forEach((el) =>
    el.addEventListener('click', () => {
      const items = [...(s.items || [])];
      items.splice(Number(el.dataset.itemDel), 1);
      patchScene(s.id, { items }, { rebuild: true });
    })
  );
  const addBtn = document.querySelector('[data-item-add]');
  if (addBtn) {
    addBtn.addEventListener('click', () =>
      patchScene(s.id, { items: [...(s.items || []), { text: '', icon: 'dot' }] }, { rebuild: true })
    );
  }

  bind('pPrompt', 'input', (el) =>
    patchScene(s.id, { asset: { ...(s.asset || { kind: 'image' }), prompt: el.value } }, { quiet: true })
  );

  document.querySelectorAll('[data-asset]').forEach((btn) => btn.addEventListener('click', () => assetAction(btn, s)));
  document.querySelectorAll('[data-act]').forEach((btn) => btn.addEventListener('click', () => sceneAction(btn, s)));
}

function bind(elId, event, fn) {
  const el = document.getElementById(elId);
  if (el) el.addEventListener(event, () => fn(el));
}

function liveRange(elId, fn, decimals = 1, unit = '') {
  const el = document.getElementById(elId);
  const out = document.getElementById(`${elId}Val`);
  if (!el) return;
  el.addEventListener('input', () => {
    const v = Number(el.value);
    if (out) out.textContent = `${v.toFixed(decimals)}${unit}`;
    fn(v);
  });
}

const lines = (v) => v.split('\n').map((l) => l.trim()).filter(Boolean);

/* ─── mutaciones ─── */

function patchProject(patch, quiet = false) {
  project = { ...project, ...patch };
  pushToStage();
  if (patch.volumes) send({ type: 'volume', volumes: project.volumes });
  if (!quiet) timeline.render(project, selectedId);
  scheduleSave();
}

function patchVolumes(patch) {
  project = { ...project, volumes: { ...(project.volumes || {}), ...patch } };
  send({ type: 'volume', volumes: project.volumes });
  scheduleSave();
}

function patchScene(sceneId, patch, { rebuild = false, quiet = false } = {}) {
  project = {
    ...project,
    scenes: project.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
  };
  pushToStage();
  if (rebuild || !quiet) {
    renderSceneList();
    timeline.render(project, selectedId);
  }
  if (rebuild) renderProps();
  scheduleSave();
}

function patchCompare(scene, patch) {
  patchScene(scene.id, { comparison: { ...(scene.comparison || {}), ...patch } }, { quiet: true });
}

function patchItems(scene, index, patch) {
  const items = [...(scene.items || [])];
  items[index] = { ...items[index], ...patch };
  patchScene(scene.id, { items }, { quiet: true });
}

/** Cambiar la duración de una escena recorre el timeline entero. */
function setDuration(sceneId, seconds) {
  const scenes = project.scenes.map((s) => (s.id === sceneId ? { ...s, duration: seconds } : { ...s, duration: s.end - s.start }));
  const { scenes: out, duration } = resequence(scenes);
  project = { ...project, scenes: out, duration };
  pushToStage();
  renderSceneList();
  timeline.render(project, selectedId);
  document.getElementById('sceneCount').textContent = `${out.length}/10 · ${duration.toFixed(1)}s`;
  scheduleSave();
}

async function sceneAction(btn, scene) {
  const i = project.scenes.indexOf(scene);
  const scenes = [...project.scenes];

  switch (btn.dataset.act) {
    case 'up':
    case 'down': {
      const j = i + (btn.dataset.act === 'up' ? -1 : 1);
      if (j < 0 || j >= scenes.length) return;
      [scenes[i], scenes[j]] = [scenes[j], scenes[i]];
      commitScenes(scenes);
      break;
    }
    case 'dup': {
      if (scenes.length >= 10) return toast('Diez escenas es el techo. Un reel con más no se sigue.', 'error');
      const copy = { ...structuredClone(scene), id: `scene_${Date.now().toString(36)}` };
      scenes.splice(i + 1, 0, copy);
      commitScenes(scenes);
      selectedId = copy.id;
      renderProps();
      break;
    }
    case 'lock':
      patchScene(scene.id, { locked: !scene.locked }, { rebuild: true });
      break;
    case 'del': {
      if (scenes.length <= 1) return;
      scenes.splice(i, 1);
      commitScenes(scenes);
      selectedId = project.scenes[Math.min(i, project.scenes.length - 1)].id;
      renderAll();
      break;
    }
    case 'regen':
      await withBusy(btn, 'Regenerando…', async () => {
        try {
          const res = await api.regenerateScene(project.id, scene.id);
          project = res.project;
          renderAll();
          pushToStage();
          toast('Escena regenerada.', 'ok');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      break;
    default:
      break;
  }
}

function commitScenes(scenes) {
  const { scenes: out, duration } = resequence(scenes.map((s) => ({ ...s, duration: s.duration ?? s.end - s.start })));
  project = { ...project, scenes: out, duration };
  pushToStage();
  renderAll();
  scheduleSave();
}

async function assetAction(btn, scene) {
  switch (btn.dataset.asset) {
    case 'prompt':
      await withBusy(btn, 'Escribiendo…', async () => {
        try {
          const res = await api.imagePrompt(project.id, scene.id);
          project = res.project;
          renderProps();
          toast('Prompt listo.', 'ok');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      break;

    case 'upload':
      pickFile('image/*', async (file) => {
        await withBusy(btn, 'Subiendo…', async () => {
          try {
            const res = await api.uploadAsset(project.id, file, scene.id);
            patchScene(scene.id, {
              asset: { ...(scene.asset || { kind: 'image' }), url: res.url, status: 'ready' },
            }, { rebuild: true });
            toast('Imagen cargada.', 'ok');
          } catch (err) {
            toast(err.message, 'error');
          }
        });
      });
      break;

    case 'generate': {
      const prompt = document.getElementById('pPrompt')?.value?.trim();
      if (!prompt) return toast('Primero hace falta un prompt.', 'error');
      await withBusy(btn, 'Generando…', async () => {
        try {
          const res = await api.generateImage(project.id, scene.id, prompt);
          patchScene(scene.id, {
            asset: { ...(scene.asset || { kind: 'image' }), prompt, url: res.url, status: 'ready' },
          }, { rebuild: true });
          toast('Imagen generada.', 'ok');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      break;
    }
    default:
      break;
  }
}

function pickFile(accept, fn) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.addEventListener('change', () => {
    if (input.files[0]) fn(input.files[0]);
  });
  input.click();
}

/* ─── guardado ─── */

function scheduleSave() {
  const state = document.getElementById('saveState');
  state.textContent = 'sin guardar';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 900);
}

async function save() {
  const state = document.getElementById('saveState');
  state.textContent = 'guardando…';
  try {
    const res = await api.updateProject(project.id, {
      scenes: project.scenes,
      skin: project.skin,
      speed: project.speed,
      intensity: project.intensity,
      cta: project.cta,
      handle: project.handle,
      volumes: project.volumes,
      voice: project.voice,
      music: project.music,
      use_base_video: project.use_base_video,
      warnings: project.warnings,
    });
    // El servidor es la fuente de verdad de los tiempos: si difieren, gana él.
    if (Math.abs((res.project.duration || 0) - (project.duration || 0)) > 0.05) {
      project = { ...project, scenes: res.project.scenes, duration: res.project.duration };
      pushToStage();
      renderAll();
    }
    state.textContent = 'guardado';
  } catch (err) {
    state.textContent = 'error al guardar';
    toast(`No se pudo guardar: ${err.message}`, 'error');
  }
}

window.addEventListener('beforeunload', (ev) => {
  if (document.getElementById('saveState').textContent === 'sin guardar') {
    ev.preventDefault();
    ev.returnValue = '';
  }
});

/* ─── exportación ─── */

const exportModal = document.getElementById('exportModal');
document.getElementById('exportBtn').addEventListener('click', async () => {
  await save();
  exportModal.classList.remove('hide');
});
document.getElementById('closeExport').addEventListener('click', () => exportModal.classList.add('hide'));
exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) exportModal.classList.add('hide');
});
document.querySelectorAll('[data-out]').forEach((chip) =>
  chip.addEventListener('click', () => chip.classList.toggle('on'))
);

document.getElementById('startRender').addEventListener('click', async (ev) => {
  const outputs = [...document.querySelectorAll('[data-out].on')].map((c) => c.dataset.out);
  if (!outputs.length) return toast('Elegí al menos una salida.', 'error');

  const status = document.getElementById('renderStatus');
  status.classList.remove('hide');
  status.className = 'notice notice-info';
  status.innerHTML = '<div><span class="spinner"></span> Arrancando el render…</div>';

  await withBusy(ev.currentTarget, 'Renderizando…', async () => {
    try {
      const fps = Number(document.getElementById('fps').value);
      const payload = { ...stageProject(), fps, script: project.script, volumes: project.volumes };
      const job = await api.render(payload, outputs);
      await poll(job.worker, job.job_id, status);
    } catch (err) {
      status.className = 'notice notice-error';
      status.textContent = err.message;
    }
  });
});

/**
 * El render tarda minutos, así que se consulta el estado cada 3 segundos.
 * No hay websocket: para una persona usando la herramienta, esto alcanza.
 */
async function poll(worker, jobIdValue, status) {
  const started = Date.now();
  const LIMIT = 40 * 60 * 1000;

  while (Date.now() - started < LIMIT) {
    await new Promise((r) => setTimeout(r, 3000));
    let job;
    try {
      job = await api.jobStatus(project.id, worker, jobIdValue);
    } catch (err) {
      status.className = 'notice notice-error';
      status.textContent = `Se perdió contacto con el render: ${err.message}`;
      return;
    }

    if (job.status === 'error') {
      status.className = 'notice notice-error';
      status.textContent = `El render falló: ${job.error}`;
      return;
    }

    if (job.status === 'listo') {
      status.className = 'notice notice-ok';
      status.innerHTML = `
        <div style="width:100%">
          <strong>Render terminado.</strong>
          <div class="render-list" style="margin-top:10px">
            ${job.outputs
              .map(
                (o) => `<div class="render-out">
                  <span>${escapeHtml(o.label)}</span>
                  <a class="btn btn-sm btn-primary" href="${escapeHtml(o.url)}" download>Descargar</a>
                </div>`
              )
              .join('')}
          </div>
          ${job.warnings?.length ? `<p class="dim" style="margin-top:10px;font-size:0.74rem">${job.warnings.map(escapeHtml).join('<br>')}</p>` : ''}
        </div>`;
      await api.updateProject(project.id, { status: 'renderizado', renders: job.outputs }).catch(() => {});
      return;
    }

    status.innerHTML = `<div style="width:100%">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>${escapeHtml(job.step || job.status)}</span>
        <span class="mono">${job.progress || 0}%</span>
      </div>
      <div class="bar"><i style="width:${job.progress || 0}%"></i></div>
    </div>`;
  }

  status.className = 'notice notice-warn';
  status.textContent = 'El render sigue corriendo pero dejé de esperarlo. Volvé a abrir esta ventana más tarde.';
}
