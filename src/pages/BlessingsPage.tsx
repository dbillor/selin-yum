import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { getBaby } from '../api'
import type { BabyProfile } from '../types'
import { ageFromBirth, prettyDateTime, fromDatetimeLocalPacific } from '../utils'
import FeedRaceGame from '../components/FeedRaceGame'

const VIRGO_ASCII = `
                 .-''""''-.
               .'  .-.  .  '.
              /   (   )( )   \
             |   .-'-'--'-.   |
             |  (    ♍     )  |   Virgo • Earth • Mercury
             |   '-._.._.-'   |
              \              /
               '._        _.'
                  '------'
`;

function westernZodiac(d: Date) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  // Ranges are inclusive of start date
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries'
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus'
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini'
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer'
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo'
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo'
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra'
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio'
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius'
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Capricorn'
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius'
  return 'Pisces'
}

function chineseZodiac(year: number) {
  // Anchor 2020 = Rat
  const animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig']
  let idx = (year - 2020) % 12
  if (idx < 0) idx += 12
  return animals[idx]
}

function chineseElement(year: number) {
  // Elements repeat in 2-year pairs; 2024/2025 = Wood
  const elements = ['Wood','Fire','Earth','Metal','Water']
  let pair = Math.floor((year - 2024) / 2)
  let idx = pair % elements.length
  if (idx < 0) idx += elements.length
  return elements[idx]
}

export default function BlessingsPage(){
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [showGame, setShowGame] = useState(false)

  useEffect(() => { getBaby().then(setBaby) }, [])

  // Fallback birth if profile not yet saved
  const fallbackBirth = useMemo(() => new Date(fromDatetimeLocalPacific('2025-09-04T23:53')), [])
  const birth = baby?.birthIso ? new Date(baby.birthIso) : fallbackBirth
  const age = ageFromBirth(birth.toISOString())
  const name = baby?.name || 'Selin'

  const west = westernZodiac(birth)
  const cz = chineseZodiac(birth.getFullYear())
  const elem = chineseElement(birth.getFullYear())

  return (
    <div className="grid gap-4">
      {showGame && <FeedRaceGame onClose={() => setShowGame(false)} />}
      <Card title={`Blessings for ${name}`} actions={<button className="text-xl opacity-0 hover:opacity-100 focus:opacity-100 transition cursor-pointer" title="Blessings mini‑game" onClick={() => setShowGame(true)} aria-label="Open mini game">🍼</button>}>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <pre className="p-3 rounded-md bg-white border border-gray-200 leading-4 overflow-auto text-sm whitespace-pre" onDoubleClick={() => setShowGame(true)} title="double‑click for a surprise">
{VIRGO_ASCII}
            </pre>
            <div className="mt-3 text-sm text-gray-700">
              <div><strong>Born:</strong> {prettyDateTime(birth.toISOString())}</div>
              <div><strong>Age:</strong> {age.label}</div>
              <div><strong>Western zodiac:</strong> {west} (Virgo window: Aug 23 – Sep 22)</div>
              <div><strong>Chinese zodiac:</strong> {elem} {cz}</div>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium mb-1">Blessings</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>May your path be gentle, your curiosity bright, and your heart brave.</li>
                <li>May kindness be your compass and wisdom your steady wind.</li>
                <li>May health, joy, and laughter gather around you like sunlight.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-1">Personality threads (fun + informal)</h3>
              <p className="text-gray-600 mb-2">Drawn from common Virgo and Wood Snake themes.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Virgo:</strong> thoughtful, observant, caring, detail-loving, helpful, grounded, health‑aware.</li>
                <li><strong>Wood Snake:</strong> wise, intuitive, calm, artistic, strategic, quietly determined, graceful.</li>
                <li><strong>Blended:</strong> gentle precision, creative problem‑solving, service‑minded leadership, deep empathy.</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">Note: Astrology is for joy and reflection — not destiny. The truest story will be the one she writes.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
