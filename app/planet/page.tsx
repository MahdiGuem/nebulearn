'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

interface PlanetSettings {
  radius: number
  baseColor: string
  glowColor: string
  textureType: 'rocky' | 'gasGiant' | 'ocean' | 'ice' | 'lava' | 'desert' | 'alien'
  hasRing: boolean
  hasMoon: boolean
  surfaceDetail: number
}

const defaults: PlanetSettings = {
  radius: 140,
  baseColor: '#3b82f6',
  glowColor: '#60a5fa',
  textureType: 'ocean',
  hasRing: false,
  hasMoon: false,
  surfaceDetail: 0.6,
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hexToRgb(hex: string) {
  const h = hex?.startsWith('#') ? hex : '#3b82f6'
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return {
    r: isNaN(r) ? 59 : r,
    g: isNaN(g) ? 130 : g,
    b: isNaN(b) ? 246 : b,
  }
}

function lerpColor(c1: string, c2: string, t: number) {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  return `rgb(${Math.round(a.r+(b.r-a.r)*t)},${Math.round(a.g+(b.g-a.g)*t)},${Math.round(a.b+(b.b-a.b)*t)})`
}

function drawPlanet(ctx: CanvasRenderingContext2D, w: number, h: number, s: PlanetSettings, seed: number, transparent = false) {
  ctx.clearRect(0, 0, w, h)

  if (!transparent) {
    const bg = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*0.8)
    bg.addColorStop(0, '#060215')
    bg.addColorStop(1, '#010008')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    const rng = seededRand(8472)
    for (let i = 0; i < 250; i++) {
      const sx = rng() * w, sy = rng() * h
      const sr = rng() * 1.3, sb = rng()
      ctx.beginPath()
      ctx.arc(sx,sy,sr,0,Math.PI*2)
      ctx.fillStyle = `rgba(255,255,255,${0.2+sb*0.6})`
      ctx.fill()
    }
  }

  const cx = w/2, cy = h/2
  const R = s.radius

  const lx = 1, ly = -0.6

  if (s.hasRing) {
    drawRing(ctx, cx, cy, R, s, false)
  }

  if (s.hasMoon) {
    const mAngle = 0
    const mDist = R * 2.4
    const mx = cx + Math.cos(mAngle) * mDist
    const my = cy + Math.sin(mAngle) * mDist * 0.4
    drawMoonBody(ctx, mx, my, 28, '#9ca3af', lx, ly)
  }

  if (s.glowColor) {
    const gc = hexToRgb(s.glowColor)
    const glowR = R * 1.65
    const glow = ctx.createRadialGradient(cx, cy, R*0.95, cx, cy, glowR)
    glow.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},0.35)`)
    glow.addColorStop(0.5, `rgba(${gc.r},${gc.g},${gc.b},0.1)`)
    glow.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`)
    ctx.beginPath()
    ctx.arc(cx, cy, glowR, 0, Math.PI*2)
    ctx.fillStyle = glow
    ctx.fill()
  }

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI*2)
  ctx.clip()

  drawSurface(ctx, cx, cy, R, s, seed)

  const shadowX = cx - lx * R * 0.3
  const shadowGrad = ctx.createRadialGradient(shadowX, cy, R*0.1, shadowX, cy, R*1.4)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)')
  shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = shadowGrad
  ctx.fillRect(cx-R, cy-R, R*2, R*2)

  const specGrad = ctx.createRadialGradient(
    cx + lx*R*0.45, cy - R*0.35, R*0.05,
    cx + lx*R*0.45, cy - R*0.35, R*0.55
  )
  specGrad.addColorStop(0, 'rgba(255,255,255,0.18)')
  specGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = specGrad
  ctx.fillRect(cx-R, cy-R, R*2, R*2)

  ctx.restore()

  if (s.hasRing) {
    drawRing(ctx, cx, cy, R, s, true)
  }
}

function drawSurface(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, s: PlanetSettings, seed: number) {
  const { textureType, baseColor, surfaceDetail } = s
  const rng = seededRand(seed)

  const accentColor = hexToRgb(baseColor)
  const accentStr = `rgb(${Math.min(255, accentColor.r + 30)},${Math.min(255, accentColor.g + 30)},${Math.min(255, accentColor.b + 30)})`

  if (textureType === 'gasGiant') {
    const bandCount = Math.floor(6 + surfaceDetail * 10)
    for (let b = 0; b < bandCount; b++) {
      const by = cy - R + (b / bandCount) * R * 2
      const bh = (R * 2) / bandCount
      const bl = b / bandCount
      const col = lerpColor(baseColor, accentStr, (Math.sin(bl * Math.PI * 3 + rng()) + 1) / 2)
      ctx.fillStyle = col
      ctx.fillRect(cx-R, by, R*2, bh + 1)
    }
  } else if (textureType === 'ocean') {
    const oceanGrad = ctx.createRadialGradient(cx-R*0.2,cy-R*0.2,0,cx,cy,R)
    oceanGrad.addColorStop(0, lerpColor(baseColor, '#ffffff', 0.2))
    oceanGrad.addColorStop(0.6, baseColor)
    oceanGrad.addColorStop(1, lerpColor(baseColor, '#000000', 0.4))
    ctx.fillStyle = oceanGrad
    ctx.fillRect(cx-R, cy-R, R*2, R*2)
    const crng = seededRand(seed + 77)
    const contCount = Math.floor(2 + surfaceDetail * 5)
    for (let c = 0; c < contCount; c++) {
      const angle = crng() * Math.PI * 2
      const dist = crng() * R * 0.55
      const lx2 = cx + Math.cos(angle) * dist
      const ly2 = cy + Math.sin(angle) * dist * 0.8
      const lr = R * (0.1 + crng() * 0.25)
      const contGrad = ctx.createRadialGradient(lx2, ly2, 0, lx2, ly2, lr)
      contGrad.addColorStop(0, accentStr)
      contGrad.addColorStop(0.6, lerpColor(baseColor, accentStr, 0.5))
      contGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(lx2, ly2, lr, 0, Math.PI*2)
      ctx.fillStyle = contGrad
      ctx.fill()
    }
  } else if (textureType === 'rocky') {
    const base = ctx.createRadialGradient(cx-R*0.1, cy-R*0.2, 0, cx, cy, R)
    base.addColorStop(0, lerpColor(baseColor, '#ffffff', 0.15))
    base.addColorStop(1, lerpColor(baseColor, '#000000', 0.3))
    ctx.fillStyle = base
    ctx.fillRect(cx-R, cy-R, R*2, R*2)
    const crng = seededRand(seed + 999)
    const craterCount = Math.floor(4 + surfaceDetail * 14)
    for (let c = 0; c < craterCount; c++) {
      const angle = crng() * Math.PI * 2
      const dist = crng() * R * 0.8
      const lx2 = cx + Math.cos(angle) * dist
      const ly2 = cy + Math.sin(angle) * dist
      const cr = R * (0.03 + crng() * 0.12)
      ctx.strokeStyle = `rgba(0,0,0,${0.2 + crng() * 0.3})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(lx2, ly2, cr, 0, Math.PI*2)
      ctx.stroke()
      const cg = ctx.createRadialGradient(lx2, ly2, 0, lx2, ly2, cr)
      cg.addColorStop(0, `rgba(0,0,0,0.25)`)
      cg.addColorStop(0.7, `rgba(0,0,0,0.05)`)
      cg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = cg
      ctx.fill()
    }
  } else if (textureType === 'lava') {
    const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
    base.addColorStop(0, '#1a0500')
    base.addColorStop(1, '#0d0200')
    ctx.fillStyle = base
    ctx.fillRect(cx-R, cy-R, R*2, R*2)
    const lrng = seededRand(seed + 4321)
    const fissures = Math.floor(5 + surfaceDetail * 15)
    for (let f = 0; f < fissures; f++) {
      const fa = lrng() * Math.PI * 2
      const fr = lrng() * R * 0.9
      const fx = cx + Math.cos(fa) * fr
      const fy = cy + Math.sin(fa) * fr
      const fs = R * (0.04 + lrng() * 0.1)
      const flare = ctx.createRadialGradient(fx, fy, 0, fx, fy, fs)
      flare.addColorStop(0, 'rgba(255,150,0,0.9)')
      flare.addColorStop(0.4, 'rgba(255,60,0,0.4)')
      flare.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(fx, fy, fs, 0, Math.PI*2)
      ctx.fillStyle = flare
      ctx.fill()
    }
  } else if (textureType === 'ice') {
    const base = ctx.createRadialGradient(cx-R*0.2, cy-R*0.3, 0, cx, cy, R)
    base.addColorStop(0, lerpColor('#ffffff', baseColor, 0.2))
    base.addColorStop(0.6, lerpColor(baseColor, '#c0e8ff', 0.5))
    base.addColorStop(1, lerpColor(baseColor, '#000000', 0.2))
    ctx.fillStyle = base
    ctx.fillRect(cx-R, cy-R, R*2, R*2)
    const irng = seededRand(seed + 654)
    const crackCount = Math.floor(3 + surfaceDetail * 12)
    for (let c = 0; c < crackCount; c++) {
      const a = irng() * Math.PI * 2
      const d = irng() * R * 0.7
      const x1 = cx + Math.cos(a) * d
      const y1 = cy + Math.sin(a) * d
      const len = 30 + irng() * 60
      const x2 = x1 + Math.cos(a + irng() * 0.5) * len
      const y2 = y1 + Math.sin(a + irng() * 0.5) * len
      ctx.strokeStyle = `rgba(100,180,255,${0.3 + irng() * 0.4})`
      ctx.lineWidth = 0.5 + irng() * 1.5
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  } else if (textureType === 'desert') {
    const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
    base.addColorStop(0, lerpColor(baseColor, '#ffffff', 0.3))
    base.addColorStop(0.5, baseColor)
    base.addColorStop(1, lerpColor(baseColor, '#000000', 0.4))
    ctx.fillStyle = base
    ctx.fillRect(cx-R, cy-R, R*2, R*2)
    const drng = seededRand(seed + 1357)
    const duneCount = Math.floor(6 + surfaceDetail * 18)
    for (let d = 0; d < duneCount; d++) {
      const dy = cy - R + drng() * R * 2
      const dx = cx + (drng()-0.5) * R * 1.5
      const dw = 40 + drng() * 80
      const dh = 3 + drng() * 8
      ctx.fillStyle = `rgba(0,0,0,${0.05 + drng() * 0.15})`
      ctx.beginPath()
      ctx.ellipse(dx, dy, dw, dh, drng(), 0, Math.PI*2)
      ctx.fill()
    }
  } else {
    const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
    base.addColorStop(0, lerpColor(baseColor, '#ffffff', 0.25))
    base.addColorStop(0.7, baseColor)
    base.addColorStop(1, lerpColor(baseColor, '#000000', 0.5))
    ctx.fillStyle = base
    ctx.fillRect(cx-R, cy-R, R*2, R*2)
    const arng = seededRand(seed + 2468)
    const patchCount = Math.floor(4 + surfaceDetail * 12)
    for (let p = 0; p < patchCount; p++) {
      const pa = arng() * Math.PI * 2
      const pd = arng() * R * 0.75
      const px = cx + Math.cos(pa) * pd
      const py = cy + Math.sin(pa) * pd
      const pr = R * (0.08 + arng() * 0.2)
      const pg = ctx.createRadialGradient(px, py, 0, px, py, pr)
      pg.addColorStop(0, `rgba(${accentColor.r},${accentColor.g},${accentColor.b},0.7)`)
      pg.addColorStop(0.5, `rgba(${accentColor.r},${accentColor.g},${accentColor.b},0.3)`)
      pg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI*2)
      ctx.fillStyle = pg
      ctx.fill()
    }
  }
}

function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, s: PlanetSettings, front: boolean) {
  const rc = hexToRgb('#c8b86a')
  const innerR = R * 1.45
  const outerR = R * 2.2
  const tilt = 0.3

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, tilt)

  const ringGrad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR)
  ringGrad.addColorStop(0, `rgba(${rc.r},${rc.g},${rc.b},0)`)
  ringGrad.addColorStop(0.1, `rgba(${rc.r},${rc.g},${rc.b},0.56)`)
  ringGrad.addColorStop(0.4, `rgba(${rc.r},${rc.g},${rc.b},0.7)`)
  ringGrad.addColorStop(0.65, `rgba(${rc.r},${rc.g},${rc.b},0.42)`)
  ringGrad.addColorStop(0.8, `rgba(${rc.r},${rc.g},${rc.b},0.21)`)
  ringGrad.addColorStop(1, `rgba(${rc.r},${rc.g},${rc.b},0)`)

  ctx.beginPath()
  ctx.arc(0, 0, outerR, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
  ctx.arc(0, 0, innerR, front ? Math.PI : Math.PI * 2, front ? 0 : Math.PI, true)
  ctx.closePath()

  ctx.fillStyle = ringGrad
  ctx.fill()

  const gapR = innerR + (outerR - innerR) * 0.45
  ctx.beginPath()
  ctx.arc(0, 0, gapR + 2, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
  ctx.arc(0, 0, gapR - 2, front ? Math.PI : Math.PI * 2, front ? 0 : Math.PI, true)
  ctx.closePath()
  ctx.fillStyle = 'rgba(0,0,0,0.245)'
  ctx.fill()

  ctx.restore()
}

function drawMoonBody(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, lx: number, ly: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI*2)
  ctx.clip()
  const base = ctx.createRadialGradient(x-r*0.2, y-r*0.3, 0, x, y, r)
  const c = hexToRgb(color)
  base.addColorStop(0, `rgb(${Math.min(255,c.r+30)},${Math.min(255,c.g+30)},${Math.min(255,c.b+30)})`)
  base.addColorStop(1, `rgb(${Math.floor(c.r*0.4)},${Math.floor(c.g*0.4)},${Math.floor(c.b*0.4)})`)
  ctx.fillStyle = base
  ctx.fillRect(x-r, y-r, r*2, r*2)
  const shadowGrad = ctx.createRadialGradient(x-lx*r*0.3, y-ly*r*0.3, r*0.1, x-lx*r*0.3, y, r*1.4)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)')
  shadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.2)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = shadowGrad
  ctx.fillRect(x-r, y-r, r*2, r*2)
  ctx.restore()
}

function randomizeSettings(seed: number): PlanetSettings {
  const rand = seededRand(seed)
  const textures: PlanetSettings['textureType'][] = ['ocean', 'gasGiant', 'rocky', 'desert', 'lava', 'ice', 'alien']
  return {
    radius: 100 + Math.floor(rand() * 80),
    baseColor: defaults.baseColor,
    glowColor: defaults.glowColor,
    textureType: textures[Math.floor(rand() * textures.length)],
    hasRing: rand() > 0.7,
    hasMoon: rand() > 0.7,
    surfaceDetail: 0.3 + rand() * 0.5,
  }
}

export default function PlanetPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [seed, setSeed] = useState(42)
  const [settings, setSettings] = useState<PlanetSettings>(defaults)

  const render = useCallback((transparent = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawPlanet(ctx, canvas.width, canvas.height, settings, seed, transparent)
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
    drawPlanet(ctx, canvas.width, canvas.height, settings, seed, true)
    const a = document.createElement('a')
    a.download = `planet-${seed}.png`
    a.href = canvas.toDataURL()
    a.click()
    setTimeout(() => render(false), 50)
  }

  const upd = (key: keyof PlanetSettings, val: PlanetSettings[keyof PlanetSettings]) =>
    setSettings(p => ({ ...p, [key]: val }))

  return (
    <main className="page">
      <aside className="panel" />

      <section className="canvas-area">
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={640} height={480} />
        </div>
        <div className="canvas-toolbar">
          <div className="toolbar-colors">
            <input type="color" value={settings.baseColor} onChange={e => upd('baseColor', e.target.value)} title="Planet" />
            <input type="color" value={settings.glowColor} onChange={e => upd('glowColor', e.target.value)} title="Glow" />
          </div>
          <div className="toolbar-buttons">
            <button className="btn btn-ghost" onClick={randomize}>⟳ Randomize</button>
            <button className="btn btn-primary" onClick={download}>↓ Export PNG</button>
          </div>
        </div>
      </section>
    </main>
  )
}