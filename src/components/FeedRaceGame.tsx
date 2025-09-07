import { useEffect, useRef, useState } from 'react'

// Simple, relevant, and actually fun/challenging:
// "Bottle Balance" — stop the flow in the green zone.
// Press the button (or Space/Enter) to stop the moving marker
// inside the target range. Each success shrinks the target and
// speeds up the marker. Three misses ends the run.

type Phase = 'ready' | 'playing' | 'result' | 'done'

export default function FeedRaceGame({ onClose }:{ onClose: () => void }){
  const boxRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(0)

  // Game progression
  const MAX_ROUNDS = 8
  const MAX_LIVES = 3

  // Reactive UI state
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [phase, setPhase] = useState<Phase>('ready')
  const [flash, setFlash] = useState<null | 'nice' | 'miss'>(null)

  // Animated marker + target in [0..1]
  const posRef = useRef<number>(Math.random())
  const dirRef = useRef<number>(Math.random() < 0.5 ? -1 : 1)
  const speedRef = useRef<number>(0.75) // units per second across [0..1]
  const targetRef = useRef<{ start: number; end: number }>({ start: 0.4, end: 0.65 })

  function difficultyForRound(n: number){
    const baseWidth = 0.24
    const minWidth = 0.1
    const width = Math.max(minWidth, baseWidth - (n-1) * 0.02)
    const speed = 0.75 + (n-1) * 0.15
    return { width, speed }
  }

  function randomTarget(width: number){
    const margin = 0.06
    const start = Math.random() * (1 - 2*margin - width) + margin
    return { start, end: start + width }
  }

  function clamp01(x: number){ return Math.max(0, Math.min(1, x)) }

  function resetGame(){
    setRound(1)
    setScore(0)
    setLives(MAX_LIVES)
    setPhase('ready')
    setFlash(null)
    posRef.current = Math.random()
    dirRef.current = Math.random() < 0.5 ? -1 : 1
    const { width, speed } = difficultyForRound(1)
    targetRef.current = randomTarget(width)
    speedRef.current = speed
  }

  function startRound(n: number){
    setPhase('playing')
    lastTsRef.current = 0
    const { width, speed } = difficultyForRound(n)
    targetRef.current = randomTarget(width)
    speedRef.current = speed
    // Start from a random spot and direction
    posRef.current = Math.random()
    dirRef.current = Math.random() < 0.5 ? -1 : 1
    animate()
  }

  function endWithResult(hit: boolean){
    if (hit){
      setScore(s => s + 1)
      setFlash('nice')
    } else {
      setLives(l => l - 1)
      setFlash('miss')
    }
    setPhase('result')
    // Small pause then continue or finish
    window.setTimeout(() => {
      setFlash(null)
      if (score + (hit ? 1 : 0) >= MAX_ROUNDS){
        setPhase('done')
        return
      }
      if (lives - (hit ? 0 : 1) <= 0){
        setPhase('done')
        return
      }
      const next = round + 1
      setRound(next)
      startRound(next)
    }, 650)
  }

  function feedNow(){
    if (phase !== 'playing') return
    const p = posRef.current
    const { start, end } = targetRef.current
    const hit = p >= start && p <= end
    // Stop animation for result flash
    if (rafRef.current){ cancelAnimationFrame(rafRef.current); rafRef.current = null }
    endWithResult(hit)
  }

  function animate(ts?: number){
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height

    // Time step
    if (!lastTsRef.current) lastTsRef.current = ts || performance.now()
    const now = ts || performance.now()
    const dt = Math.min(0.032, (now - lastTsRef.current) / 1000) // clamp dt
    lastTsRef.current = now

    // Update position only if playing
    if (phase === 'playing'){
      let p = posRef.current + dirRef.current * speedRef.current * dt
      if (p <= 0){ p = 0; dirRef.current = 1 }
      if (p >= 1){ p = 1; dirRef.current = -1 }
      posRef.current = clamp01(p)
    }

    // Draw frame
    ctx.clearRect(0, 0, w, h)
    // Background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, w, h)

    // Title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto'
    ctx.textAlign = 'left'
    ctx.fillText(`Round ${round}/${MAX_ROUNDS}`, 12, 22)
    ctx.textAlign = 'right'
    ctx.fillText(`Lives: ${'❤'.repeat(lives)}`, w - 12, 22)

    // Track
    const x0 = 40, x1 = w - 40
    const y = Math.floor(h * 0.55)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()

    // Target zone
    const { start, end } = targetRef.current
    const tx0 = x0 + (x1 - x0) * start
    const tx1 = x0 + (x1 - x0) * end
    ctx.strokeStyle = '#34d399'
    ctx.lineWidth = 10
    ctx.beginPath(); ctx.moveTo(tx0, y); ctx.lineTo(tx1, y); ctx.stroke()

    // Marker (bottle)
    const p = posRef.current
    const px = x0 + (x1 - x0) * p
    // Bottle body
    ctx.save()
    ctx.translate(px, y)
    ctx.fillStyle = '#60a5fa'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 1
    // Rounded bottle body
    function roundedRectPath(cx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number){
      const rr = Math.min(r, w/2, h/2)
      cx.beginPath()
      cx.moveTo(x + rr, y)
      cx.lineTo(x + w - rr, y)
      cx.arcTo(x + w, y, x + w, y + rr, rr)
      cx.lineTo(x + w, y + h - rr)
      cx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
      cx.lineTo(x + rr, y + h)
      cx.arcTo(x, y + h, x, y + h - rr, rr)
      cx.lineTo(x, y + rr)
      cx.arcTo(x, y, x + rr, y, rr)
      cx.closePath()
    }
    roundedRectPath(ctx, -8, -20, 16, 28, 4)
    ctx.fill(); ctx.stroke()
    // Nipple
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath(); ctx.arc(0, -24, 6, Math.PI, 0); ctx.fill()
    ctx.restore()

    // Prompt
    ctx.fillStyle = '#6b7280'
    ctx.textAlign = 'center'
    ctx.font = '13px system-ui, -apple-system, Segoe UI, Roboto'
    if (phase === 'playing') ctx.fillText('Tap Feed Now when the bottle is in the green zone', w/2, h - 18)
    if (phase === 'ready') ctx.fillText('Press Start to begin • Stop in the green zone', w/2, h - 18)
    if (phase === 'result' && flash === 'nice') ctx.fillText('Nice! Good amount.', w/2, h - 18)
    if (phase === 'result' && flash === 'miss') ctx.fillText('Oops! Too little or too much.', w/2, h - 18)

    if (phase === 'playing') rafRef.current = requestAnimationFrame(animate)
  }

  // Layout: size canvas responsively
  useEffect(() => {
    function setSize(){
      const box = boxRef.current
      const canvas = canvasRef.current
      if (!box || !canvas) return
      const rect = box.getBoundingClientRect()
      const w = Math.min(720, Math.max(480, Math.floor(rect.width)))
      const h = Math.floor(w * 9/16)
      canvas.width = w
      canvas.height = h
      // Redraw once on resize
      requestAnimationFrame(() => animate())
    }
    setSize()
    const ro = new ResizeObserver(() => setSize())
    if (boxRef.current) ro.observe(boxRef.current)
    return () => ro.disconnect()
  }, [])

  // Keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (e.key === 'Escape') onClose()
      if ((e.key === ' ' || e.key === 'Enter')){
        e.preventDefault()
        if (phase === 'ready') startRound(1)
        else if (phase === 'playing') feedNow()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, phase])

  // Ensure we stop RAF when leaving result/done
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-label="Bottle balance game">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">Bottle Balance — stop in the green</h3>
          <button className="text-gray-500 hover:text-gray-800" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div ref={boxRef} className="p-4">
          <div className="mb-2 text-sm text-gray-600">
            Stop the bottle in the green zone to give just the right amount. The zone shrinks and speed increases each round.
          </div>
          <canvas ref={canvasRef} className="w-full h-auto rounded-md border border-gray-200 bg-gray-50"/>
          <div className="mt-3 flex items-center gap-2">
            {phase === 'ready' && <button className="btn" onClick={() => startRound(1)}>Start</button>}
            {phase === 'playing' && <button className="btn" onClick={feedNow}>Feed Now</button>}
            {phase === 'result' && <button className="px-3 py-2 rounded-md border" onClick={() => {/* wait */}} disabled>…</button>}
            {phase === 'done' && (
              <>
                <span className="text-sm text-gray-700">{lives > 0 ? 'Well fed! 🍼' : 'All out of tries.'} Score: {score}/{MAX_ROUNDS}</span>
                <button className="btn" onClick={resetGame}>Play again</button>
                <button className="px-3 py-2 rounded-md border" onClick={onClose}>Close</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
