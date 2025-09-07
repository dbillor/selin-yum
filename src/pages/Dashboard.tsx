
import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { StatPill } from '../components/StatPill'
import { getBaby, getDiapers, getFeedings, getSleeps, addFeeding } from '../api'
import { Link } from 'react-router-dom'
import type { Feeding, Diaper, Sleep, BabyProfile } from '../types'
import { ageFromBirth, wetDiaperTarget, stoolTarget } from '../utils'
import { startOfDay, endOfDay, isAfter, parseISO } from 'date-fns'

export default function Dashboard(){
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [feedings, setFeedings] = useState<Feeding[]>([])
  const [diapers, setDiapers] = useState<Diaper[]>([])
  const [sleeps, setSleeps] = useState<Sleep[]>([])

  useEffect(() => {
    (async () => {
      const bb = await getBaby()
      setBaby(bb)
      const today = new Date()
      const sd = startOfDay(today).toISOString()
      const ed = endOfDay(today).toISOString()
      // API returns full lists; filter client-side for today to keep API simple
      const allFeedings = await getFeedings()
      const allDiapers = await getDiapers()
      const allSleeps = await getSleeps()
      setFeedings(allFeedings.filter(f => f.datetime >= sd && f.datetime <= ed))
      setDiapers(allDiapers.filter(d => d.datetime >= sd && d.datetime <= ed))
      setSleeps(allSleeps.filter(s => s.start <= ed))
    })()
  }, [])

  const age = baby ? ageFromBirth(baby.birthIso) : null
  const dayOfLife = useMemo(() => {
    if (!baby) return 0
    const birth = new Date(baby.birthIso)
    const now = new Date()
    const diff = Math.floor((startOfDay(now).getTime() - startOfDay(birth).getTime()) / (24*3600*1000))
    return diff
  }, [baby])

  const wetTarget = wetDiaperTarget(dayOfLife)
  const stoolGoal = stoolTarget(dayOfLife)

  const lastFeeding = feedings.sort((a,b) => (a.datetime > b.datetime ? -1 : 1))[0]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <Card title="Today at a glance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPill label="Age" value={age ? age.label : '—'} sub={baby ? new Date(baby.birthIso).toLocaleString() : ''} />
            <StatPill label="Feedings (today)" value={feedings.length} sub="Log each side/ bottle" />
            <StatPill label="Wet diapers (today)" value={diapers.filter(d=>d.type!=='dirty').length} sub={`Target ≥ ${wetTarget}`} />
            <StatPill label="Stools (today)" value={diapers.filter(d=>d.type!=='wet').length} sub={`Target ≥ ${stoolGoal}`} />
          </div>
        </Card>

        <Card title="Quick log">
          <QuickLog />
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
        <Card title="Last feeding">
          {lastFeeding ? (
            <div className="text-sm">
              <div>{new Date(lastFeeding.datetime).toLocaleString()}</div>
              <div className="text-gray-600">Method: {lastFeeding.method}{lastFeeding.side ? ` • ${lastFeeding.side}` : ''}</div>
              {lastFeeding.durationMin ? <div>Duration: {lastFeeding.durationMin} min</div> : null}
              {lastFeeding.amountMl ? <div>Amount: {lastFeeding.amountMl} mL</div> : null}
              {lastFeeding.notes ? <div className="text-gray-600">{lastFeeding.notes}</div> : null}
            </div>
          ) : <div className="text-sm text-gray-500">No entries yet.</div>}
        </Card>

        <Card title="Shortcuts">
          <div className="grid gap-2">
            <Link className="btn" to="/feeding">Open Feeding</Link>
            <Link className="btn" to="/diapers">Open Diapers</Link>
            <Link className="btn" to="/sleep">Open Sleep</Link>
            <Link className="btn" to="/resources">Open Resources</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

function QuickLog(){
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
  }
  return (
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
  )
}
