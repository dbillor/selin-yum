// API wrapper with resilient local fallback
import { db } from './db'
import type { Feeding, Diaper, Sleep, Growth, BabyProfile } from './types'

// Preferred API base; when undefined/unreachable, we fall back to Dexie.
// In dev, Vite proxies '/api' to the local server. We still detect reachability.
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
  if (await isBackendAvailable()) {
    return json<Feeding[]>(`${PREFERRED_API}/feedings`)
  }
  return db.feedings.orderBy('datetime').reverse().toArray()
}
export async function addFeeding(entry: Feeding): Promise<void> {
  if (await isBackendAvailable()) {
    await json(`${PREFERRED_API}/feedings`, { method: 'POST', body: JSON.stringify(entry) })
    return
  }
  await db.feedings.add(entry)
}
export async function deleteFeeding(id: number): Promise<void> {
  if (await isBackendAvailable()) {
    await json(`${PREFERRED_API}/feedings/${id}`, { method: 'DELETE' })
    return
  }
  await db.feedings.delete(id)
}

// Diapers
export async function getDiapers(): Promise<Diaper[]> {
  if (await isBackendAvailable()) return json<Diaper[]>(`${PREFERRED_API}/diapers`)
  return db.diapers.orderBy('datetime').reverse().toArray()
}
export async function addDiaper(entry: Diaper): Promise<void> {
  if (await isBackendAvailable()) { await json(`${PREFERRED_API}/diapers`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.diapers.add(entry)
}
export async function deleteDiaper(id: number): Promise<void> {
  if (await isBackendAvailable()) { await json(`${PREFERRED_API}/diapers/${id}`, { method: 'DELETE' }); return }
  await db.diapers.delete(id)
}

// Sleeps
export async function getSleeps(): Promise<Sleep[]> {
  if (await isBackendAvailable()) return json<Sleep[]>(`${PREFERRED_API}/sleeps`)
  return db.sleeps.orderBy('start').reverse().toArray()
}
export async function addSleep(entry: Sleep): Promise<void> {
  if (await isBackendAvailable()) { await json(`${PREFERRED_API}/sleeps`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.sleeps.add(entry)
}
export async function deleteSleep(id: number): Promise<void> {
  if (await isBackendAvailable()) { await json(`${PREFERRED_API}/sleeps/${id}`, { method: 'DELETE' }); return }
  await db.sleeps.delete(id)
}

// Growth
export async function getGrowth(): Promise<Growth[]> {
  if (await isBackendAvailable()) return json<Growth[]>(`${PREFERRED_API}/growth`)
  return db.growth.orderBy('datetime').toArray()
}
export async function addGrowth(entry: Growth): Promise<void> {
  if (await isBackendAvailable()) { await json(`${PREFERRED_API}/growth`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.growth.add(entry)
}
export async function deleteGrowth(id: number): Promise<void> {
  if (await isBackendAvailable()) { await json(`${PREFERRED_API}/growth/${id}`, { method: 'DELETE' }); return }
  await db.growth.delete(id)
}

// Baby profile (treat as single row list)
export async function getBaby(): Promise<BabyProfile | null> {
  if (await isBackendAvailable()) {
    const rows = await json<BabyProfile[]>(`${PREFERRED_API}/baby`)
    return rows[0] || null
  }
  const rows = await db.baby.toArray()
  return rows[0] || null
}
export async function saveBaby(profile: BabyProfile): Promise<void> {
  if (await isBackendAvailable()) {
    const rows = await json<BabyProfile[]>(`${PREFERRED_API}/baby`)
    if (rows[0]) await json(`${PREFERRED_API}/baby/${rows[0].id}`, { method: 'PUT', body: JSON.stringify(profile) })
    else await json(`${PREFERRED_API}/baby`, { method: 'POST', body: JSON.stringify(profile) })
    return
  }
  const rows = await db.baby.toArray()
  if (rows[0]) await db.baby.update(rows[0].id!, profile)
  else await db.baby.add(profile)
}

// Export/Import helpers
export async function exportAll() {
  if (await isBackendAvailable()) return json(`${PREFERRED_API}/export`)
  return {
    baby: await db.baby.toArray(),
    feedings: await db.feedings.toArray(),
    diapers: await db.diapers.toArray(),
    sleeps: await db.sleeps.toArray(),
    growth: await db.growth.toArray(),
  }
}
export async function importAll(payload: any) {
  if (await isBackendAvailable()) return json(`${PREFERRED_API}/import`, { method: 'POST', body: JSON.stringify(payload) })
  if (payload.baby) { await db.baby.clear(); await db.baby.bulkAdd(payload.baby) }
  if (payload.feedings) { await db.feedings.clear(); await db.feedings.bulkAdd(payload.feedings) }
  if (payload.diapers) { await db.diapers.clear(); await db.diapers.bulkAdd(payload.diapers) }
  if (payload.sleeps) { await db.sleeps.clear(); await db.sleeps.bulkAdd(payload.sleeps) }
  if (payload.growth) { await db.growth.clear(); await db.growth.bulkAdd(payload.growth) }
}
