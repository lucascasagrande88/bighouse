import type { PersistedState } from "./types.ts";

export const STORAGE_KEY = "chimi-outbound-state";

export function loadState(): Partial<PersistedState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* almacenamiento lleno o bloqueado: se mantiene el estado en memoria */ }
}
