import { useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Subject, Task } from '../../types'
import { WORKLOAD_SPHERE_CONFIG, WorkloadOrbitSphere } from './WorkloadOrbitSphere'
import { WorkloadSubjectCard } from './WorkloadSubjectCard'
import type { WorkloadHotspotPalette } from './WorkloadHotspotPoint'
import { createWorkloadHotspots } from './workloadHotspotData'
import type { WorkloadHotspot } from './workloadHotspotData'

interface WorkloadSphereCanvasProps {
  tasks: Task[]
  subjects: Subject[]
  className?: string
}

const defaultHotspotPalette: WorkloadHotspotPalette = {
  empty: '#5e5a52',
  active: '#d8d2c7',
  warning: '#bd8b5e',
  critical: '#c27a59',
  done: '#8d9b86',
  selected: '#d69a68',
  particleCore: '#d8d2c7',
  particleShell: '#f0ede4',
}

function readThemeColor(name: string, fallback: string) {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function useWorkloadHotspotPalette() {
  const [palette, setPalette] = useState<WorkloadHotspotPalette>(defaultHotspotPalette)

  useEffect(() => {
    const updatePalette = () => {
      setPalette({
        empty: readThemeColor('--workload-hotspot-empty', defaultHotspotPalette.empty),
        active: readThemeColor('--workload-hotspot-active', defaultHotspotPalette.active),
        warning: readThemeColor('--workload-hotspot-warning', defaultHotspotPalette.warning),
        critical: readThemeColor('--workload-hotspot-critical', defaultHotspotPalette.critical),
        done: readThemeColor('--workload-hotspot-done', defaultHotspotPalette.done),
        selected: readThemeColor('--workload-hotspot-selected', defaultHotspotPalette.selected),
        particleCore: readThemeColor('--workload-particle-core', defaultHotspotPalette.particleCore),
        particleShell: readThemeColor('--workload-particle-shell', defaultHotspotPalette.particleShell),
      })
    }

    const observer = new MutationObserver(updatePalette)
    updatePalette()
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-accent', 'style'] })

    return () => observer.disconnect()
  }, [])

  return palette
}

function ResponsiveWorkloadCamera() {
  const { camera, size } = useThree()

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    const aspect = size.width / Math.max(1, size.height)
    const verticalFov = THREE.MathUtils.degToRad(camera.fov)
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
    const fitFov = Math.min(verticalFov, horizontalFov)
    const radius = WORKLOAD_SPHERE_CONFIG.sphereRadius * 1.22
    const distance = Math.max(8.5, radius / Math.sin(fitFov / 2))

    camera.position.set(0, 0, distance)
    camera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}

function SelectedWorkloadCamera({ selectedHotspot }: { selectedHotspot: WorkloadHotspot | null }) {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    target.set(
      selectedHotspot ? -selectedHotspot.position[0] * 0.18 : 0,
      selectedHotspot ? -selectedHotspot.position[1] * 0.12 : 0,
      selectedHotspot ? 8.05 : 8.5,
    )

    camera.position.lerp(target, 0.045)
    camera.lookAt(0, 0, 0)
  })

  return null
}

export function WorkloadSphereCanvas({ tasks, subjects, className }: WorkloadSphereCanvasProps) {
  const hotspots = useMemo(() => createWorkloadHotspots(subjects, tasks), [subjects, tasks])
  const palette = useWorkloadHotspotPalette()
  const [hoveredHotspotId, setHoveredHotspotId] = useState<number | null>(null)
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | null>(null)
  const selectedHotspot = hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? hotspots[0] ?? null
  const hoveredHotspot = hotspots.find((hotspot) => hotspot.id === hoveredHotspotId) ?? null

  useEffect(() => {
    if (!hotspots.length) {
      setSelectedHotspotId(null)
      return
    }

    setSelectedHotspotId((current) => (current && hotspots.some((hotspot) => hotspot.id === current) ? current : hotspots[0].id))
  }, [hotspots])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 420,
        background: 'var(--workload-scene-bg)',
        overflow: 'hidden',
        borderRadius: 24,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'var(--workload-scene-overlay)',
          pointerEvents: 'none',
        }}
      />
      <Canvas
        dpr={[1, WORKLOAD_SPHERE_CONFIG.dprCap]}
        camera={{
          position: [0, 0, 8.5],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onPointerMissed={() => setSelectedHotspotId(null)}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <ResponsiveWorkloadCamera />
        <SelectedWorkloadCamera selectedHotspot={selectedHotspot} />
        <WorkloadOrbitSphere
          hotspots={hotspots}
          hoveredHotspotId={hoveredHotspotId}
          selectedHotspotId={selectedHotspot?.id ?? null}
          palette={palette}
          onHotspotHover={setHoveredHotspotId}
          onHotspotSelect={setSelectedHotspotId}
        />
      </Canvas>

      <WorkloadSubjectCard hoveredHotspot={hoveredHotspot} selectedHotspot={selectedHotspot} />

      <div
        style={{
          position: 'absolute',
          left: 22,
          top: 20,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--text-faint)',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: 'var(--workload-hotspot-selected)',
            boxShadow: '0 0 14px rgba(var(--accent-primary-rgb), 0.18)',
          }}
        />
        subject hotspots
      </div>
    </div>
  )
}
