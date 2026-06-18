import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Subject, Task } from '../../types'
import { WORKLOAD_SPHERE_CONFIG, WorkloadOrbitSphere } from './WorkloadOrbitSphere'

interface WorkloadSphereCanvasProps {
  tasks: Task[]
  subjects: Subject[]
  className?: string
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

export function WorkloadSphereCanvas({ tasks, subjects, className }: WorkloadSphereCanvasProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 420,
        background: '#000',
        overflow: 'hidden',
        borderRadius: 24,
      }}
    >
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
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#000000']} />

        <ResponsiveWorkloadCamera />
        <WorkloadOrbitSphere tasks={tasks} subjects={subjects} />
      </Canvas>
    </div>
  )
}
