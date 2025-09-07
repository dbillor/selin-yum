
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { addDiaper, deleteDiaper, getDiapers, getBaby } from '../api'
import type { Diaper, BabyProfile } from '../types'
import { prettyDateTime, ageFromBirth, wetDiaperTarget, stoolTarget, pacificDateKey } from '../utils'
import { startOfDay } from 'date-fns'

export default function DiaperPage(){
  const [entries, setEntries] = useState<Diaper[]>([])
  const [form, setForm] = useState<Diaper>({
    datetime: new Date().toISOString(),
    type: 'wet',
  })
  const [baby, setBaby] = useState<BabyProfile | null>(null)

  useEffect(()=>{
    getDiapers().then(setEntries)
    getBaby().then(b=>setBaby(b))
  }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault()
    await addDiaper(form)
    setForm({ datetime: new Date().toISOString(), type: 'wet' })
    setEntries(await getDiapers())
    triggerSaved()
  }
  async function remove(id?: number){
    if (!id) return
    await deleteDiaper(id)
    setEntries(await getDiapers())
  }

  const [justSaved, setJustSaved] = useState(false)
  function triggerSaved(){ setJustSaved(true); setTimeout(()=>setJustSaved(false), 900) }

  const dayOfLife = (() => {
    if (!baby) return 0
    const birth = new Date(baby.birthIso)
    const now = new Date()
    return Math.floor((startOfDay(now).getTime()-startOfDay(birth).getTime())/(24*3600*1000))
  })()

  const todayKey = pacificDateKey(new Date())
  const todayWet = entries.filter(e=>e.type!=='dirty' && pacificDateKey(new Date(e.datetime)) === todayKey).length
  const todayStool = entries.filter(e=>e.type!=='wet' && pacificDateKey(new Date(e.datetime)) === todayKey).length

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Log a diaper" actions={justSaved ? <span className="text-sm text-green-700 animate-pop">Saved!</span> : null}>
        <form onSubmit={submit} className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Date & time</span>
            <input type="datetime-local" className="input" value={form.datetime.slice(0,16)}
              onChange={e=>setForm({...form, datetime: new Date(e.target.value).toISOString()})} required/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Type</span>
            <select className="input" value={form.type} onChange={e=>setForm({...form, type: e.target.value as any})}>
              <option value="wet">Wet</option>
              <option value="dirty">Stool</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Color/notes</span>
            <input className="input" value={form.color || ''} onChange={e=>setForm({...form, color: e.target.value})} placeholder="yellow, seedy, green, etc."/>
          </label>
          <div>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Add diaper</button>
          </div>
        </form>
      </Card>

      <Card title="Today’s progress">
        <div className="text-sm space-y-2">
          <div>Wet diapers: <strong>{todayWet}</strong> (goal ≥ {wetDiaperTarget(dayOfLife)})</div>
          <div>Stools: <strong>{todayStool}</strong> (goal ≥ {stoolTarget(dayOfLife)})</div>
          <p className="text-gray-500 text-xs">Goals update automatically based on day of life.</p>
        </div>
        <hr className="my-3"/>
        <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
          {entries.map(e => (
            <div key={e.id} className="p-2 rounded-md border border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-medium">{prettyDateTime(e.datetime)}</div>
                <div className="text-gray-600">{e.type}{e.color ? ` • ${e.color}` : ''}</div>
              </div>
              <button className="text-red-600 hover:underline" onClick={()=>remove(e.id)}>Delete</button>
            </div>
          ))}
          {entries.length===0 && <div className="text-gray-500">No diapers logged yet.</div>}
        </div>
      </Card>
    </div>
  )
}
