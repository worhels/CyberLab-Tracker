import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { WorkloadHotspot, WorkloadHotspotStatus } from './workloadHotspotData'

export interface WorkloadHotspotPalette {
  empty: string
  active: string
  warning: string
  critical: string
  done: string
  selected: string
}

const STATUS_OPACITY: Record<WorkloadHotspotStatus, number> = {
  empty: 0.28,
  active: 0.72,
  warning: 0.92,
  critical: 1,
  done: 0.48,
}

interface WorkloadHotspotPointProps {
  hotspot: WorkloadHotspot
  isHovered: boolean
  isSelected: boolean
  palette: WorkloadHotspotPalette
  onHover: (id: number | null) => void
  onSelect: (id: number) => void
}

export function WorkloadHotspotPoint({
  hotspot,
  isHovered,
  isSelected,
  palette,
  onHover,
  onSelect,
}: WorkloadHotspotPointProps) {
  const pointRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const color = isSelected ? palette.selected : palette[hotspot.status]
  const opacity = STATUS_OPACITY[hotspot.status]
  const shouldPulse = hotspot.status === 'critical' || hotspot.status === 'warning'

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    const targetScale = isSelected ? 1.42 : isHovered ? 1.25 : 1
    const pulse = shouldPulse ? Math.sin(time * 4.4 + hotspot.id) * 0.1 : 0
    const scale = targetScale + pulse

    if (pointRef.current) {
      pointRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), Math.min(1, delta * 12))
    }

    if (glowRef.current) {
      const glowScale = isSelected ? 2.8 : isHovered ? 2.25 : 1.65
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), Math.min(1, delta * 9))
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = isSelected ? 0.62 : isHovered ? 0.42 : shouldPulse ? 0.24 + Math.sin(time * 4.8) * 0.12 : 0.18
    }

    if (pulseRef.current) {
      const wave = 1.6 + ((time * 0.8 + hotspot.id * 0.13) % 1) * 2.2
      pulseRef.current.scale.setScalar(wave)
      const material = pulseRef.current.material as THREE.MeshBasicMaterial
      material.opacity = shouldPulse ? Math.max(0, 0.26 * (1 - (wave - 1.6) / 2.2)) : 0
    }
  })

  const stopAndSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(hotspot.id)
  }

  return (
    <group position={hotspot.position}>
      <mesh ref={glowRef} renderOrder={12}>
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={pulseRef} renderOrder={11}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh
        ref={pointRef}
        renderOrder={13}
        onClick={stopAndSelect}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover(hotspot.id)
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onHover(null)
        }}
      >
        <sphereGeometry args={[isSelected ? 0.105 : 0.082, 28, 28]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </group>
  )
}
