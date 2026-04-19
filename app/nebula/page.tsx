'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

interface NebulaSettings {
  color1: string
  color2: string
  layers: number
  spread: number
  turbulence: number
  starDensity: number
  shape: 'cloud' | 'ring' | 'bipolar' | 'irregular'
}

const defaults: NebulaSettings = {
  color1: '#c084fc',
  color2: '#38bdf8',
  layers: 7,
  spread: 0.65,
  turbulence: 0.5,
  starDensity: 0.6,
  shape: 'cloud',
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hexToRgb(hex: string) {
  const h = hex?.startsWith('#') ? hex : '#c084fc'
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return {
    r: isNaN(r) ? 192 : r,
    g: isNaN(g) ? 132 : g,
    b: isNaN(b) ? 252 : b,
  }
}

function drawNebula(ctx: CanvasRenderingContext2D, w: number, h: number, s: NebulaSettings, seed: number, transparent = false) {
  const rand = seededRandom(seed)
  ctx.clearRect(0, 0, w, h)

  if (!transparent) {
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    bg.addColorStop(0, '#050210')
    bg.addColorStop(1, '#010008')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
  }

  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) * s.spread * 0.48

  if (!transparent) {
    const starCount = Math.floor(s.starDensity * 300)
    const starRand = seededRandom(seed + 99)
    for (let i = 0; i < starCount; i++) {
      const sx = starRand() * w
      const sy = starRand() * h
      const sr = starRand() * 1.4
      const sb = starRand()
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${0.2 + sb * 0.7})`
      ctx.fill()
    }
  }

  const c1 = hexToRgb(s.color1)
  const c2 = hexToRgb(s.color2)

  ctx.globalCompositeOperation = 'screen'

  const layers = s.layers
  for (let l = 0; l < layers; l++) {
    const progress = l / layers
    rand()
    const dist = rand() * maxR * 0.7
    const angle = rand() * Math.PI * 2
    const turbOff = s.turbulence * 40

    let lx = cx + Math.cos(angle) * dist * rand()
    let ly = cy + Math.sin(angle) * dist * rand()

    if (s.shape === 'ring') {
      const ringR = maxR * 0.55
      const ringAngle = (l / layers) * Math.PI * 2
      lx = cx + Math.cos(ringAngle) * ringR + (rand() - 0.5) * turbOff * 1.5
      ly = cy + Math.sin(ringAngle) * ringR * 0.5 + (rand() - 0.5) * turbOff
    } else if (s.shape === 'bipolar') {
      const side = l % 2 === 0 ? 1 : -1
      lx = cx + side * (maxR * 0.4 + rand() * maxR * 0.2) + (rand() - 0.5) * turbOff
      ly = cy + (rand() - 0.5) * maxR * 0.6 + (rand() - 0.5) * turbOff
    } else if (s.shape === 'irregular') {
      lx = cx + (rand() - 0.5) * maxR * 1.6 + (rand() - 0.5) * turbOff * 2
      ly = cy + (rand() - 0.5) * maxR * 1.3 + (rand() - 0.5) * turbOff * 2
    }

    const layerR = (0.25 + rand() * 0.75) * maxR * (0.4 + s.spread * 0.6)

    const t1 = 0.3 + rand() * 0.4
    const ri = Math.round(c1.r + (c2.r - c1.r) * t1)
    const gi = Math.round(c1.g + (c2.g - c1.g) * t1)
    const bi = Math.round(c1.b + (c2.b - c1.b) * t1)

    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, layerR)
    const alpha = (0.82 * (0.12 + rand() * 0.2) * (1 - progress * 0.4))
    grad.addColorStop(0, `rgba(${ri},${gi},${bi},${alpha})`)
    grad.addColorStop(0.4, `rgba(${ri},${gi},${bi},${alpha * 0.5})`)
    grad.addColorStop(1, `rgba(${ri},${gi},${bi},0)`)

    ctx.beginPath()
    ctx.arc(lx, ly, layerR, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  const fRand = seededRandom(seed + 7)
  const filCount = Math.floor(4 + s.turbulence * 8)
  for (let f = 0; f < filCount; f++) {
    const fa = fRand() * Math.PI * 2
    const fl = maxR * (0.3 + fRand() * 0.6)
    const fw = 1 + fRand() * 3
    const fx = cx + (fRand() - 0.5) * maxR * 0.4
    const fy = cy + (fRand() - 0.5) * maxR * 0.4
    const ex = fx + Math.cos(fa) * fl
    const ey = fy + Math.sin(fa) * fl
    const colR = fRand()
    let fc: string
    if (colR < 0.5) fc = `rgba(${c1.r},${c1.g},${c1.b},`
    else fc = `rgba(${c2.r},${c2.g},${c2.b},`
    const grad = ctx.createLinearGradient(fx, fy, ex, ey)
    grad.addColorStop(0, fc + '0)')
    grad.addColorStop(0.3, fc + (0.82 * 0.25) + ')')
    grad.addColorStop(0.7, fc + (0.82 * 0.2) + ')')
    grad.addColorStop(1, fc + '0)')
    ctx.strokeStyle = grad
    ctx.lineWidth = fw
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    const cpx = cx + (fRand() - 0.5) * maxR * 0.8
    const cpy = cy + (fRand() - 0.5) * maxR * 0.8
    ctx.quadraticCurveTo(cpx, cpy, ex, ey)
    ctx.stroke()
  }

  if (!transparent) {
    ctx.globalCompositeOperation = 'multiply'
    const dRand = seededRandom(seed + 13)
    const laneCount = Math.floor(1 + s.turbulence * 3)
    for (let d = 0; d < laneCount; d++) {
      const da = dRand() * Math.PI * 2
      const dl = maxR * (0.4 + dRand() * 0.4)
      const dx = cx + (dRand() - 0.5) * maxR * 0.3
      const dy = cy + (dRand() - 0.5) * maxR * 0.3
      const ex = dx + Math.cos(da) * dl
      const ey = dy + Math.sin(da) * dl
      const grad = ctx.createLinearGradient(dx, dy, ex, ey)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.4, `rgba(0,0,0,${0.25 + dRand() * 0.2})`)
      grad.addColorStop(0.6, `rgba(0,0,0,${0.2 + dRand() * 0.15})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 4 + dRand() * 12
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(dx, dy)
      const cpx = cx + (dRand() - 0.5) * maxR
      const cpy = cy + (dRand() - 0.5) * maxR
      ctx.quadraticCurveTo(cpx, cpy, ex, ey)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'screen'
  }

  if (!transparent) {
    const csRand = seededRandom(seed + 55)
    const coreStars = Math.floor(3 + s.starDensity * 12)
    for (let i = 0; i < coreStars; i++) {
      const sa = csRand() * Math.PI * 2
      const sd = csRand() * maxR * 0.5
      const sx = cx + Math.cos(sa) * sd
      const sy = cy + Math.sin(sa) * sd
      const sr = 1.5 + csRand() * 3
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 6)
      glow.addColorStop(0, 'rgba(255,255,255,0.63)')
      glow.addColorStop(0.2, 'rgba(255,255,255,0.21)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(sx, sy, sr * 6, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fill()
    }
  }

  ctx.globalCompositeOperation = 'source-over'
}

function randomizeSettings(seed: number): NebulaSettings {
  const rand = seededRandom(seed)
  const shapes: NebulaSettings['shape'][] = ['cloud', 'ring', 'bipolar', 'irregular']
  return {
    color1: defaults.color1,
    color2: defaults.color2,
    layers: Math.floor(3 + rand() * 12),
    spread: 0.3 + rand() * 0.5,
    turbulence: rand() * 0.8,
    starDensity: rand() * 0.7 + 0.2,
    shape: shapes[Math.floor(rand() * shapes.length)],
  }
}

export default function NebulaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(42)
  const [settings, setSettings] = useState<NebulaSettings>(defaults)

  const render = useCallback((transparent = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawNebula(ctx, canvas.width, canvas.height, settings, seed, transparent)
  }, [settings, seed])

  useEffect(() => {
    render(false)
  }, [render])

  const randomize = () => {
    const newSeed = Math.floor(Math.random() * 99999)
    setSeed(newSeed)
    setSettings(randomizeSettings(newSeed))
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawNebula(ctx, canvas.width, canvas.height, settings, seed, true)
    const a = document.createElement('a')
    a.download = `nebula-${seed}.png`
    a.href = canvas.toDataURL()
    a.click()
    setTimeout(() => render(false), 50)
  }

  const upd = (key: keyof NebulaSettings, val: NebulaSettings[keyof NebulaSettings]) =>
    setSettings(p => ({ ...p, [key]: val }))

  return (
    <div className="relative min-h-screen overflow-auto">
      <div className="absolute inset-0 bg-stars"></div>
      <div className="relative z-10">
        <aside className="panel" />

        <section className="canvas-area">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} width={640} height={480} />
          </div>
          <div className="canvas-toolbar">
            <div className="toolbar-colors">
              <input type="color" value={settings.color1} onChange={e => upd('color1', e.target.value)} title="Primary" />
              <input type="color" value={settings.color2} onChange={e => upd('color2', e.target.value)} title="Secondary" />
            </div>
            <div className="toolbar-buttons">
              <button className="btn btn-ghost" onClick={randomize}>⟳ Randomize</button>
              <button className="btn btn-primary" onClick={download}>↓ Export PNG</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}