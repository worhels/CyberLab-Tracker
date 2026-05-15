import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import type { AuthMode } from './AuthShell'

interface AuthGenerativeVisualProps {
  mode: AuthMode
}

interface MotionRefs {
  active: MutableRefObject<number>
  pointer: MutableRefObject<THREE.Vector2>
}

interface QualityProfile {
  curveSegments: number
  edgeCount: number
  lineCount: number
  particleCount: number
}

const FULLSCREEN_VERTEX = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const BACKGROUND_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerStrength;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;
  float n = hash(floor((uv + uTime * 0.004) * vec2(280.0, 180.0)));
  float leftHaze = smoothstep(0.82, 0.04, distance(uv, vec2(0.08 + uPointer.x * 0.012, 0.49 + uPointer.y * 0.01)));
  float bodyHaze = smoothstep(0.62, 0.08, distance(uv, vec2(0.36, 0.52)));
  float rightDark = smoothstep(0.48, 0.78, uv.x);
  float vignette = smoothstep(1.18, 0.28, length(p * vec2(0.78, 1.0)));

  vec3 base = mix(vec3(0.043, 0.039, 0.027), vec3(0.084, 0.079, 0.063), 1.0 - rightDark);
  base += vec3(0.50, 0.49, 0.45) * leftHaze * 0.34;
  base += vec3(0.22, 0.22, 0.20) * bodyHaze * 0.16;
  base *= mix(1.0, 0.34, rightDark);
  base *= mix(0.58, 1.0, vignette);
  base += (n - 0.5) * 0.022;

  gl_FragColor = vec4(base, 1.0);
}
`

const HAZE_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerStrength;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;
  float veilA = smoothstep(0.52, 0.02, distance(uv, vec2(0.36 + sin(uTime * 0.11) * 0.01, 0.42)));
  float veilB = smoothstep(0.46, 0.04, distance(uv, vec2(0.25, 0.73)));
  float cursor = smoothstep(0.22, 0.0, distance(p, uPointer)) * uPointerStrength;
  float rightFade = 1.0 - smoothstep(0.54, 0.82, uv.x);
  float alpha = (veilA * 0.12 + veilB * 0.075 + cursor * 0.06) * rightFade;
  vec3 color = vec3(0.94, 0.93, 0.88);
  gl_FragColor = vec4(color, alpha);
}
`

const POINT_VERTEX = `
precision highp float;

attribute vec4 aMeta;
attribute float aTone;

uniform float uTime;
uniform float uMotion;
uniform float uPixelRatio;
uniform vec2 uPointer;
uniform float uPointerStrength;

varying float vAlpha;
varying float vTone;
varying float vCursor;

void main() {
  vec3 p = position;
  float phase = aMeta.z;
  float speed = aMeta.w * uMotion;
  float flow = sin(uTime * speed + phase + p.y * 9.5 + p.z * 1.7);
  float cross = cos(uTime * speed * 0.73 + phase * 1.31 + p.x * 10.0);
  float breath = sin(uTime * 0.38 + p.y * 1.9) * 0.012 * uMotion;

  p.x += flow * 0.0065 * uMotion + p.x * breath;
  p.y += cross * 0.0045 * uMotion;
  p.xy += uPointer * (0.013 + p.z * 0.012) * uPointerStrength;

  float d = distance(p.xy, uPointer);
  float local = smoothstep(0.31, 0.0, d) * uPointerStrength;
  vec2 dir = normalize(p.xy - uPointer + vec2(0.001, -0.001));
  p.xy += dir * local * 0.028;
  p.z += local * 0.05;

  gl_Position = vec4(p.xy, p.z * 0.08, 1.0);
  float twinkle = 0.86 + sin(uTime * (0.55 + aMeta.w) + phase) * 0.12 * uMotion;
  gl_PointSize = aMeta.x * uPixelRatio * (1.0 + local * 0.44) * (1.05 + p.z * 0.08);
  vAlpha = aMeta.y * twinkle * (1.0 + local * 0.24);
  vTone = aTone;
  vCursor = local;
}
`

const POINT_FRAGMENT = `
precision highp float;

varying float vAlpha;
varying float vTone;
varying float vCursor;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float disc = 1.0 - smoothstep(0.18, 0.5, d);
  if (disc * vAlpha < 0.01) discard;

  vec3 smoke = vec3(0.62, 0.61, 0.57);
  vec3 silver = vec3(0.95, 0.94, 0.90);
  vec3 cold = vec3(0.58, 0.63, 0.68);
  vec3 color = mix(smoke, silver, vTone);
  color = mix(color, cold, smoothstep(0.84, 1.0, vTone) * 0.18);
  color += vCursor * 0.08;

  gl_FragColor = vec4(color, disc * vAlpha);
}
`

const LINE_VERTEX = `
precision highp float;

attribute vec4 aLineMeta;

uniform float uTime;
uniform float uMotion;
uniform vec2 uPointer;
uniform float uPointerStrength;

varying float vAlpha;

void main() {
  vec3 p = position;
  float phase = aLineMeta.y;
  float speed = aLineMeta.z * uMotion;
  float flow = sin(uTime * speed + phase + p.y * 8.0 + p.x * 2.0);
  float cross = cos(uTime * speed * 0.68 + phase * 1.4 + p.x * 10.0);

  p.x += flow * 0.008 * uMotion;
  p.y += cross * 0.004 * uMotion;
  p.xy += uPointer * (0.012 + p.z * 0.012) * uPointerStrength;

  float d = distance(p.xy, uPointer);
  float local = smoothstep(0.34, 0.0, d) * uPointerStrength;
  vec2 dir = normalize(p.xy - uPointer + vec2(0.001, 0.001));
  p.xy += dir * local * 0.021;

  gl_Position = vec4(p.xy, p.z * 0.06, 1.0);
  vAlpha = aLineMeta.x * (0.88 + sin(uTime * 0.33 + phase) * 0.12 * uMotion) * (1.0 + local * 0.28);
}
`

const LINE_FRAGMENT = `
precision highp float;

varying float vAlpha;

void main() {
  gl_FragColor = vec4(0.88, 0.87, 0.82, vAlpha);
}
`

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

function useGlobalPointer() {
  const pointer = useRef(new THREE.Vector2(-0.22, 0.08))
  const active = useRef(0)

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      pointer.current.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
      active.current = 1
    }
    const deactivate = () => {
      active.current = 0
    }

    window.addEventListener('pointermove', updatePointer, { passive: true })
    window.addEventListener('pointerleave', deactivate)
    window.addEventListener('blur', deactivate)

    return () => {
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('pointerleave', deactivate)
      window.removeEventListener('blur', deactivate)
    }
  }, [])

  return { active, pointer }
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

function bell(value: number, center: number, spread: number) {
  const distance = (value - center) / spread
  return Math.exp(-distance * distance)
}

function getQualityProfile(reducedMotion: boolean): QualityProfile {
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth
  const height = typeof window === 'undefined' ? 900 : window.innerHeight
  const cores = typeof navigator === 'undefined' ? 8 : navigator.hardwareConcurrency || 8
  const area = width * height
  const weakFactor = cores <= 4 ? 0.58 : cores <= 6 ? 0.76 : 1
  const sizeFactor = width < 720 ? 0.52 : width < 1100 ? 0.76 : 1
  const motionFactor = reducedMotion ? 0.58 : 1
  const factor = weakFactor * sizeFactor * motionFactor

  return {
    curveSegments: width < 720 ? 60 : 86,
    edgeCount: Math.floor(clamp(area / 590, 900, 2700) * factor),
    lineCount: Math.floor(clamp(width / 3.1, 230, 520) * factor),
    particleCount: Math.floor(clamp(area / 46, 9000, 28000) * factor),
  }
}

function shapeCenterX(t: number, mode: AuthMode) {
  const registerBias = mode === 'register' ? -0.025 : 0
  const upperLean = bell(t, 0.2, 0.18) * 0.16
  const waistPull = bell(t, 0.55, 0.16) * -0.08
  const lowerLean = bell(t, 0.82, 0.18) * 0.1
  return -0.42 + registerBias + upperLean + waistPull + lowerLean + Math.sin(t * Math.PI * 2.15 + 0.35) * 0.045 + Math.sin(t * Math.PI * 6.2 + 1.4) * 0.018
}

function shapeRadiusX(t: number) {
  return (
    0.035 +
    bell(t, 0.13, 0.13) * 0.24 +
    bell(t, 0.32, 0.19) * 0.31 +
    bell(t, 0.53, 0.13) * 0.085 +
    bell(t, 0.72, 0.17) * 0.24 +
    bell(t, 0.91, 0.1) * 0.31
  )
}

function shapeRadiusY(t: number) {
  return 0.014 + bell(t, 0.36, 0.26) * 0.048 + bell(t, 0.76, 0.2) * 0.074
}

function shapeY(t: number) {
  return 0.96 - t * 1.92
}

function pointOnSculpture(t: number, lane: number, phase: number, mode: AuthMode) {
  const radiusX = shapeRadiusX(t)
  const center = shapeCenterX(t, mode)
  const twist = Math.sin(t * Math.PI * 2.7 + phase * 0.35) * 0.14
  const x =
    center +
    (lane + twist) * radiusX +
    Math.sin(t * Math.PI * 3.4 + phase) * radiusX * 0.12 +
    Math.sin(t * Math.PI * 11.0 + phase * 0.4) * 0.012
  const y = shapeY(t) + Math.cos(t * Math.PI * 5.2 + phase) * shapeRadiusY(t)
  const z = Math.sin(t * Math.PI * 2.0 + phase) * 0.28 + lane * 0.08

  return { x, y, z }
}

function pickVerticalT(random: () => number) {
  const bucket = random()
  if (bucket < 0.34) return clamp(0.32 + (random() - 0.5) * 0.36, 0.02, 0.98)
  if (bucket < 0.74) return clamp(0.7 + (random() - 0.5) * 0.34, 0.02, 0.98)
  if (bucket < 0.88) return clamp(0.16 + (random() - 0.5) * 0.24, 0.02, 0.98)
  return random()
}

function createParticleGeometry(mode: AuthMode, profile: QualityProfile) {
  const random = createRandom(mode === 'login' ? 11037 : 22891)
  const positions = new Float32Array(profile.particleCount * 3)
  const meta = new Float32Array(profile.particleCount * 4)
  const tone = new Float32Array(profile.particleCount)

  for (let index = 0; index < profile.particleCount; index += 1) {
    const t = pickVerticalT(random)
    const angle = random() * Math.PI * 2
    const radial = random() > 0.42 ? 0.72 + random() * 0.3 : Math.pow(random(), 0.8) * 0.76
    const center = shapeCenterX(t, mode)
    const radiusX = shapeRadiusX(t)
    const radiusY = shapeRadiusY(t)
    const i3 = index * 3
    const i4 = index * 4

    positions[i3] =
      center +
      Math.cos(angle) * radiusX * radial +
      Math.sin(t * 23.0 + random() * 3.0) * 0.014 +
      (random() - 0.5) * 0.025
    positions[i3 + 1] = shapeY(t) + Math.sin(angle) * radiusY * radial + Math.sin(t * 13.0 + random() * 4.0) * 0.012
    positions[i3 + 2] = (random() - 0.5) * 0.58 + radial * 0.18

    const surfaceAlpha = radial > 0.7 ? 0.09 : 0
    const coreAlpha = 0.11 + surfaceAlpha + bell(t, 0.42, 0.31) * 0.24 + bell(t, 0.76, 0.2) * 0.35
    const sparkle = random() > 0.92 ? 0.18 + random() * 0.22 : 0
    const largeDot = random() > 0.962
    meta[i4] = largeDot ? 4.1 + random() * 3.0 : 1.25 + random() * 2.15
    meta[i4 + 1] = clamp(coreAlpha + sparkle + random() * 0.12, 0.08, 0.88)
    meta[i4 + 2] = random() * Math.PI * 2
    meta[i4 + 3] = 0.18 + random() * 0.9
    tone[index] = clamp(0.28 + random() * 0.7 + sparkle * 0.9, 0, 1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aMeta', new THREE.BufferAttribute(meta, 4))
  geometry.setAttribute('aTone', new THREE.BufferAttribute(tone, 1))
  geometry.computeBoundingSphere()
  return geometry
}

function createFlowLineGeometry(mode: AuthMode, profile: QualityProfile) {
  const random = createRandom(mode === 'login' ? 39197 : 57163)
  const vertexCount = profile.lineCount * profile.curveSegments * 2
  const positions = new Float32Array(vertexCount * 3)
  const meta = new Float32Array(vertexCount * 4)
  let cursor = 0
  let metaCursor = 0

  for (let line = 0; line < profile.lineCount; line += 1) {
    const lane = (line / Math.max(1, profile.lineCount - 1) - 0.5) * 2.35 + (random() - 0.5) * 0.16
    const phase = random() * Math.PI * 2
    const speed = 0.08 + random() * 0.34
    const alpha = 0.018 + random() * 0.086 + (Math.abs(lane) < 0.42 ? 0.038 : 0)
    let previous = pointOnSculpture(0, lane, phase, mode)

    for (let step = 1; step <= profile.curveSegments; step += 1) {
      const t = step / profile.curveSegments
      const current = pointOnSculpture(t, lane, phase, mode)
      const fadeTopBottom = bell(t, 0.48, 0.46)
      const localAlpha = alpha * (0.52 + fadeTopBottom * 0.72)

      positions[cursor] = previous.x
      positions[cursor + 1] = previous.y
      positions[cursor + 2] = previous.z
      positions[cursor + 3] = current.x
      positions[cursor + 4] = current.y
      positions[cursor + 5] = current.z
      cursor += 6

      for (let copy = 0; copy < 2; copy += 1) {
        meta[metaCursor] = localAlpha
        meta[metaCursor + 1] = phase
        meta[metaCursor + 2] = speed
        meta[metaCursor + 3] = lane
        metaCursor += 4
      }

      previous = current
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aLineMeta', new THREE.BufferAttribute(meta, 4))
  geometry.computeBoundingSphere()
  return geometry
}

function createNetworkGeometry(mode: AuthMode, profile: QualityProfile) {
  const random = createRandom(mode === 'login' ? 71921 : 81911)
  const vertexCount = profile.edgeCount * 2
  const positions = new Float32Array(vertexCount * 3)
  const meta = new Float32Array(vertexCount * 4)
  let cursor = 0
  let metaCursor = 0

  for (let edge = 0; edge < profile.edgeCount; edge += 1) {
    const t = clamp(0.35 + random() * 0.58, 0.02, 0.98)
    const phase = random() * Math.PI * 2
    const laneA = (random() - 0.5) * 1.42
    const laneB = laneA + (random() - 0.5) * 0.24
    const a = pointOnSculpture(t + (random() - 0.5) * 0.018, laneA, phase, mode)
    const b = pointOnSculpture(t + (random() - 0.5) * 0.038, laneB, phase + random() * 0.4, mode)
    const alpha = (0.015 + random() * 0.055) * (bell(t, 0.69, 0.27) + 0.42)
    const speed = 0.06 + random() * 0.18

    positions[cursor] = a.x
    positions[cursor + 1] = a.y
    positions[cursor + 2] = a.z
    positions[cursor + 3] = b.x
    positions[cursor + 4] = b.y
    positions[cursor + 5] = b.z
    cursor += 6

    for (let copy = 0; copy < 2; copy += 1) {
      meta[metaCursor] = alpha
      meta[metaCursor + 1] = phase
      meta[metaCursor + 2] = speed
      meta[metaCursor + 3] = laneA
      metaCursor += 4
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aLineMeta', new THREE.BufferAttribute(meta, 4))
  geometry.computeBoundingSphere()
  return geometry
}

function createContourGeometry(mode: AuthMode, profile: QualityProfile) {
  const random = createRandom(mode === 'login' ? 99317 : 44719)
  const ringCount = Math.floor(profile.lineCount * 0.18)
  const ringSegments = 56
  const vertexCount = ringCount * ringSegments * 2
  const positions = new Float32Array(vertexCount * 3)
  const meta = new Float32Array(vertexCount * 4)
  let cursor = 0
  let metaCursor = 0

  for (let ring = 0; ring < ringCount; ring += 1) {
    const t = clamp(0.04 + (ring / Math.max(1, ringCount - 1)) * 0.9 + (random() - 0.5) * 0.012, 0.02, 0.98)
    const radius = shapeRadiusX(t)
    const radiusY = 0.022 + shapeRadiusY(t) * 0.82
    const center = shapeCenterX(t, mode)
    const phase = random() * Math.PI * 2
    const alpha = (0.014 + random() * 0.036) * (0.48 + bell(t, 0.36, 0.26) + bell(t, 0.78, 0.23))
    const speed = 0.04 + random() * 0.13

    for (let step = 0; step < ringSegments; step += 1) {
      const a0 = (step / ringSegments) * Math.PI * 2
      const a1 = ((step + 1) / ringSegments) * Math.PI * 2
      const twist0 = Math.sin(t * Math.PI * 2.7 + a0 * 0.35) * 0.09
      const twist1 = Math.sin(t * Math.PI * 2.7 + a1 * 0.35) * 0.09
      const x0 = center + Math.cos(a0 + phase * 0.08) * radius * (0.72 + Math.sin(a0 * 2.0 + phase) * 0.08) + twist0
      const y0 = shapeY(t) + Math.sin(a0) * radiusY + Math.sin(a0 * 3.0 + phase) * 0.008
      const z0 = Math.sin(a0 + phase) * 0.24
      const x1 = center + Math.cos(a1 + phase * 0.08) * radius * (0.72 + Math.sin(a1 * 2.0 + phase) * 0.08) + twist1
      const y1 = shapeY(t) + Math.sin(a1) * radiusY + Math.sin(a1 * 3.0 + phase) * 0.008
      const z1 = Math.sin(a1 + phase) * 0.24

      positions[cursor] = x0
      positions[cursor + 1] = y0
      positions[cursor + 2] = z0
      positions[cursor + 3] = x1
      positions[cursor + 4] = y1
      positions[cursor + 5] = z1
      cursor += 6

      for (let copy = 0; copy < 2; copy += 1) {
        meta[metaCursor] = alpha
        meta[metaCursor + 1] = phase
        meta[metaCursor + 2] = speed
        meta[metaCursor + 3] = t
        metaCursor += 4
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aLineMeta', new THREE.BufferAttribute(meta, 4))
  geometry.computeBoundingSphere()
  return geometry
}

function makeCommonUniforms(reducedMotion: boolean) {
  return {
    uMotion: { value: reducedMotion ? 0 : 1 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.55) },
    uPointer: { value: new THREE.Vector2(-0.22, 0.08) },
    uPointerStrength: { value: 0 },
    uTime: { value: 0 },
  }
}

function useMotionUniforms(materialRef: React.RefObject<THREE.ShaderMaterial | null>, motion: MotionRefs, reducedMotion: boolean) {
  const smoothPointer = useRef(new THREE.Vector2(-0.22, 0.08))
  const smoothStrength = useRef(0)

  useFrame(({ clock }, delta) => {
    const material = materialRef.current
    if (!material) return

    const targetStrength = reducedMotion ? 0 : motion.active.current
    smoothPointer.current.lerp(motion.pointer.current, 1 - Math.exp(-delta * 3.6))
    smoothStrength.current = THREE.MathUtils.damp(smoothStrength.current, targetStrength, 4.8, delta)

    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uMotion.value = reducedMotion ? 0 : 1
    material.uniforms.uPointer.value.copy(smoothPointer.current)
    material.uniforms.uPointerStrength.value = smoothStrength.current
  })
}

function BackgroundField({ motion, reducedMotion }: { motion: MotionRefs; reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => makeCommonUniforms(reducedMotion), [reducedMotion])
  useMotionUniforms(materialRef, motion, reducedMotion)

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={materialRef} uniforms={uniforms} vertexShader={FULLSCREEN_VERTEX} fragmentShader={BACKGROUND_FRAGMENT} depthWrite={false} depthTest={false} />
    </mesh>
  )
}

function HazeField({ motion, reducedMotion }: { motion: MotionRefs; reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => makeCommonUniforms(reducedMotion), [reducedMotion])
  useMotionUniforms(materialRef, motion, reducedMotion)

  return (
    <mesh frustumCulled={false} renderOrder={5}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={FULLSCREEN_VERTEX}
        fragmentShader={HAZE_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function ParticleVolume({ mode, motion, profile, reducedMotion }: { mode: AuthMode; motion: MotionRefs; profile: QualityProfile; reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createParticleGeometry(mode, profile), [mode, profile])
  const uniforms = useMemo(() => makeCommonUniforms(reducedMotion), [reducedMotion])
  useMotionUniforms(materialRef, motion, reducedMotion)

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={4}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={POINT_VERTEX}
        fragmentShader={POINT_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function FlowLines({ mode, motion, profile, reducedMotion }: { mode: AuthMode; motion: MotionRefs; profile: QualityProfile; reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createFlowLineGeometry(mode, profile), [mode, profile])
  const uniforms = useMemo(() => makeCommonUniforms(reducedMotion), [reducedMotion])
  useMotionUniforms(materialRef, motion, reducedMotion)

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={LINE_VERTEX}
        fragmentShader={LINE_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

function LocalMesh({ mode, motion, profile, reducedMotion }: { mode: AuthMode; motion: MotionRefs; profile: QualityProfile; reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createNetworkGeometry(mode, profile), [mode, profile])
  const uniforms = useMemo(() => makeCommonUniforms(reducedMotion), [reducedMotion])
  useMotionUniforms(materialRef, motion, reducedMotion)

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={LINE_VERTEX}
        fragmentShader={LINE_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

function ContourMesh({ mode, motion, profile, reducedMotion }: { mode: AuthMode; motion: MotionRefs; profile: QualityProfile; reducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const geometry = useMemo(() => createContourGeometry(mode, profile), [mode, profile])
  const uniforms = useMemo(() => makeCommonUniforms(reducedMotion), [reducedMotion])
  useMotionUniforms(materialRef, motion, reducedMotion)

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={LINE_VERTEX}
        fragmentShader={LINE_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

function GenerativeScene({ mode, motion, profile, reducedMotion }: { mode: AuthMode; motion: MotionRefs; profile: QualityProfile; reducedMotion: boolean }) {
  return (
    <>
      <BackgroundField motion={motion} reducedMotion={reducedMotion} />
      <HazeField motion={motion} reducedMotion={reducedMotion} />
      <FlowLines mode={mode} motion={motion} profile={profile} reducedMotion={reducedMotion} />
      <ContourMesh mode={mode} motion={motion} profile={profile} reducedMotion={reducedMotion} />
      <LocalMesh mode={mode} motion={motion} profile={profile} reducedMotion={reducedMotion} />
      <ParticleVolume mode={mode} motion={motion} profile={profile} reducedMotion={reducedMotion} />
    </>
  )
}

export function AuthGenerativeVisual({ mode }: AuthGenerativeVisualProps) {
  const reducedMotion = usePrefersReducedMotion()
  const motion = useGlobalPointer()
  const profile = useMemo(() => getQualityProfile(reducedMotion), [reducedMotion])

  return (
    <div className={`auth-generative-visual auth-generative-visual--${mode}`}>
      <Canvas
        className="auth-generative-canvas"
        dpr={[1, 1.55]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <GenerativeScene mode={mode} motion={motion} profile={profile} reducedMotion={reducedMotion} />
      </Canvas>
      <div className="auth-generative-grain" />
      <div className="auth-generative-vignette" />
      <div className="auth-micro-type auth-micro-type--left">
        <span>CYBERLAB TRACKER</span>
        <span>LAB LOAD VECTOR / STATUS FIELD</span>
        <span>DEADLINE PRESSURE MAP</span>
        <span>CRISIS SORT ACTIVE</span>
        <span>SUBJECT NODES NORMALIZED</span>
      </div>
      <div className="auth-micro-type auth-micro-type--right">
        <span>PARTICLE INDEX 04.29</span>
        <span>WIRE VEIL / LOCAL MESH</span>
        <span>PRIORITY GRAVITY 00.71</span>
        <span>ACCEPTANCE SIGNAL LOW</span>
        <span>REPORT TRACE READY</span>
      </div>
      <div className="auth-micro-type auth-micro-type--bottom">NOCTURNE FIELD / STUDY ORGANISM</div>
    </div>
  )
}
