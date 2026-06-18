import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Subject, Task } from '../../types'
import {
  calculateTaskLoad,
  generateInteriorCloud,
  generateOrbitBand,
  generateOuterShell,
  stableHash,
  type ParticleGeometryData,
} from './workloadMath'

export const WORKLOAD_SPHERE_CONFIG = {
  sphereRadius: 2.5,

  interiorParticleCount: 140_000,
  shellParticleCount: 42_000,

  minLineParticles: 600,
  maxLineParticles: 9_000,

  interiorPointScale: 0.62,
  shellPointScale: 0.72,

  minLinePointScale: 0.75,
  maxLinePointScale: 1.85,

  interiorOpacity: 0.26,
  shellOpacity: 0.38,
  lineOpacity: 0.28,

  subjectTint: 0.08,

  glowStrength: 0.85,
  noiseAmount: 0.026,
  lineSpread: 0.055,

  rotationSpeed: 0.055,
  breathingAmount: 0.003,

  maxRenderedTasks: 14,
  dprCap: 1.25,
}

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;

  uniform float uPointScale;

  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float perspective = 3.2 / max(0.001, -mvPosition.z);
    gl_PointSize = clamp(aSize * uPointScale * perspective, 0.45, 2.4);

    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));

    if (d > 0.5) {
      discard;
    }

    float softEdge = smoothstep(0.5, 0.05, d);
    float core = smoothstep(0.18, 0.0, d) * 0.45;

    float alpha = (softEdge + core) * vAlpha * uOpacity;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(uColor, alpha);
  }
`

function createParticleGeometry(data: ParticleGeometryData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()

  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(data.alphas, 1))

  return geometry
}

function createParticleMaterial(
  color: THREE.ColorRepresentation,
  opacity: number,
  pointScale: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPointScale: { value: pointScale },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  })
}

interface WorkloadOrbitSphereProps {
  tasks: Task[]
  subjects: Subject[]
}

export function WorkloadOrbitSphere({ tasks, subjects }: WorkloadOrbitSphereProps) {
  const groupRef = useRef<THREE.Group>(null)

  const subjectsMap = useMemo(() => {
    return new Map(subjects.map((subject) => [String(subject.id), subject]))
  }, [subjects])

  const interiorGeometry = useMemo(() => {
    return createParticleGeometry(
      generateInteriorCloud(WORKLOAD_SPHERE_CONFIG.interiorParticleCount, WORKLOAD_SPHERE_CONFIG.sphereRadius, 1001),
    )
  }, [])

  const shellGeometry = useMemo(() => {
    return createParticleGeometry(
      generateOuterShell(WORKLOAD_SPHERE_CONFIG.shellParticleCount, WORKLOAD_SPHERE_CONFIG.sphereRadius, 2002),
    )
  }, [])

  const interiorMaterial = useMemo(() => {
    return createParticleMaterial(
      '#ffffff',
      WORKLOAD_SPHERE_CONFIG.interiorOpacity,
      WORKLOAD_SPHERE_CONFIG.interiorPointScale,
    )
  }, [])

  const shellMaterial = useMemo(() => {
    return createParticleMaterial('#ffffff', WORKLOAD_SPHERE_CONFIG.shellOpacity, WORKLOAD_SPHERE_CONFIG.shellPointScale)
  }, [])

  const visualTasks = useMemo(() => {
    return tasks
      .map((task) => ({
        task,
        metrics: calculateTaskLoad(task, subjectsMap),
      }))
      .sort((a, b) => b.metrics.load - a.metrics.load)
      .slice(0, WORKLOAD_SPHERE_CONFIG.maxRenderedTasks)
  }, [tasks, subjectsMap])

  const orbitItems = useMemo(() => {
    return visualTasks.map(({ task, metrics }) => {
      const particleCount = Math.round(
        WORKLOAD_SPHERE_CONFIG.minLineParticles +
          metrics.load * (WORKLOAD_SPHERE_CONFIG.maxLineParticles - WORKLOAD_SPHERE_CONFIG.minLineParticles),
      )

      const pointScale =
        WORKLOAD_SPHERE_CONFIG.minLinePointScale +
        metrics.load * (WORKLOAD_SPHERE_CONFIG.maxLinePointScale - WORKLOAD_SPHERE_CONFIG.minLinePointScale)

      const opacity = WORKLOAD_SPHERE_CONFIG.lineOpacity * WORKLOAD_SPHERE_CONFIG.glowStrength * (0.22 + metrics.load * 0.42)

      const seed = stableHash(`${task.id}-${task.subject_id}-${task.title}-${task.deadline ?? ''}`)

      const geometry = createParticleGeometry(
        generateOrbitBand({
          radius: WORKLOAD_SPHERE_CONFIG.sphereRadius * 1.015,
          particleCount,
          load: metrics.load,
          seed,
          noiseAmount: WORKLOAD_SPHERE_CONFIG.noiseAmount,
          lineSpread: WORKLOAD_SPHERE_CONFIG.lineSpread,
        }),
      )

      const material = createParticleMaterial('#ffffff', opacity, pointScale)

      return {
        id: task.id,
        geometry,
        material,
      }
    })
  }, [visualTasks])

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const time = clock.getElapsedTime()

    groupRef.current.rotation.y = time * WORKLOAD_SPHERE_CONFIG.rotationSpeed
    groupRef.current.rotation.z = Math.sin(time * 0.16) * 0.035

    const breathe = 1 + Math.sin(time * 0.42) * WORKLOAD_SPHERE_CONFIG.breathingAmount

    groupRef.current.scale.set(breathe, breathe, breathe)
  })

  useEffect(() => {
    return () => {
      interiorGeometry.dispose()
      shellGeometry.dispose()
      interiorMaterial.dispose()
      shellMaterial.dispose()
    }
  }, [interiorGeometry, shellGeometry, interiorMaterial, shellMaterial])

  useEffect(() => {
    const currentOrbitItems = orbitItems

    return () => {
      currentOrbitItems.forEach((item) => {
        item.geometry.dispose()
        item.material.dispose()
      })
    }
  }, [orbitItems])

  return (
    <group ref={groupRef}>
      <points geometry={interiorGeometry} material={interiorMaterial} frustumCulled={false} />

      <points geometry={shellGeometry} material={shellMaterial} frustumCulled={false} />

      {orbitItems.map((item) => (
        <points key={item.id} geometry={item.geometry} material={item.material} frustumCulled={false} />
      ))}
    </group>
  )
}
