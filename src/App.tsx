
import { Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from './components/Header'
import Banner from './components/Banner'
import { backendReachable, getBaby, saveBaby, getGrowth, addGrowth } from './api'
import { fromDatetimeLocalPacific } from './utils'
import Dashboard from './pages/Dashboard'
import FeedingPage from './pages/FeedingPage'
import DiaperPage from './pages/DiaperPage'
import SleepPage from './pages/SleepPage'
import GrowthPage from './pages/GrowthPage'
import SettingsPage from './pages/SettingsPage'
import ResourcesPage from './pages/ResourcesPage'
import LoginPage from './pages/LoginPage'
import BlessingsPage from './pages/BlessingsPage'
import MedicationsPage from './pages/MedicationsPage'

export default function App(){
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return localStorage.getItem('sb_auth') === '1' } catch { return false }
  })
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [babyMissing, setBabyMissing] = useState<boolean>(false)

  useEffect(() => {
    // Probe backend and whether a baby profile exists after auth
    let cancelled = false
    ;(async () => {
      if (!authed) return
      let onlineFlag = false
      try {
        const online = await backendReachable()
        onlineFlag = !!online
        if (!cancelled) setBackendOnline(onlineFlag)
      } catch { if (!cancelled) setBackendOnline(false) }
      try {
        const baby = await getBaby()
        if (!cancelled) setBabyMissing(!baby)

        // Seed default profile and birth weight if backend is online and profile is empty
        if (!cancelled && onlineFlag && !baby) {
          const birthIso = fromDatetimeLocalPacific('2025-09-04T23:53')
          await saveBaby({ name: 'Selin Billor', birthIso })
          const growth = await getGrowth()
          if (!growth || growth.length === 0) {
            await addGrowth({ datetime: birthIso, weightGrams: 3544, notes: 'Birth weight (7 lb 13 oz)' })
          }
          setBabyMissing(false)
        }
      } catch { if (!cancelled) setBabyMissing(true) }
    })()
    return () => { cancelled = true }
  }, [authed])

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  if (backendOnline === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto p-4 space-y-4">
          <Banner kind="warn">
            Backend is required but not reachable. Set `VITE_API_URL` to your deployed API (e.g., Vercel/Render) and redeploy.
          </Banner>
          <div className="text-sm text-gray-700">Current base: {(import.meta as any).env.VITE_API_URL || '/api'}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {babyMissing && (
          <Banner kind="info">
            Add your baby’s name and birth in Settings to show age everywhere.
          </Banner>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feeding" element={<FeedingPage />} />
          <Route path="/diapers" element={<DiaperPage />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/meds" element={<MedicationsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/blessings" element={<BlessingsPage />} />
          <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-semibold">Not Found</h1><Link to="/" className="text-indigo-600 underline">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-500 py-8">
        Built with ❤️ for Selin • Secure sync via your backend
      </footer>
    </div>
  )
}
