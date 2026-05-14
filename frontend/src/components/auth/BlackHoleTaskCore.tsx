import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { AuthMode } from './AuthShell'

const PALETTE = {
  background: '#0B0A07',
  secondaryBackground: '#151411',
  darkLayer: '#1D1C19',
  wetGraphite: '#252421',
  darkGraphite: '#302F2D',
  borderGraphite: '#454441',
  mutedGray: '#828282',
  normalParticle: '#939393',
  fogGray: '#A7A7A7',
  silverFog: '#C0C0C0',
  lightSmoke: '#D4D4D4',
  paleFog: '#E7E7E7',
  rareHighlight: '#F1F1F1',
  coldBlue: '#6F87A8',
  deepColdBlue: '#38465C',
  dryNaturalShadow: '#6C5F50',
}

const DISK_PARTICLE_COUNT = 18000
const BACKGROUND_DUST_COUNT = 420

const RINGS = [
  { rx: 0.72, ry: 0.17, speed: 0.64, thickness: 0.028, alpha: 0.68 },
  { rx: 0.9, ry: 0.22, speed: 0.52, thickness: 0.034, alpha: 0.58 },
  { rx: 1.08, ry: 0.28, speed: 0.43, thickness: 0.04, alpha: 0.52 },
  { rx: 1.3, ry: 0.35, speed: 0.34, thickness: 0.048, alpha: 0.46 },
  { rx: 1.56, ry: 0.44, speed: 0.27, thickness: 0.056, alpha: 0.39 },
  { rx: 1.84, ry: 0.54, speed: 0.21, thickness: 0.066, alpha: 0.34 },
  { rx: 2.18, ry: 0.66, speed: 0.17, thickness: 0.078, alpha: 0.28 },
  { rx: 2.54, ry: 0.78, speed: 0.135, thickness: 0.09, alpha: 0.23 },
  { rx: 2.92, ry: 0.92, speed: 0.108, thickness: 0.105, alpha: 0.19 },
  { rx: 3.32, ry: 1.08, speed: 0.086, thickness: 0.122, alpha: 0.16 },
  { rx: 3.74, ry: 1.25, speed: 0.068, thickness: 0.14, alpha: 0.13 },
  { rx: 4.18, ry: 1.42, speed: 0.052, thickness: 0.16, alpha: 0.1 },
] as const

type TaskNodeKind = 'normal' | 'upcoming' | 'now' | 'debt'

interface TaskNode {
  ring: number
  phase: number
  speed: number
  size: number
  kind: TaskNodeKind
  lift: number
}

const TASK_NODES: TaskNode[] = [
  { ring: 1, phase: 0.28, speed: 0.26, size: 0.046, kind: 'now', lift: 0.02 },
  { ring: 1, phase: 2.75, speed: 0.23, size: 0.04, kind: 'upcoming', lift: -0.01 },
  { ring: 2, phase: 1.26, speed: 0.21, size: 0.028, kind: 'normal', lift: 0.04 },
  { ring: 2, phase: 4.42, speed: 0.18, size: 0.05, kind: 'now', lift: -0.02 },
  { ring: 3, phase: 0.72, speed: 0.16, size: 0.042, kind: 'upcoming', lift: 0.03 },
  { ring: 3, phase: 2.4, speed: 0.15, size: 0.024, kind: 'normal', lift: -0.05 },
  { ring: 3, phase: 5.3, speed: 0.145, size: 0.026, kind: 'normal', lift: 0.01 },
  { ring: 4, phase: 0.18, speed: 0.13, size: 0.026, kind: 'normal', lift: 0.04 },
  { ring: 4, phase: 1.76, speed: 0.118, size: 0.046, kind: 'upcoming', lift: -0.03 },
  { ring: 4, phase: 3.84, speed: 0.11, size: 0.046, kind: 'debt', lift: -0.04 },
  { ring: 5, phase: 0.94, speed: 0.098, size: 0.03, kind: 'normal', lift: 0.06 },
  { ring: 5, phase: 2.52, speed: 0.09, size: 0.05, kind: 'now', lift: 0.02 },
  { ring: 5, phase: 4.86, speed: 0.085, size: 0.026, kind: 'normal', lift: -0.03 },
  { ring: 6, phase: 0.48, speed: 0.074, size: 0.024, kind: 'normal', lift: -0.01 },
  { ring: 6, phase: 2.08, speed: 0.068, size: 0.044, kind: 'upcoming', lift: 0.04 },
  { ring: 6, phase: 4.08, speed: 0.063, size: 0.026, kind: 'normal', lift: -0.05 },
  { ring: 7, phase: 1.14, speed: 0.056, size: 0.026, kind: 'normal', lift: 0.04 },
  { ring: 7, phase: 3.18, speed: 0.052, size: 0.046, kind: 'debt', lift: -0.02 },
  { ring: 8, phase: 0.34, speed: 0.046, size: 0.024, kind: 'normal', lift: -0.03 },
  { ring: 8, phase: 2.62, speed: 0.043, size: 0.042, kind: 'upcoming', lift: 0.03 },
  { ring: 9, phase: 4.8, speed: 0.035, size: 0.024, kind: 'normal', lift: 0.02 },
  { ring: 10, phase: 1.84, speed: 0.028, size: 0.024, kind: 'normal', lift: -0.04 },
]

const NODE_LINKS = [
  [0, 1],
  [3, 4],
  [8, 11],
  [9, 12],
  [11, 14],
  [14, 16],
  [17, 20],
  [5, 7],
  [18, 21],
] as const

const DISK_VERTEX_SHADER = `
attribute float aRing;
attribute float aAngle;
attribute float aRadialOffset;
attribute float aSpeed;
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
attribute vec3 aScatter;

uniform float uTime;
uniform float uMode;
uniform float uPixelRatio;
uniform vec2 uPointer;
uniform float uPointerInfluence;

varying vec3 vColor;
varying float vAlpha;

const float PI = 3.14159265359;

void main() {
  float ring = aRing;
  float normalizedRing = ring / 11.0;
  float angle = aAngle + uTime * aSpeed;
  float ringPulse = sin(angle * 3.0 + ring * 0.7 + uTime * 0.18) * 0.018;
  float rx = mix(0.72, 4.18, normalizedRing) + aRadialOffset + ringPulse;
  float ry = mix(0.17, 1.42, normalizedRing) + aRadialOffset * 0.32;
  vec3 disk = vec3(cos(angle) * rx, sin(angle) * ry, sin(angle * 2.0 + ring) * 0.035);

  float assembly = mix(1.0, 0.57 + 0.2 * sin(uTime * 0.14 + aAngle), uMode);
  vec3 p = mix(aScatter, disk, assembly);

  vec2 cursor = uPointer * vec2(3.5, 2.1);
  float focus = smoothstep(0.72, 0.0, distance(p.xy, cursor)) * uPointerInfluence;
  vec3 deflect = normalize(vec3(p.xy - cursor, 0.18));
  p += deflect * focus * 0.045;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float perspective = 7.0 / max(2.0, -mvPosition.z);
  gl_PointSize = clamp(aSize * 360.0 * perspective * uPixelRatio * (1.0 + focus * 0.35), 0.6, 3.2);

  float fadeOuter = 1.0 - smoothstep(0.72, 1.0, normalizedRing);
  vColor = aColor;
  vAlpha = aAlpha * (0.42 + fadeOuter * 0.68) * mix(1.0, 0.78, uMode) * (1.0 + focus * 0.18);
}
`

const POINT_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float disc = 1.0 - smoothstep(0.18, 0.5, d);
  if (disc * vAlpha < 0.014) {
    discard;
  }
  gl_FragColor = vec4(vColor, disc * vAlpha);
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
  float focus = smoothstep(0.82, 0.0, distance(p.xy, uPointer * vec2(3.5, 2.1))) * uPointerInfluence;
  p.z += focus * 0.055;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(aSize * 520.0 * (7.0 / max(2.0, -mvPosition.z)) * uPixelRatio * (1.0 + focus * 0.55), 4.0, 18.0);

  vColor = aColor;
  vAlpha = aAlpha * (0.9 + focus * 0.28);
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

function nodeColor(kind: TaskNodeKind) {
  if (kind === 'now') return new THREE.Color(PALETTE.coldBlue)
  if (kind === 'upcoming') return new THREE.Color(PALETTE.paleFog)
  if (kind === 'debt') return new THREE.Color(PALETTE.dryNaturalShadow)
  return new THREE.Color(PALETTE.borderGraphite)
}

function diskPoint(ringIndex: number, angle: number, offset = 0) {
  const ring = RINGS[ringIndex]
  const ripple = Math.sin(angle * 3.0 + ringIndex * 0.7) * 0.018
  const x = Math.cos(angle) * (ring.rx + offset + ripple)
  const y = Math.sin(angle) * (ring.ry + offset * 0.32)
  const z = Math.sin(angle * 2.0 + ringIndex) * 0.035

  return new THREE.Vector3(x, y, z)
}

function taskPosition(index: number, elapsed: number, mode: AuthMode, target: THREE.Vector3) {
  const node = TASK_NODES[index]
  const forming = mode === 'register' ? Math.sin(elapsed * 0.26 + node.phase) * 0.12 : 0
  const heaviness = node.kind === 'now' ? 0.72 : 1
  const angle = node.phase + elapsed * node.speed * heaviness * (mode === 'register' ? 0.76 : 1)
  const point = diskPoint(node.ring, angle, forming)

  point.y += node.lift
  point.z += node.kind === 'now' ? 0.055 : 0.02
  point.applyEuler(new THREE.Euler(-0.62, 0.08, -0.08))
  target.copy(point)
}

function createDiskGeometry(mode: AuthMode) {
  const random = seededRandom(mode === 'login' ? 24019 : 53087)
  const ringWeights = RINGS.map((_, index) => 1 / (index + 1.35))
  const totalWeight = ringWeights.reduce((sum, weight) => sum + weight, 0)
  const ringStops = ringWeights.reduce<number[]>((stops, weight) => {
    stops.push((stops.at(-1) ?? 0) + weight / totalWeight)
    return stops
  }, [])

  const positions = new Float32Array(DISK_PARTICLE_COUNT * 3)
  const rings = new Float32Array(DISK_PARTICLE_COUNT)
  const angles = new Float32Array(DISK_PARTICLE_COUNT)
  const radialOffsets = new Float32Array(DISK_PARTICLE_COUNT)
  const speeds = new Float32Array(DISK_PARTICLE_COUNT)
  const sizes = new Float32Array(DISK_PARTICLE_COUNT)
  const alphas = new Float32Array(DISK_PARTICLE_COUNT)
  const colors = new Float32Array(DISK_PARTICLE_COUNT * 3)
  const scatters = new Float32Array(DISK_PARTICLE_COUNT * 3)

  const graphite = new THREE.Color(PALETTE.darkGraphite)
  const border = new THREE.Color(PALETTE.borderGraphite)
  const fog = new THREE.Color(PALETTE.fogGray)
  const smoke = new THREE.Color(PALETTE.lightSmoke)
  const blue = new THREE.Color(PALETTE.deepColdBlue)

  for (let index = 0; index < DISK_PARTICLE_COUNT; index += 1) {
    const pick = random()
    const ringIndex = Math.max(0, ringStops.findIndex((stop) => pick <= stop))
    const ring = RINGS[ringIndex]
    const angle = random() * Math.PI * 2
    const offset = (random() - 0.5) * ring.thickness
    const point = diskPoint(ringIndex, angle, offset)
    const i3 = index * 3
    const ringRatio = ringIndex / (RINGS.length - 1)
    const colorPick = random()
    let color = graphite.clone().lerp(border, 0.3 + random() * 0.52)

    if (colorPick > 0.9) color = border.clone().lerp(fog, 0.2 + random() * 0.42)
    if (colorPick > 0.977) color = fog.clone().lerp(smoke, random() * 0.45)
    if (colorPick > 0.991) color = blue.clone().lerp(new THREE.Color(PALETTE.coldBlue), random() * 0.42)

    positions[i3] = 0
    positions[i3 + 1] = 0
    positions[i3 + 2] = 0
    rings[index] = ringIndex
    angles[index] = angle
    radialOffsets[index] = offset
    speeds[index] = ring.speed * (0.88 + random() * 0.24)
    sizes[index] = 0.006 + random() * 0.01 + (1 - ringRatio) * 0.003
    alphas[index] = ring.alpha * (0.52 + random() * 0.5)
    color.toArray(colors, i3)

    const scatterRadius = 2.6 + random() * 2.8
    const scatterAngle = random() * Math.PI * 2
    scatters[i3] = Math.cos(scatterAngle) * scatterRadius
    scatters[i3 + 1] = (random() - 0.5) * 3.1
    scatters[i3 + 2] = Math.sin(scatterAngle) * scatterRadius - 0.4

    point.applyEuler(new THREE.Euler(-0.62, 0.08, -0.08))
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aRing', new THREE.BufferAttribute(rings, 1))
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1))
  geometry.setAttribute('aRadialOffset', new THREE.BufferAttribute(radialOffsets, 1))
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3))
  geometry.computeBoundingSphere()

  return geometry
}

function AccretionDisk({ mode }: { mode: AuthMode }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const smoothPointer = useRef(new THREE.Vector2())
  const geometry = useMemo(() => createDiskGeometry(mode), [mode])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMode: { value: mode === 'register' ? 1 : 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.25) },
      uPointer: { value: new THREE.Vector2() },
      uPointerInfluence: { value: 0 },
    }),
    [mode],
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 3.4))

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uMode.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uMode.value as number,
        mode === 'register' ? 1 : 0,
        2.8,
        delta,
      )
      materialRef.current.uniforms.uPointer.value.copy(smoothPointer.current)
      materialRef.current.uniforms.uPointerInfluence.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uPointerInfluence.value as number,
        Math.min(1, smoothPointer.current.length() * 1.2),
        3.5,
        delta,
      )
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.x = THREE.MathUtils.damp(pointsRef.current.rotation.x, -0.62 + smoothPointer.current.y * 0.04, 2.8, delta)
      pointsRef.current.rotation.y = THREE.MathUtils.damp(pointsRef.current.rotation.y, 0.08 + smoothPointer.current.x * 0.055, 2.8, delta)
      pointsRef.current.rotation.z = THREE.MathUtils.damp(pointsRef.current.rotation.z, -0.08, 2.8, delta)
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={DISK_VERTEX_SHADER}
        fragmentShader={POINT_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}

function EventHorizon({ mode }: { mode: AuthMode }) {
  const groupRef = useRef<THREE.Group>(null)
  const scale = mode === 'register' ? 0.92 : 1

  useFrame(({ pointer }, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, -0.62 + pointer.y * 0.012, 2.6, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, pointer.x * 0.018, 2.6, delta)
  })

  return (
    <group ref={groupRef} scale={scale}>
      <mesh renderOrder={3}>
        <sphereGeometry args={[0.49, 64, 64]} />
        <meshBasicMaterial color="#050504" />
      </mesh>
      <mesh position={[0, 0, 0.08]} renderOrder={6}>
        <circleGeometry args={[0.495, 96]} />
        <meshBasicMaterial color="#050504" depthTest={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={7}>
        <torusGeometry args={[0.515, 0.006, 10, 144]} />
        <meshBasicMaterial color={PALETTE.lightSmoke} transparent opacity={0.34} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
        <torusGeometry args={[0.62, 0.003, 8, 144]} />
        <meshBasicMaterial color={PALETTE.borderGraphite} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

function TaskNodes({ mode }: { mode: AuthMode }) {
  const ringRef = useRef<THREE.InstancedMesh>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const ringDummy = useMemo(() => new THREE.Object3D(), [])
  const position = useMemo(() => new THREE.Vector3(), [])
  const smoothPointer = useRef(new THREE.Vector2())
  const geometry = useMemo(() => {
    const positions = new Float32Array(TASK_NODES.length * 3)
    const colors = new Float32Array(TASK_NODES.length * 3)
    const sizes = new Float32Array(TASK_NODES.length)
    const alphas = new Float32Array(TASK_NODES.length)

    TASK_NODES.forEach((node, index) => {
      nodeColor(node.kind).toArray(colors, index * 3)
      sizes[index] = node.size
      alphas[index] = node.kind === 'normal' ? 0.56 : node.kind === 'debt' ? 0.7 : 0.86
    })

    const nodeGeometry = new THREE.BufferGeometry()
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    nodeGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    nodeGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    nodeGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    return nodeGeometry
  }, [])
  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.25) },
      uPointer: { value: new THREE.Vector2() },
      uPointerInfluence: { value: 0 },
    }),
    [],
  )

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 3.8))
    const elapsed = clock.getElapsedTime()
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute

    TASK_NODES.forEach((node, index) => {
      taskPosition(index, elapsed, mode, position)
      const distance = position.distanceTo(new THREE.Vector3(smoothPointer.current.x * 3.5, smoothPointer.current.y * 2.1, position.z))
      const focus = THREE.MathUtils.clamp(1 - distance / 0.72, 0, 1)
      const registerEase = mode === 'register' ? THREE.MathUtils.clamp(elapsed * 0.22 - index * 0.025, 0.35, 1) : 1
      const scale = node.size * (1 + focus * 0.42) * registerEase

      positions.setXYZ(index, position.x, position.y, position.z)

      ringDummy.position.copy(position)
      ringDummy.rotation.set(-0.62, 0.08, 0)
      ringDummy.scale.setScalar(scale * (node.kind === 'now' ? 2.35 : node.kind === 'upcoming' ? 1.85 : 1.25))
      ringDummy.updateMatrix()
      ringRef.current?.setMatrixAt(index, ringDummy.matrix)
    })

    positions.needsUpdate = true
    if (materialRef.current) {
      materialRef.current.uniforms.uPointer.value.copy(smoothPointer.current)
      materialRef.current.uniforms.uPointerInfluence.value = THREE.MathUtils.damp(
        materialRef.current.uniforms.uPointerInfluence.value as number,
        Math.min(1, smoothPointer.current.length() * 1.18),
        4,
        delta,
      )
    }
    if (ringRef.current) ringRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <points ref={pointsRef} geometry={geometry} renderOrder={5}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={NODE_VERTEX_SHADER}
          fragmentShader={POINT_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
      <instancedMesh ref={ringRef} args={[undefined, undefined, TASK_NODES.length]} renderOrder={4}>
        <torusGeometry args={[1, 0.035, 6, 36]} />
        <meshBasicMaterial color={PALETTE.borderGraphite} transparent opacity={0.13} depthWrite={false} />
      </instancedMesh>
    </>
  )
}

function createLinkGeometry() {
  const positions = new Float32Array(NODE_LINKS.length * 2 * 3)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

function NodeLinks({ mode }: { mode: AuthMode }) {
  const linesRef = useRef<THREE.LineSegments>(null)
  const materialRef = useRef<THREE.LineBasicMaterial>(null)
  const geometry = useMemo(() => createLinkGeometry(), [])
  const pointA = useMemo(() => new THREE.Vector3(), [])
  const pointB = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock, pointer }, delta) => {
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute
    const elapsed = clock.getElapsedTime()

    NODE_LINKS.forEach(([start, end], index) => {
      taskPosition(start, elapsed, mode, pointA)
      taskPosition(end, elapsed, mode, pointB)
      positions.setXYZ(index * 2, pointA.x, pointA.y, pointA.z)
      positions.setXYZ(index * 2 + 1, pointB.x, pointB.y, pointB.z)
    })

    positions.needsUpdate = true

    if (materialRef.current) {
      const lift = THREE.MathUtils.clamp(pointer.length() * 0.025, 0, 0.025)
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, 0.055 + lift, 3.8, delta)
    }

    if (linesRef.current) {
      linesRef.current.rotation.z = THREE.MathUtils.damp(linesRef.current.rotation.z, pointer.x * 0.012, 2.8, delta)
    }
  })

  return (
    <lineSegments ref={linesRef} geometry={geometry} renderOrder={3}>
      <lineBasicMaterial ref={materialRef} color={PALETTE.borderGraphite} transparent opacity={0.055} depthWrite={false} />
    </lineSegments>
  )
}

function createDustGeometry() {
  const random = seededRandom(9917)
  const positions = new Float32Array(BACKGROUND_DUST_COUNT * 3)
  const colors = new Float32Array(BACKGROUND_DUST_COUNT * 3)
  const dark = new THREE.Color(PALETTE.darkLayer)
  const graphite = new THREE.Color(PALETTE.borderGraphite)
  const blue = new THREE.Color(PALETTE.deepColdBlue)

  for (let index = 0; index < BACKGROUND_DUST_COUNT; index += 1) {
    const i3 = index * 3
    positions[i3] = (random() - 0.5) * 9.6
    positions[i3 + 1] = (random() - 0.5) * 4.8
    positions[i3 + 2] = -1.5 - random() * 3.8
    dark.clone().lerp(random() > 0.92 ? blue : graphite, random() * 0.34).toArray(colors, i3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

function BackgroundDust() {
  const pointsRef = useRef<THREE.Points>(null)
  const geometry = useMemo(() => createDustGeometry(), [])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.06) * 0.05
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.01} sizeAttenuation vertexColors transparent opacity={0.13} depthWrite={false} />
    </points>
  )
}

function BlackHoleSystem({ mode }: { mode: AuthMode }) {
  const rootRef = useRef<THREE.Group>(null)
  const diskRef = useRef<THREE.Group>(null)
  const smoothPointer = useRef(new THREE.Vector2())

  useFrame(({ pointer }, delta) => {
    smoothPointer.current.lerp(pointer, 1 - Math.exp(-delta * 3.2))

    if (rootRef.current) {
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, smoothPointer.current.x * 0.075, 2.6, delta)
      rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, smoothPointer.current.y * 0.045, 2.6, delta)
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, smoothPointer.current.x * 0.1, 2.4, delta)
      rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, smoothPointer.current.y * 0.06, 2.4, delta)
    }

    if (diskRef.current) {
      diskRef.current.rotation.x = THREE.MathUtils.damp(diskRef.current.rotation.x, smoothPointer.current.y * 0.035, 2.8, delta)
      diskRef.current.rotation.y = THREE.MathUtils.damp(diskRef.current.rotation.y, smoothPointer.current.x * 0.045, 2.8, delta)
    }
  })

  return (
    <group ref={rootRef} position={[0.05, -0.02, 0]} scale={1.15}>
      <BackgroundDust />
      <group ref={diskRef}>
        <AccretionDisk mode={mode} />
        <NodeLinks mode={mode} />
        <TaskNodes mode={mode} />
      </group>
      <EventHorizon mode={mode} />
    </group>
  )
}

export function BlackHoleTaskCore({ mode }: { mode: AuthMode }) {
  return (
    <Canvas
      camera={{ fov: 35, position: [0, 0, 7.2] }}
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <BlackHoleSystem mode={mode} />
    </Canvas>
  )
}
