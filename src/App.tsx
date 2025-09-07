
import { Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import FeedingPage from './pages/FeedingPage'
import DiaperPage from './pages/DiaperPage'
import SleepPage from './pages/SleepPage'
import GrowthPage from './pages/GrowthPage'
import SettingsPage from './pages/SettingsPage'
import ResourcesPage from './pages/ResourcesPage'
import LoginPage from './pages/LoginPage'

export default function App(){
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return localStorage.getItem('sb_auth') === '1' } catch { return false }
  })

  useEffect(() => {
    // No-op: placeholder if we later sync auth state or need effects
  }, [authed])

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feeding" element={<FeedingPage />} />
          <Route path="/diapers" element={<DiaperPage />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-semibold">Not Found</h1><Link to="/" className="text-indigo-600 underline">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-500 py-8">
        Built with ❤️ for Selin • Offline-first • Your data stays on this device
      </footer>
    </div>
  )
}
