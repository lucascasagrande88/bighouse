// Pipeline de preparación: referencia → análisis → adaptación → dirección.
//
// Cada paso guarda en el servidor antes de habilitar el siguiente, así que se
// puede cerrar la pestaña en cualquier punto y retomar.

import { api } from './api.js';
import { toast, escapeHtml, withBusy, wireLogout, showAlert, requireSessionOrRedirect, secs } from './ui.js';
import { estimateDuration, fitsTarget, DEFAULT_WPM } from '/engine/src/timing.js';

const id = new URLSearchParams(location.search).get('id');
let project = null;
let manualIngest = null;

const session = await api.session().catch(() => null);
if (!requireSessionOrRedirect(session)) throw new Error('sin sesión');
wireLogout(api);

if (!id) {
  showAlert('alert', 'Falta el id del proyecto.');
} else {
  await load();
}

async function load() {
  try {
    const res = await api.getProject(id);
    project = res.project;
    render();
  } catch (err) {
    showAlert('alert', err.message);
  }
}

function render() {
  document.getElementById('title').textContent = project.name;
  document.getElementById('crumbName').textContent = project.name;
  document.getElementById('brief').textContent =
    `${project.brand} · ${project.objective} · ${project.target_duration}s objetivo · CTA: ${project.cta}`;

  const hasIngest = !!project.ingest;
  const hasAnalysis = !!project.analysis;
  const hasScript = !!(project.script && project.script.trim());
  const hasScenes = !!(project.scenes && project.scenes.length);

  step('step1', 's1tag', hasIngest, !hasIngest);
  step('step2', 's2tag', hasAnalysis, hasIngest && !hasAnalysis, !hasIngest);
  step('step3', 's3tag', hasScript, hasAnalysis && !hasScript, !hasAnalysis);
  step('step4', 's4tag', hasScenes, hasScript && !hasScenes, !hasScript);

  // Modo de carga según lo que se eligió al crear el proyecto.
  const textMode = project.source === 'transcript' || project.source === 'idea';
  document.getElementById('uploadBox').classList.toggle('hide', textMode);
  document.getElementById('textBox').classList.toggle('hide', !textMode);
  if (textMode) {
    const isIdea = project.source === 'idea';
    document.getElementById('manualLabel').textContent = isIdea ? 'Tu idea' : 'Transcripción';
    document.getElementById('manualText').placeholder = isIdea
      ? 'Escribí la idea en criollo: qué querés decir y a quién…'
      : 'Pegá acá el texto del reel de referencia…';
    document.getElementById('sourceHelp').textContent = isIdea
      ? 'Sin reel de referencia. Se analiza tu idea como si fuera el original.'
      : 'Sin video: se analiza sólo el texto. La capa visual la decide la dirección de escenas.';
  } else if (project.source === 'audio') {
    document.getElementById('dropHint').textContent = '.mp3 / .m4a / .wav · sin fotogramas, sólo audio y ritmo';
    document.getElementById('file').accept = 'audio/*';
  }

  if (hasIngest) renderIngest();
  document.getElementById('secAnalysis').classList.toggle('hide', !hasIngest);
  document.getElementById('doAnalyze').classList.toggle('hide', hasAnalysis);
  document.getElementById('reAnalyze').classList.toggle('hide', !hasAnalysis);
  if (hasAnalysis) renderAnalysis();

  document.getElementById('secAdapt').classList.toggle('hide', !hasAnalysis);
  document.getElementById('doAdapt').classList.toggle('hide', hasScript);
  document.getElementById('reAdapt').classList.toggle('hide', !hasScript);
  if (project.adaptation) renderAdaptation();

  document.getElementById('secDirect').classList.toggle('hide', !hasScript);
  if (hasScript) {
    document.getElementById('scriptEdit').value = project.script;
    updateScriptMeta();
  }

  const toEditor = document.getElementById('toEditor');
  toEditor.classList.toggle('hide', !hasScenes);
  toEditor.href = `/content-factory/reel/editor.html?id=${encodeURIComponent(project.id)}`;
}

function step(stepId, tagId, done, active, blocked = false) {
  const el = document.getElementById(stepId);
  el.classList.toggle('done', done);
  el.classList.toggle('active', !!active);
  el.classList.toggle('blocked', !!blocked && !done);
  const tag = document.getElementById(tagId);
  tag.textContent = done ? 'Listo' : blocked ? 'Bloqueado' : 'Pendiente';
  tag.className = `tag ${done ? 'tag-ok' : active ? 'tag-accent' : ''}`;
}

/* ─── 1 · referencia ─── */

const drop = document.getElementById('drop');
const fileInput = document.getElementById('file');

['dragover', 'dragenter'].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('over');
  })
);
['dragleave', 'drop'].forEach((ev) =>
  drop.addEventListener(ev, () => drop.classList.remove('over'))
);
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) upload(fileInput.files[0]);
});

async function upload(file) {
  const bar = document.getElementById('upBar');
  const fill = bar.querySelector('i');
  const status = document.getElementById('upStatus');
  bar.classList.remove('hide');
  status.textContent = 'Subiendo…';

  try {
    const kind = file.type.startsWith('audio') || project.source === 'audio' ? 'audio' : 'video';
    const res = await api.ingest(project.id, file, {
      kind,
      onProgress: (p) => {
        fill.style.width = `${Math.round(p * 100)}%`;
        if (p >= 1) status.textContent = 'Procesando: extrayendo audio, transcribiendo y sacando fotogramas. Esto tarda.';
      },
    });

    // La ingesta se guarda ya: si el análisis falla, no hay que volver a subir.
    const saved = await api.updateProject(project.id, { ingest: res.ingest, status: 'ingerido' });
    project = saved.project;
    toast('Reel procesado.', 'ok');
    render();
  } catch (err) {
    status.textContent = '';
    showAlert('alert', `No se pudo procesar el archivo: ${err.message}`);
  } finally {
    bar.classList.add('hide');
    fill.style.width = '0';
  }
}

document.getElementById('useText').addEventListener('click', async (ev) => {
  const text = document.getElementById('manualText').value.trim();
  if (!text) return toast('Escribí o pegá algo primero.', 'error');
  const duration = Number(document.getElementById('manualDuration').value) || 30;

  manualIngest = {
    kind: project.source === 'idea' ? 'idea' : 'transcript',
    duration,
    transcript: text,
    // Sin audio real no hay segmentos: se arma uno solo que cubre todo, y el
    // análisis lo sabe porque no hay fotogramas ni cortes.
    segments: [{ start: 0, end: duration, text }],
    words: [],
    frames: [],
    cuts: [],
    cut_count: 0,
    at: new Date().toISOString(),
  };

  await withBusy(ev.currentTarget, 'Guardando…', async () => {
    try {
      const saved = await api.updateProject(project.id, { ingest: manualIngest, status: 'ingerido' });
      project = saved.project;
      render();
      toast('Texto cargado.', 'ok');
    } catch (err) {
      showAlert('alert', err.message);
    }
  });
});

function renderIngest() {
  const g = project.ingest;
  const box = document.getElementById('ingestSummary');
  box.classList.remove('hide');
  const rows = [
    ['Duración', `${Number(g.duration || 0).toFixed(1)} s`],
    ['Palabras', String((g.transcript || '').trim().split(/\s+/).filter(Boolean).length)],
    ['Ritmo', g.wpm ? `${g.wpm} palabras/min` : 'no medido'],
    ['Cortes visuales', g.cut_count != null ? String(g.cut_count) : '—'],
    ['Fotogramas', String((g.frames || []).length)],
    ['Pausa más larga', g.longest_pause ? `${g.longest_pause} s` : '—'],
  ];
  box.innerHTML = `
    <div class="notice notice-ok" style="margin-bottom:12px">Referencia cargada.</div>
    <div class="chips">${rows.map(([k, v]) => `<span class="chip">${escapeHtml(k)}: ${escapeHtml(v)}</span>`).join('')}</div>
    ${g.transcript ? `<div class="field" style="margin-top:14px"><label>Transcripción</label>
      <textarea rows="4" readonly>${escapeHtml(g.transcript)}</textarea></div>` : ''}`;
}

/* ─── 2 · análisis ─── */

document.getElementById('doAnalyze').addEventListener('click', analyze);
document.getElementById('reAnalyze').addEventListener('click', analyze);

async function analyze(ev) {
  await withBusy(ev.currentTarget, 'Analizando…', async () => {
    try {
      showAlert('alert', null);
      const res = await api.analyze(project.id);
      project = res.project;
      render();
      toast('Análisis listo.', 'ok');
    } catch (err) {
      showAlert('alert', `El análisis falló: ${err.message}`);
    }
  });
}

function renderAnalysis() {
  const a = project.analysis;
  const out = document.getElementById('analysisOut');
  out.innerHTML = `
    <div class="chips" style="margin-bottom:16px">
      <span class="chip on">${escapeHtml(a.structure.hook_type.replace(/_/g, ' '))}</span>
      <span class="chip">${escapeHtml(a.message.objective)}</span>
      <span class="chip">${a.timing.wpm} ppm</span>
      <span class="chip">${a.timing.cut_count} cortes</span>
      <span class="chip">${escapeHtml(a.timing.pace)}</span>
      <span class="chip">${escapeHtml(a.visual_language.camera_presence.replace(/_/g, ' '))}</span>
    </div>
    ${block('Tesis', a.message.thesis)}
    ${block('Le habla a', a.message.audience)}
    ${block('Estructura', a.structure.pattern)}
    ${block('Recursos visuales', (a.visual_language.resources || []).join(', '))}
    ${block('Uso de tipografía', a.visual_language.text_style)}
    <div class="field" style="margin-top:14px">
      <label>Qué conviene replicar</label>
      <ul style="display:flex;flex-direction:column;gap:6px">
        ${(a.takeaways || []).map((t) => `<li style="font-size:0.82rem;color:var(--text-dim)">— ${escapeHtml(t)}</li>`).join('')}
      </ul>
    </div>
    <div class="field" style="margin-top:14px">
      <label>Tramos del original</label>
      <div class="chips">
        ${(a.structure.beats || [])
          .map((b) => `<span class="chip">${escapeHtml(b.role)} · ${secs(b.start)}–${secs(b.end)}</span>`)
          .join('')}
      </div>
    </div>`;
}

function block(label, value) {
  if (!value) return '';
  return `<div class="field" style="margin-bottom:12px">
    <label>${escapeHtml(label)}</label>
    <p style="font-size:0.85rem;color:var(--text-dim)">${escapeHtml(value)}</p>
  </div>`;
}

/* ─── 3 · adaptación ─── */

document.getElementById('doAdapt').addEventListener('click', adapt);
document.getElementById('reAdapt').addEventListener('click', adapt);

async function adapt(ev) {
  await withBusy(ev.currentTarget, 'Escribiendo…', async () => {
    try {
      showAlert('alert', null);
      const res = await api.adapt(project.id, { duration: project.target_duration });
      project = res.project;
      render();
      toast('Guion generado.', 'ok');
    } catch (err) {
      showAlert('alert', `La adaptación falló: ${err.message}`);
    }
  });
}

function renderAdaptation() {
  const ad = project.adaptation;
  const out = document.getElementById('adaptOut');
  const fit = ad.fit || {};

  const fitNotice = fit.fits
    ? `<div class="notice notice-ok" style="margin-bottom:14px">Entra en la duración: ${fit.estimated}s sobre un objetivo de ${fit.target}s.</div>`
    : `<div class="notice notice-warn" style="margin-bottom:14px">
        <div><strong>El guion no entra cómodo.</strong><br>
        Estimado ${fit.estimated}s contra un objetivo de ${fit.target}s${fit.retried ? ' (ya se reescribió una vez)' : ''}.
        ${fit.advice ? `Habría que ${fit.advice.action === 'shorten' ? 'sacar' : 'agregar'} unas ${fit.advice.words} palabras.` : ''}
        Se puede dirigir igual: las escenas se van a estirar y te va a avisar cuáles quedan apretadas.</div>
      </div>`;

  out.innerHTML = `
    ${fitNotice}
    ${block('Idea original', ad.original_idea)}
    ${block('Aplicación a la marca', ad.brand_application)}
    <div class="field" style="margin-bottom:14px">
      <label>Qué se movió respecto del original</label>
      <div class="chips">
        ${Object.entries(ad.shifts || {})
          .map(([k, v]) => `<span class="chip" title="${escapeHtml(v)}">${escapeHtml(k)}</span>`)
          .join('')}
      </div>
      <span class="help">Pasá el mouse por cada uno para ver el cambio.</span>
    </div>
    <div class="field" style="margin-bottom:14px">
      <label>Hooks alternativos</label>
      <ul style="display:flex;flex-direction:column;gap:6px">
        ${(ad.hook_options || [])
          .map((h, i) => `<li style="font-size:0.84rem;color:${i === 0 ? 'var(--accent)' : 'var(--text-dim)'}">${i + 1}. ${escapeHtml(h)}</li>`)
          .join('')}
      </ul>
    </div>
    ${ad.risk_notes ? `<div class="notice notice-info">${escapeHtml(ad.risk_notes)}</div>` : ''}`;
}

/* ─── 4 · dirección ─── */

const scriptEdit = document.getElementById('scriptEdit');
scriptEdit.addEventListener('input', updateScriptMeta);

function updateScriptMeta() {
  const text = scriptEdit.value;
  const wpm = project.analysis?.timing?.wpm || DEFAULT_WPM;
  const est = estimateDuration(text, wpm);
  const target = project.target_duration || 30;
  const fit = fitsTarget(text, target, wpm);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('scriptMeta').innerHTML = fit.fits
    ? `${words} palabras · ${est}s estimados a ${wpm} ppm · entra en ${target}s`
    : `<span style="color:var(--warn)">${words} palabras · ${est}s estimados a ${wpm} ppm · el objetivo son ${target}s</span>`;
}

document.getElementById('saveScript').addEventListener('click', async (ev) => {
  await withBusy(ev.currentTarget, 'Guardando…', async () => {
    try {
      const saved = await api.updateProject(project.id, { script: scriptEdit.value.trim() });
      project = saved.project;
      toast('Guion guardado.', 'ok');
    } catch (err) {
      toast(err.message, 'error');
    }
  });
});

document.getElementById('doDirect').addEventListener('click', async (ev) => {
  const script = scriptEdit.value.trim();
  if (!script) return toast('No hay guion para dirigir.', 'error');

  await withBusy(ev.currentTarget, 'Dirigiendo…', async () => {
    try {
      showAlert('alert', null);
      const res = await api.direct(project.id, { script, duration: project.target_duration });
      project = res.project;
      if (res.warnings?.length) {
        toast(`${res.warnings.length} aviso(s) de dirección. Los ves en el editor.`, '');
      }
      location.href = `/content-factory/reel/editor.html?id=${encodeURIComponent(project.id)}`;
    } catch (err) {
      showAlert('alert', `La dirección falló: ${err.message}`);
    }
  });
});
