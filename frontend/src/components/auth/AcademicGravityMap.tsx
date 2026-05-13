import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { AuthMode } from './AuthShell'

const PALETTE = {
  background: '#0B0A07',
  secondaryBackground: '#151411',
  darkLayer: '#1D1C19',
  cardDark: '#252421',
  darkGraphite: '#302F2D',
  borderGraphite: '#454441',
  mutedGray: '#828282',
  mainParticle: '#A7A7A7',
  brightFog: '#D4D4D4',
  rareHighlight: '#F1F1F1',
  coldBlue: '#6F87A8',
  deepColdBlue: '#38465C',
  dryNaturalShadow: '#6C5F50',
}

const CORE_PARTICLE_COUNT = 14000
const CORE_ANCHOR_COUNT = 2200
const DEBT_CLUSTER_COUNT = 1800
const BACKGROUND_DUST_COUNT = 620

const ORBITS = [
  { radiusX: 2.34, radiusY: 0.52, tiltX: 0.16, tiltY: -0.38, tiltZ: 0.1, speed: 0.023, opacity: 0.36, phase: 0.2 },
  { radiusX: 2.78, radiusY: 0.76, tiltX: -0.44, tiltY: 0.14, tiltZ: -0.36, speed: -0.017, opacity: 0.3, phase: 1.1 },
  { radiusX: 3.18, radiusY: 1.02, tiltX: 0.42, tiltY: 0.34, tiltZ: 0.66, speed: 0.013, opacity: 0.26, phase: 2.4 },
  { radiusX: 3.58, radiusY: 1.18, tiltX: -0.28, tiltY: -0.52, tiltZ: 1.0, speed: -0.01, opacity: 0.22, phase: 0.8 },
  { radiusX: 4.02, radiusY: 1.42, tiltX: 0.34, tiltY: 0.46, tiltZ: -0.8, speed: 0.008, opacity: 0.18, phase: 2.0 },
  { radiusX: 4.46, radiusY: 1.7, tiltX: -0.52, tiltY: 0.08, tiltZ: 0.34, speed: -0.007, opacity: 0.15, phase: 3.1 },
  { radiusX: 4.86, radiusY: 1.92, tiltX: 0.08, tiltY: -0.62, tiltZ: -0.2, speed: 0.006, opacity: 0.12, phase: 4.0 },
] as const

type TaskNodeKind = 'quiet' | 'important' | 'now' | 'rare'

interface TaskNodeConfig {
  orbit: number
  phase: number
  speed: number
  size: number
  kind: TaskNodeKind
  lift: number
  drift: number
}

const TASK_NODES: TaskNodeConfig[] = [
  { orbit: 0, phase: 0.28, speed: 0.18, size: 0.032, kind: 'quiet', lift: 0.04, drift: 0.04 },
  { orbit: 0, phase: 1.56, speed: 0.155, size: 0.052, kind: 'important', lift: -0.03, drift: 0.08 },
  { orbit: 0, phase: 3.6, speed: 0.19, size: 0.03, kind: 'quiet', lift: 0.08, drift: 0.03 },
  { orbit: 1, phase: 0.62, speed: 0.12, size: 0.034, kind: 'quiet', lift: -0.06, drift: 0.04 },
  { orbit: 1, phase: 1.94, speed: 0.112, size: 0.058, kind: 'now', lift: 0.04, drift: 0.1 },
  { orbit: 1, phase: 3.2, speed: 0.128, size: 0.032, kind: 'quiet', lift: 0.02, drift: 0.05 },
  { orbit: 2, phase: 0.18, speed: 0.086, size: 0.03, kind: 'quiet', lift: 0.04, drift: 0.03 },
  { orbit: 2, phase: 1.34, speed: 0.079, size: 0.048, kind: 'important', lift: -0.05, drift: 0.08 },
  { orbit: 2, phase: 2.7, speed: 0.091, size: 0.036, kind: 'quiet', lift: 0.03, drift: 0.04 },
  { orbit: 2, phase: 4.04, speed: 0.082, size: 0.052, kind: 'now', lift: 0.07, drift: 0.1 },
  { orbit: 3, phase: 0.88, speed: 0.064, size: 0.032, kind: 'quiet', lift: 0.03, drift: 0.04 },
  { orbit: 3, phase: 2.08, speed: 0.069, size: 0.046, kind: 'important', lift: -0.04, drift: 0.07 },
  { orbit: 3, phase: 3.1, speed: 0.058, size: 0.032, kind: 'quiet', lift: 0.08, drift: 0.05 },
  { orbit: 3, phase: 4.62, speed: 0.064, size: 0.055, kind: 'rare', lift: -0.07, drift: 0.12 },
  { orbit: 4, phase: 1.74, speed: 0.052, size: 0.052, kind: 'now', lift: 0.05, drift: 0.09 },
  { orbit: 4, phase: 4.36, speed: 0.044, size: 0.044, kind: 'important', lift: -0.04, drift: 0.07 },
  { orbit: 5, phase: 2.2, speed: 0.039, size: 0.046, kind: 'now', lift: 0.02, drift: 0.08 },
  { orbit: 6, phase: 5.1, speed: 0.031, size: 0.032, kind: 'quiet', lift: 0.04, drift: 0.05 },
]

const NODE_LINKS = [
  [1, 4],
  [4, 7],
  [7, 11],
  [11, 13],
  [13, 15],
  [2, 8],
  [8, 10],
  [10, 14],
  [14, 16],
  [3, 6],
  [5, 9],
  [12, 17],
] as const

const DEBT_CENTERS = [
  new THREE.Vector3(-1.48, -0.7, 0.34),
  new THREE.Vector3(1.32, -0.56, -0.22),
  new THREE.Vector3(-0.64, 1.05, -0.36),
]

const CORE_VERTEX_SHADER = `
attribute vec3 aColor;
attribute vec3 aScatterPosition;
attribute float aSize;
attribute float aAlpha;
attribute float aPhase;
attribute float aWeight;
attribute float aDensity;

uniform float uTime;
uniform float uMode;
uniform float uPixelRatio;
uniform vec2 uPointer;
uniform float uPointerInfluence;

varying vec3 vColor;
varying float vAlpha;
varying float vDensity;

void main() {
  vec3 target = position;
  float assembly = mix(1.0, 0.61 + 0.17 * sin(uTime * 0.16 + aPhase), uMode);
  vec3 p = mix(aScatterPosition, target, assembly);

  float lobe =
    sin(target.x * 2.7 + uTime * 0.28 + aPhase) +
    sin(target.y * 3.8 - uTime * 0.21 + aPhase * 0.7) +
    cos(target.z * 3.1 + target.x * 1.3 + uTime * 0.18);
  float breath = lobe * 0.012 * aWeight;
  p += normalize(target + vec3(0.001)) * breath;

  vec2 cursor = uPointer * vec2(2.8, 1.7);
  float cursorDistance = distance(p.xy, cursor);
  float focus = smoothstep(1.05, 0.0, cursorDistance) * uPointerInfluence;
  vec3 cursorDirection = normalize(vec3(p.xy - cursor, 0.22));
  p += cursorDirection * focus * (0.055 + aDensity * 0.035);
  p.z += focus * 0.05;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float perspective = 7.0 / max(2.0, -mvPosition.z);
  gl_PointSize = clamp(aSize * 380.0 * perspective * uPixelRatio * (1.0 + focus * 0.65), 0.78, 4.8);

  vColor = aColor;
  vAlpha = aAlpha * mix(1.0, 0.82, uMode) * (0.88 + focus * 0.42);
  vDensity = aDensity;
}
`

const CORE_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;
varying float vDensity;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float disc = 1.0 - smoothstep(0.14, 0.5, d);
  float center = 1.0 - smoothstep(0.0, 0.22, d);
  float alpha = disc * vAlpha * (0.82 + center * 0.2 + vDensity * 0.12);

  if (alpha < 0.016) {
    discard;
  }

  gl_FragColor = vec4(vColor * (0.86 + center * 0.14), alpha);
}
`

const NODE_VERTEX_SHADER = `
attribute vec3 aColor;
attribute float aSize;
attribute float aAlpha;

uniform float uPixelRatio;
uniform vec2 uPointer;
uniform float uPointerInfluence;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float focus = smoothstep(0.86, 0.0, distance(p.xy, uPointer * vec2(4.35, 2.65))) * uPointerInfluence;
  p.z += focus * 0.1;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(aSize * 470.0 * (7.0 / max(2.0, -mvPosition.z)) * uPixelRatio * (1.0 + focus * 1.08), 4.0, 18.0);

  vColor = aColor;
  vAlpha = aAlpha * (0.86 + focus * 0.36);
}
`

const NODE_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float disc = 1.0 - smoothstep(0.2, 0.5, d);
  float core = 1.0 - smoothstep(0.0, 0.18, d);

  if (disc < 0.02) {
    discard;
  }

  gl_FragColor = vec4(vColor * (0.88 + core * 0.12), disc * vAlpha);
}
`

const LINK_VERTEX_SHADER = `
attribute vec3 aMidpoint;
attribute float aAlpha;

uniform vec2 uPointer;
uniform float uPointerInfluence;

varying float vAlpha;

void main() {
  float focus = smoothstep(0.95, 0.0, distance(aMidpoint.xy, uPointer * vec2(4.35, 2.65))) * uPointerInfluence;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vAlpha = aAlpha * (0.75 + focus * 1.3);
}
`

const LINK_FRAGMENT_SHADER = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(uColor, vAlpha);
}
`

function seededRandom(seed: number) {
  let value = seed
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function randomDirection(random: () => number) {
  const z = random() * 2 - 1
  const theta = random() * Math.PI * 2
  const radius = Math.sqrt(1 - z * z)

  return new THREE.Vector3(Math.cos(theta) * radius, z, Math.sin(theta) * radius)
}

function organicCorePoint(direction: THREE.Vector3, radius: number, phase: number) {
  const theta = Math.atan2(direction.z, direction.x)
  const phi = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1))
  const lobe =
    1 +
    Math.sin(theta * 3.0 + phi * 1.6 + phase) * 0.16 +
    Math.cos(theta * 5.0 - phase * 0.7) * 0.075 +
    Math.sin(phi * 5.4 + theta * 1.3) * 0.08

  return new THREE.Vector3(
    direction.x * radius * 1.34 * lobe,
    direction.y * radius * 1.02 * (1 + Math.sin(theta * 2 + phase) * 0.06),
    direction.z * radius * 1.16 * (1 + Math.cos(phi * 3 - phase) * 0.07),
  )
}

function taskNodeColor(kind: TaskNodeKind) {
  if (kind === 'now') return new THREE.Color(PALETTE.coldBlue)
  if (kind === 'rare') return new THREE.Color(PALETTE.rareHighlight)
  if (kind === 'important') return new THREE.Color(PALETTE.brightFog)
  return new THREE.Color(PALETTE.borderGraphite)
}

function orbitPoint(orbitIndex: number, angle: number, looseness: number) {
  const orbit = ORBITS[orbitIndex]
  const ripple =
    Math.sin(angle * 3.0 + orbit.phase) * 0.045 +
    Math.sin(angle * 7.0 - orbit.phase * 0.6) * 0.018 +
    Math.cos(angle * 2.0 + orbit.phase) * looseness
  const x = Math.cos(angle) * (orbit.radiusX + ripple)
  const y = Math.sin(angle) * (orbit.radiusY + ripple * 0.32) + Math.sin(angle * 4.0 + orbit.phase) * 0.025
  const z = Math.sin(angle * 2.0 + orbit.phase) * 0.07

  return new THREE.Vector3(x, y, z).applyEuler(new THREE.Euler(orbit.tiltX, orbit.tiltY, orbit.tiltZ))
}

function taskNodePosition(index: number, elapsed: number, mode: AuthMode, target: THREE.Vector3) {
  const node = TASK_NODES[index]
  const registerLoose = mode === 'register' ? node.drift * Math.sin(elapsed * 0.32 + node.phase * 1.8) : 0
  const angle = node.phase + elapsed * node.speed * (mode === 'register' ? 0.78 : 1)
  const vector = orbitPoint(node.orbit, angle, registerLoose)

  vector.y += node.lift
  vector.z += Math.sin(angle * 0.72 + node.phase) * (mode === 'register' ? 0.22 : 0.07)
  target.copy(vector)
}

function createCoreGeometry(mode: AuthMode) {
  const random = seededRandom(mode === 'login' ? 14503 : 27119)
  const positions = new Float32Array(CORE_PARTICLE_COUNT * 3)
  const scatterPositions = new Float32Array(CORE_PARTICLE_COUNT * 3)
  const colors = new Float32Array(CORE_PARTICLE_COUNT * 3)
  const sizes = new Float32Array(CORE_PARTICLE_COUNT)
  const alphas = new Float32Array(CORE_PARTICLE_COUNT)
  const phases = new Float32Array(CORE_PARTICLE_COUNT)
  const weights = new Float32Array(CORE_PARTICLE_COUNT)
  const densities = new Float32Array(CORE_PARTICLE_COUNT)

  const graphite = new THREE.Color(PALETTE.darkGraphite)
  const border = new THREE.Color(PALETTE.borderGraphite)
  const muted = new THREE.Color(PALETTE.mutedGray)
  const main = new THREE.Color(PALETTE.mainParticle)
  const bright = new THREE.Color(PALETTE.brightFog)
  const cold = new THREE.Color(PALETTE.coldBlue)
  const deepCold = new THREE.Color(PALETTE.deepColdBlue)
  const dry = new THREE.Color(PALETTE.dryNaturalShadow)

  for (let index = 0; index < CORE_PARTICLE_COUNT; index += 1) {
    const i3 = index * 3
    const phase = random() * Math.PI * 2
    const clusterChance = random()
    let target: THREE.Vector3
    let density = 0

    if (clusterChance > 0.84) {
      const center = DEBT_CENTERS[Math.floor(random() * DEBT_CENTERS.length)]
      const local = randomDirection(random).multiplyScalar(Math.pow(random(), 1.8) * (0.22 + random() * 0.32))
      target = center.clone().add(local)
      density = 0.85 + random() * 0.15
    } else {
      const direction = randomDirection(random)
      const coreBias = random()
      const radius = 0.1 + Math.pow(coreBias, 1.62) * 1.82 + (random() > 0.82 ? random() * 0.34 : 0)
      target = organicCorePoint(direction, radius, phase)
      density = 1 - THREE.MathUtils.clamp(radius / 2.2, 0, 1)
    }

    const scatterDirection = randomDirection(random)
    const scatterRadius = 2.35 + random() * 2.6
    const scatter = scatterDirection.multiplyScalar(scatterRadius)

    positions[i3] = target.x
    positions[i3 + 1] = target.y
    positions[i3 + 2] = target.z
    scatterPositions[i3] = scatter.x + (random() - 0.5) * 0.48
    scatterPositions[i3 + 1] = scatter.y + (random() - 0.5) * 0.62
    scatterPositions[i3 + 2] = scatter.z - 0.42

    const height = THREE.MathUtils.clamp((target.y + 1.65) / 3.25, 0, 1)
    const sideLight = THREE.MathUtils.clamp((target.x + 2.2) / 4.4, 0, 1)
    const pick = random()
    let color = graphite.clone().lerp(border, height * 0.7 + random() * 0.2)

    if (clusterChance > 0.84) {
      color = graphite.clone().lerp(dry, 0.26 + random() * 0.22)
    }

    if (pick > 0.82) {
      color = border.clone().lerp(muted, height * 0.72 + density * 0.14)
    }

    if (pick > 0.92) {
      color = muted.clone().lerp(main, height * 0.75 + sideLight * 0.18)
    }

    if (pick > 0.978) {
      color = main.clone().lerp(bright, height * 0.64 + random() * 0.2)
    }

    if (pick > 0.989 || (target.z > 0.9 && random() > 0.986)) {
      color = deepCold.clone().lerp(cold, 0.42 + height * 0.34)
    }

    color.toArray(colors, i3)
    sizes[index] = 0.008 + random() * 0.012 + density * 0.003
    alphas[index] = 0.24 + density * 0.28 + height * 0.24 + random() * 0.2
    phases[index] = phase
    weights[index] = 0.35 + random() * 0.95
    densities[index] = density
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aScatterPosition', new THREE.BufferAttribute(scatterPositions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute('aWeight', new THREE.BufferAttribute(weights, 1))
  geometry.setAttribute('aDensity', new THREE.BufferAttribute(densities, 1))
  geometry.computeBoundingSphere()

  return geometry
}

function CoreParticleField({ mode }: { mode: AuthMode }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const smoothPointer = useRef(new THREE.Vector2())
  const geometry = useMemo(() => createCoreGeometry(mode), [mode])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMode: { value: mode === 'register' ? 1 : 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.3) },
      uPointer: { value: new THREE.Vector2() },
      uPointerInfluence: { value: 0 },
    }),
    [mode],
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 3.9))

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uMode.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uMode.value as number,
        mode === 'register' ? 1 : 0,
        3.1,
        delta,
      )
      materialRef.current.uniforms.uPointer.value.copy(smoothPointer.current)
      materialRef.current.uniforms.uPointerInfluence.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uPointerInfluence.value as number,
        Math.min(1, smoothPointer.current.length() * 1.22),
        3.8,
        delta,
      )
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (mode === 'register' ? 0.03 : 0.021)
      pointsRef.current.rotation.x = THREE.MathUtils.damp(pointsRef.current.rotation.x, smoothPointer.current.y * 0.07, 2.8, delta)
      pointsRef.current.rotation.z = THREE.MathUtils.damp(pointsRef.current.rotation.z, smoothPointer.current.x * -0.034, 2.8, delta)
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={CORE_VERTEX_SHADER}
        fragmentShader={CORE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}

function createDebtClusterGeometry() {
  const random = seededRandom(81173)
  const positions = new Float32Array(DEBT_CLUSTER_COUNT * 3)
  const colors = new Float32Array(DEBT_CLUSTER_COUNT * 3)
  const graphite = new THREE.Color(PALETTE.darkGraphite)
  const dry = new THREE.Color(PALETTE.dryNaturalShadow)
  const fog = new THREE.Color(PALETTE.mainParticle)

  for (let index = 0; index < DEBT_CLUSTER_COUNT; index += 1) {
    const center = DEBT_CENTERS[index % DEBT_CENTERS.length]
    const angle = random() * Math.PI * 2
    const band = randomDirection(random).multiplyScalar(Math.pow(random(), 2.2) * 0.56)
    const swirl = new THREE.Vector3(Math.cos(angle) * 0.24, Math.sin(angle * 1.7) * 0.12, Math.sin(angle) * 0.22)
    const point = center.clone().add(band).add(swirl.multiplyScalar(random() * 0.45))
    const i3 = index * 3

    positions[i3] = point.x
    positions[i3 + 1] = point.y
    positions[i3 + 2] = point.z

    const color = graphite.clone().lerp(random() > 0.88 ? fog : dry, 0.16 + random() * 0.34)
    color.toArray(colors, i3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  return geometry
}

function createCoreAnchorGeometry() {
  const random = seededRandom(33291)
  const positions = new Float32Array(CORE_ANCHOR_COUNT * 3)
  const colors = new Float32Array(CORE_ANCHOR_COUNT * 3)
  const graphite = new THREE.Color(PALETTE.borderGraphite)
  const main = new THREE.Color(PALETTE.mainParticle)
  const fog = new THREE.Color(PALETTE.brightFog)
  const blue = new THREE.Color(PALETTE.deepColdBlue)

  for (let index = 0; index < CORE_ANCHOR_COUNT; index += 1) {
    const direction = randomDirection(random)
    const radius = Math.pow(random(), 2.35) * 1.05
    const phase = random() * Math.PI * 2
    const point = organicCorePoint(direction, radius, phase)
    const i3 = index * 3

    positions[i3] = point.x
    positions[i3 + 1] = point.y
    positions[i3 + 2] = point.z

    const height = THREE.MathUtils.clamp((point.y + 1.0) / 2.0, 0, 1)
    const color = graphite.clone().lerp(random() > 0.93 ? fog : main, 0.22 + height * 0.32)
    if (random() > 0.985) color.lerp(blue, 0.4)
    color.toArray(colors, i3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  return geometry
}

function CoreAnchorField({ mode }: { mode: AuthMode }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const geometry = useMemo(() => createCoreAnchorGeometry(), [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (mode === 'register' ? -0.026 : -0.016)
      pointsRef.current.rotation.x = THREE.MathUtils.damp(pointsRef.current.rotation.x, pointer.y * 0.045, 2.8, delta)
      pointsRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.1) * 0.018
    }

    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, mode === 'register' ? 0.46 : 0.58, 2.7, delta)
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.017}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.56}
        depthWrite={false}
      />
    </points>
  )
}

function createCoreFilamentGeometry() {
  const random = seededRandom(77113)
  const positions: number[] = []

  for (let strand = 0; strand < 46; strand += 1) {
    const phase = random() * Math.PI * 2
    const radius = 0.42 + random() * 1.34
    const height = (random() - 0.5) * 1.45
    const segmentCount = 8 + Math.floor(random() * 7)

    for (let segment = 0; segment < segmentCount; segment += 1) {
      const tA = segment / segmentCount
      const tB = (segment + 1) / segmentCount
      const angleA = phase + tA * Math.PI * (0.8 + random() * 0.5)
      const angleB = phase + tB * Math.PI * (0.8 + random() * 0.5)
      const taperA = Math.sin(tA * Math.PI)
      const taperB = Math.sin(tB * Math.PI)
      const pointA = new THREE.Vector3(
        Math.cos(angleA) * radius * (0.55 + taperA * 0.52),
        height + (tA - 0.5) * 0.45 + Math.sin(angleA * 1.7) * 0.08,
        Math.sin(angleA) * radius * (0.48 + taperA * 0.44),
      )
      const pointB = new THREE.Vector3(
        Math.cos(angleB) * radius * (0.55 + taperB * 0.52),
        height + (tB - 0.5) * 0.45 + Math.sin(angleB * 1.7) * 0.08,
        Math.sin(angleB) * radius * (0.48 + taperB * 0.44),
      )

      positions.push(pointA.x, pointA.y, pointA.z, pointB.x, pointB.y, pointB.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  return geometry
}

function CoreFilaments({ mode }: { mode: AuthMode }) {
  const linesRef = useRef<THREE.LineSegments>(null)
  const materialRef = useRef<THREE.LineBasicMaterial>(null)
  const geometry = useMemo(() => createCoreFilamentGeometry(), [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ pointer }, delta) => {
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * (mode === 'register' ? 0.022 : 0.012)
      linesRef.current.rotation.x = THREE.MathUtils.damp(linesRef.current.rotation.x, pointer.y * 0.035, 2.7, delta)
    }

    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, mode === 'register' ? 0.12 : 0.17, 2.8, delta)
    }
  })

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial ref={materialRef} color={PALETTE.mutedGray} transparent opacity={0.16} depthWrite={false} />
    </lineSegments>
  )
}

function DebtClusters({ mode }: { mode: AuthMode }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const geometry = useMemo(() => createDebtClusterGeometry(), [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock }, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (mode === 'register' ? 0.028 : 0.014)
      pointsRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.12) * 0.045
    }

    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, mode === 'register' ? 0.32 : 0.42, 2.5, delta)
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.018}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </points>
  )
}

function createOrbitParticleGeometry(orbitIndex: number, mode: AuthMode) {
  const random = seededRandom(3100 + orbitIndex * 911 + (mode === 'register' ? 97 : 0))
  const count = 460 + orbitIndex * 46
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const base = new THREE.Color(PALETTE.borderGraphite)
  const muted = new THREE.Color(PALETTE.mutedGray)
  const blue = new THREE.Color(PALETTE.deepColdBlue)

  for (let index = 0; index < count; index += 1) {
    const t = (index / count) * Math.PI * 2
    const gap = Math.sin(t * 2.0 + orbitIndex) > 0.72 || Math.sin(t * 5.0 - orbitIndex) < -0.9
    const jitter = (random() - 0.5) * (mode === 'register' ? 0.13 : 0.045)
    const point = orbitPoint(orbitIndex, t + jitter, (random() - 0.5) * 0.04)
    const i3 = index * 3

    positions[i3] = point.x
    positions[i3 + 1] = point.y
    positions[i3 + 2] = point.z

    const color = base.clone().lerp(gap ? new THREE.Color(PALETTE.darkLayer) : muted, random() * 0.5)
    if (random() > 0.982) color.lerp(blue, 0.42)
    color.toArray(colors, i3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  return geometry
}

function createOrbitLineGeometry(orbitIndex: number, mode: AuthMode) {
  const random = seededRandom(5400 + orbitIndex * 547 + (mode === 'register' ? 33 : 0))
  const segments = 210
  const positions: number[] = []

  for (let index = 0; index < segments; index += 1) {
    const tA = (index / segments) * Math.PI * 2
    const tB = ((index + 1) / segments) * Math.PI * 2
    const visible = Math.sin(tA * 2 + orbitIndex * 0.7) < 0.82 && Math.cos(tA * 4.3 - orbitIndex) > -0.92

    if (!visible || random() < (mode === 'register' ? 0.18 : 0.08)) continue

    const pointA = orbitPoint(orbitIndex, tA, Math.sin(tA * 3) * 0.025)
    const pointB = orbitPoint(orbitIndex, tB, Math.sin(tB * 3) * 0.025)
    positions.push(pointA.x, pointA.y, pointA.z, pointB.x, pointB.y, pointB.z)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  return geometry
}

function OrbitLayer({ mode, orbitIndex }: { mode: AuthMode; orbitIndex: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const pointMaterialRef = useRef<THREE.PointsMaterial>(null)
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null)
  const orbit = ORBITS[orbitIndex]
  const particleGeometry = useMemo(() => createOrbitParticleGeometry(orbitIndex, mode), [mode, orbitIndex])
  const lineGeometry = useMemo(() => createOrbitLineGeometry(orbitIndex, mode), [mode, orbitIndex])

  useEffect(() => {
    return () => {
      particleGeometry.dispose()
      lineGeometry.dispose()
    }
  }, [particleGeometry, lineGeometry])

  useFrame(({ pointer, clock }, delta) => {
    if (groupRef.current) {
      const loose = mode === 'register' ? Math.sin(clock.getElapsedTime() * 0.2 + orbit.phase) * 0.052 : 0
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, pointer.y * 0.042 + loose, 3.1, delta)
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, pointer.x * 0.052, 3.1, delta)
      groupRef.current.rotation.z += delta * orbit.speed * (mode === 'register' ? 1.5 : 1)
    }

    if (pointMaterialRef.current) {
      pointMaterialRef.current.opacity = THREE.MathUtils.damp(pointMaterialRef.current.opacity, orbit.opacity, 3, delta)
    }

    if (lineMaterialRef.current) {
      lineMaterialRef.current.opacity = THREE.MathUtils.damp(lineMaterialRef.current.opacity, orbit.opacity * 0.58, 3, delta)
    }
  })

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial ref={lineMaterialRef} color={PALETTE.borderGraphite} transparent opacity={orbit.opacity * 0.58} depthWrite={false} />
      </lineSegments>
      <points geometry={particleGeometry}>
        <pointsMaterial
          ref={pointMaterialRef}
          size={0.021}
          sizeAttenuation
          vertexColors
          transparent
          opacity={orbit.opacity}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function createTaskNodeGeometry() {
  const positions = new Float32Array(TASK_NODES.length * 3)
  const colors = new Float32Array(TASK_NODES.length * 3)
  const sizes = new Float32Array(TASK_NODES.length)
  const alphas = new Float32Array(TASK_NODES.length)

  TASK_NODES.forEach((node, index) => {
    taskNodeColor(node.kind).toArray(colors, index * 3)
    sizes[index] = node.size
    alphas[index] = node.kind === 'quiet' ? 0.58 : node.kind === 'now' ? 0.84 : 0.76
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  return geometry
}

function TaskNodeField({ mode }: { mode: AuthMode }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const smoothPointer = useRef(new THREE.Vector2())
  const geometry = useMemo(() => createTaskNodeGeometry(), [])
  const temp = useMemo(() => new THREE.Vector3(), [])
  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.3) },
      uPointer: { value: new THREE.Vector2() },
      uPointerInfluence: { value: 0 },
    }),
    [],
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute
    const elapsed = clock.getElapsedTime()
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 4.2))

    TASK_NODES.forEach((_, index) => {
      taskNodePosition(index, elapsed, mode, temp)
      positions.setXYZ(index, temp.x, temp.y, temp.z)
    })

    positions.needsUpdate = true

    if (materialRef.current) {
      materialRef.current.uniforms.uPointer.value.copy(smoothPointer.current)
      materialRef.current.uniforms.uPointerInfluence.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uPointerInfluence.value as number,
        Math.min(1, smoothPointer.current.length() * 1.18),
        4.8,
        delta,
      )
    }
  })

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={NODE_VERTEX_SHADER}
        fragmentShader={NODE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}

function createNodeLinkGeometry() {
  const positions = new Float32Array(NODE_LINKS.length * 2 * 3)
  const midpoints = new Float32Array(NODE_LINKS.length * 2 * 3)
  const alphas = new Float32Array(NODE_LINKS.length * 2)
  const geometry = new THREE.BufferGeometry()

  NODE_LINKS.forEach((_, index) => {
    alphas[index * 2] = 0.15
    alphas[index * 2 + 1] = 0.15
  })

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aMidpoint', new THREE.BufferAttribute(midpoints, 3))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  return geometry
}

function NodeLinks({ mode }: { mode: AuthMode }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createNodeLinkGeometry(), [])
  const pointA = useMemo(() => new THREE.Vector3(), [])
  const pointB = useMemo(() => new THREE.Vector3(), [])
  const midpoint = useMemo(() => new THREE.Vector3(), [])
  const smoothPointer = useRef(new THREE.Vector2())
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(PALETTE.borderGraphite) },
      uPointer: { value: new THREE.Vector2() },
      uPointerInfluence: { value: 0 },
    }),
    [],
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute
    const midpoints = geometry.getAttribute('aMidpoint') as THREE.BufferAttribute
    const elapsed = clock.getElapsedTime()
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 4.1))

    NODE_LINKS.forEach(([start, end], index) => {
      taskNodePosition(start, elapsed, mode, pointA)
      taskNodePosition(end, elapsed, mode, pointB)
      midpoint.copy(pointA).add(pointB).multiplyScalar(0.5)

      const i2 = index * 2
      positions.setXYZ(i2, pointA.x, pointA.y, pointA.z)
      positions.setXYZ(i2 + 1, pointB.x, pointB.y, pointB.z)
      midpoints.setXYZ(i2, midpoint.x, midpoint.y, midpoint.z)
      midpoints.setXYZ(i2 + 1, midpoint.x, midpoint.y, midpoint.z)
    })

    positions.needsUpdate = true
    midpoints.needsUpdate = true

    if (materialRef.current) {
      materialRef.current.uniforms.uPointer.value.copy(smoothPointer.current)
      materialRef.current.uniforms.uPointerInfluence.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uPointerInfluence.value as number,
        Math.min(1, smoothPointer.current.length() * 1.15),
        4.2,
        delta,
      )
    }
  })

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={LINK_VERTEX_SHADER}
        fragmentShader={LINK_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  )
}

function createBackgroundDustGeometry() {
  const random = seededRandom(42424)
  const positions = new Float32Array(BACKGROUND_DUST_COUNT * 3)
  const colors = new Float32Array(BACKGROUND_DUST_COUNT * 3)
  const graphite = new THREE.Color(PALETTE.darkLayer)
  const dust = new THREE.Color(PALETTE.borderGraphite)
  const blue = new THREE.Color(PALETTE.deepColdBlue)

  for (let index = 0; index < BACKGROUND_DUST_COUNT; index += 1) {
    const i3 = index * 3
    positions[i3] = (random() - 0.5) * 10.4
    positions[i3 + 1] = (random() - 0.5) * 5.9
    positions[i3 + 2] = -1.4 - random() * 4.8

    const color = graphite.clone().lerp(random() > 0.9 ? blue : dust, random() * 0.35)
    color.toArray(colors, i3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  return geometry
}

function BackgroundDust() {
  const pointsRef = useRef<THREE.Points>(null)
  const geometry = useMemo(() => createBackgroundDustGeometry(), [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.07) * 0.08
      pointsRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.05
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.012} sizeAttenuation vertexColors transparent opacity={0.16} depthWrite={false} />
    </points>
  )
}

function GravitySystem({ mode }: { mode: AuthMode }) {
  const rootRef = useRef<THREE.Group>(null)
  const smoothPointer = useRef(new THREE.Vector2())

  useFrame(({ pointer }, delta) => {
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 3.4))

    if (!rootRef.current) return

    rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, smoothPointer.current.y * 0.075, 2.8, delta)
    rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, smoothPointer.current.x * 0.115, 2.8, delta)
    rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, smoothPointer.current.x * 0.13, 2.6, delta)
    rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, smoothPointer.current.y * 0.085, 2.6, delta)
  })

  return (
    <group ref={rootRef} position={[0.12, -0.02, 0]} scale={1.08}>
      <BackgroundDust />
      <NodeLinks mode={mode} />
      <CoreFilaments mode={mode} />
      <DebtClusters mode={mode} />
      <CoreParticleField mode={mode} />
      <CoreAnchorField mode={mode} />
      {ORBITS.map((_, index) => (
        <OrbitLayer key={index} mode={mode} orbitIndex={index} />
      ))}
      <TaskNodeField mode={mode} />
    </group>
  )
}

export function AcademicGravityMap({ mode }: { mode: AuthMode }) {
  return (
    <Canvas
      camera={{ fov: 36, position: [0, 0, 7.0] }}
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <GravitySystem mode={mode} />
    </Canvas>
  )
}
