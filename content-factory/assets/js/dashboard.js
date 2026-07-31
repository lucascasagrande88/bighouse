// Dashboard: listar proyectos y crear nuevos.

import { api } from './api.js';
import { toast, escapeHtml, ago, withBusy, bindRange, wireLogout, showAlert, requireSessionOrRedirect } from './ui.js';

const STATUS = {
  nuevo: { label: 'Nuevo', tag: '' },
  ingerido: { label: 'Reel cargado', tag: '' },
  analizado: { label: 'Analizado', tag: '' },
  adaptado: { label: 'Con guion', tag: 'tag-warn' },
  dirigido: { label: 'Con escenas', tag: 'tag-accent' },
  renderizado: { label: 'Renderizado', tag: 'tag-ok' },
};

const session = await api.session().catch(() => null);
if (requireSessionOrRedirect(session)) {
  document.getElementById('who').textContent = session.email;
  wireLogout(api);
  await refresh();
}

async function refresh() {
  const list = document.getElementById('list');
  try {
    const { projects } = await api.listProjects();
    list.innerHTML = projects.length ? renderProjects(projects) : renderEmpty();
    list.querySelectorAll('[data-open]').forEach((el) =>
      el.addEventListener('click', () => open(el.dataset.open))
    );
    const newCard = list.querySelector('[data-new]');
    if (newCard) newCard.addEventListener('click', openModal);
  } catch (err) {
    showAlert('alert', `No se pudieron cargar los proyectos: ${err.message}`);
    list.innerHTML = renderEmpty();
    list.querySelector('[data-new]')?.addEventListener('click', openModal);
  }
}

function renderProjects(projects) {
  const cards = projects
    .map((p) => {
      const st = STATUS[p.status] || { label: p.status || '—', tag: '' };
      return `
        <div class="project" data-open="${escapeHtml(p.id)}" role="button" tabindex="0">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="meta">
            <span class="tag ${st.tag}">${escapeHtml(st.label)}</span>
            <span class="tag">${escapeHtml(p.brand || 'chimichurri')}</span>
            ${p.scenes ? `<span class="tag">${p.scenes} escenas</span>` : ''}
          </div>
          <div class="foot">
            <span>${p.duration ? `${Number(p.duration).toFixed(1)}s` : 'sin timeline'}</span>
            <span>${ago(p.updated_at)}</span>
          </div>
        </div>`;
    })
    .join('');

  return `<div class="projects">
    <button class="project-new" data-new><span>+</span><span>Nuevo reel</span></button>
    ${cards}
  </div>`;
}

function renderEmpty() {
  return `<div class="empty">
    <h3>Todavía no hay reels</h3>
    <p>Bajá un reel que te guste, subilo acá y la fábrica lo desarma para
      construir uno propio con el lenguaje de la marca.</p>
    <button class="btn btn-primary" data-new>+ Crear el primero</button>
  </div>`;
}

/** Un proyecto sin escenas va al pipeline; con escenas, derecho al editor. */
async function open(id) {
  try {
    const { project } = await api.getProject(id);
    const target = project.scenes && project.scenes.length ? 'editor.html' : 'project.html';
    location.href = `/content-factory/reel/${target}?id=${encodeURIComponent(id)}`;
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ─── modal de creación ─── */

const modal = document.getElementById('modal');
document.getElementById('newBtn').addEventListener('click', openModal);
document.getElementById('cancel').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hide')) closeModal();
});

bindRange(document.getElementById('duration'), document.getElementById('durVal'), (v) => `${v}s`);
bindRange(document.getElementById('intensity'), document.getElementById('intVal'));

function openModal() {
  modal.classList.remove('hide');
  document.getElementById('name').focus();
}

function closeModal() {
  modal.classList.add('hide');
}

document.getElementById('newForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('create');

  const payload = {
    name: document.getElementById('name').value.trim(),
    brand: document.getElementById('brand').value,
    objective: document.getElementById('objective').value,
    cta: document.getElementById('cta').value.trim(),
    target_duration: Number(document.getElementById('duration').value),
    intensity: Number(document.getElementById('intensity').value),
    source: document.getElementById('source').value,
    notes: document.getElementById('notes').value.trim(),
  };

  await withBusy(btn, 'Creando…', async () => {
    try {
      const { project } = await api.createProject(payload);
      location.href = `/content-factory/reel/project.html?id=${encodeURIComponent(project.id)}`;
    } catch (err) {
      toast(err.message, 'error');
    }
  });
});
