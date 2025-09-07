
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { db } from '../db'
import type { BabyProfile } from '../types'

export default function SettingsPage(){
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  useEffect(()=>{ db.baby.toArray().then(rows => setBaby(rows[0])) }, [])

  async function save(){
    if (!baby) return
    const rows = await db.baby.toArray()
    if (rows[0]) await db.baby.update(rows[0].id!, baby)
    else await db.baby.add(baby)
    alert('Saved')
  }

  async function exportData(){
    const payload = {
      baby: await db.baby.toArray(),
      feedings: await db.feedings.toArray(),
      diapers: await db.diapers.toArray(),
      sleeps: await db.sleeps.toArray(),
      growth: await db.growth.toArray()
    }
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
    if (data.baby) { await db.baby.clear(); await db.baby.bulkAdd(data.baby) }
    if (data.feedings) { await db.feedings.clear(); await db.feedings.bulkAdd(data.feedings) }
    if (data.diapers) { await db.diapers.clear(); await db.diapers.bulkAdd(data.diapers) }
    if (data.sleeps) { await db.sleeps.clear(); await db.sleeps.bulkAdd(data.sleeps) }
    if (data.growth) { await db.growth.clear(); await db.growth.bulkAdd(data.growth) }
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
              <span className="text-xs font-medium">Birth date/time</span>
              <input type="datetime-local" className="input" value={baby.birthIso.slice(0,16)}
                onChange={e=>setBaby({...baby, birthIso: new Date(e.target.value).toISOString()})}/>
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
