// API wrapper — backend required
import type { Feeding, Diaper, Sleep, Growth, BabyProfile } from './types'

// Preferred API base. In dev, Vite proxies '/api' to the local server.
const PREFERRED_API: string | undefined = (import.meta.env.VITE_API_URL as string | undefined) || '/api'

let backendAvailable: boolean | null = null
async function isBackendAvailable(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable
  if (!PREFERRED_API) { backendAvailable = false; return backendAvailable }
  try {
    const res = await fetch(`${PREFERRED_API}/health`, { method: 'GET' })
    backendAvailable = res.ok
  } catch {
    backendAvailable = false
  }
  return backendAvailable
}

// Expose a simple reachability probe for UI hints
export async function backendReachable(): Promise<boolean> {
  return isBackendAvailable()
}

async function json<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(opts?.headers || {}) },
    ...opts
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

// Feedings
export async function getFeedings(): Promise<Feeding[]> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  return json<Feeding[]>(`${PREFERRED_API}/feedings`)
}
export async function addFeeding(entry: Feeding): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/feedings`, { method: 'POST', body: JSON.stringify(entry) })
}
export async function deleteFeeding(id: number): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/feedings/${id}`, { method: 'DELETE' })
}

// Diapers
export async function getDiapers(): Promise<Diaper[]> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  return json<Diaper[]>(`${PREFERRED_API}/diapers`)
}
export async function addDiaper(entry: Diaper): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/diapers`, { method: 'POST', body: JSON.stringify(entry) })
}
export async function deleteDiaper(id: number): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/diapers/${id}`, { method: 'DELETE' })
}

// Sleeps
export async function getSleeps(): Promise<Sleep[]> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  return json<Sleep[]>(`${PREFERRED_API}/sleeps`)
}
export async function addSleep(entry: Sleep): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/sleeps`, { method: 'POST', body: JSON.stringify(entry) })
}
export async function deleteSleep(id: number): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/sleeps/${id}`, { method: 'DELETE' })
}

// Growth
export async function getGrowth(): Promise<Growth[]> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  return json<Growth[]>(`${PREFERRED_API}/growth`)
}
export async function addGrowth(entry: Growth): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/growth`, { method: 'POST', body: JSON.stringify(entry) })
}
export async function deleteGrowth(id: number): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  await json(`${PREFERRED_API}/growth/${id}`, { method: 'DELETE' })
}

// Baby profile (treat as single row list)
export async function getBaby(): Promise<BabyProfile | null> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  const rows = await json<BabyProfile[]>(`${PREFERRED_API}/baby`)
  return rows[0] || null
}
export async function saveBaby(profile: BabyProfile): Promise<void> {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  const rows = await json<BabyProfile[]>(`${PREFERRED_API}/baby`)
  if (rows[0]) await json(`${PREFERRED_API}/baby/${rows[0].id}`, { method: 'PUT', body: JSON.stringify(profile) })
  else await json(`${PREFERRED_API}/baby`, { method: 'POST', body: JSON.stringify(profile) })
}

// Export/Import helpers
export async function exportAll() {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  return json(`${PREFERRED_API}/export`)
}
export async function importAll(payload: any) {
  if (!(await isBackendAvailable())) throw new Error('Backend required but not reachable')
  return json(`${PREFERRED_API}/import`, { method: 'POST', body: JSON.stringify(payload) })
}
