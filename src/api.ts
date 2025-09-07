// API wrapper
// Note: Feedings are ALWAYS saved on the backend (no local fallback).
import { db } from './db'
import type { Feeding, Diaper, Sleep, Growth, BabyProfile } from './types'

// Base API path: prefer env, else same-origin '/api'
const BASE_API = (import.meta.env.VITE_API_URL as string | undefined) || '/api'

async function json<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(opts?.headers || {}) },
    ...opts
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

// Feedings (always backend)
export async function getFeedings(): Promise<Feeding[]> {
  return json<Feeding[]>(`${BASE_API}/feedings`)
}
export async function addFeeding(entry: Feeding): Promise<void> {
  await json(`${BASE_API}/feedings`, { method: 'POST', body: JSON.stringify(entry) })
}
export async function deleteFeeding(id: number): Promise<void> {
  await json(`${BASE_API}/feedings/${id}`, { method: 'DELETE' })
}

// Diapers
export async function getDiapers(): Promise<Diaper[]> {
  const API_URL = BASE_API
  if (API_URL) return json<Diaper[]>(`${API_URL}/diapers`)
  return db.diapers.orderBy('datetime').reverse().toArray()
}
export async function addDiaper(entry: Diaper): Promise<void> {
  const API_URL = BASE_API
  if (API_URL) { await json(`${API_URL}/diapers`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.diapers.add(entry)
}
export async function deleteDiaper(id: number): Promise<void> {
  const API_URL = BASE_API
  if (API_URL) { await json(`${API_URL}/diapers/${id}`, { method: 'DELETE' }); return }
  await db.diapers.delete(id)
}

// Sleeps
export async function getSleeps(): Promise<Sleep[]> {
  const API_URL = BASE_API
  if (API_URL) return json<Sleep[]>(`${API_URL}/sleeps`)
  return db.sleeps.orderBy('start').reverse().toArray()
}
export async function addSleep(entry: Sleep): Promise<void> {
  const API_URL = BASE_API
  if (API_URL) { await json(`${API_URL}/sleeps`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.sleeps.add(entry)
}
export async function deleteSleep(id: number): Promise<void> {
  const API_URL = BASE_API
  if (API_URL) { await json(`${API_URL}/sleeps/${id}`, { method: 'DELETE' }); return }
  await db.sleeps.delete(id)
}

// Growth
export async function getGrowth(): Promise<Growth[]> {
  const API_URL = BASE_API
  if (API_URL) return json<Growth[]>(`${API_URL}/growth`)
  return db.growth.orderBy('datetime').toArray()
}
export async function addGrowth(entry: Growth): Promise<void> {
  const API_URL = BASE_API
  if (API_URL) { await json(`${API_URL}/growth`, { method: 'POST', body: JSON.stringify(entry) }); return }
  await db.growth.add(entry)
}
export async function deleteGrowth(id: number): Promise<void> {
  const API_URL = BASE_API
  if (API_URL) { await json(`${API_URL}/growth/${id}`, { method: 'DELETE' }); return }
  await db.growth.delete(id)
}

// Baby profile (treat as single row list)
export async function getBaby(): Promise<BabyProfile | null> {
  const API_URL = BASE_API
  if (API_URL) {
    const rows = await json<BabyProfile[]>(`${API_URL}/baby`)
    return rows[0] || null
  }
  const rows = await db.baby.toArray()
  return rows[0] || null
}
export async function saveBaby(profile: BabyProfile): Promise<void> {
  const API_URL = BASE_API
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
  const API_URL = BASE_API
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
  const API_URL = BASE_API
  if (API_URL) return json(`${API_URL}/import`, { method: 'POST', body: JSON.stringify(payload) })
  if (payload.baby) { await db.baby.clear(); await db.baby.bulkAdd(payload.baby) }
  if (payload.feedings) { await db.feedings.clear(); await db.feedings.bulkAdd(payload.feedings) }
  if (payload.diapers) { await db.diapers.clear(); await db.diapers.bulkAdd(payload.diapers) }
  if (payload.sleeps) { await db.sleeps.clear(); await db.sleeps.bulkAdd(payload.sleeps) }
  if (payload.growth) { await db.growth.clear(); await db.growth.bulkAdd(payload.growth) }
}
