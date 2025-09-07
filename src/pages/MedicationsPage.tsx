import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { addMedication, deleteMedication, getMedications } from '../api'
import type { MedicationDose, MedicationName } from '../types'
import { formatDateTimePacific, pacificDateKey, prettyDateTime } from '../utils'

export default function MedicationsPage(){
  const [entries, setEntries] = useState<MedicationDose[]>([])
  const [justSaved, setJustSaved] = useState(false)

  useEffect(()=>{ getMedications().then(setEntries) }, [])

  function triggerSaved(){ setJustSaved(true); setTimeout(()=>setJustSaved(false), 900) }

  const last = useMemo(() => entries.slice().sort((a,b) => (a.datetime > b.datetime ? -1 : 1))[0], [entries])
  const now = new Date()
  const next: { name: MedicationName, at: Date } = useMemo(() => {
    if (!last) return { name: 'ibuprofen', at: now }
    const at = new Date(new Date(last.datetime).getTime() + 2 * 3600 * 1000)
    const name: MedicationName = last.name === 'ibuprofen' ? 'acetaminophen' : 'ibuprofen'
    return { name, at }
  }, [last])

  async function logNow(name: MedicationName){
    const entry: MedicationDose = { name, datetime: new Date().toISOString() }
    await addMedication(entry)
    setEntries(await getMedications())
    triggerSaved()
  }

  async function addCustom(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as MedicationName)
    const datetimeLocal = String(fd.get('dt'))
    if (!datetimeLocal) return
    const entry: MedicationDose = { name, datetime: new Date(datetimeLocal).toISOString(), doseMg: fd.get('dose') ? parseInt(String(fd.get('dose')), 10) : undefined, notes: String(fd.get('notes') || '') || undefined }
    await addMedication(entry)
    e.currentTarget.reset()
    setEntries(await getMedications())
    triggerSaved()
  }

  async function remove(id?: number){
    if (!id) return
    await deleteMedication(id)
    setEntries(await getMedications())
  }

  const schedule = useMemo(() => {
    const out: { name: MedicationName, at: Date }[] = []
    let base = last ? new Date(last.datetime) : new Date()
    let nextName: MedicationName = last ? (last.name === 'ibuprofen' ? 'acetaminophen' : 'ibuprofen') : 'ibuprofen'
    for (let i = 0; i < 6; i++) { // next ~12 hours
      base = new Date(base.getTime() + 2 * 3600 * 1000)
      out.push({ name: nextName, at: new Date(base) })
      nextName = nextName === 'ibuprofen' ? 'acetaminophen' : 'ibuprofen'
    }
    return out
  }, [last])

  const todayKey = pacificDateKey(new Date())
  const todayCount = entries.filter(e => pacificDateKey(e.datetime) === todayKey).length

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Medications" actions={justSaved ? <span className="text-sm text-green-700 animate-pop">Saved!</span> : null}>
        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-md bg-white border border-gray-200">
            <div className="font-medium">Next dose</div>
            <div className="text-gray-700">{next.name === 'ibuprofen' ? 'Ibuprofen' : 'Acetaminophen'} at {formatDateTimePacific(next.at)}</div>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-2 bg-indigo-600 text-white rounded-md" onClick={() => logNow(next.name)}>Log now</button>
              <button className="px-3 py-2 bg-gray-200 rounded-md" onClick={() => logNow(next.name === 'ibuprofen' ? 'acetaminophen' : 'ibuprofen')}>Log other now</button>
            </div>
          </div>

          <div className="p-3 rounded-md bg-white border border-gray-200">
            <div className="font-medium mb-2">Add custom entry</div>
            <form className="grid md:grid-cols-2 gap-3" onSubmit={addCustom}>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Medication</span>
                <select name="name" className="input" defaultValue={next.name}>
                  <option value="ibuprofen">Ibuprofen</option>
                  <option value="acetaminophen">Acetaminophen</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Date & time</span>
                <input name="dt" type="datetime-local" className="input" required />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Dose (mg) (optional)</span>
                <input name="dose" type="number" className="input" min={0} step={50} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Notes</span>
                <input name="notes" className="input" placeholder="e.g., with food" />
              </label>
              <div className="md:col-span-2">
                <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Add entry</button>
              </div>
            </form>
          </div>

          <div className="p-3 rounded-md bg-white border border-gray-200">
            <div className="font-medium mb-2">Upcoming (next 12 hours)</div>
            <ul className="text-sm list-disc pl-5">
              {schedule.map((s, idx) => (
                <li key={idx}>{s.name === 'ibuprofen' ? 'Ibuprofen' : 'Acetaminophen'} at {formatDateTimePacific(s.at)}</li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-gray-600">Logged today: {todayCount}</div>
        </div>
      </Card>

      <Card title="History">
        <div className="space-y-2 text-sm max-h-[60vh] overflow-auto pr-1">
          {entries.map(e => (
            <div key={e.id} className="p-2 rounded-md border border-gray-200 bg-white flex items-center justify-between">
              <div>
                <div className="font-medium">{prettyDateTime(e.datetime)}</div>
                <div className="text-gray-600">{e.name === 'ibuprofen' ? 'Ibuprofen' : 'Acetaminophen'}{e.doseMg ? ` • ${e.doseMg} mg` : ''}</div>
                {e.notes ? <div className="text-gray-500">{e.notes}</div> : null}
              </div>
              <button className="text-red-600 hover:underline" onClick={()=>remove(e.id)}>Delete</button>
            </div>
          ))}
          {entries.length===0 && <div className="text-gray-500">No medication entries yet.</div>}
        </div>
      </Card>
    </div>
  )
}

