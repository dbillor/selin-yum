
import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { addFeeding, deleteFeeding, getFeedings } from '../api'
import type { Feeding } from '../types'
import { prettyDateTime, mlToOz, ozToMl, formatDatePacific, pacificDateKey, formatDateTimePacific } from '../utils'
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

      <Card title="Feed events (last 48h)">
        <FeedEventsTimeline entries={entries} hours={48} />
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
    const fmt = (d: Date) => formatDatePacific(d)
    const key = (d: Date) => pacificDateKey(d)

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
      const dkey = pacificDateKey(e.datetime)
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
        <div className="relative h-64">
          <Line
            data={{ labels, datasets: [{ label: 'Count', data: countSeries, borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.2)' }] }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Bottle/formula volume (mL)</h3>
        <div className="relative h-64">
          <Line
            data={{ labels, datasets: [{ label: 'mL', data: mlSeries, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,.2)' }] }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </div>
    </div>
  )
}

function FeedEventsTimeline({ entries, hours = 48 }: { entries: Feeding[]; hours?: number }){
  const now = new Date()
  const start = new Date(now.getTime() - hours * 60 * 60 * 1000)
  const events = entries
    .filter(e => {
      const t = new Date(e.datetime).getTime()
      return t >= start.getTime() && t <= now.getTime()
    })
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  if (events.length === 0) return <div className="text-sm text-gray-500">No events in the last {hours} hours.</div>

  const spanMs = now.getTime() - start.getTime()
  const ticks = 8 // number of tick marks including start/end
  const tickMs = spanMs / (ticks - 1)

  function pctFromDate(d: string){
    const t = new Date(d).getTime()
    return ((t - start.getTime()) / spanMs) * 100
  }

  function color(method: Feeding['method']){
    if (method === 'breast') return 'bg-indigo-500'
    if (method === 'bottle-breastmilk') return 'bg-emerald-500'
    return 'bg-amber-500'
  }

  function title(e: Feeding){
    const dt = formatDateTimePacific(new Date(e.datetime))
    const parts = [
      `Time: ${dt}`,
      `Method: ${e.method}${e.side ? ` • ${e.side}` : ''}`,
      e.durationMin ? `Duration: ${e.durationMin} min` : '',
      typeof e.amountMl === 'number' ? `Amount: ${e.amountMl} mL` : '',
      e.notes ? `Notes: ${e.notes}` : ''
    ].filter(Boolean)
    return parts.join('\n')
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600 flex items-center justify-between">
        <span>{formatDateTimePacific(start)}</span>
        <span>Now</span>
      </div>
      <div className="relative h-16 rounded-md border border-gray-200 bg-gray-50">
        {/* baseline */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-300" />

        {/* ticks */}
        {Array.from({ length: ticks }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${(i / (ticks - 1)) * 100}%` }}
          />
        ))}

        {/* dots */}
        {events.map((e, idx) => (
          <div
            key={e.id ?? `${e.datetime}-${idx}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${pctFromDate(e.datetime)}%` }}
            title={title(e)}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow ${color(e.method)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Breast</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bottle (BM)</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Formula</span>
      </div>
    </div>
  )
}
