
import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { addFeeding, deleteFeeding, getFeedings } from '../api'
import type { Feeding } from '../types'
import { prettyDateTime, mlToOz, ozToMl } from '../utils'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

export default function FeedingPage(){
  const [entries, setEntries] = useState<Feeding[]>([])
  const [form, setForm] = useState<Feeding>({
    datetime: new Date().toISOString(),
    method: 'breast',
    side: 'left',
    durationMin: 10,
  })

  useEffect(()=>{ getFeedings().then(setEntries) }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault()
    await addFeeding(form)
    setForm({ datetime: new Date().toISOString(), method: 'breast', side: 'left', durationMin: 10 })
    setEntries(await getFeedings())
    triggerSaved()
  }
  async function remove(id?: number){
    if (!id) return
    await deleteFeeding(id)
    setEntries(await getFeedings())
  }

  const [justSaved, setJustSaved] = useState(false)
  function triggerSaved(){
    setJustSaved(true)
    setTimeout(()=>setJustSaved(false), 900)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Log a feeding" actions={justSaved ? <span className="text-sm text-green-700 animate-pop">Saved!</span> : null}>
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

      <Card title="Trends (last 7 days)">
        <FeedingTrends entries={entries} />
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

function FeedingTrends({ entries }: { entries: Feeding[] }){
  const days = 7
  const { labels, countSeries, mlSeries } = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - (days - 1))
    const fmt = (d: Date) => d.toLocaleDateString()
    const key = (d: Date) => d.toISOString().slice(0,10)

    const dayKeys: string[] = []
    const labels: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dayKeys.push(key(d))
      labels.push(fmt(d))
    }

    const counts: Record<string, number> = {}
    const mls: Record<string, number> = {}
    for (const k of dayKeys) { counts[k] = 0; mls[k] = 0 }

    for (const e of entries) {
      const dkey = e.datetime.slice(0,10)
      if (dkey >= dayKeys[0] && dkey <= dayKeys[dayKeys.length-1]) {
        counts[dkey] = (counts[dkey] || 0) + 1
        if (typeof e.amountMl === 'number') mls[dkey] = (mls[dkey] || 0) + e.amountMl
      }
    }

    const countSeries = dayKeys.map(k => counts[k] || 0)
    const mlSeries = dayKeys.map(k => mls[k] || 0)
    return { labels, countSeries, mlSeries }
  }, [entries])

  const hasAny = entries.length > 0
  if (!hasAny) return <div className="text-sm text-gray-500">No data yet.</div>

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-2">Feedings per day</h3>
        <Line data={{ labels, datasets: [{ label: 'Count', data: countSeries, borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.2)' }] }} options={{ responsive: true, maintainAspectRatio: false }} height={240} />
      </div>
      <div>
        <h3 className="font-medium mb-2">Bottle/formula volume (mL)</h3>
        <Line data={{ labels, datasets: [{ label: 'mL', data: mlSeries, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,.2)' }] }} options={{ responsive: true, maintainAspectRatio: false }} height={240} />
      </div>
    </div>
  )
}
