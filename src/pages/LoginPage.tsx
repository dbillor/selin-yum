import { useState } from 'react'
import type React from 'react'

export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'selin') {
      try { localStorage.setItem('sb_auth', '1') } catch {}
      onSuccess()
    } else {
      setError('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-7 h-7 rounded bg-pink-400" />
          <h1 className="text-lg font-semibold">Selin • Baby Log</h1>
        </div>
        <p className="text-sm text-gray-600 mb-4">Enter password to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn w-full">Enter</button>
        </form>
        <p className="mt-4 text-[11px] leading-snug text-gray-500">
          Note: This is a simple client-side lock for personal use. Do not store secrets.
        </p>
      </div>
    </div>
  )
}
