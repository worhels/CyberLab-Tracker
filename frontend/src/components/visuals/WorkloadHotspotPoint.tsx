import { useFrame, useThree } from '@react-three/fiber'
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
  particleCore: string
  particleShell: string
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
  const groupRef = useRef<THREE.Group>(null)
  const pointRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const accentRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const color = isSelected ? palette.selected : palette[hotspot.status]
  const opacity = STATUS_OPACITY[hotspot.status]
  const shouldPulse = hotspot.status === 'critical' || hotspot.status === 'warning'

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    const targetScale = isSelected ? 1.18 : isHovered ? 1.1 : 1
    const pulse = shouldPulse ? Math.sin(time * 4.4 + hotspot.id) * 0.035 : 0
    const scale = targetScale + pulse

    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), Math.min(1, delta * 12))
    }

    if (pointRef.current) {
      const material = pointRef.current.material as THREE.MeshBasicMaterial
      material.opacity = isSelected ? 0.96 : isHovered ? Math.min(1, opacity + 0.12) : opacity
    }

    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = isSelected ? 0.16 : isHovered ? 0.12 : shouldPulse ? 0.08 + Math.sin(time * 4.8) * 0.035 : 0.045
    }

    if (pulseRef.current) {
      const wave = 1 + ((time * 0.7 + hotspot.id * 0.13) % 1) * 1.6
      pulseRef.current.scale.setScalar(wave)
      const material = pulseRef.current.material as THREE.MeshBasicMaterial
      material.opacity = shouldPulse ? Math.max(0, 0.16 * (1 - (wave - 1) / 1.6)) : 0
    }

    if (ringRef.current) {
      const material = ringRef.current.material as THREE.MeshBasicMaterial
      material.opacity = isSelected ? 0.78 : isHovered ? 0.54 : 0.28
    }

    if (accentRef.current) {
      const material = accentRef.current.material as THREE.MeshBasicMaterial
      material.opacity = isSelected ? 0.74 : isHovered ? 0.5 : hotspot.status === 'empty' ? 0.16 : 0.34
    }
  })

  const stopAndSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(hotspot.id)
  }

  return (
    <group ref={groupRef} position={hotspot.position}>
      <mesh ref={glowRef} renderOrder={10}>
        <circleGeometry args={[isSelected ? 0.23 : 0.18, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.045} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={pulseRef} renderOrder={11}>
        <ringGeometry args={[0.102, 0.108, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringRef} renderOrder={12}>
        <ringGeometry args={[isSelected ? 0.083 : 0.07, isSelected ? 0.094 : 0.079, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} depthTest={false} />
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
        <circleGeometry args={[isSelected ? 0.044 : 0.034, 36]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh ref={accentRef} renderOrder={14} position={[isSelected ? 0.052 : 0.041, isSelected ? 0.052 : 0.041, 0.001]}>
        <circleGeometry args={[isSelected ? 0.011 : 0.008, 18]} />
        <meshBasicMaterial color={palette.particleShell} transparent opacity={0.34} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh
        renderOrder={15}
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
        <circleGeometry args={[0.17, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.001} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  )
}
