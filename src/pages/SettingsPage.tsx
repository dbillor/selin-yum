
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { getBaby, saveBaby, exportAll, importAll } from '../api'
import type { BabyProfile } from '../types'
import { toDatetimeLocalPacific, fromDatetimeLocalPacific } from '../utils'

export default function SettingsPage(){
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  useEffect(()=>{ getBaby().then(b => setBaby(b)) }, [])

  async function save(){
    if (!baby) return
    await saveBaby(baby)
    alert('Saved')
  }

  async function exportData(){
    const payload = await exportAll()
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'selin-baby-log-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]
    if (!file) return
    const txt = await file.text()
    const data = JSON.parse(txt)
    await importAll(data)
    alert('Imported! Reloading…')
    location.reload()
  }

  return (
    <div className="grid gap-4">
      <Card title="Baby profile">
        {baby && (
          <form onSubmit={e=>{e.preventDefault(); save();}} className="grid md:grid-cols-3 gap-3 text-sm">
            <label className="grid gap-1">
              <span className="text-xs font-medium">Name</span>
              <input className="input" value={baby.name} onChange={e=>setBaby({...baby, name: e.target.value})}/>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium">Birth date/time (Pacific)</span>
              <input type="datetime-local" className="input" value={toDatetimeLocalPacific(baby.birthIso)}
                onChange={e=>setBaby({...baby, birthIso: fromDatetimeLocalPacific(e.target.value)})}/>
            </label>
            <div className="md:col-span-3">
              <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Save</button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Backup & restore">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <button className="px-3 py-2 bg-gray-900 text-white rounded-md" onClick={exportData}>Export data</button>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Import from JSON</span>
            <input type="file" accept="application/json" onChange={importData} />
          </label>
        </div>
      </Card>
    </div>
  )
}
