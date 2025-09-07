
import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

const NavItem = ({ to, label }: { to: string, label: string }) => (
  <NavLink to={to} className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}>
    {label}
  </NavLink>
)

export default function Header() {
  const [taps, setTaps] = useState(0)
  const [secret, setSecret] = useState(false)

  useEffect(() => {
    if (taps >= 7) setSecret(true)
  }, [taps])

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => setTaps(t => t + 1)} title="Selin • Baby Log">
          <span className="inline-block w-6 h-6 rounded bg-pink-400" />
          <span>Selin • Baby Log</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/feeding" label="Feeding" />
          <NavItem to="/diapers" label="Diapers" />
          <NavItem to="/sleep" label="Sleep" />
          <NavItem to="/growth" label="Growth" />
          <NavItem to="/resources" label="Resources" />
          <NavItem to="/settings" label="Settings" />
          {secret && <NavItem to="/blessings" label="✨ Blessings" />}
        </nav>
      </div>
    </header>
  )
}
