import { useEffect, useRef } from 'react'
import type { AuthMode } from './AuthShell'

interface AuthVisualBackgroundProps {
  mode: AuthMode
}

interface NoiseParticle {
  x: number
  y: number
  size: number
  alpha: number
  phase: number
  speed: number
}

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

function buildNoise(width: number, height: number) {
  const random = createRandom(Math.floor(width * 13 + height * 29))
  const count = Math.floor(clamp((width * height) / 21000, 42, 120))
  const particles: NoiseParticle[] = []

  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: random() * width,
      y: random() * height,
      size: 0.35 + random() * 0.9,
      alpha: 0.025 + random() * 0.07,
      phase: random() * Math.PI * 2,
      speed: 0.18 + random() * 0.46,
    })
  }

  return particles
}

export function AuthVisualBackground({ mode }: AuthVisualBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const preload = document.createElement('link')
    preload.rel = 'preload'
    preload.as = 'image'
    preload.href = '/assets/auth-mesh-reference.jpg'
    document.head.appendChild(preload)

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return () => preload.remove()

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionMedia.matches
    let animationFrame = 0
    let width = 1
    let height = 1
    let elapsed = 0
    let lastTime = performance.now()
    let particles = buildNoise(width, height)

    const draw = () => {
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'source-over'

      const scanOffset = reducedMotion ? 0 : (elapsed * 12) % 6
      context.fillStyle = 'rgba(242,240,234,0.022)'
      for (let y = scanOffset; y < height; y += 6) {
        context.fillRect(0, y, width, 0.55)
      }

      context.globalCompositeOperation = 'screen'
      context.fillStyle = 'rgba(245,245,245,0.9)'
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]
        const pulse = reducedMotion ? 0.72 : 0.64 + Math.sin(elapsed * particle.speed + particle.phase) * 0.22
        context.globalAlpha = particle.alpha * pulse
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = buildNoise(width, height)
      draw()
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
      draw()
      animationFrame = requestAnimationFrame(tick)
    }

    const start = () => {
      stop()
      if (reducedMotion) {
        draw()
        return
      }
      lastTime = performance.now()
      animationFrame = requestAnimationFrame(tick)
    }

    const handleMotionChange = () => {
      reducedMotion = motionMedia.matches
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
      preload.remove()
    }
  }, [])

  return (
    <div className={`auth-visual-bg auth-visual-bg--${mode}`}>
      <div className="auth-reference-layer" />
      <div className="auth-left-haze" />
      <div className="auth-right-fade" />
      <div className="auth-bottom-vignette" />
      <div className="auth-film-grain" />
      <canvas ref={canvasRef} className="auth-visual-fx-canvas" />
    </div>
  )
}
