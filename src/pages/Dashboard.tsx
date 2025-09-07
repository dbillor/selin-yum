
import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { StatPill } from '../components/StatPill'
import Achievements from '../components/Achievements'
import { getBaby, getDiapers, getFeedings, getSleeps, addFeeding, addDiaper, addSleep, getGrowth, getMedications, addMedication } from '../api'
import { Link } from 'react-router-dom'
import type { Feeding, Diaper, Sleep, BabyProfile, Growth, MedicationDose, MedicationName } from '../types'
import { ageFromBirth, wetDiaperTarget, stoolTarget, pacificDateKey, formatDateTimePacific, PACIFIC_TZ } from '../utils'
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns'

export default function Dashboard(){
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [feedings, setFeedings] = useState<Feeding[]>([])
  const [feedingsAll, setFeedingsAll] = useState<Feeding[]>([])
  const [diapers, setDiapers] = useState<Diaper[]>([])
  const [diapersAll, setDiapersAll] = useState<Diaper[]>([])
  const [sleeps, setSleeps] = useState<Sleep[]>([])
  const [sleepsAll, setSleepsAll] = useState<Sleep[]>([])
  const [meds, setMeds] = useState<MedicationDose[]>([])
  const [growth, setGrowth] = useState<Growth[]>([])

  async function reloadData(){
    const bb = await getBaby()
    setBaby(bb)
    // API returns full lists; filter client-side for today (Pacific time) to keep API simple
    const allFeedings = await getFeedings()
    const allDiapers = await getDiapers()
    const allSleeps = await getSleeps()
    const allMeds = await getMedications()
    const todayKey = pacificDateKey(new Date())
    setFeedingsAll(allFeedings)
    setFeedings(allFeedings.filter(f => pacificDateKey(f.datetime) === todayKey))
    setDiapersAll(allDiapers)
    setDiapers(allDiapers.filter(d => pacificDateKey(d.datetime) === todayKey))
    const ed = endOfDay(new Date()).toISOString()
    setSleepsAll(allSleeps)
    setSleeps(allSleeps.filter(s => s.start <= ed))
    setMeds(allMeds)
    setGrowth(await getGrowth())
  }

  useEffect(() => { reloadData() }, [])

  const age = baby ? ageFromBirth(baby.birthIso) : null
  const dayOfLife = age?.days ?? 0

  const wetTarget = wetDiaperTarget(dayOfLife)
  const stoolGoal = stoolTarget(dayOfLife)

  const lastFeeding = feedingsAll.slice().sort((a,b) => (a.datetime > b.datetime ? -1 : 1))[0]

  type Insight = { severity: 'warn' | 'info', text: string }
  const insights: Insight[] = useMemo(() => {
    const out: Insight[] = []
    const now = new Date()

    if (baby && lastFeeding) {
      const mins = differenceInMinutes(now, new Date(lastFeeding.datetime))
      if (mins >= 180) out.push({ severity: 'warn', text: `It’s been ${Math.floor(mins/60)}h ${mins%60}m since last feeding — consider offering a feed.` })
      else if (mins >= 120) out.push({ severity: 'info', text: `Last feeding ${Math.floor(mins/60)}h ${mins%60}m ago — next may be soon.` })
    } else if (baby && feedings.length === 0) {
      out.push({ severity: 'info', text: 'No feedings logged yet today.' })
    }

    if (baby) {
      const wet = diapers.filter(d => d.type !== 'dirty').length
      const stool = diapers.filter(d => d.type !== 'wet').length
      const wetTarget = wetDiaperTarget(dayOfLife)
      const stoolGoal = stoolTarget(dayOfLife)
      // Current hour in Pacific time
      const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: PACIFIC_TZ, hour: '2-digit', hour12: false }).format(now), 10)
      if (wet < wetTarget && hour >= 18) out.push({ severity: 'warn', text: `Wet diapers: ${wet} so far; aim ≥ ${wetTarget} by day’s end.` })
      else out.push({ severity: 'info', text: `Wet diapers so far: ${wet} (target ≥ ${wetTarget} by day’s end).` })
      if (stool < stoolGoal && hour >= 18) out.push({ severity: 'warn', text: `Stools: ${stool} so far; goal ≥ ${stoolGoal} by day’s end.` })
      else out.push({ severity: 'info', text: `Stools so far: ${stool} (goal ≥ ${stoolGoal} by day’s end).` })
    }

    if (growth && growth.length > 0) {
      const last = growth.slice().sort((a,b)=> a.datetime > b.datetime ? -1 : 1)[0]
      const daysSince = Math.floor((startOfDay(new Date()).getTime() - startOfDay(new Date(last.datetime)).getTime())/(24*3600*1000))
      if (daysSince >= 7) out.push({ severity: 'info', text: `Last growth entry ${daysSince} day(s) ago — consider a weekly check.` })
    } else {
      out.push({ severity: 'info', text: 'Add a growth measurement when convenient to start trends.' })
    }

    return out
  }, [baby, lastFeeding, feedings, diapers, growth, dayOfLife])

  // Timers — recompute every second
  const [nowTick, setNowTick] = useState<number>(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNowTick(Date.now()), 1000); return () => clearInterval(t) }, [])
  const lastDiaper = useMemo(() => {
    const nowMs = nowTick
    return diapers
      .filter(d => new Date(d.datetime).getTime() <= nowMs)
      .sort((a,b)=> (a.datetime > b.datetime ? -1 : 1))[0]
  }, [diapers, nowTick])
  const diaperIntervalMin = 120 // recommend check/change about every 2 hours by default
  const diaperDueAt = lastDiaper ? new Date(new Date(lastDiaper.datetime).getTime() + diaperIntervalMin*60*1000) : null
  const diaperDeltaMs = diaperDueAt ? (diaperDueAt.getTime() - nowTick) : 0
  const lastMed = useMemo(() => {
    const nowMs = nowTick
    return meds
      .filter(m => new Date(m.datetime).getTime() <= nowMs)
      .sort((a,b)=> (a.datetime > b.datetime ? -1 : 1))[0]
  }, [meds, nowTick])
  const medIntervalMin = 120
  const medDueAt = lastMed ? new Date(new Date(lastMed.datetime).getTime() + medIntervalMin*60*1000) : null
  const medDeltaMs = medDueAt ? (medDueAt.getTime() - nowTick) : 0
  const nextMedName: MedicationName = lastMed ? (lastMed.name === 'ibuprofen' ? 'acetaminophen' : 'ibuprofen') : 'ibuprofen'
  // Feeding window: open at 2h, overdue at 3h
  const lastFeedingPast = useMemo(() => {
    const nowMs = nowTick
    return feedingsAll
      .filter(f => new Date(f.datetime).getTime() <= nowMs)
      .sort((a,b)=> (a.datetime > b.datetime ? -1 : 1))[0]
  }, [feedingsAll, nowTick])
  const feedDueEarlyAt = lastFeedingPast ? new Date(new Date(lastFeedingPast.datetime).getTime() + 120*60*1000) : null
  const feedDueLateAt = lastFeedingPast ? new Date(new Date(lastFeedingPast.datetime).getTime() + 180*60*1000) : null
  const feedDeltaToEarly = feedDueEarlyAt ? (feedDueEarlyAt.getTime() - nowTick) : 0
  const feedDeltaToLate = feedDueLateAt ? (feedDueLateAt.getTime() - nowTick) : 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <Card title="Today at a glance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPill label="Age" value={age ? age.label : '—'} sub={baby ? formatDateTimePacific(new Date(baby.birthIso)) : ''} />
            <StatPill label="Feedings (today)" value={feedings.length} sub="Log each side/ bottle" />
            <StatPill label="Wet diapers (today)" value={diapers.filter(d=>d.type!=='dirty').length} sub={`Target ≥ ${wetTarget}`} />
            <StatPill label="Stools (today)" value={diapers.filter(d=>d.type!=='wet').length} sub={`Target ≥ ${stoolGoal}`} />
          </div>
        </Card>

        <Card title="Timers">
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-md bg-white border border-gray-200">
              <div className="font-medium mb-1">Feeding</div>
              {lastFeeding ? (
                <div className="text-gray-700">
                  {feedDeltaToEarly > 0 ? (
                    <span>Window opens in {fmtDelta(feedDeltaToEarly)}</span>
                  ) : feedDeltaToLate > 0 ? (
                    <span>Window open • {fmtDelta(feedDeltaToLate)} left</span>
                  ) : (
                    <span className="text-red-700">Overdue by {fmtDelta(-feedDeltaToLate)}</span>
                  )}
                </div>
              ) : <div className="text-gray-500">No feedings yet — log one to start the timer.</div>}
            </div>
            <div className="p-3 rounded-md bg-white border border-gray-200">
              <div className="font-medium mb-1">Diaper</div>
              {lastDiaper ? (
                <div className="text-gray-700">
                  {diaperDeltaMs > 0 ? (
                    <span>Next check in {fmtDelta(diaperDeltaMs)}</span>
                  ) : (
                    <span className="text-red-700">Due {fmtDelta(-diaperDeltaMs)} ago</span>
                  )}
                </div>
              ) : <div className="text-gray-500">No diapers yet — log one to start the timer.</div>}
            </div>
            <div className="p-3 rounded-md bg-white border border-gray-200">
              <div className="font-medium mb-1">Medication</div>
              {lastMed ? (
                <div className="text-gray-700">
                  {medDeltaMs > 0 ? (
                    <span>Next dose ({nextMedName === 'ibuprofen' ? 'Ibuprofen' : 'Acetaminophen'}) in {fmtDelta(medDeltaMs)}</span>
                  ) : (
                    <span className="text-red-700">Eligible ({nextMedName === 'ibuprofen' ? 'Ibuprofen' : 'Acetaminophen'}) {fmtDelta(-medDeltaMs)} ago</span>
                  )}
                </div>
              ) : <div className="text-gray-500">No medication entries yet.</div>}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Timers are guidance only; follow your clinician’s advice for diapering and dosing intervals.</p>
        </Card>

        <Card title="Today’s insights">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {insights.map((i, idx) => (
              <li key={idx} className={i.severity==='warn' ? 'text-red-700' : 'text-gray-700'}>{i.text}</li>
            ))}
          </ul>
        </Card>

        <Card title="Quick log">
          <QuickLog onRefresh={reloadData} />
        </Card>

        <Card title="Evidence-based tips">
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li><strong>Feeding:</strong> Breastfed newborns typically feed 8–12 times/24h; formula-fed newborns often take 1–2 oz every 2–3 hours in the first days. Follow baby’s cues.</li>
            <li><strong>Diapers:</strong> Expect ≥1 wet on day 1, ≥2 on day 2, ≥3 on day 3, ≥4 on day 4, and ≥6/day by day 5+. Call your clinician for fewer than these or signs of dehydration.</li>
            <li><strong>Vitamin D:</strong> If breastfed (fully or partially), offer 400 IU vitamin D daily unless told otherwise by your clinician.</li>
            <li><strong>Safe sleep:</strong> Always back-to-sleep in a bare crib/bassinet; room-share (not bed-share). Avoid soft bedding and weighted sleepers.</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">These tips are summaries; see Resources for full details and citations.</p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Achievements">
          <Achievements baby={baby} feedings={feedingsAll} diapers={diapersAll} sleeps={sleepsAll} growth={growth} />
        </Card>
        <Card title="Last feeding">
          {lastFeeding ? (
            <div className="text-sm">
              <div>{formatDateTimePacific(new Date(lastFeeding.datetime))}</div>
              <div className="text-gray-600">Method: {lastFeeding.method}{lastFeeding.side ? ` • ${lastFeeding.side}` : ''}</div>
              {lastFeeding.durationMin ? <div>Duration: {lastFeeding.durationMin} min</div> : null}
              {lastFeeding.amountMl ? <div>Amount: {lastFeeding.amountMl} mL</div> : null}
              {lastFeeding.notes ? <div className="text-gray-600">{lastFeeding.notes}</div> : null}
            </div>
          ) : <div className="text-sm text-gray-500">No entries yet.</div>}
        </Card>

        
      </div>
    </div>
  )
}

function fmtDelta(ms: number){
  const total = Math.max(0, Math.floor(ms/1000))
  const h = Math.floor(total/3600)
  const m = Math.floor((total%3600)/60)
  const s = total%60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function QuickLog({ onRefresh }:{ onRefresh: ()=>void }){
  const [method, setMethod] = useState<'breast'|'bottle-breastmilk'|'formula'>('breast')
  const [side, setSide] = useState<'left'|'right'|'both'|'na'>('left')
  const [duration, setDuration] = useState<number>(10)
  const [amount, setAmount] = useState<number>(60)
  const [notes, setNotes] = useState('')

  const [justSaved, setJustSaved] = useState(false)
  async function submit(){
    const entry: Feeding = {
      datetime: new Date().toISOString(),
      method,
      side: method==='breast' ? side : 'na',
      durationMin: method==='breast' ? duration : undefined,
      amountMl: method!=='breast' ? amount : undefined,
      notes: notes || undefined
    }
    await addFeeding(entry)
    setNotes('')
    setJustSaved(true); setTimeout(()=>setJustSaved(false), 900)
    onRefresh()
  }
  // Diaper quick log
  const [dType, setDType] = useState<'wet'|'dirty'|'mixed'>('wet')
  const [dColor, setDColor] = useState('')
  const [justSavedDiaper, setJustSavedDiaper] = useState(false)
  async function submitDiaper(){
    const entry = { datetime: new Date().toISOString(), type: dType, color: dColor || undefined }
    await addDiaper(entry)
    setDColor('')
    setJustSavedDiaper(true); setTimeout(()=>setJustSavedDiaper(false), 900)
    onRefresh()
  }

  // Sleep quick log (by duration)
  const [sDuration, setSDuration] = useState<number>(30)
  const [sNotes, setSNotes] = useState('')
  const [justSavedSleep, setJustSavedSleep] = useState(false)
  async function submitSleep(){
    const end = new Date()
    const start = new Date(end.getTime() - Math.max(0, sDuration||0) * 60 * 1000)
    const entry = { start: start.toISOString(), end: end.toISOString(), notes: sNotes || undefined }
    await addSleep(entry)
    setSNotes('')
    setJustSavedSleep(true); setTimeout(()=>setJustSavedSleep(false), 900)
    onRefresh()
  }

  // Medication quick log
  const [medName, setMedName] = useState<MedicationName>('ibuprofen')
  const [medDose, setMedDose] = useState<string>('')
  const [medNotes, setMedNotes] = useState<string>('')
  const [justSavedMed, setJustSavedMed] = useState(false)
  async function submitMed(){
    const entry: MedicationDose = { name: medName, datetime: new Date().toISOString(), doseMg: medDose ? parseInt(medDose,10) : undefined, notes: medNotes || undefined }
    await addMedication(entry)
    setMedDose(''); setMedNotes('')
    setJustSavedMed(true); setTimeout(()=>setJustSavedMed(false), 900)
    onRefresh()
  }

  return (
    <div className="space-y-6">
      {/* Feeding quick form */}
      <form onSubmit={(e)=>{e.preventDefault(); submit();}} className="grid md:grid-cols-5 gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-xs font-medium">Method</span>
          <select value={method} onChange={e=>setMethod(e.target.value as any)} className="input">
            <option value="breast">Breast</option>
            <option value="bottle-breastmilk">Bottle (Breastmilk)</option>
            <option value="formula">Formula</option>
          </select>
        </label>
        {method==='breast' ? (
          <label className="grid gap-1">
            <span className="text-xs font-medium">Side</span>
            <select value={side} onChange={e=>setSide(e.target.value as any)} className="input">
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="both">Both</option>
            </select>
          </label>
        ) : (
          <label className="grid gap-1">
            <span className="text-xs font-medium">Amount (mL)</span>
            <input type="number" className="input" value={amount} onChange={e=>setAmount(parseInt(e.target.value||'0'))} min={0} step={10}/>
          </label>
        )}
        {method==='breast' && (
          <label className="grid gap-1">
            <span className="text-xs font-medium">Duration (min)</span>
            <input type="number" className="input" value={duration} onChange={e=>setDuration(parseInt(e.target.value||'0'))} min={0} step={1}/>
          </label>
        )}
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs font-medium">Notes</span>
          <input className="input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Latch, spit-up, mood…" />
        </label>
        <div className="md:col-span-5 flex items-center gap-3">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Log Feeding</button>
          {justSaved && <span className="text-green-700 text-sm animate-pop">Saved!</span>}
        </div>
      </form>

      <hr className="border-gray-200"/>

      {/* Diaper quick form */}
      <form onSubmit={(e)=>{e.preventDefault(); submitDiaper();}} className="grid md:grid-cols-5 gap-3 text-sm">
        <div className="grid gap-1 md:col-span-2">
          <span className="text-xs font-medium">Diaper</span>
          <div className="flex gap-2">
            <button type="button" onClick={()=>setDType('wet')} className={`px-3 py-2 rounded-md border ${dType==='wet' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300'}`}>Wet</button>
            <button type="button" onClick={()=>setDType('dirty')} className={`px-3 py-2 rounded-md border ${dType==='dirty' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300'}`}>Stool</button>
            <button type="button" onClick={()=>setDType('mixed')} className={`px-3 py-2 rounded-md border ${dType==='mixed' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300'}`}>Mixed</button>
          </div>
        </div>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs font-medium">Color/notes</span>
          <input className="input" value={dColor} onChange={e=>setDColor(e.target.value)} placeholder="yellow, green, seedy…" />
        </label>
        <div className="md:col-span-1 flex items-end gap-3">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Log Diaper</button>
          {justSavedDiaper && <span className="text-green-700 text-sm animate-pop">Saved!</span>}
        </div>
      </form>

      <hr className="border-gray-200"/>

      {/* Sleep quick form */}
      <form onSubmit={(e)=>{e.preventDefault(); submitSleep();}} className="grid md:grid-cols-5 gap-3 text-sm">
        <div className="grid gap-1">
          <span className="text-xs font-medium">Duration (min)</span>
          <div className="flex gap-2">
            <button type="button" onClick={()=>setSDuration(15)} className={`px-2 py-1 rounded-md border text-sm ${sDuration===15 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300'}`}>15</button>
            <button type="button" onClick={()=>setSDuration(30)} className={`px-2 py-1 rounded-md border text-sm ${sDuration===30 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300'}`}>30</button>
            <button type="button" onClick={()=>setSDuration(60)} className={`px-2 py-1 rounded-md border text-sm ${sDuration===60 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300'}`}>60</button>
            <input type="number" className="input w-24" value={sDuration} onChange={e=>setSDuration(parseInt(e.target.value||'0'))} min={0} step={5}/>
          </div>
        </div>
        <label className="grid gap-1 md:col-span-3">
          <span className="text-xs font-medium">Notes</span>
          <input className="input" value={sNotes} onChange={e=>setSNotes(e.target.value)} placeholder="contact nap, bassinet, etc." />
        </label>
        <div className="md:col-span-1 flex items-end gap-3">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Log Sleep</button>
          {justSavedSleep && <span className="text-green-700 text-sm animate-pop">Saved!</span>}
        </div>
      </form>

      <hr className="border-gray-200"/>

      {/* Medication quick form */}
      <form onSubmit={(e)=>{e.preventDefault(); submitMed();}} className="grid md:grid-cols-5 gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-xs font-medium">Medication</span>
          <select className="input" value={medName} onChange={e=>setMedName(e.target.value as MedicationName)}>
            <option value="ibuprofen">Ibuprofen</option>
            <option value="acetaminophen">Acetaminophen</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium">Dose (mg)</span>
          <input type="number" className="input" min={0} step={50} value={medDose} onChange={e=>setMedDose(e.target.value)} placeholder="optional" />
        </label>
        <label className="grid gap-1 md:col-span-2">
          <span className="text-xs font-medium">Notes</span>
          <input className="input" value={medNotes} onChange={e=>setMedNotes(e.target.value)} placeholder="e.g., with food" />
        </label>
        <div className="md:col-span-1 flex items-end gap-3">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded-md">Log Medication</button>
          {justSavedMed && <span className="text-green-700 text-sm animate-pop">Saved!</span>}
        </div>
      </form>
    </div>
  )
}
