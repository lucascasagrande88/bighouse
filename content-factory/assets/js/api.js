// Cliente del backend. Único lugar del frontend que sabe de URLs.
//
// No hay ninguna clave acá. La sesión viaja en una cookie HttpOnly que este
// código no puede ni leer, y la API key de OpenAI vive sólo en el servidor.

const JSON_HEADERS = { 'Content-Type': 'application/json' };

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, timeout = 180000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body ? JSON_HEADERS : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.status === 401) {
      // La sesión se venció mientras se trabajaba: al login, guardando el destino.
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `/content-factory/?next=${next}&expired=1`;
      throw new ApiError('Sesión vencida.', 401);
    }
    if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('La operación tardó demasiado y se canceló.', 504);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  /* ─── sesión ─── */
  session: () => request('/api/auth/session'),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password }, timeout: 20000 }),
  logout: () => request('/api/auth/logout', { method: 'POST', timeout: 10000 }),

  /* ─── proyectos ─── */
  listProjects: () => request('/api/projects'),
  getProject: (id) => request(`/api/projects/${id}`),
  createProject: (data) => request('/api/projects', { method: 'POST', body: data }),
  updateProject: (id, patch) => request(`/api/projects/${id}`, { method: 'PUT', body: patch }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),

  /* ─── IA ─── */
  analyze: (project_id, ingest) => request('/api/ai/analyze', { method: 'POST', body: { project_id, ingest } }),
  adapt: (project_id, opts = {}) => request('/api/ai/adapt', { method: 'POST', body: { project_id, ...opts } }),
  direct: (project_id, opts = {}) => request('/api/ai/direct', { method: 'POST', body: { project_id, ...opts } }),
  imagePrompt: (project_id, scene_id, hint) =>
    request('/api/ai/image-prompt', { method: 'POST', body: { project_id, scene_id, hint } }),
  regenerateScene: (project_id, scene_id, hint) =>
    request('/api/ai/scene', { method: 'POST', body: { project_id, scene_id, hint } }),

  /* ─── worker ─── */
  ticket: (action, project_id) => request('/api/worker/ticket', { method: 'POST', body: { action, project_id } }),

  /**
   * Sube el reel directo al worker con un ticket firmado.
   * No pasa por Netlify: un mp4 de 60 MB no entra en el body de una función.
   */
  async ingest(project_id, file, { kind = 'video', onProgress } = {}) {
    const t = await api.ticket('ingest', project_id);
    const form = new FormData();
    form.append('file', file);
    form.append('project_id', project_id);
    form.append('kind', kind);
    return xhrUpload(`${t.url}/ingest`, form, t.token, onProgress);
  },

  async uploadAsset(project_id, file, slot, onProgress) {
    const t = await api.ticket('asset', project_id);
    const form = new FormData();
    form.append('file', file);
    form.append('project_id', project_id);
    form.append('slot', slot);
    return xhrUpload(`${t.url}/asset`, form, t.token, onProgress);
  },

  async generateImage(project_id, scene_id, prompt) {
    const t = await api.ticket('image', project_id);
    const res = await fetch(`${t.url}/image`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${t.token}` },
      body: JSON.stringify({ prompt, project_id, scene_id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new ApiError(data.error || 'No se pudo generar la imagen.', res.status);
    return data;
  },

  async render(project, outputs) {
    const t = await api.ticket('render', project.id);
    const res = await fetch(`${t.url}/render`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${t.token}` },
      body: JSON.stringify({ project, outputs, fps: project.fps || 30 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new ApiError(data.error || 'No se pudo arrancar el render.', res.status);
    return { ...data, worker: t.url };
  },

  async jobStatus(project_id, worker, jobIdValue) {
    const t = await api.ticket('status', project_id);
    const res = await fetch(`${worker}/status/${jobIdValue}`, {
      headers: { Authorization: `Bearer ${t.token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new ApiError(data.error || 'No se pudo consultar el job.', res.status);
    return data.job;
  },
};

function xhrUpload(url, form, token, onProgress) {
  // XHR y no fetch por una sola razón: fetch todavía no da progreso de subida,
  // y subir 60 MB sin barra es una espera a ciegas.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 20 * 60 * 1000;

    xhr.upload.addEventListener('progress', (e) => {
      if (onProgress && e.lengthComputable) onProgress(e.loaded / e.total);
    });
    xhr.addEventListener('load', () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) resolve(data);
      else reject(new ApiError(data.error || `El worker respondió ${xhr.status}`, xhr.status));
    });
    xhr.addEventListener('error', () => reject(new ApiError('No se pudo contactar el worker.', 0)));
    xhr.addEventListener('timeout', () => reject(new ApiError('La subida tardó demasiado.', 504)));
    xhr.send(form);
  });
}

export { ApiError };
