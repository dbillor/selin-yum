
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { addSleep, deleteSleep, getSleeps } from '../api'
import type { Sleep } from '../types'
import { prettyDateTime, toDatetimeLocalPacific, fromDatetimeLocalPacific } from '../utils'

export default function SleepPage(){
  const [entries, setEntries] = useState<Sleep[]>([])
  const [form, setForm] = useState<Sleep>({
    start: new Date().toISOString(),
  })

  useEffect(()=>{ getSleeps().then(setEntries) }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault()
    await addSleep(form)
    setForm({ start: new Date().toISOString() })
    setEntries(await getSleeps())
    triggerSaved()
  }
  async function remove(id?: number){
    if (!id) return
    await deleteSleep(id)
    setEntries(await getSleeps())
  }

  const [justSaved, setJustSaved] = useState(false)
  function triggerSaved(){ setJustSaved(true); setTimeout(()=>setJustSaved(false), 900) }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Log sleep" actions={justSaved ? <span className="text-sm text-green-700 animate-pop">Saved!</span> : null}>
        <form onSubmit={submit} className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Start (Pacific)</span>
            <input type="datetime-local" className="input" value={toDatetimeLocalPacific(form.start)}
              onChange={e=>setForm({...form, start: fromDatetimeLocalPacific(e.target.value)})} required/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">End (optional, Pacific)</span>
            <input type="datetime-local" className="input" value={form.end ? toDatetimeLocalPacific(form.end) : ''}
              onChange={e=>setForm({...form, end: e.target.value ? fromDatetimeLocalPacific(e.target.value) : undefined})}/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Notes</span>
            <input className="input" value={form.notes || ''} onChange={e=>setForm({...form, notes: e.target.value})} placeholder="contact nap, bassinet, etc."/>
          </label>
          <div>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Add sleep</button>
          </div>
        </form>
      </Card>

      <Card title="History">
        <div className="space-y-2 text-sm max-h-[60vh] overflow-auto pr-1">
          {entries.slice().sort((a,b)=> (a.start > b.start ? -1 : 1)).map(e => (
            <div key={e.id} className="p-2 rounded-md border border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-medium">{prettyDateTime(e.start)} — {e.end ? prettyDateTime(e.end) : '…'}</div>
                {e.notes ? <div className="text-gray-600">{e.notes}</div> : null}
              </div>
              <button className="text-red-600 hover:underline" onClick={()=>remove(e.id)}>Delete</button>
            </div>
          ))}
          {entries.length===0 && <div className="text-gray-500">No sleep logged yet.</div>}
        </div>
      </Card>
    </div>
  )
}
