import { useEffect, useRef } from 'react'
import type { AuthMode } from './AuthShell'

interface GenerativeMeshVisualProps {
  mode: AuthMode
}

interface Particle {
  x: number
  y: number
  currentX: number
  currentY: number
  size: number
  alpha: number
  phase: number
  speed: number
  drift: number
  twinkle: number
  network: number
}

interface MeshLine {
  offset: number
  phase: number
  alpha: number
  width: number
  amplitude: number
  frequency: number
  verticalShift: number
}

interface NetworkEdge {
  from: Particle
  to: Particle
  alpha: number
}

interface MicroTextBlock {
  x: number
  y: number
  align: CanvasTextAlign
  alpha: number
  lines: string[]
}

interface SceneData {
  particles: Particle[]
  meshLines: MeshLine[]
  edges: NetworkEdge[]
  labels: MicroTextBlock[]
}

const MICRO_COPY = [
  'VECTOR FIELD / STUDY LOAD',
  'DEADLINE INDEX 04.17',
  'LAB QUEUE ACTIVE',
  'CRISIS SORT / SIGNAL MAP',
  'SUBJECT NODES NORMALIZED',
  'PRIORITY WEIGHT MATRIX',
  'TASK STREAM COMPRESSION',
  'ACADEMIC DEBT WATCH',
  'REPORT LINK RESOLVER',
  'WIRE CACHE 0110 1011',
] as const

function createRandom(seed: number) {
  let value = seed
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function bell(value: number, center: number, spread: number) {
  const distance = (value - center) / spread
  return Math.exp(-distance * distance)
}

function shapeCenterX(t: number, width: number, mode: AuthMode) {
  const registerShift = mode === 'register' ? -0.018 : 0
  return (
    width *
    (0.44 +
      registerShift +
      Math.sin(t * Math.PI * 2.2 + 0.42) * 0.055 +
      Math.sin(t * Math.PI * 5.8 + 1.7) * 0.024)
  )
}

function shapeRadiusX(t: number, width: number) {
  const torso = bell(t, 0.48, 0.31)
  const lower = bell(t, 0.78, 0.18)
  const crown = bell(t, 0.15, 0.14)
  return width * (0.05 + torso * 0.18 + lower * 0.115 + crown * 0.075)
}

function shapeY(t: number, height: number) {
  return height * (0.035 + t * 0.92)
}

function makeMicroLabels(width: number, height: number): MicroTextBlock[] {
  return [
    {
      x: width * 0.085,
      y: height * 0.47,
      align: 'left',
      alpha: 0.36,
      lines: [
        'CYBERLAB TRACKER',
        'LOAD: LABS / PRACTICE / EXAM',
        'MODEL: DEADLINE FIELD',
        'STATUS: NOT STARTED / DEBT',
        'SORT: CRISIS SCORE DESC',
        'HASH 8F-11-C0-A2',
      ],
    },
    {
      x: width * 0.83,
      y: height * 0.42,
      align: 'right',
      alpha: 0.26,
      lines: [
        'TASK VECTOR SNAPSHOT',
        'ACCEPTED 00.42',
        'SUBMITTED 00.18',
        'OVERDUE 00.09',
        'PRIORITY HIGH 00.31',
      ],
    },
    {
      x: width * 0.12,
      y: height * 0.93,
      align: 'left',
      alpha: 0.25,
      lines: ['NOCTURNE FIELD', 'MOTION REDUCED READY'],
    },
  ]
}

function buildScene(width: number, height: number, mode: AuthMode, reducedMotion: boolean): SceneData {
  const seed = Math.floor(width * 17 + height * 31 + (mode === 'register' ? 9721 : 4127))
  const random = createRandom(seed)
  const area = width * height
  const cores = navigator.hardwareConcurrency || 8
  const weakDeviceFactor = cores <= 4 ? 0.64 : cores <= 6 ? 0.82 : 1
  const densityFactor = width < 760 ? 0.54 : width < 1100 ? 0.76 : 1
  const motionFactor = reducedMotion ? 0.72 : 1
  const particleCount = Math.floor(clamp(area / 260, 1500, 5200) * weakDeviceFactor * densityFactor * motionFactor)
  const lineCount = Math.floor(clamp(width / 4.6, 128, 240) * densityFactor)
  const particles: Particle[] = []
  const meshLines: MeshLine[] = []

  for (let index = 0; index < particleCount; index += 1) {
    const bandPick = random()
    const t =
      bandPick < 0.46
        ? clamp(0.26 + (random() - 0.5) * 0.52, 0, 1)
        : bandPick < 0.76
          ? clamp(0.68 + (random() - 0.5) * 0.34, 0, 1)
          : random()
    const angle = random() * Math.PI * 2
    const radial = Math.pow(random(), 0.62)
    const centerX = shapeCenterX(t, width, mode)
    const radiusX = shapeRadiusX(t, width)
    const verticalPull = height * (0.012 + bell(t, 0.78, 0.18) * 0.028)
    const x =
      centerX +
      Math.cos(angle) * radiusX * radial +
      Math.sin(t * 19 + random() * 4) * width * 0.012 +
      (random() - 0.5) * width * 0.018
    const y =
      shapeY(t, height) +
      Math.sin(angle) * verticalPull * radial +
      Math.sin(t * 12 + random() * 6) * height * 0.006
    const coreAlpha = 0.24 + bell(t, 0.38, 0.34) * 0.46 + bell(t, 0.76, 0.2) * 0.34
    const highlight = random() > 0.86 ? 0.32 : 0
    const size = random() > 0.955 ? 1.55 + random() * 1.7 : 0.44 + random() * 1.08

    particles.push({
      x,
      y,
      currentX: x,
      currentY: y,
      size,
      alpha: clamp(coreAlpha + highlight + random() * 0.22, 0.12, 0.92),
      phase: random() * Math.PI * 2,
      speed: 0.18 + random() * 0.62,
      drift: 0.42 + random() * 1.95,
      twinkle: 0.18 + random() * 0.72,
      network: t > 0.28 && random() > (t > 0.64 ? 0.68 : 0.82) ? 1 : 0,
    })
  }

  const ambientDust = Math.floor(particleCount * 0.16)
  for (let index = 0; index < ambientDust; index += 1) {
    const x = random() * width * 0.92
    const y = random() * height
    particles.push({
      x,
      y,
      currentX: x,
      currentY: y,
      size: 0.28 + random() * 0.78,
      alpha: 0.035 + random() * 0.16,
      phase: random() * Math.PI * 2,
      speed: 0.08 + random() * 0.22,
      drift: 0.28 + random() * 0.82,
      twinkle: 0.12 + random() * 0.28,
      network: 0,
    })
  }

  for (let index = 0; index < lineCount; index += 1) {
    meshLines.push({
      offset: (index / Math.max(1, lineCount - 1) - 0.5) * 2,
      phase: random() * Math.PI * 2,
      alpha: 0.075 + random() * 0.2,
      width: 0.18 + random() * 0.5,
      amplitude: 0.24 + random() * 0.92,
      frequency: 1.7 + random() * 3.8,
      verticalShift: (random() - 0.5) * 0.09,
    })
  }

  const networkCandidates = particles.filter((particle) => particle.network > 0).slice(0, width < 760 ? 240 : 470)
  const edges: NetworkEdge[] = []
  const maxDistance = Math.min(width, height) * (width < 760 ? 0.082 : 0.066)
  const maxEdges = width < 760 ? 680 : 1900

  for (let start = 0; start < networkCandidates.length; start += 1) {
    const from = networkCandidates[start]
    for (let end = start + 1; end < networkCandidates.length && edges.length < maxEdges; end += 1) {
      const to = networkCandidates[end]
      const dx = from.x - to.x
      const dy = from.y - to.y
      const distance = Math.hypot(dx, dy)
      if (distance < maxDistance && random() > 0.48) {
        edges.push({
          from,
          to,
          alpha: clamp(1 - distance / maxDistance, 0.04, 0.46) * (0.28 + random() * 0.62),
        })
      }
    }
  }

  return {
    particles,
    meshLines,
    edges,
    labels: makeMicroLabels(width, height),
  }
}

function drawBase(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = '#0B0A07'
  ctx.fillRect(0, 0, width, height)

  const field = ctx.createLinearGradient(0, 0, width, 0)
  field.addColorStop(0, '#151411')
  field.addColorStop(0.34, '#1D1C19')
  field.addColorStop(0.64, '#0B0A07')
  field.addColorStop(1, '#020201')
  ctx.fillStyle = field
  ctx.fillRect(0, 0, width, height)

  const leftMist = ctx.createRadialGradient(width * 0.1, height * 0.42, 0, width * 0.1, height * 0.42, width * 0.82)
  leftMist.addColorStop(0, 'rgba(242,240,234,0.32)')
  leftMist.addColorStop(0.34, 'rgba(141,138,132,0.2)')
  leftMist.addColorStop(0.68, 'rgba(21,20,17,0.04)')
  leftMist.addColorStop(1, 'rgba(11,10,7,0)')
  ctx.fillStyle = leftMist
  ctx.fillRect(0, 0, width, height)

  const bodyFog = ctx.createRadialGradient(width * 0.4, height * 0.45, 0, width * 0.4, height * 0.45, width * 0.44)
  bodyFog.addColorStop(0, 'rgba(245,245,245,0.18)')
  bodyFog.addColorStop(0.52, 'rgba(69,68,65,0.16)')
  bodyFog.addColorStop(1, 'rgba(11,10,7,0)')
  ctx.fillStyle = bodyFog
  ctx.fillRect(0, 0, width, height)

  const rightDark = ctx.createLinearGradient(width * 0.56, 0, width, 0)
  rightDark.addColorStop(0, 'rgba(11,10,7,0)')
  rightDark.addColorStop(0.62, 'rgba(0,0,0,0.42)')
  rightDark.addColorStop(1, 'rgba(0,0,0,0.86)')
  ctx.fillStyle = rightDark
  ctx.fillRect(0, 0, width, height)
}

function drawMesh(ctx: CanvasRenderingContext2D, scene: SceneData, width: number, height: number, time: number, mode: AuthMode) {
  ctx.globalCompositeOperation = 'screen'
  ctx.lineCap = 'round'

  for (let index = 0; index < scene.meshLines.length; index += 1) {
    const line = scene.meshLines[index]
    const registerBias = mode === 'register' ? -0.022 : 0
    const phase = line.phase + time * 0.11
    const steps = 72
    ctx.beginPath()

    for (let step = 0; step <= steps; step += 1) {
      const rawT = step / steps
      const t = clamp(rawT + line.verticalShift * 0.18, 0, 1)
      const center = shapeCenterX(t, width, mode)
      const radius = shapeRadiusX(t, width) * (0.74 + line.amplitude * 0.42)
      const helix = Math.sin(t * Math.PI * line.frequency + phase) * radius * 0.62
      const rib = line.offset * radius * (0.62 + Math.sin(t * Math.PI * 2 + phase) * 0.24)
      const wave = Math.sin(t * Math.PI * 9.2 + phase * 0.7) * width * 0.006
      const x = center + rib + helix * 0.2 + wave + width * registerBias
      const y = shapeY(t, height) + Math.sin(t * Math.PI * 4 + phase) * height * 0.008

      if (step === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    const brightBand = 0.7 + Math.sin(line.offset * Math.PI * 1.8 + time * 0.16) * 0.18
    ctx.globalAlpha = line.alpha * brightBand
    ctx.lineWidth = line.width
    ctx.strokeStyle = 'rgba(245,245,245,0.86)'
    ctx.stroke()
  }

  const waveCount = 38
  for (let index = 0; index < waveCount; index += 1) {
    const yBase = height * (0.16 + index * 0.008)
    const amplitude = height * (0.012 + index * 0.0009)
    ctx.beginPath()
    for (let step = 0; step <= 80; step += 1) {
      const x = width * (0.12 + step / 80 * 0.58)
      const t = step / 80
      const y = yBase + Math.sin(t * Math.PI * 3.8 + index * 0.18 + time * 0.1) * amplitude
      if (step === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.globalAlpha = 0.052 + index * 0.0025
    ctx.lineWidth = 0.28
    ctx.strokeStyle = 'rgba(245,245,245,0.78)'
    ctx.stroke()
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, scene: SceneData, time: number) {
  ctx.globalCompositeOperation = 'screen'

  for (let index = 0; index < scene.particles.length; index += 1) {
    const particle = scene.particles[index]
    const driftX = Math.sin(time * particle.speed + particle.phase) * particle.drift
    const driftY = Math.cos(time * particle.speed * 0.72 + particle.phase * 1.31) * particle.drift * 0.38
    const pulse = 0.72 + Math.sin(time * particle.twinkle + particle.phase) * 0.16
    particle.currentX = particle.x + driftX
    particle.currentY = particle.y + driftY

    ctx.globalAlpha = clamp(particle.alpha * pulse, 0.035, 0.96)
    ctx.fillStyle = 'rgba(245,245,245,0.9)'
    ctx.beginPath()
    ctx.arc(particle.currentX, particle.currentY, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawNetwork(ctx: CanvasRenderingContext2D, scene: SceneData, time: number) {
  ctx.globalCompositeOperation = 'screen'
  ctx.lineCap = 'round'
  ctx.lineWidth = 0.32
  ctx.strokeStyle = 'rgba(245,245,245,0.68)'

  for (let index = 0; index < scene.edges.length; index += 1) {
    const edge = scene.edges[index]
    const shimmer = 0.72 + Math.sin(time * 0.9 + index * 0.37) * 0.14
    ctx.globalAlpha = edge.alpha * shimmer
    ctx.beginPath()
    ctx.moveTo(edge.from.currentX, edge.from.currentY)
    ctx.lineTo(edge.to.currentX, edge.to.currentY)
    ctx.stroke()
  }
}

function drawMicroText(ctx: CanvasRenderingContext2D, scene: SceneData, width: number, height: number, time: number) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  ctx.fillStyle = 'rgba(242,240,234,0.72)'
  ctx.strokeStyle = 'rgba(242,240,234,0.2)'
  ctx.lineWidth = 0.35

  for (let blockIndex = 0; blockIndex < scene.labels.length; blockIndex += 1) {
    const block = scene.labels[blockIndex]
    ctx.textAlign = block.align
    ctx.globalAlpha = block.alpha

    for (let lineIndex = 0; lineIndex < block.lines.length; lineIndex += 1) {
      ctx.fillText(block.lines[lineIndex], block.x, block.y + lineIndex * 13)
    }

    const rulerStart = block.align === 'right' ? block.x - width * 0.14 : block.x
    const rulerEnd = block.align === 'right' ? block.x : block.x + width * 0.14
    ctx.globalAlpha = block.alpha * 0.46
    ctx.beginPath()
    ctx.moveTo(rulerStart, block.y - 12)
    ctx.lineTo(rulerEnd, block.y - 12)
    ctx.stroke()
  }

  ctx.textAlign = 'left'
  ctx.globalAlpha = 0.13
  for (let index = 0; index < MICRO_COPY.length; index += 1) {
    const x = width * (0.63 + (index % 2) * 0.055)
    const y = height * 0.62 + index * 17 + Math.sin(time * 0.15 + index) * 1.4
    ctx.fillText(MICRO_COPY[index], x, y)
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  const topBottom = ctx.createLinearGradient(0, 0, 0, height)
  topBottom.addColorStop(0, 'rgba(11,10,7,0.6)')
  topBottom.addColorStop(0.16, 'rgba(11,10,7,0)')
  topBottom.addColorStop(0.8, 'rgba(11,10,7,0)')
  topBottom.addColorStop(1, 'rgba(11,10,7,0.72)')
  ctx.fillStyle = topBottom
  ctx.fillRect(0, 0, width, height)

  const grain = ctx.createLinearGradient(0, 0, width, height)
  grain.addColorStop(0, 'rgba(245,245,245,0.018)')
  grain.addColorStop(0.5, 'rgba(0,0,0,0.02)')
  grain.addColorStop(1, 'rgba(245,245,245,0.012)')
  ctx.fillStyle = grain
  ctx.fillRect(0, 0, width, height)
}

export function GenerativeMeshVisual({ mode }: GenerativeMeshVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return undefined

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionMedia.matches
    let width = 0
    let height = 0
    let scene = buildScene(1, 1, mode, reducedMotion)
    let animationFrame = 0
    let lastTime = performance.now()
    let elapsed = 0

    const drawFrame = () => {
      drawBase(context, width, height)
      drawMesh(context, scene, width, height, elapsed, mode)
      drawParticles(context, scene, elapsed)
      drawNetwork(context, scene, elapsed)
      drawMicroText(context, scene, width, height, elapsed)
      drawVignette(context, width, height)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const nextWidth = Math.max(1, rect.width)
      const nextHeight = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      width = nextWidth
      height = nextHeight
      canvas.width = Math.floor(nextWidth * dpr)
      canvas.height = Math.floor(nextHeight * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene = buildScene(width, height, mode, reducedMotion)
      elapsed = 0
      drawFrame()
    }

    const stop = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }
    }

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      elapsed += delta
      drawFrame()
      animationFrame = requestAnimationFrame(tick)
    }

    const start = () => {
      stop()
      if (reducedMotion) {
        drawFrame()
        return
      }
      lastTime = performance.now()
      animationFrame = requestAnimationFrame(tick)
    }

    const handleMotionChange = () => {
      reducedMotion = motionMedia.matches
      resize()
      start()
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      start()
    })

    resizeObserver.observe(canvas)
    motionMedia.addEventListener('change', handleMotionChange)
    resize()
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      motionMedia.removeEventListener('change', handleMotionChange)
    }
  }, [mode])

  return <canvas ref={canvasRef} className="generative-mesh-canvas" />
}
