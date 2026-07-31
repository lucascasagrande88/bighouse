import { json, fail, readJson, requireSession } from './_lib/http.js';
import { listProjects, getProject, putProject, deleteProject, newProjectId, isSafeId } from './_lib/store.js';
import { resequence } from '../../engine/src/timing.js';

export const config = { path: '/api/projects{/:id}?' };

const OBJECTIVES = ['vender', 'educar', 'entretener', 'posicionar'];
const BRANDS = ['chimichurri', 'lucas', 'cliente'];

export default async function projects(request, context) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const id = context.params && context.params.id;

  switch (request.method) {
    case 'GET':
      if (id) {
        if (!isSafeId(id)) return fail(400, 'Id inválido.');
        const project = await getProject(session, id);
        return project ? json({ ok: true, project }) : fail(404, 'Ese proyecto no existe.');
      }
      return json({ ok: true, projects: await listProjects(session) });

    case 'POST': {
      const body = await readJson(request);
      if (!body.name || !String(body.name).trim()) return fail(400, 'El proyecto necesita un nombre.');

      const project = await putProject(session, {
        id: newProjectId(),
        name: String(body.name).trim().slice(0, 80),
        brand: BRANDS.includes(body.brand) ? body.brand : 'chimichurri',
        objective: OBJECTIVES.includes(body.objective) ? body.objective : 'vender',
        cta: String(body.cta || 'Escribinos por WhatsApp').slice(0, 60),
        handle: String(body.handle || '@chimichurridiseno').slice(0, 40),
        target_duration: clamp(body.target_duration, 8, 90, 30),
        intensity: clamp(body.intensity, 0, 1, 0.6),
        speed: clamp(body.speed, 0.6, 1.6, 1),
        source: body.source || 'upload',
        notes: String(body.notes || '').slice(0, 1200),
        status: 'nuevo',
        skin: BRANDS.includes(body.brand) ? body.brand : 'chimichurri',
        // Se llenan a medida que avanza el flujo.
        ingest: null,
        analysis: null,
        adaptation: null,
        script: '',
        director_notes: '',
        duration: 0,
        scenes: [],
        warnings: [],
        renders: [],
      });
      return json({ ok: true, project }, { status: 201 });
    }

    case 'PUT': {
      if (!id || !isSafeId(id)) return fail(400, 'Id inválido.');
      const current = await getProject(session, id);
      if (!current) return fail(404, 'Ese proyecto no existe.');

      const patch = await readJson(request);
      // Campos que el cliente no puede pisar por más que los mande.
      delete patch.id;
      delete patch.owner;
      delete patch.created_at;

      const merged = { ...current, ...patch };

      // Si tocaron las escenas, los tiempos se recalculan del lado del
      // servidor. El cliente no es la fuente de verdad del timeline.
      if (Array.isArray(patch.scenes)) {
        const { scenes, duration } = resequence(patch.scenes);
        merged.scenes = scenes;
        merged.duration = duration;
      }

      const saved = await putProject(session, merged);
      return json({ ok: true, project: saved });
    }

    case 'DELETE': {
      if (!id || !isSafeId(id)) return fail(400, 'Id inválido.');
      await deleteProject(session, id);
      return json({ ok: true });
    }

    default:
      return fail(405, 'Método no permitido.');
  }
}

function clamp(v, min, max, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
