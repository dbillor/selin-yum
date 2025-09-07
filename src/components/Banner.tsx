import React from 'react'

type Props = {
  kind?: 'info' | 'warn'
  children: React.ReactNode
}

export default function Banner({ kind = 'info', children }: Props) {
  const styles = kind === 'warn'
    ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
    : 'bg-blue-50 border-blue-300 text-blue-900'
  return (
    <div className={`border rounded-md px-3 py-2 text-sm ${styles}`}>{children}</div>
  )
}

