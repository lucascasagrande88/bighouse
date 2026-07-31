// Utilidades de UI compartidas entre las pantallas.

export function toast(message, kind = '', ms = 4200) {
  const host = document.getElementById('toasts') || makeHost();
  const el = document.createElement('div');
  el.className = `toast${kind ? ` toast-${kind}` : ''}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), ms);
  return el;
}

function makeHost() {
  const host = document.createElement('div');
  host.className = 'toast-host';
  host.id = 'toasts';
  document.body.appendChild(host);
  return host;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** "hace 3 min", "ayer". Un timestamp ISO no le dice nada a nadie. */
export function ago(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ayer';
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  return new Date(iso).toLocaleDateString('es-AR');
}

export function secs(t) {
  const n = Number(t) || 0;
  return `${n.toFixed(1)}s`;
}

/** Botón que se bloquea y avisa mientras corre una promesa. */
export async function withBusy(button, label, fn) {
  if (!button) return fn();
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="spinner"></span>${label}`;
  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export function bindRange(input, output, format = (v) => v) {
  if (!input || !output) return;
  const sync = () => (output.textContent = format(input.value));
  input.addEventListener('input', sync);
  sync();
}

export function requireSessionOrRedirect(session) {
  if (!session) {
    location.replace(`/content-factory/?next=${encodeURIComponent(location.pathname + location.search)}`);
    return false;
  }
  return true;
}

export function wireLogout(api, id = 'logout') {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await api.logout().catch(() => {});
    location.replace('/content-factory/');
  });
}

export function showAlert(id, message, kind = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  if (!message) {
    el.className = 'notice hide';
    return;
  }
  el.className = `notice notice-${kind}`;
  el.textContent = message;
}
