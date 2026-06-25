import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import type { MutableRefObject } from 'react'
import type { CrisisSeverityCounts } from '../types'

const TARGET_FPS = 60
const BLOOM_SIZE = 256
const MAX_DPR = 1.5
const CUBE_SCALE = 1.35

const COUNT_EDGE = 16000
const COUNT_MID = 12000
const COUNT_CORE = 22000
const MIN_CORE = 300

const START_ROTATION_X = -0.18
const START_ROTATION_Y = 0.62
const START_ROTATION_Z = 0.03
const AUTO_ROTATION_SPEED = 0.08
const DRAG_YAW_SPEED = 0.006
const DRAG_PITCH_SPEED = 0.004

const CUBE_CORNERS = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],
  [-0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5],
  [-0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
] as const

const CUBE_EDGES = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const

const PRIORITY_CELLS = [
  { key: 'critical', label: 'CRITICAL', color: '#c85050' },
  { key: 'high', label: 'HIGH', color: '#c8a84b' },
  { key: 'medium', label: 'MEDIUM', color: '#9a9690' },
  { key: 'low', label: 'LOW', color: '#4e4c48' },
] as const

interface CubeParams {
  assembly: number
  progress: number
  pressure: number
  instability: number
  scatter: number
  jitter: number
  edgeFill: number
  midFill: number
  coreFill: number
}

interface UniformBundle {
  uTime: THREE.IUniform<number>
  uAssembly: THREE.IUniform<number>
  uPressure: THREE.IUniform<number>
  uScatter: THREE.IUniform<number>
  uJitter: THREE.IUniform<number>
  uDpr: THREE.IUniform<number>
  uPointer: THREE.IUniform<THREE.Vector2>
}

interface LayerProps {
  geometry: THREE.BufferGeometry
  color: string
  glow: number
  sharedRef: MutableRefObject<UniformBundle>
  fillRef: MutableRefObject<THREE.IUniform<number>>
  renderOrder: number
}

interface CubeSceneProps {
  params: CubeParams
  tick: number
  edgeGeo: THREE.BufferGeometry
  midGeo: THREE.BufferGeometry
  coreGeo: THREE.BufferGeometry
  colors: {
    edge: string
    mid: string
    core: string
  }
}

interface BloomComposerProps {
  assemblyRef: MutableRefObject<number>
  pressureRef: MutableRefObject<number>
}

interface CrisisVolumeCubeProps {
  totalTasks: number
  activeTasks: number
  acceptedTasks: number
  completionRatio: number
  pressureScore: number
  cohesionScore: number
  instabilityScore: number
  severityCounts: CrisisSeverityCounts
}

const VERT = /* glsl */ `
precision highp float;

attribute vec3 aBase;
attribute vec3 aScatter;
attribute vec4 aParams;
attribute float aSeed;

uniform float uTime;
uniform float uAssembly;
uniform float uPressure;
uniform float uScatter;
uniform float uJitter;
uniform float uFill;
uniform float uDpr;
uniform vec2 uPointer;

varying float vAlpha;

float cubicSmooth(float value) {
  return value * value * (3.0 - 2.0 * value);
}

void main() {
  if (aSeed > uFill) {
    gl_Position = vec4(0.0, 0.0, -999.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  float size = aParams.x;
  float baseAlpha = aParams.y;
  float speed = aParams.z;
  float phase = aParams.w;
  float assembly = cubicSmooth(clamp(uAssembly, 0.0, 1.0));
  float pressure = clamp(uPressure, 0.0, 1.0);

  vec3 pos = mix(aScatter * uScatter, aBase, assembly);

  vec3 orbitAxis = normalize(vec3(
    sin(aSeed * 37.0 + phase),
    cos(aSeed * 29.0 - phase),
    sin(aSeed * 53.0)
  ));
  vec3 orbitTangent = cross(orbitAxis, vec3(0.0, 1.0, 0.0));
  if (length(orbitTangent) < 0.001) {
    orbitTangent = cross(orbitAxis, vec3(1.0, 0.0, 0.0));
  }
  orbitTangent = normalize(orbitTangent);
  vec3 orbitBitangent = normalize(cross(orbitAxis, orbitTangent));
  float orbitPhase = uTime * (0.75 + speed * 1.65) + phase + aSeed * 6.28318;
  float orbitRadius = (mix(0.04, 0.012, assembly) + pressure * 0.012 + uJitter * 0.4) * (0.55 + aSeed * 0.9);
  pos += (cos(orbitPhase) * orbitTangent + sin(orbitPhase) * orbitBitangent) * orbitRadius;

  float turbulence = (1.0 - assembly) * 0.12 + pressure * 0.07 + uJitter;
  pos.x += sin(uTime * 0.33 + phase + pos.y * 3.8) * turbulence;
  pos.y += cos(uTime * 0.27 + phase + pos.z * 3.2) * turbulence;
  pos.z += sin(uTime * 0.31 + phase + pos.x * 4.1) * turbulence;

  pos.y += sin(uTime * speed + phase) * 0.012;
  pos.x += uPointer.x * 0.055;
  pos.y += uPointer.y * 0.055;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  float perspective = clamp(2.35 / max(0.72, -mvPos.z), 0.55, 1.7);
  float sizeScale = mix(0.45, 1.0, assembly);
  float pulse = 1.0 + sin(uTime * (1.4 + speed) + phase) * 0.06;
  gl_PointSize = clamp(size * pulse * sizeScale * uDpr * perspective, 0.3, 5.0);

  vAlpha = baseAlpha * mix(0.48, 1.0, assembly) * mix(0.68, 1.0, uFill);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uGlow;

varying float vAlpha;

void main() {
  if (vAlpha < 0.005) discard;

  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  float core = 1.0 - smoothstep(0.0, 0.16, d);
  float halo = (1.0 - smoothstep(0.16, 0.5, d)) * 0.35;

  float fx = exp(-abs(uv.x) * 22.0) * (1.0 - smoothstep(0.0, 0.48, abs(uv.y)));
  float fy = exp(-abs(uv.y) * 22.0) * (1.0 - smoothstep(0.0, 0.48, abs(uv.x)));
  float flare = (fx + fy) * uGlow * 0.28;

  float alpha = (core + halo + flare) * vAlpha;

  if (alpha < 0.004) discard;

  gl_FragColor = vec4(uColor + flare * 0.12, alpha);
}
`

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function makeRng(seed: number) {
  let state = (seed | 0) || 0xdeadbeef

  return () => {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}

function stableSeed(totalTasks: number, activeTasks: number, acceptedTasks: number) {
  return totalTasks * 101 + activeTasks * 17 + acceptedTasks * 43 || 42
}

function sampleCorner(random: () => number) {
  const corner = CUBE_CORNERS[Math.floor(random() * CUBE_CORNERS.length)]
  return new THREE.Vector3(corner[0], corner[1], corner[2])
}

function sampleEdge(random: () => number) {
  const edge = CUBE_EDGES[Math.floor(random() * CUBE_EDGES.length)]
  const start = CUBE_CORNERS[edge[0]]
  const end = CUBE_CORNERS[edge[1]]
  const t = random()

  return new THREE.Vector3(
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  )
}

function sampleFace(random: () => number) {
  const face = Math.floor(random() * 6)
  const u = random() - 0.5
  const v = random() - 0.5

  switch (face) {
    case 0:
      return new THREE.Vector3(0.5, u, v)
    case 1:
      return new THREE.Vector3(-0.5, u, v)
    case 2:
      return new THREE.Vector3(u, 0.5, v)
    case 3:
      return new THREE.Vector3(u, -0.5, v)
    case 4:
      return new THREE.Vector3(u, v, 0.5)
    default:
      return new THREE.Vector3(u, v, -0.5)
  }
}

function sampleInterior(random: () => number) {
  return new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5)
}

function sampleScatter(random: () => number, scale: number) {
  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const radius = scale * (1 + random() * 2.5)

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  )
}

function buildLayerGeometry(
  count: number,
  baseSampler: (random: () => number) => THREE.Vector3,
  scale: number,
  seed: number,
  baseAlpha: number,
  baseSize: number,
) {
  const random = makeRng(seed)
  const base = new Float32Array(count * 3)
  const scatter = new Float32Array(count * 3)
  const params = new Float32Array(count * 4)
  const seedValues = new Float32Array(count)
  const placeholder = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const point = baseSampler(random).multiplyScalar(scale)
    const scattered = sampleScatter(random, scale)
    const pointOffset = index * 3
    const paramOffset = index * 4

    base[pointOffset] = point.x
    base[pointOffset + 1] = point.y
    base[pointOffset + 2] = point.z
    scatter[pointOffset] = scattered.x
    scatter[pointOffset + 1] = scattered.y
    scatter[pointOffset + 2] = scattered.z

    params[paramOffset] = baseSize * (0.5 + random())
    params[paramOffset + 1] = baseAlpha * (0.4 + random() * 0.6)
    params[paramOffset + 2] = 0.25 + random() * 0.75
    params[paramOffset + 3] = random() * Math.PI * 2
    seedValues[index] = random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(placeholder, 3))
  geometry.setAttribute('aBase', new THREE.BufferAttribute(base, 3))
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))
  geometry.setAttribute('aParams', new THREE.BufferAttribute(params, 4))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seedValues, 1))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), scale * 4)

  return geometry
}

function deriveCubeParams(
  completionRatio: number,
  pressureScore: number,
  cohesionScore: number,
  instabilityScore: number,
): CubeParams {
  const completion = clamp(completionRatio, 0, 1)
  const progress = clamp(cohesionScore || completion, 0, 1)
  const assembly = smoothstep(0.04, 0.78, progress)
  const pressure = clamp(pressureScore, 0, 1)
  const instability = clamp(instabilityScore, 0, 1)
  const pressureScatter = pressure * lerp(0.42, 0.06, assembly)
  const scatter = lerp(1.55, 0.2, assembly) + pressureScatter
  const jitter = 0.01 + pressure * 0.05
  const edgeStrength = smoothstep(0.2, 0.86, assembly)
  const faceStrength = smoothstep(0.12, 0.74, assembly)
  const coreStrength = 1 - edgeStrength
  const chaosFill = lerp(0.74, 0.16, assembly)

  return {
    assembly,
    progress,
    pressure,
    instability,
    scatter,
    jitter,
    edgeFill: edgeStrength,
    midFill: faceStrength,
    coreFill: clamp(chaosFill + pressure * coreStrength * 0.14 + instability * 0.06, 0.16, 0.86),
  }
}

function getStageLabel(assembly: number) {
  if (assembly < 0.22) return 'DISPERSED / CHAOTIC MASS'
  if (assembly < 0.55) return 'PARTIAL COHESION'
  if (assembly < 0.88) return 'STRUCTURED VOLUME'
  return 'STABLE CUBE'
}

function useIsLightTheme() {
  const [isLightTheme, setIsLightTheme] = useState(false)

  useEffect(() => {
    const updateTheme = () => setIsLightTheme(document.documentElement.classList.contains('light'))
    const observer = new MutationObserver(updateTheme)

    updateTheme()
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isLightTheme
}

function ParticleLayer({ geometry, color, glow, sharedRef, fillRef, renderOrder }: LayerProps) {
  const uniforms = useMemo(
    () => ({
      uTime: sharedRef.current.uTime,
      uAssembly: sharedRef.current.uAssembly,
      uPressure: sharedRef.current.uPressure,
      uScatter: sharedRef.current.uScatter,
      uJitter: sharedRef.current.uJitter,
      uDpr: sharedRef.current.uDpr,
      uPointer: sharedRef.current.uPointer,
      uFill: fillRef.current,
      uColor: { value: new THREE.Color(color) },
      uGlow: { value: glow },
    }),
    [color, fillRef, glow, sharedRef],
  )

  return (
    <points frustumCulled={false} renderOrder={renderOrder}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function BloomComposer({ assemblyRef, pressureRef }: BloomComposerProps) {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const bloomRef = useRef<UnrealBloomPass | null>(null)

  useEffect(() => {
    const composer = new EffectComposer(gl)
    const bloom = new UnrealBloomPass(new THREE.Vector2(BLOOM_SIZE, BLOOM_SIZE), 0.28, 0.28, 0.82)

    bloom.setSize(BLOOM_SIZE, BLOOM_SIZE)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR))
    composer.setSize(size.width, size.height)
    composerRef.current = composer
    bloomRef.current = bloom

    return () => {
      composer.dispose()
      bloom.dispose()
      composerRef.current = null
      bloomRef.current = null
    }
  }, [camera, gl, scene, size.height, size.width])

  useFrame(() => {
    if (bloomRef.current) {
      bloomRef.current.strength = 0.22 + assemblyRef.current * 0.42 + pressureRef.current * 0.35
    }
    composerRef.current?.render()
  }, 1)

  return null
}

function CubeScene({ params, tick, edgeGeo, midGeo, coreGeo, colors }: CubeSceneProps) {
  const { invalidate } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const assemblyRef = useRef(params.assembly)
  const pressureRef = useRef(params.pressure)
  const pointerTarget = useRef(new THREE.Vector2(0, 0))
  const pointerSmooth = useRef(new THREE.Vector2(0, 0))
  const rotationTarget = useRef(new THREE.Vector2(START_ROTATION_Y, START_ROTATION_X))
  const rotationSmooth = useRef(new THREE.Vector2(START_ROTATION_Y, START_ROTATION_X))
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, pointerId: -1 })

  const sharedRef = useRef<UniformBundle>({
    uTime: { value: 0 },
    uAssembly: { value: params.assembly },
    uPressure: { value: params.pressure },
    uScatter: { value: params.scatter },
    uJitter: { value: params.jitter },
    uDpr: { value: Math.min(window.devicePixelRatio || 1, MAX_DPR) },
    uPointer: { value: new THREE.Vector2(0, 0) },
  })
  const edgeFillRef = useRef<THREE.IUniform<number>>({ value: params.edgeFill })
  const midFillRef = useRef<THREE.IUniform<number>>({ value: params.midFill })
  const coreFillRef = useRef<THREE.IUniform<number>>({ value: params.coreFill })

  useEffect(() => {
    const canvas = document.querySelector('.crisis-cube-canvas') as HTMLElement | null

    const updatePointerTarget = (event: PointerEvent) => {
      const wrap = canvas?.closest('.crisis-cube-wrap') as HTMLElement | null
      const rect = (wrap ?? canvas)?.getBoundingClientRect()
      if (!rect) return

      pointerTarget.current.set(
        ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        -((event.clientY - rect.top) / rect.height - 0.5) * 2,
      )
    }

    const onPointerDown = (event: PointerEvent) => {
      dragRef.current.active = true
      dragRef.current.lastX = event.clientX
      dragRef.current.lastY = event.clientY
      dragRef.current.pointerId = event.pointerId
      canvas?.setPointerCapture?.(event.pointerId)
      if (canvas) canvas.style.cursor = 'grabbing'
      event.preventDefault()
    }

    const onPointerMove = (event: PointerEvent) => {
      updatePointerTarget(event)

      if (!dragRef.current.active) return

      const deltaX = event.clientX - dragRef.current.lastX
      const deltaY = event.clientY - dragRef.current.lastY
      rotationTarget.current.x += deltaX * DRAG_YAW_SPEED
      rotationTarget.current.y = clamp(
        rotationTarget.current.y + deltaY * DRAG_PITCH_SPEED,
        -0.95,
        0.55,
      )
      dragRef.current.lastX = event.clientX
      dragRef.current.lastY = event.clientY
      event.preventDefault()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (dragRef.current.pointerId === event.pointerId) {
        canvas?.releasePointerCapture?.(event.pointerId)
      }
      dragRef.current.active = false
      dragRef.current.pointerId = -1
      if (canvas) canvas.style.cursor = 'grab'
    }

    const onPointerLeave = () => pointerTarget.current.set(0, 0)

    canvas?.addEventListener('pointerdown', onPointerDown)
    canvas?.addEventListener('pointermove', onPointerMove)
    canvas?.addEventListener('pointerup', onPointerUp)
    canvas?.addEventListener('pointercancel', onPointerUp)
    canvas?.addEventListener('pointerleave', onPointerLeave)

    return () => {
      canvas?.removeEventListener('pointerdown', onPointerDown)
      canvas?.removeEventListener('pointermove', onPointerMove)
      canvas?.removeEventListener('pointerup', onPointerUp)
      canvas?.removeEventListener('pointercancel', onPointerUp)
      canvas?.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  useEffect(() => {
    invalidate()
  }, [invalidate, tick])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    timeRef.current += dt
    assemblyRef.current += (params.assembly - assemblyRef.current) * (1 - Math.exp(-dt * 2.5))
    pressureRef.current += (params.pressure - pressureRef.current) * (1 - Math.exp(-dt * 3))

    pointerSmooth.current.x += (pointerTarget.current.x - pointerSmooth.current.x) * (1 - Math.exp(-dt * 7))
    pointerSmooth.current.y += (pointerTarget.current.y - pointerSmooth.current.y) * (1 - Math.exp(-dt * 7))

    sharedRef.current.uTime.value = timeRef.current
    sharedRef.current.uAssembly.value = assemblyRef.current
    sharedRef.current.uPressure.value = pressureRef.current
    sharedRef.current.uScatter.value = params.scatter
    sharedRef.current.uJitter.value = params.jitter
    sharedRef.current.uPointer.value.copy(pointerSmooth.current)
    edgeFillRef.current.value = params.edgeFill
    midFillRef.current.value = params.midFill
    coreFillRef.current.value = params.coreFill

    if (!dragRef.current.active) {
      rotationTarget.current.x += dt * AUTO_ROTATION_SPEED
    }

    rotationSmooth.current.x += (rotationTarget.current.x - rotationSmooth.current.x) * (1 - Math.exp(-dt * 8))
    rotationSmooth.current.y += (rotationTarget.current.y - rotationSmooth.current.y) * (1 - Math.exp(-dt * 8))

    if (groupRef.current) {
      groupRef.current.rotation.y = rotationSmooth.current.x
      groupRef.current.rotation.x = rotationSmooth.current.y + Math.sin(timeRef.current * 0.06) * 0.04
      groupRef.current.rotation.z = START_ROTATION_Z
    }
  })

  return (
    <>
      <group ref={groupRef} rotation={[START_ROTATION_X, START_ROTATION_Y, START_ROTATION_Z]}>
        <ParticleLayer
          geometry={edgeGeo}
          color={colors.edge}
          glow={0.85}
          sharedRef={sharedRef}
          fillRef={edgeFillRef}
          renderOrder={3}
        />
        <ParticleLayer
          geometry={midGeo}
          color={colors.mid}
          glow={0.22}
          sharedRef={sharedRef}
          fillRef={midFillRef}
          renderOrder={2}
        />
        <ParticleLayer
          geometry={coreGeo}
          color={colors.core}
          glow={0.78}
          sharedRef={sharedRef}
          fillRef={coreFillRef}
          renderOrder={1}
        />
      </group>
      <BloomComposer assemblyRef={assemblyRef} pressureRef={pressureRef} />
    </>
  )
}

export function CrisisVolumeCube({
  totalTasks,
  activeTasks,
  acceptedTasks,
  completionRatio,
  pressureScore,
  cohesionScore,
  instabilityScore,
  severityCounts,
}: CrisisVolumeCubeProps) {
  const [tick, setTick] = useState(0)
  const isLightTheme = useIsLightTheme()
  const params = useMemo(
    () => deriveCubeParams(completionRatio, pressureScore, cohesionScore, instabilityScore),
    [cohesionScore, completionRatio, instabilityScore, pressureScore],
  )
  const seed = useMemo(() => stableSeed(totalTasks, activeTasks, acceptedTasks), [acceptedTasks, activeTasks, totalTasks])
  const dprMax = Math.min(MAX_DPR, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  const colors = isLightTheme
    ? { edge: '#141414', mid: '#4d4a43', core: '#161616' }
    : { edge: '#f0ede4', mid: '#c8c4bc', core: '#f0ede4' }

  useEffect(() => {
    const id = window.setInterval(() => setTick((current) => current + 1), 1000 / TARGET_FPS)
    return () => window.clearInterval(id)
  }, [])

  const { edgeGeo, midGeo, coreGeo } = useMemo(() => {
    const random = makeRng(seed)

    return {
      edgeGeo: buildLayerGeometry(
        COUNT_EDGE,
        (layerRandom) => (layerRandom() < 0.25 ? sampleCorner(layerRandom) : sampleEdge(layerRandom)),
        CUBE_SCALE,
        (random() * 0xfffff) | 0,
        0.72,
        1.55,
      ),
      midGeo: buildLayerGeometry(
        COUNT_MID,
        sampleFace,
        CUBE_SCALE * 0.97,
        (random() * 0xfffff) | 0,
        0.34,
        1.05,
      ),
      coreGeo: buildLayerGeometry(
        Math.max(COUNT_CORE, MIN_CORE),
        sampleInterior,
        CUBE_SCALE * 0.75,
        (random() * 0xfffff) | 0,
        0.52,
        1.8,
      ),
    }
  }, [seed])

  useEffect(() => {
    return () => {
      edgeGeo.dispose()
      midGeo.dispose()
      coreGeo.dispose()
    }
  }, [coreGeo, edgeGeo, midGeo])

  return (
    <div className="crisis-cube-wrap" style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden' }}>
        <Canvas
          className="crisis-cube-canvas"
          camera={{ position: [0, 0.1, 3.4], fov: 40 }}
          dpr={[1, dprMax]}
          frameloop="demand"
          gl={{ alpha: true, antialias: false, powerPreference: 'default' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.setPixelRatio(Math.min(gl.getPixelRatio(), MAX_DPR))
          }}
          style={{ background: 'transparent', cursor: 'grab', touchAction: 'none' }}
        >
          <CubeScene params={params} tick={tick} edgeGeo={edgeGeo} midGeo={midGeo} coreGeo={coreGeo} colors={colors} />
        </Canvas>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--text-faint)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {getStageLabel(params.progress)}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '32px',
            right: '32px',
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '1px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: `${params.progress * 100}%`,
              height: '100%',
              background: 'var(--active)',
              borderRadius: '1px',
              boxShadow: '0 0 6px rgba(240,237,228,0.5)',
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            pointerEvents: 'none',
          }}
        >
          {[
            { label: 'CORE', fill: params.coreFill, color: '#f0ede4' },
            { label: 'FACE', fill: params.midFill, color: '#9a9690' },
            { label: 'EDGE', fill: params.edgeFill, color: '#4e4c48' },
          ].map(({ label, fill, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '28px',
                  height: '2px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '1px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${fill * 100}%`,
                    background: color,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {PRIORITY_CELLS.map(({ key, label, color }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              padding: '14px 18px',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-faint)' }}>
              {label}
            </span>
            <span
              style={{
                color,
                fontSize: '24px',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {severityCounts[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
