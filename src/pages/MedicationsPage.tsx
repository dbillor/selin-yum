import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { addMedication, deleteMedication, getMedications } from '../api'
import type { MedicationDose, MedicationName } from '../types'
import { formatDateTimePacific, pacificDateKey, prettyDateTime, toDatetimeLocalPacific, fromDatetimeLocalPacific } from '../utils'

export default function MedicationsPage(){
  const [entries, setEntries] = useState<MedicationDose[]>([])
  const [justSaved, setJustSaved] = useState(false)
  // Controlled state for custom-entry form (more reliable than FormData)
  const [cName, setCName] = useState<MedicationName>('ibuprofen')
  const [cDt, setCDt] = useState<string>(() => toDatetimeLocalPacific(new Date()))
  const [cDose, setCDose] = useState<string>('')
  const [cNotes, setCNotes] = useState<string>('')

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
    const created = await addMedication(entry)
    setEntries(prev => [created, ...prev])
    triggerSaved()
  }

  async function addCustom(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    if (!cDt) return
    const entry: MedicationDose = {
      name: cName,
      datetime: fromDatetimeLocalPacific(cDt),
      doseMg: cDose ? parseInt(cDose, 10) : undefined,
      notes: cNotes || undefined,
    }
    const created = await addMedication(entry)
    // Reset fields and refresh list
    setCName('ibuprofen')
    setCDt(toDatetimeLocalPacific(new Date()))
    setCDose('')
    setCNotes('')
    setEntries(prev => [created, ...prev])
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
                <select name="name" className="input" value={cName} onChange={e=>setCName(e.target.value as MedicationName)}>
                  <option value="ibuprofen">Ibuprofen</option>
                  <option value="acetaminophen">Acetaminophen</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Date & time (Pacific)</span>
                <input name="dt" type="datetime-local" className="input" value={cDt} onChange={e=>setCDt(e.target.value)} required />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Dose (mg) (optional)</span>
                <input name="dose" type="number" className="input" min={0} step={50} value={cDose} onChange={e=>setCDose(e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Notes</span>
                <input name="notes" className="input" placeholder="e.g., with food" value={cNotes} onChange={e=>setCNotes(e.target.value)} />
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
          {entries.slice().sort((a,b)=> (a.datetime > b.datetime ? -1 : 1)).map(e => (
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
