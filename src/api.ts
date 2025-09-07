// API wrapper: uses server if VITE_API_URL is set, else falls back to Dexie (IndexedDB)
import { db } from './db'
import type { Feeding, Diaper, Sleep, Growth, BabyProfile } from './types'

const API_URL = import.meta.env.VITE_API_URL as string | undefined

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
  if (API_URL) return json<Feeding[]>(`${API_URL}/feedings`)
  return db.feedings.orderBy('datetime').reverse().toArray()
}
export async function addFeeding(entry: Feeding): Promise<void> {
  if (API_URL) { await json(`${API_URL}/feedings`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.feedings.add(entry)
}
export async function deleteFeeding(id: number): Promise<void> {
  if (API_URL) { await json(`${API_URL}/feedings/${id}`, { method: 'DELETE' }); return }
  await db.feedings.delete(id)
}

// Diapers
export async function getDiapers(): Promise<Diaper[]> {
  if (API_URL) return json<Diaper[]>(`${API_URL}/diapers`)
  return db.diapers.orderBy('datetime').reverse().toArray()
}
export async function addDiaper(entry: Diaper): Promise<void> {
  if (API_URL) { await json(`${API_URL}/diapers`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.diapers.add(entry)
}
export async function deleteDiaper(id: number): Promise<void> {
  if (API_URL) { await json(`${API_URL}/diapers/${id}`, { method: 'DELETE' }); return }
  await db.diapers.delete(id)
}

// Sleeps
export async function getSleeps(): Promise<Sleep[]> {
  if (API_URL) return json<Sleep[]>(`${API_URL}/sleeps`)
  return db.sleeps.orderBy('start').reverse().toArray()
}
export async function addSleep(entry: Sleep): Promise<void> {
  if (API_URL) { await json(`${API_URL}/sleeps`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.sleeps.add(entry)
}
export async function deleteSleep(id: number): Promise<void> {
  if (API_URL) { await json(`${API_URL}/sleeps/${id}`, { method: 'DELETE' }); return }
  await db.sleeps.delete(id)
}

// Growth
export async function getGrowth(): Promise<Growth[]> {
  if (API_URL) return json<Growth[]>(`${API_URL}/growth`)
  return db.growth.orderBy('datetime').toArray()
}
export async function addGrowth(entry: Growth): Promise<void> {
  if (API_URL) { await json(`${API_URL}/growth`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.growth.add(entry)
}
export async function deleteGrowth(id: number): Promise<void> {
  if (API_URL) { await json(`${API_URL}/growth/${id}`, { method: 'DELETE' }); return }
  await db.growth.delete(id)
}

// Baby profile (treat as single row list)
export async function getBaby(): Promise<BabyProfile | null> {
  if (API_URL) {
    const rows = await json<BabyProfile[]>(`${API_URL}/baby`)
    return rows[0] || null
  }
  const rows = await db.baby.toArray()
  return rows[0] || null
}
export async function saveBaby(profile: BabyProfile): Promise<void> {
  if (API_URL) {
    const rows = await json<BabyProfile[]>(`${API_URL}/baby`)
    if (rows[0]) await json(`${API_URL}/baby/${rows[0].id}`, { method: 'PUT', body: JSON.stringify(profile) })
    else await json(`${API_URL}/baby`, { method: 'POST', body: JSON.stringify(profile) })
    return
  }
  const rows = await db.baby.toArray()
  if (rows[0]) await db.baby.update(rows[0].id!, profile)
  else await db.baby.add(profile)
}

// Export/Import helpers
export async function exportAll() {
  if (API_URL) return json(`${API_URL}/export`)
  return {
    baby: await db.baby.toArray(),
    feedings: await db.feedings.toArray(),
    diapers: await db.diapers.toArray(),
    sleeps: await db.sleeps.toArray(),
    growth: await db.growth.toArray(),
  }
}
export async function importAll(payload: any) {
  if (API_URL) return json(`${API_URL}/import`, { method: 'POST', body: JSON.stringify(payload) })
  if (payload.baby) { await db.baby.clear(); await db.baby.bulkAdd(payload.baby) }
  if (payload.feedings) { await db.feedings.clear(); await db.feedings.bulkAdd(payload.feedings) }
  if (payload.diapers) { await db.diapers.clear(); await db.diapers.bulkAdd(payload.diapers) }
  if (payload.sleeps) { await db.sleeps.clear(); await db.sleeps.bulkAdd(payload.sleeps) }
  if (payload.growth) { await db.growth.clear(); await db.growth.bulkAdd(payload.growth) }
}

