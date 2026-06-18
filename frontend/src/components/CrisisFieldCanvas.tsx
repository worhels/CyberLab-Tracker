import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { CrisisTask, Subject } from '../types'

interface CrisisFieldCanvasProps {
  tasks: CrisisTask[]
  subjectById: Map<number, Subject>
}

interface Particle {
  x: number
  y: number
  z: number
  restX: number
  restY: number
  restZ: number
  vx: number
  vy: number
  vz: number
  task: CrisisTask
}

interface TaskAnchor {
  task: CrisisTask
  x: number
  y: number
  z: number
}

const HEIGHT = 280

function getPriorityColor(priority: CrisisTask['priority']) {
  if (priority === 'critical') return { r: 200 / 255, g: 80 / 255, b: 80 / 255, alpha: 0.75 }
  if (priority === 'high') return { r: 200 / 255, g: 168 / 255, b: 75 / 255, alpha: 0.65 }
  if (priority === 'medium') return { r: 240 / 255, g: 237 / 255, b: 228 / 255, alpha: 0.35 }
  return { r: 78 / 255, g: 76 / 255, b: 72 / 255, alpha: 0.5 }
}

export function CrisisFieldCanvas({ tasks, subjectById }: CrisisFieldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipTitleRef = useRef<HTMLDivElement>(null)
  const tooltipSubjectRef = useRef<HTMLDivElement>(null)
  const tooltipScoreRef = useRef<HTMLDivElement>(null)
  const tooltipMetaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const tooltip = tooltipRef.current
    const tooltipTitle = tooltipTitleRef.current
    const tooltipSubject = tooltipSubjectRef.current
    const tooltipScore = tooltipScoreRef.current
    const tooltipMeta = tooltipMetaRef.current

    if (!container || !canvas || !tooltip || !tooltipTitle || !tooltipSubject || !tooltipScore || !tooltipMeta) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.offsetWidth, HEIGHT)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, container.offsetWidth / HEIGHT, 0.1, 1000)
    camera.position.set(0, 2.5, 7)
    camera.lookAt(0, 0, 0)

    const maxScore = tasks[0]?.crisis_score || 1
    const particles: Particle[] = []
    const taskAnchors: TaskAnchor[] = []
    const positions: number[] = []
    const colors: number[] = []
    const sizes: number[] = []

    tasks.forEach((task, index) => {
      const ratio = task.crisis_score / maxScore
      const baseX = -5 + (index / (tasks.length - 1 || 1)) * 10
      const peakHeight = ratio * 3.5
      const particlesPerTask = Math.floor(60 + ratio * 140)
      const spreadX = 0.6 + ratio * 0.8
      const priorityColor = getPriorityColor(task.priority)

      taskAnchors.push({
        task,
        x: baseX,
        y: peakHeight,
        z: 0,
      })

      for (let particleIndex = 0; particleIndex < particlesPerTask; particleIndex += 1) {
        const gauss = (Math.random() + Math.random() + Math.random()) / 3
        const px = baseX + (Math.random() - 0.5) * spreadX * 2
        const py = gauss * peakHeight
        const pz = (Math.random() - 0.5) * 1.2
        const size = 0.015 + Math.random() * 0.025

        particles.push({
          x: px,
          y: py,
          z: pz,
          restX: px,
          restY: py,
          restZ: pz,
          vx: 0,
          vy: 0,
          vz: 0,
          task,
        })
        positions.push(px, py, pz)
        colors.push(priorityColor.r * priorityColor.alpha, priorityColor.g * priorityColor.alpha, priorityColor.b * priorityColor.alpha)
        sizes.push(size)
      }
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      sizeAttenuation: true,
      depthWrite: false,
    })

    const field = new THREE.Points(geometry, material)
    scene.add(field)

    const gridPositions: number[] = []
    const xMin = -5.5
    const xMax = 5.5
    const zMin = -1.2
    const zMax = 1.2

    for (let column = 0; column <= 22; column += 1) {
      const x = xMin + (column / 22) * (xMax - xMin)
      gridPositions.push(x, -0.05, zMin, x, -0.05, zMax)
    }

    for (let row = 0; row <= 8; row += 1) {
      const z = zMin + (row / 8) * (zMax - zMin)
      gridPositions.push(xMin, -0.05, z, xMax, -0.05, z)
    }

    const gridGeometry = new THREE.BufferGeometry()
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3))
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x2c2c29, transparent: true, opacity: 0.5 })
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial)
    scene.add(grid)

    const mouse = new THREE.Vector2(9999, 9999)
    const worldMouse = new THREE.Vector3(9999, 9999, 0)
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let animFrameId = 0
    let hasMouse = false

    const updateTooltip = (event: MouseEvent) => {
      let closestAnchor: TaskAnchor | null = null
      let closestDistance = Number.POSITIVE_INFINITY
      const projected = new THREE.Vector3()

      for (const anchor of taskAnchors) {
        projected.set(anchor.x, anchor.y, anchor.z).project(camera)
        const screenX = (projected.x * 0.5 + 0.5) * container.offsetWidth
        const screenY = (-projected.y * 0.5 + 0.5) * HEIGHT
        const dx = screenX - event.offsetX
        const dy = screenY - event.offsetY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < closestDistance) {
          closestDistance = distance
          closestAnchor = anchor
        }
      }

      if (!closestAnchor || closestDistance > 40) {
        tooltip.style.display = 'none'
        return
      }

      tooltipTitle.textContent = closestAnchor.task.title
      tooltipSubject.textContent = subjectById.get(closestAnchor.task.subject_id)?.name || 'Unknown subject'
      tooltipScore.textContent = `Crisis: ${closestAnchor.task.crisis_score}`
      tooltipMeta.textContent = `${closestAnchor.task.priority} - ${closestAnchor.task.status}`

      tooltip.style.display = 'block'
      tooltip.style.left = `${event.offsetX}px`
      tooltip.style.top = `${Math.max(event.offsetY - 90, 8)}px`
    }

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      raycaster.ray.intersectPlane(plane, worldMouse)
      hasMouse = true
      updateTooltip(event)
    }

    const onMouseLeave = () => {
      mouse.set(9999, 9999)
      worldMouse.set(9999, 9999, 0)
      hasMouse = false
      tooltip.style.display = 'none'
    }

    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      const positionAttribute = geometry.attributes.position
      const positionArray = positionAttribute.array

      particles.forEach((particle, index) => {
        if (hasMouse) {
          const dx = particle.x - worldMouse.x
          const dy = particle.y - worldMouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 1.5 && dist > 0) {
            const force = (1 - dist / 1.5) * 0.12
            particle.vx += (dx / dist) * force
            particle.vy += (dy / dist) * force
          }
        }

        particle.vx += (particle.restX - particle.x) * 0.04
        particle.vy += (particle.restY - particle.y) * 0.04
        particle.vz += (particle.restZ - particle.z) * 0.04
        particle.vx *= 0.88
        particle.vy *= 0.88
        particle.vz *= 0.88
        particle.x += particle.vx
        particle.y += particle.vy
        particle.z += particle.vz

        const offset = index * 3
        positionArray[offset] = particle.x
        positionArray[offset + 1] = particle.y
        positionArray[offset + 2] = particle.z
      })

      positionAttribute.needsUpdate = true
      renderer.render(scene, camera)
    }

    const resizeObserver = new ResizeObserver(() => {
      renderer.setSize(container.offsetWidth, HEIGHT)
      camera.aspect = container.offsetWidth / HEIGHT
      camera.updateProjectionMatrix()
    })

    resizeObserver.observe(container)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    animate()

    return () => {
      cancelAnimationFrame(animFrameId)
      resizeObserver.disconnect()
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      geometry.dispose()
      material.dispose()
      gridGeometry.dispose()
      gridMaterial.dispose()
      renderer.dispose()
    }
  }, [tasks])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${HEIGHT}px`,
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          background: 'rgba(26,26,23,0.96)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontFamily: 'inherit',
          position: 'absolute',
          left: '0',
          top: '0',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 10,
          maxWidth: '280px',
        }}
      >
        <div ref={tooltipTitleRef} style={{ fontSize: '13px', fontWeight: 700, color: '#f0ede4', marginBottom: '4px' }} />
        <div ref={tooltipSubjectRef} style={{ fontSize: '11px', color: '#9a9690', marginBottom: '4px' }} />
        <div ref={tooltipScoreRef} style={{ fontSize: '11px', color: '#c85050', fontWeight: 700 }} />
        <div ref={tooltipMetaRef} style={{ fontSize: '10px', color: '#4e4c48', marginTop: '3px' }} />
      </div>
    </div>
  )
}
