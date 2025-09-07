
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { addGrowth, deleteGrowth, getGrowth } from '../api'
import type { Growth } from '../types'
import { prettyDateTime, formatDatePacific, toDatetimeLocalPacific, fromDatetimeLocalPacific } from '../utils'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

export default function GrowthPage(){
  const [entries, setEntries] = useState<Growth[]>([])
  const [form, setForm] = useState<Growth>({
    datetime: new Date().toISOString(),
    weightGrams: undefined,
    lengthCm: undefined,
    headCm: undefined,
  })

  useEffect(()=>{ getGrowth().then(setEntries) }, [])

  async function submit(e: React.FormEvent){
    e.preventDefault()
    await addGrowth(form)
    setForm({ datetime: new Date().toISOString() })
    setEntries(await getGrowth())
    triggerSaved()
  }
  async function remove(id?: number){
    if (!id) return
    await deleteGrowth(id)
    setEntries(await getGrowth())
  }

  const [justSaved, setJustSaved] = useState(false)
  function triggerSaved(){ setJustSaved(true); setTimeout(()=>setJustSaved(false), 900) }

  const labels = entries.map(e => formatDatePacific(new Date(e.datetime)))
  const weightData = entries.map(e => (e.weightGrams||0)/1000)
  const lengthData = entries.map(e => (e.lengthCm||0))

  return (
    <div className="grid gap-4">
      <Card title="Record a measurement" actions={justSaved ? <span className="text-sm text-green-700 animate-pop">Saved!</span> : null}>
        <form onSubmit={submit} className="grid md:grid-cols-4 gap-3 text-sm">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Date (Pacific)</span>
            <input type="datetime-local" className="input" value={toDatetimeLocalPacific(form.datetime)}
              onChange={e=>setForm({...form, datetime: fromDatetimeLocalPacific(e.target.value)})} required/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Weight (g)</span>
            <input type="number" className="input" value={form.weightGrams||''} onChange={e=>setForm({...form, weightGrams: parseInt(e.target.value||'0')})}/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Length (cm)</span>
            <input type="number" className="input" value={form.lengthCm||''} onChange={e=>setForm({...form, lengthCm: parseFloat(e.target.value||'0')})}/>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium">Head (cm)</span>
            <input type="number" className="input" value={form.headCm||''} onChange={e=>setForm({...form, headCm: parseFloat(e.target.value||'0')})}/>
          </label>
          <div className="md:col-span-4">
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Add</button>
          </div>
        </form>
      </Card>

      <Card title="Trends (your data)">
        {entries.length >= 1 ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Weight (kg)</h3>
              <div className="relative h-64">
                <Line data={{ labels, datasets: [{ label: 'Weight', data: weightData }] }} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Length (cm)</h3>
              <div className="relative h-64">
                <Line data={{ labels, datasets: [{ label: 'Length', data: lengthData }] }} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        ) : <div className="text-sm text-gray-500">Add some measurements to see charts.</div>}
        <p className="text-xs text-gray-500 mt-3">Note: Percentiles are best calculated using WHO standards. This app focuses on trends; bring this log to your pediatrician for official percentiles.</p>
      </Card>

      <Card title="History">
        <div className="space-y-2 text-sm max-h-[50vh] overflow-auto pr-1">
          {entries.map(e => (
            <div key={e.id} className="p-2 rounded-md border border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-medium">{prettyDateTime(e.datetime)}</div>
                <div className="text-gray-600">Wt: {e.weightGrams? `${(e.weightGrams/1000).toFixed(2)} kg`:'—'} • L: {e.lengthCm||'—'} cm • HC: {e.headCm||'—'} cm</div>
                {e.notes ? <div className="text-gray-500">{e.notes}</div> : null}
              </div>
              <button className="text-red-600 hover:underline" onClick={()=>remove(e.id)}>Delete</button>
            </div>
          ))}
          {entries.length===0 && <div className="text-gray-500">No measurements yet.</div>}
        </div>
      </Card>
    </div>
  )
}
