
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { db } from '../db'
import type { Feeding } from '../types'
import { prettyDateTime, mlToOz, ozToMl } from '../utils'

export default function FeedingPage(){
  const [entries, setEntries] = useState<Feeding[]>([])
  const [form, setForm] = useState<Feeding>({
    datetime: new Date().toISOString(),
    method: 'breast',
    side: 'left',
    durationMin: 10,
  })

  useEffect(()=>{
    db.feedings.orderBy('datetime').reverse().toArray().then(setEntries)
  }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault()
    await db.feedings.add(form)
    setForm({ datetime: new Date().toISOString(), method: 'breast', side: 'left', durationMin: 10 })
    setEntries(await db.feedings.orderBy('datetime').reverse().toArray())
  }
  async function remove(id?: number){
    if (!id) return
    await db.feedings.delete(id)
    setEntries(await db.feedings.orderBy('datetime').reverse().toArray())
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Log a feeding">
        <form onSubmit={submit} className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Date & time</span>
            <input type="datetime-local" className="input" value={form.datetime.slice(0,16)}
              onChange={e=>setForm({...form, datetime: new Date(e.target.value).toISOString()})} required/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Method</span>
            <select className="input" value={form.method} onChange={e=>setForm({...form, method: e.target.value as any})}>
              <option value="breast">Breast</option>
              <option value="bottle-breastmilk">Bottle (Breastmilk)</option>
              <option value="formula">Formula</option>
            </select>
          </label>
          {form.method === 'breast' ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium">Side</span>
                <select className="input" value={form.side} onChange={e=>setForm({...form, side: e.target.value as any})}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Duration (minutes)</span>
                <input type="number" className="input" min={0} step={1} value={form.durationMin || 0}
                  onChange={e=>setForm({...form, durationMin: parseInt(e.target.value||'0')})}/>
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium">Amount (mL)</span>
                <input type="number" className="input" min={0} step={10} value={form.amountMl || 0}
                  onChange={e=>setForm({...form, amountMl: parseInt(e.target.value||'0')})}/>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Amount (oz)</span>
                <input type="number" className="input" min={0} step={0.5} value={mlToOz(form.amountMl) || 0}
                  onChange={e=>setForm({...form, amountMl: ozToMl(parseFloat(e.target.value||'0'))})}/>
              </label>
            </div>
          )}
          <label className="grid gap-1">
            <span className="text-xs font-medium">Notes</span>
            <input className="input" value={form.notes || ''} onChange={e=>setForm({...form, notes: e.target.value})} placeholder="Latch, spit-up, etc."/>
          </label>
          <div>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Add feeding</button>
          </div>
        </form>
      </Card>

      <Card title="History">
        <div className="space-y-2 text-sm max-h-[60vh] overflow-auto pr-1">
          {entries.map(e => (
            <div key={e.id} className="p-2 rounded-md border border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-medium">{prettyDateTime(e.datetime)}</div>
                <div className="text-gray-600">
                  {e.method}{e.side ? ` • ${e.side}` : ''}
                  {e.durationMin ? ` • ${e.durationMin} min` : ''}
                  {e.amountMl ? ` • ${e.amountMl} mL (${mlToOz(e.amountMl)} oz)` : ''}
                </div>
                {e.notes ? <div className="text-gray-500">{e.notes}</div> : null}
              </div>
              <button className="text-red-600 hover:underline" onClick={()=>remove(e.id)}>Delete</button>
            </div>
          ))}
          {entries.length===0 && <div className="text-gray-500">No feedings logged yet.</div>}
        </div>
      </Card>
    </div>
  )
}
