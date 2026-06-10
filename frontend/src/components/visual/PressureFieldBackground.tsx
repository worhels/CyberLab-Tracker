import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'

export type PressureFieldVariant = 'tasks' | 'dashboard' | 'subjects' | 'crisis' | 'stats' | 'settings'

interface PressureFieldBackgroundProps {
  intensity?: number
  opacity?: number
  speed?: number
  variant?: PressureFieldVariant
  className?: string
}

interface VariantSettings {
  seed: number
  speed: number
  dpr: number
  shaderBias: number
  lineCount: number
  dustCount: number
}

const VARIANT_SETTINGS = {
  tasks: {
    seed: 1409,
    speed: 0.58,
    dpr: 1.25,
    shaderBias: 0.1,
    lineCount: 86,
    dustCount: 230,
  },
  dashboard: {
    seed: 2617,
    speed: 0.48,
    dpr: 1.2,
    shaderBias: -0.08,
    lineCount: 72,
    dustCount: 180,
  },
  subjects: {
    seed: 3167,
    speed: 0.52,
    dpr: 1.2,
    shaderBias: -0.02,
    lineCount: 78,
    dustCount: 190,
  },
  crisis: {
    seed: 3821,
    speed: 0.68,
    dpr: 1.25,
    shaderBias: 0.24,
    lineCount: 96,
    dustCount: 260,
  },
  stats: {
    seed: 4721,
    speed: 0.42,
    dpr: 1.15,
    shaderBias: -0.12,
    lineCount: 68,
    dustCount: 160,
  },
  settings: {
    seed: 5923,
    speed: 0.32,
    dpr: 1,
    shaderBias: -0.18,
    lineCount: 48,
    dustCount: 100,
  },
} satisfies Record<PressureFieldVariant, VariantSettings>

const FIELD_Y_BIAS = 0.38
const MAX_RENDER_DPR = 1.5

const FIELD_VERTEX = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FIELD_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform float uIntensity;
uniform float uVariant;
uniform vec2 uResolution;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amp;
    p = mat2(1.62, -1.18, 1.18, 1.62) * p;
    amp *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = uv * 2.0 - 1.0;
  p.x *= aspect;
  p.y -= 0.38;

  vec2 dir = normalize(vec2(1.0, 0.34 + uVariant * 0.08));
  vec2 normal = vec2(-dir.y, dir.x);
  float along = dot(p, dir);
  float across = dot(p, normal);

  float t = uTime;
  float pressureNoise = fbm(vec2(along * 0.82 - t * 0.018, across * 1.2 + t * 0.012));
  float center = sin(along * 1.35 + t * 0.035) * 0.08;
  center += sin(along * 3.2 - t * 0.028) * 0.028;
  center += (pressureNoise - 0.5) * 0.1;

  float band = exp(-pow((across - center) / 0.52, 2.0));
  float coreBand = exp(-pow((across - center) / 0.16, 2.0));
  float fieldFade = smoothstep(-1.7, -0.72, along) * (1.0 - smoothstep(0.88, 1.74, along));

  float fibers = 0.0;
  float glow = 0.0;

  for (int i = 0; i < 42; i++) {
    float fi = float(i);
    float seed = hash21(vec2(fi * 0.137, uVariant + 2.41));
    float lane = mix(-0.82, 0.82, (fi + seed * 0.8) / 42.0);
    float laneCurve = lane * 0.44;
    float wave = sin(along * (1.1 + seed * 2.0) + t * (0.024 + seed * 0.024) + seed * 6.283) * (0.026 + seed * 0.04);
    wave += sin(along * (4.2 + seed * 3.4) - t * 0.026 + seed * 9.0) * 0.012;
    wave += (fbm(vec2(along * 1.8 + seed * 9.0, t * 0.028 + seed)) - 0.5) * 0.025;

    float d = abs(across - center - laneCurve - wave);
    float width = mix(0.0022, 0.0078, seed) * (0.72 + band * 0.82);
    float thread = 1.0 - smoothstep(width, width * 2.9, d);
    float laneFade = exp(-lane * lane * 1.9);
    float broken = smoothstep(0.24, 1.0, noise(vec2(along * 13.0 + t * 0.042, seed * 19.0)));

    fibers += thread * laneFade * fieldFade * broken;
    glow += exp(-(d * d) / max(width * width * 18.0, 0.00001)) * laneFade * fieldFade * 0.022;
  }

  float centralVeil = coreBand * fieldFade * (0.26 + pressureNoise * 0.28);
  float broadHaze = band * fieldFade * 0.1;
  float grain = hash21(floor((uv + vec2(t * 0.002, -t * 0.001)) * uResolution * 0.52)) - 0.5;
  float edge = 1.0 - smoothstep(0.46, 1.42, length((uv * 2.0 - 1.0) * vec2(0.78, 1.18)));

  vec3 base = mix(vec3(0.012, 0.012, 0.013), vec3(0.037, 0.037, 0.04), broadHaze + centralVeil * 0.8);
  vec3 light = vec3(0.86, 0.86, 0.87) * fibers * 0.34;
  light += vec3(0.72, 0.72, 0.74) * glow * 1.35;
  light += vec3(0.58, 0.58, 0.6) * centralVeil * 1.2;

  vec3 color = base + light * uIntensity;
  color += grain * 0.018;
  color *= mix(0.16, 1.0, edge);

  gl_FragColor = vec4(color, 1.0);
}
`

const FIBER_LINE_VERTEX = `
precision highp float;

attribute float aSeed;
attribute float aAlpha;
attribute float aDrift;

uniform float uTime;
uniform float uIntensity;
uniform float uReducedMotion;
uniform float uVariant;

varying float vAlpha;

void main() {
  vec3 pos = position;
  float t = mix(uTime, 9.0, step(0.5, uReducedMotion));
  vec2 dir = normalize(vec2(1.0, 0.34 + uVariant * 0.08));
  vec2 normal = vec2(-dir.y, dir.x);
  float stream = dot(pos.xy, dir);
  float drift = t * (0.02 + aDrift * 0.024);

  pos.xy += dir * sin(t * 0.035 + aSeed * 5.7) * 0.01;
  pos.xy += normal * (
    sin((stream + drift) * 5.1 + aSeed * 12.0) * 0.01 +
    sin((stream - drift) * 12.0 + aSeed * 19.0) * 0.0035
  );

  float breathe = 0.9 + 0.1 * sin(t * 0.32 + aSeed * 6.283);
  vAlpha = aAlpha * uIntensity * breathe;
  gl_Position = vec4(pos, 1.0);
}
`

const FIBER_LINE_FRAGMENT = `
precision highp float;

varying float vAlpha;

void main() {
  gl_FragColor = vec4(vec3(0.9, 0.9, 0.92), vAlpha);
}
`

const DUST_VERTEX = `
precision highp float;

attribute float aSize;
attribute float aSeed;
attribute float aAlpha;

uniform float uTime;
uniform float uDpr;
uniform float uIntensity;
uniform float uReducedMotion;
uniform float uVariant;

varying float vAlpha;

void main() {
  vec3 pos = position;
  float t = mix(uTime, 11.0, step(0.5, uReducedMotion));
  vec2 dir = normalize(vec2(1.0, 0.34 + uVariant * 0.08));
  vec2 normal = vec2(-dir.y, dir.x);
  float stream = dot(pos.xy, dir);

  pos.xy += dir * t * 0.006;
  pos.xy += normal * sin(stream * 3.6 + t * 0.05 + aSeed * 8.0) * 0.01;

  float twinkle = 0.78 + 0.22 * sin(t * 0.38 + aSeed * 10.0);
  vAlpha = aAlpha * uIntensity * twinkle;
  gl_PointSize = aSize * uDpr * (0.82 + twinkle * 0.32);
  gl_Position = vec4(pos, 1.0);
}
`

const DUST_FRAGMENT = `
precision highp float;

varying float vAlpha;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float alpha = (1.0 - smoothstep(0.18, 0.5, d)) * vAlpha;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(vec3(0.78, 0.78, 0.8), alpha);
}
`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}

function createShaderMaterial(
  vertexShader: string,
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
  blending: THREE.Blending = THREE.NormalBlending,
) {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: blending !== THREE.NormalBlending,
    depthTest: false,
    depthWrite: false,
    blending,
  })
}

function buildFiberGeometry(settings: VariantSettings, reducedMotion: boolean) {
  const random = createRandom(settings.seed)
  const lineCount = reducedMotion ? Math.floor(settings.lineCount * 0.52) : settings.lineCount
  const segments = reducedMotion ? 42 : 68
  const dir = new THREE.Vector2(1, 0.36 + settings.shaderBias * 0.08).normalize()
  const normal = new THREE.Vector2(-dir.y, dir.x)

  const positions: number[] = []
  const seeds: number[] = []
  const alphas: number[] = []
  const drifts: number[] = []

  for (let line = 0; line < lineCount; line += 1) {
    const laneRatio = lineCount === 1 ? 0.5 : line / (lineCount - 1)
    const seed = random()
    const lane = (laneRatio - 0.5) * 1.68 + (random() - 0.5) * 0.08
    const centralWeight = Math.exp(-(lane * lane) * 1.8)
    const phase = random() * Math.PI * 2
    const waveAmp = 0.018 + random() * 0.07
    const drift = 0.35 + random() * 0.65
    const alpha = (0.04 + centralWeight * 0.16 + random() * 0.03) * (0.78 + settings.shaderBias * 0.18)

    let previous: THREE.Vector2 | null = null
    let previousFade = 0

    for (let segment = 0; segment <= segments; segment += 1) {
      const progress = segment / segments
      const along = -1.68 + progress * 3.26
      const center = Math.sin(along * 1.42 + phase) * 0.08 + Math.sin(along * 3.1 - phase * 0.6) * 0.024
      const cross = lane * 0.42 + center + Math.sin(along * (4.0 + seed * 2.3) + phase) * waveAmp
      const point = dir.clone().multiplyScalar(along).add(normal.clone().multiplyScalar(cross))
      point.y += FIELD_Y_BIAS
      const edgeFade = smoothstep(0.03, 0.22, progress) * (1 - smoothstep(0.78, 0.98, progress))
      const verticalFade = 1 - smoothstep(0.72, 1.08, Math.abs(point.y))
      const pointFade = edgeFade * verticalFade

      if (previous && previousFade > 0.02 && pointFade > 0.02) {
        positions.push(previous.x, previous.y, 0, point.x, point.y, 0)
        seeds.push(seed, seed)
        alphas.push(alpha * previousFade, alpha * pointFade)
        drifts.push(drift, drift)
      }

      previous = point
      previousFade = pointFade
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('aDrift', new THREE.Float32BufferAttribute(drifts, 1))
  return geometry
}

function buildDustGeometry(settings: VariantSettings, reducedMotion: boolean) {
  const random = createRandom(settings.seed + 101)
  const count = reducedMotion ? Math.floor(settings.dustCount * 0.44) : settings.dustCount
  const dir = new THREE.Vector2(1, 0.36 + settings.shaderBias * 0.08).normalize()
  const normal = new THREE.Vector2(-dir.y, dir.x)

  const positions: number[] = []
  const sizes: number[] = []
  const seeds: number[] = []
  const alphas: number[] = []

  for (let i = 0; i < count; i += 1) {
    const seed = random()
    const along = -1.42 + random() * 2.72
    const lane = (random() - 0.5) * 0.78
    const center = Math.sin(along * 1.3 + seed * 6.0) * 0.08
    const cross = lane + center + (random() - 0.5) * 0.12
    const point = dir.clone().multiplyScalar(along).add(normal.clone().multiplyScalar(cross))
    point.y += FIELD_Y_BIAS
    const band = Math.exp(-(lane * lane) * 2.5)
    const edgeFade = 1 - smoothstep(0.74, 1.18, Math.abs(point.y))

    positions.push(point.x, point.y, 0)
    sizes.push(0.7 + random() * 1.9)
    seeds.push(seed)
    alphas.push((0.026 + random() * 0.07) * band * edgeFade)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1))
  return geometry
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(media.matches)

    updatePreference()
    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

function FieldPlane({
  intensity,
  reducedMotion,
  settings,
  speed,
}: {
  intensity: number
  reducedMotion: boolean
  settings: VariantSettings
  speed: number
}) {
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const timeRef = useRef(reducedMotion ? 9 : 0)
  const material = useMemo(
    () =>
      createShaderMaterial(FIELD_VERTEX, FIELD_FRAGMENT, {
        uTime: { value: reducedMotion ? 9 : 0 },
        uIntensity: { value: intensity },
        uVariant: { value: settings.shaderBias },
        uResolution: { value: new THREE.Vector2(1, 1) },
      }),
    [intensity, reducedMotion, settings.shaderBias],
  )

  useEffect(() => {
    material.uniforms.uResolution.value.set(size.width, size.height)
    invalidate()
  }, [invalidate, material, size.height, size.width])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (!reducedMotion) {
      timeRef.current += Math.min(delta, 0.05) * speed
      material.uniforms.uTime.value = timeRef.current
    }
  })

  return (
    <mesh frustumCulled={false} renderOrder={0}>
      <planeGeometry args={[2, 2]} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}

function FiberLines({
  intensity,
  reducedMotion,
  settings,
  speed,
}: {
  intensity: number
  reducedMotion: boolean
  settings: VariantSettings
  speed: number
}) {
  const timeRef = useRef(reducedMotion ? 9 : 0)
  const geometry = useMemo(() => buildFiberGeometry(settings, reducedMotion), [reducedMotion, settings])
  const material = useMemo(
    () =>
      createShaderMaterial(
        FIBER_LINE_VERTEX,
        FIBER_LINE_FRAGMENT,
        {
          uTime: { value: reducedMotion ? 9 : 0 },
          uIntensity: { value: intensity },
          uReducedMotion: { value: reducedMotion ? 1 : 0 },
          uVariant: { value: settings.shaderBias },
        },
        THREE.AdditiveBlending,
      ),
    [intensity, reducedMotion, settings.shaderBias],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (!reducedMotion) {
      timeRef.current += Math.min(delta, 0.05) * speed
      material.uniforms.uTime.value = timeRef.current
    }
  })

  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={2}>
      <primitive attach="material" object={material} />
    </lineSegments>
  )
}

function DustPoints({
  intensity,
  reducedMotion,
  settings,
  speed,
}: {
  intensity: number
  reducedMotion: boolean
  settings: VariantSettings
  speed: number
}) {
  const viewport = useThree((state) => state.viewport)
  const timeRef = useRef(reducedMotion ? 11 : 0)
  const geometry = useMemo(() => buildDustGeometry(settings, reducedMotion), [reducedMotion, settings])
  const material = useMemo(
    () =>
      createShaderMaterial(
        DUST_VERTEX,
        DUST_FRAGMENT,
        {
          uTime: { value: reducedMotion ? 11 : 0 },
          uDpr: { value: Math.min(viewport.dpr, settings.dpr, MAX_RENDER_DPR) },
          uIntensity: { value: intensity },
          uReducedMotion: { value: reducedMotion ? 1 : 0 },
          uVariant: { value: settings.shaderBias },
        },
        THREE.AdditiveBlending,
      ),
    [intensity, reducedMotion, settings.dpr, settings.shaderBias, viewport.dpr],
  )

  useEffect(() => {
    material.uniforms.uDpr.value = Math.min(viewport.dpr, settings.dpr, MAX_RENDER_DPR)
  }, [material, settings.dpr, viewport.dpr])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (!reducedMotion) {
      timeRef.current += Math.min(delta, 0.05) * speed
      material.uniforms.uTime.value = timeRef.current
    }
  })

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={3}>
      <primitive attach="material" object={material} />
    </points>
  )
}

function PressureFieldScene({
  intensity,
  reducedMotion,
  settings,
  speed,
}: {
  intensity: number
  reducedMotion: boolean
  settings: VariantSettings
  speed: number
}) {
  return (
    <>
      <FieldPlane intensity={intensity} reducedMotion={reducedMotion} settings={settings} speed={speed} />
      <FiberLines intensity={intensity} reducedMotion={reducedMotion} settings={settings} speed={speed} />
      <DustPoints intensity={intensity * 0.82} reducedMotion={reducedMotion} settings={settings} speed={speed} />
    </>
  )
}

export function PressureFieldBackground({
  intensity = 0.82,
  opacity = 0.2,
  speed,
  variant = 'tasks',
  className,
}: PressureFieldBackgroundProps) {
  const reducedMotion = usePrefersReducedMotion()
  const settings = VARIANT_SETTINGS[variant]
  const clampedIntensity = clamp(intensity, 0.2, 1.35)
  const clampedOpacity = clamp(opacity, 0.05, 0.75)
  const resolvedSpeed = speed ?? settings.speed
  const devicePixelRatio = typeof window === 'undefined' ? settings.dpr : window.devicePixelRatio || settings.dpr
  const dprMax = reducedMotion ? 1 : Math.min(settings.dpr, devicePixelRatio, MAX_RENDER_DPR)
  const classes = ['pressure-field-background', `pressure-field-background--${variant}`, className].filter(Boolean).join(' ')
  const style = { '--pressure-field-opacity': clampedOpacity } as CSSProperties

  return (
    <div className={classes} style={style} aria-hidden="true">
      {reducedMotion ? (
        <div className="pressure-field-background__reduced" />
      ) : (
        <Canvas
          className="pressure-field-background__canvas"
          dpr={[1, dprMax]}
          frameloop="always"
          gl={{ alpha: false, antialias: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(gl.getPixelRatio(), MAX_RENDER_DPR))
            gl.setClearColor('#050505', 1)
            gl.outputColorSpace = THREE.SRGBColorSpace
          }}
        >
          <PressureFieldScene intensity={clampedIntensity} reducedMotion={reducedMotion} settings={settings} speed={resolvedSpeed} />
        </Canvas>
      )}
      <div className="pressure-field-background__soft-mask" />
      <div className="pressure-field-background__grain" />
      <div className="pressure-field-background__vignette" />
    </div>
  )
}
