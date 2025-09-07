
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { db } from '../db'
import type { Sleep } from '../types'
import { prettyDateTime } from '../utils'

export default function SleepPage(){
  const [entries, setEntries] = useState<Sleep[]>([])
  const [form, setForm] = useState<Sleep>({
    start: new Date().toISOString(),
  })

  useEffect(()=>{
    db.sleeps.orderBy('start').reverse().toArray().then(setEntries)
  }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault()
    await db.sleeps.add(form)
    setForm({ start: new Date().toISOString() })
    setEntries(await db.sleeps.orderBy('start').reverse().toArray())
  }
  async function remove(id?: number){
    if (!id) return
    await db.sleeps.delete(id)
    setEntries(await db.sleeps.orderBy('start').reverse().toArray())
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Log sleep">
        <form onSubmit={submit} className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Start</span>
            <input type="datetime-local" className="input" value={form.start.slice(0,16)}
              onChange={e=>setForm({...form, start: new Date(e.target.value).toISOString()})} required/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">End (optional)</span>
            <input type="datetime-local" className="input" value={(form.end||'').slice(0,16)}
              onChange={e=>setForm({...form, end: new Date(e.target.value).toISOString()})}/>
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
          {entries.map(e => (
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
