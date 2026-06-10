import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'
import type { AuthMode } from './AuthShell'

interface AuthGenerativeVisualProps {
  mode: AuthMode
}

type QualityTier = 'high' | 'mid' | 'low'

interface QualityProfile {
  tier: QualityTier
  dpr: number
  surfaceParticles: number
  coreParticles: number
  dustParticles: number
  highlightParticles: number
  lowerNodes: number
  verticalContourCurves: number
  upperRibbonCurves: number
  cavityContourCurves: number
  waistFlowCurves: number
  lowerMeshLinks: number
  atmosphericArcs: number
  bloom: boolean
  chromatic: boolean
}

interface SharedUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>
  uDelta: THREE.IUniform<number>
  uViewport: THREE.IUniform<THREE.Vector2>
  uResolution: THREE.IUniform<THREE.Vector2>
  uDpr: THREE.IUniform<number>
  uMaskTex0: THREE.IUniform<THREE.DataTexture>
  uMaskTex1: THREE.IUniform<THREE.DataTexture>
  uMaskTex2: THREE.IUniform<THREE.DataTexture>
  uPointer: THREE.IUniform<THREE.Vector2>
  uPointerSmooth: THREE.IUniform<THREE.Vector2>
  uPointerVelocity: THREE.IUniform<THREE.Vector2>
  uParallaxAmp: THREE.IUniform<THREE.Vector2>
  uRepulseRadius: THREE.IUniform<number>
  uRepulseStrength: THREE.IUniform<number>
  uDistortGain: THREE.IUniform<number>
  uCursorGlow: THREE.IUniform<number>
  uHazeGain: THREE.IUniform<number>
  uLeftLightBias: THREE.IUniform<number>
  uVeilAlpha: THREE.IUniform<number>
  uVeilCurlAmp: THREE.IUniform<number>
  uVeilMotion: THREE.IUniform<number>
  uCoreAlpha: THREE.IUniform<number>
  uCoreContrast: THREE.IUniform<number>
  uAccentMix: THREE.IUniform<number>
  uRibbonBoost: THREE.IUniform<number>
  uRibbonWidth: THREE.IUniform<number>
  uCavityStrength: THREE.IUniform<number>
  uCavitySoftness: THREE.IUniform<number>
  uLowerMeshAlpha: THREE.IUniform<number>
  uNodeContrast: THREE.IUniform<number>
  uNodePulse: THREE.IUniform<number>
  uDustGain: THREE.IUniform<number>
  uDustMotion: THREE.IUniform<number>
  uMicroAlphaLeft: THREE.IUniform<number>
  uMicroAlphaRight: THREE.IUniform<number>
}

interface MaskTextures {
  tex0: THREE.DataTexture
  tex1: THREE.DataTexture
  tex2: THREE.DataTexture
}

interface CurveLayers {
  vertical: Float32Array
  ribbons: Float32Array
  cavity: Float32Array
  waist: Float32Array
  atmosphere: Float32Array
  terminals: Float32Array
  lowerLinks: Float32Array
  crestPolylines: Float32Array[]
}

interface LowerNodeBuild {
  geometry: THREE.InstancedBufferGeometry
  links: Float32Array
}

const MASK_WIDTH = 64
const MASK_HEIGHT = 96
const RIGHT_RESERVE = 0.72
const SCULPTURE_SHIFT_X = -0.28
const MAX_RENDER_DPR = 1.5
const BLOOM_BUFFER_SIZE = 512
const TARGET_FPS = 60

const SPINE_POINTS: Array<[number, number, number]> = [
  [0.60, -0.22, 0.08],
  [0.59, -0.10, 0.06],
  [0.58, 0.02, 0.05],
  [0.55, 0.09, 0.02],
  [0.49, 0.18, -0.03],
  [0.42, 0.3, -0.09],
  [0.39, 0.48, -0.07],
  [0.43, 0.62, -0.02],
  [0.49, 0.74, 0.03],
  [0.54, 0.88, 0.07],
  [0.58, 0.98, 0.1],
  [0.60, 1.10, 0.12],
  [0.61, 1.22, 0.13],
]

const QUALITY_PRESETS: Record<QualityTier, Omit<QualityProfile, 'tier'>> = {
  high: {
    dpr: 1.5,
    surfaceParticles: 76000,
    coreParticles: 56000,
    dustParticles: 42000,
    highlightParticles: 14000,
    lowerNodes: 520,
    verticalContourCurves: 640,
    upperRibbonCurves: 140,
    cavityContourCurves: 80,
    waistFlowCurves: 160,
    lowerMeshLinks: 460,
    atmosphericArcs: 64,
    bloom: true,
    chromatic: true,
  },
  mid: {
    dpr: 1.25,
    surfaceParticles: 42000,
    coreParticles: 30000,
    dustParticles: 24000,
    highlightParticles: 6000,
    lowerNodes: 280,
    verticalContourCurves: 360,
    upperRibbonCurves: 72,
    cavityContourCurves: 48,
    waistFlowCurves: 80,
    lowerMeshLinks: 240,
    atmosphericArcs: 24,
    bloom: true,
    chromatic: false,
  },
  low: {
    dpr: 1,
    surfaceParticles: 28000,
    coreParticles: 20000,
    dustParticles: 16000,
    highlightParticles: 4000,
    lowerNodes: 180,
    verticalContourCurves: 240,
    upperRibbonCurves: 48,
    cavityContourCurves: 32,
    waistFlowCurves: 56,
    lowerMeshLinks: 160,
    atmosphericArcs: 12,
    bloom: false,
    chromatic: false,
  },
}

const FULLSCREEN_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const BACKGROUND_FRAGMENT = `
precision highp float;
uniform float uTime;
uniform sampler2D uMaskTex0;
uniform sampler2D uMaskTex1;
uniform sampler2D uMaskTex2;
uniform float uHazeGain;
uniform float uLeftLightBias;
uniform float uVeilAlpha;
uniform float uRibbonBoost;
uniform float uCavityStrength;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  float leftHaze = texture2D(uMaskTex0, uv).r * uHazeGain;
  float upperVeil = texture2D(uMaskTex0, uv).g * uVeilAlpha;
  float core = texture2D(uMaskTex0, uv).b;
  float cavity = texture2D(uMaskTex0, uv).a * uCavityStrength;
  float lower = texture2D(uMaskTex1, uv).r;
  float dust = texture2D(uMaskTex1, uv).g;
  float ribbon = texture2D(uMaskTex2, uv).r * uRibbonBoost;
  float rightReserve = smoothstep(0.62, 0.9, uv.x);

  vec3 base = mix(vec3(0.070, 0.070, 0.074), vec3(0.012, 0.012, 0.013), smoothstep(0.4, 0.9, uv.x));
  base += vec3(0.58, 0.58, 0.60) * leftHaze * (0.19 + uLeftLightBias * 0.16);
  base += vec3(0.84, 0.84, 0.86) * upperVeil * 0.12;
  base += vec3(0.80, 0.80, 0.82) * ribbon * 0.09;
  base += vec3(0.22, 0.22, 0.24) * core * 0.08;
  base += vec3(0.16, 0.16, 0.17) * lower * 0.05;
  base += vec3(0.65, 0.65, 0.67) * dust * 0.025;
  base *= 1.0 - rightReserve * 0.84;
  base *= 1.0 - cavity * 0.18;

  float grain = hash(floor((uv + vec2(uTime * 0.003, -uTime * 0.0015)) * vec2(960.0, 540.0))) - 0.5;
  base += grain * 0.018;

  gl_FragColor = vec4(base, 1.0);
}
`

const POINT_VERTEX = `
precision highp float;
attribute vec3 aBasePosition;
attribute vec3 aSecondaryPosition;
attribute vec4 aParams0;
attribute vec4 aParams1;
attribute vec4 aColor;

uniform float uTime;
uniform float uDelta;
uniform vec2 uViewport;
uniform vec2 uResolution;
uniform float uDpr;
uniform sampler2D uMaskTex0;
uniform sampler2D uMaskTex1;
uniform sampler2D uMaskTex2;
uniform vec2 uPointer;
uniform vec2 uPointerSmooth;
uniform vec2 uPointerVelocity;
uniform vec2 uParallaxAmp;
uniform float uRepulseRadius;
uniform float uRepulseStrength;
uniform float uDistortGain;
uniform float uCursorGlow;
uniform float uVeilMotion;
uniform float uCoreAlpha;
uniform float uCoreContrast;
uniform float uAccentMix;
uniform float uCavityStrength;
uniform float uDustGain;
uniform float uDustMotion;

varying vec4 vColor;
varying float vAlpha;
varying float vGroup;

void main() {
  vec3 base = aBasePosition;
  vec3 secondary = aSecondaryPosition;
  float size = aParams0.x;
  float alpha = aParams0.y;
  float groupId = aParams0.z;
  float depthBias = aParams0.w;
  float phase = aParams1.x;
  float speed = aParams1.y;
  float seed = aParams1.z;
  float density = aParams1.w;

  float oscillation = sin(uTime * (0.35 + speed) + phase) * 0.5 + 0.5;
  vec3 pos = mix(base, secondary, oscillation);
  pos.x += sin(uTime * (0.16 + speed * 0.3) + seed * 7.3 + pos.y * 2.4) * uDistortGain;
  pos.y += cos(uTime * (0.14 + speed * 0.2) + seed * 5.7 + pos.x * 3.1) * uDistortGain * 0.75;

  vec2 screenUv = vec2(base.x * 0.5 + 0.5, 0.5 - base.y * 0.5);
  float cavity = texture2D(uMaskTex0, screenUv).a * uCavityStrength;
  float veil = texture2D(uMaskTex0, screenUv).g;
  float core = texture2D(uMaskTex0, screenUv).b;
  float dust = texture2D(uMaskTex1, screenUv).g;
  float ribbon = texture2D(uMaskTex2, screenUv).r;

  vec2 pointer = uPointerSmooth;
  float d = length(pos.xy - pointer);
  float falloff = exp(-pow(d / max(uRepulseRadius, 1e-4), 2.0));
  vec2 repulseDir = normalize(pos.xy - pointer + vec2(1e-4, -1e-4));
  pos.xy += repulseDir * (uRepulseStrength * falloff);
  pos.xy += pointer * vec2(uParallaxAmp.x, uParallaxAmp.y);
  pos.xy += uPointerVelocity * 0.00035;
  pos.z += (falloff * 0.05 + ribbon * 0.03 - cavity * 0.07) + depthBias;

  float motion = sin(uTime * (uVeilMotion + speed * 0.15) + phase + pos.y * 5.0);
  pos.x += motion * 0.004 * (groupId < 2.5 ? 1.0 : 0.5);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float groupScale = 1.0;
  if (groupId > 2.5) {
    groupScale = mix(0.65, 1.25, dust);
  } else if (groupId > 1.5) {
    groupScale = mix(0.9, 1.45, ribbon);
  } else if (groupId > 0.5) {
    groupScale = mix(0.95, 1.4, core * uCoreContrast);
  } else {
    groupScale = mix(0.85, 1.15, veil);
  }

  float cursorGlow = uCursorGlow * falloff;
  gl_PointSize = max(0.2, size * groupScale * uDpr * (1.0 + cursorGlow * 0.85)) * 0.55;
  gl_PointSize *= 1.0 + abs(mvPosition.z) * 0.03;

  float groupAlpha = alpha;
  if (groupId > 2.5) {
    groupAlpha *= uDustGain * mix(0.45, 1.0, dust);
    groupAlpha *= 1.0 + sin(uTime * (uDustMotion * 4.0 + seed * 2.0)) * 0.12;
  } else if (groupId > 1.5) {
    groupAlpha *= mix(0.7, 1.45, ribbon);
  } else if (groupId > 0.5) {
    groupAlpha *= uCoreAlpha * mix(0.7, 1.3, core);
  } else {
    groupAlpha *= mix(0.6, 1.0, density);
  }
  groupAlpha *= (1.0 - cavity * 0.72);

  vec3 color = aColor.rgb;
  if (groupId > 0.5 && groupId < 1.5) {
    float accent = smoothstep(0.7, 1.0, core) * uAccentMix;
    vec3 cool = vec3(0.52, 0.56, 0.88);
    vec3 warm = vec3(0.64, 0.57, 0.44);
    color = mix(color, mix(cool, warm, fract(seed * 13.7)), accent);
  }
  color += cursorGlow * 0.06;

  vColor = vec4(color, aColor.a);
  vAlpha = max(0.0, groupAlpha);
  vGroup = groupId;
}
`

const POINT_FRAGMENT = `
precision highp float;
varying vec4 vColor;
varying float vAlpha;
varying float vGroup;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  float disc = 1.0 - smoothstep(0.2, 0.5, d);
  float rim = smoothstep(0.42, 0.08, d) * 0.18;
  float alpha = disc * vAlpha;
  if (alpha < 0.003) discard;

  vec3 color = vColor.rgb;
  if (vGroup > 1.5 && vGroup < 2.5) {
    color += vec3(0.04, 0.04, 0.04);
  }
  if (vGroup > 2.5) {
    color *= 0.88;
  }
  color += rim;

  gl_FragColor = vec4(color, alpha * vColor.a);
}
`

const NODE_VERTEX = `
precision highp float;
attribute vec3 aInstancePosition;
attribute float aInstanceSize;
attribute float aInstanceSeed;
attribute float aInstanceAlpha;

uniform float uTime;
uniform float uNodePulse;
uniform vec2 uPointerSmooth;
uniform float uRepulseRadius;
uniform float uRepulseStrength;
uniform float uDistortGain;

varying vec2 vUv;
varying float vAlpha;
varying float vPulse;

void main() {
  vec3 center = aInstancePosition;
  float pulse = 1.0 + sin(uTime * 0.8 + aInstanceSeed * 12.0) * uNodePulse;
  float size = aInstanceSize * pulse;
  vec3 mvCenter = (modelViewMatrix * vec4(center, 1.0)).xyz;
  vec2 quad = position.xy * size;

  float d = length(center.xy - uPointerSmooth);
  float falloff = exp(-pow(d / max(uRepulseRadius, 1e-4), 2.0));
  vec2 repulseDir = normalize(center.xy - uPointerSmooth + vec2(1e-4));
  vec2 repulse = repulseDir * uRepulseStrength * falloff * 0.6;

  mvCenter.xy += repulse;
  mvCenter.xy += vec2(
    sin(uTime * 0.22 + aInstanceSeed * 6.0),
    cos(uTime * 0.27 + aInstanceSeed * 4.0)
  ) * uDistortGain * 0.5;
  mvCenter.xy += quad;

  gl_Position = projectionMatrix * vec4(mvCenter, 1.0);
  vUv = uv;
  vAlpha = aInstanceAlpha * (1.0 - falloff * 0.35);
  vPulse = pulse;
}
`

const NODE_FRAGMENT = `
precision highp float;
uniform float uNodeContrast;
varying vec2 vUv;
varying float vAlpha;
varying float vPulse;

void main() {
  vec2 centered = vUv - 0.5;
  float d = length(centered);
  float core = 1.0 - smoothstep(0.08, 0.48, d);
  float ring = smoothstep(0.48, 0.18, d) * 0.32;
  float alpha = (core + ring) * vAlpha;
  if (alpha < 0.02) discard;

  vec3 darkNode = vec3(0.06, 0.06, 0.065);
  vec3 highlight = vec3(0.82, 0.82, 0.84);
  vec3 color = mix(darkNode, highlight, core * 0.35 + ring * uNodeContrast * 0.2);
  color *= 0.9 + (vPulse - 1.0) * 0.25;

  gl_FragColor = vec4(color, alpha);
}
`

const POST_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const POST_FRAGMENT = `
precision highp float;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
uniform float uGrain;
uniform float uVignette;
uniform float uChromatic;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  vec2 px = 1.0 / max(uResolution, vec2(1.0));
  vec3 color;
  if (uChromatic > 0.0) {
    float ca = uChromatic * (0.4 + smoothstep(0.4, 0.95, uv.x));
    color.r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
    color.g = texture2D(tDiffuse, uv).g;
    color.b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;
  } else {
    color = texture2D(tDiffuse, uv).rgb;
  }

  float grain = hash(floor((uv + vec2(uTime * 0.01, -uTime * 0.005)) * uResolution)) - 0.5;
  color += grain * uGrain;

  vec2 p = uv * 2.0 - 1.0;
  float vig = smoothstep(1.12, 0.26, length(p * vec2(0.86, 1.0)));
  color *= mix(1.0 - uVignette, 1.0, vig);

  gl_FragColor = vec4(color, 1.0);
}
`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}

function gaussian(value: number, center: number, width: number) {
  const d = (value - center) / width
  return Math.exp(-(d * d))
}

function toWorld(nx: number, ny: number, z = 0) {
  return new THREE.Vector3(nx * 2 - 1, 1 - ny * 2, z)
}

function toScreen(point: THREE.Vector3) {
  return {
    x: point.x * 0.5 + 0.5,
    y: 0.5 - point.y * 0.5,
  }
}

function shiftNormalizedX(nx: number) {
  return nx + SCULPTURE_SHIFT_X
}

function reserveWeight(nx: number) {
  return smoothstep(RIGHT_RESERVE - 0.12, RIGHT_RESERVE + 0.08, nx)
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

function cavityMask(nx: number, ny: number) {
  const sampleX = nx - SCULPTURE_SHIFT_X
  const cavity1 = Math.exp(-(Math.pow((sampleX - 0.66) / 0.07, 2) + Math.pow((ny - 0.31) / 0.05, 2)))
  const cavity2 = Math.exp(-(Math.pow((sampleX - 0.6) / 0.11, 2) + Math.pow((ny - 0.24) / 0.08, 2)))
  return clamp(0.95 * cavity1 + 0.62 * cavity2, 0, 1)
}

function crossSectionX(t: number) {
  return (
    0.035 +
    0.115 * Math.exp(-Math.pow((t - 0.18) / 0.14, 2)) +
    0.085 * Math.exp(-Math.pow((t - 0.78) / 0.16, 2)) -
    0.04 * Math.exp(-Math.pow((t - 0.53) / 0.09, 2))
  )
}

function crossSectionZ(t: number) {
  return 0.02 + 0.05 * Math.exp(-Math.pow((t - 0.22) / 0.16, 2)) + 0.035 * Math.exp(-Math.pow((t - 0.76) / 0.18, 2))
}

function twistAt(t: number) {
  return 0.35 * Math.sin(2.4 * Math.PI * t + 0.2) + 0.18 * Math.sin(7.0 * Math.PI * t - 0.6)
}

function buildSpine(mode: AuthMode) {
  const registerBias = mode === 'register' ? -0.012 : 0
  const points = SPINE_POINTS.map(([x, y, z]) => {
    const v = toWorld(x + registerBias + SCULPTURE_SHIFT_X, y, z)
    v.z *= 1.05
    return v
  })
  return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.55)
}

function sampleShell(spine: THREE.CatmullRomCurve3, t: number, phi: number, rho: number) {
  const center = spine.getPointAt(t)
  const tangent = spine.getTangentAt(t).normalize()
  const normal = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent)
  if (normal.lengthSq() < 1e-4) {
    normal.set(1, 0, 0)
  }
  normal.normalize()
  const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize()
  const angle = twistAt(t)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const rotatedNormal = normal.clone().multiplyScalar(c).add(binormal.clone().multiplyScalar(s))
  const rotatedBinormal = binormal.clone().multiplyScalar(c).add(normal.clone().multiplyScalar(-s))
  const rx = crossSectionX(t) * 2
  const rz = crossSectionZ(t) * 1.35
  const localX = rho * rx * Math.cos(phi)
  const localZ = 0.92 * rho * rz * Math.sin(phi)
  const ripple = 0.028 * rho * Math.sin(2 * phi + 1.7 * t)
  return center
    .clone()
    .add(rotatedNormal.multiplyScalar(localX))
    .add(rotatedBinormal.multiplyScalar(localZ + ripple))
}

function selectQuality(reducedMotion: boolean): QualityProfile {
  const width = typeof window === 'undefined' ? 1920 : window.innerWidth
  const height = typeof window === 'undefined' ? 1080 : window.innerHeight
  const cores = typeof navigator === 'undefined' ? 8 : navigator.hardwareConcurrency || 8
  const largerSide = Math.max(width, height)

  let tier: QualityTier = 'low'
  if (largerSide >= 3840 && cores >= 12) {
    tier = 'high'
  } else if (largerSide >= 1500 && cores >= 4) {
    tier = 'mid'
  }

  if (reducedMotion) {
    tier = 'low'
  }

  const preset = QUALITY_PRESETS[tier]
  if (!reducedMotion) {
    return { tier, ...preset }
  }

  return {
    tier,
    dpr: 1,
    surfaceParticles: Math.floor(preset.surfaceParticles * 0.35),
    coreParticles: Math.floor(preset.coreParticles * 0.35),
    dustParticles: Math.floor(preset.dustParticles * 0.2),
    highlightParticles: Math.floor(preset.highlightParticles * 0.3),
    lowerNodes: Math.floor(preset.lowerNodes * 0.5),
    verticalContourCurves: Math.floor(preset.verticalContourCurves * 0.55),
    upperRibbonCurves: Math.floor(preset.upperRibbonCurves * 0.55),
    cavityContourCurves: Math.floor(preset.cavityContourCurves * 0.55),
    waistFlowCurves: Math.floor(preset.waistFlowCurves * 0.55),
    lowerMeshLinks: Math.floor(preset.lowerMeshLinks * 0.5),
    atmosphericArcs: Math.floor(preset.atmosphericArcs * 0.5),
    bloom: false,
    chromatic: false,
  }
}

function createMaskTexture(buffer: Uint8Array) {
  const texture = new THREE.DataTexture(buffer, MASK_WIDTH, MASK_HEIGHT, THREE.RGBAFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

function buildMaskTextures(): MaskTextures {
  const tex0 = new Uint8Array(MASK_WIDTH * MASK_HEIGHT * 4)
  const tex1 = new Uint8Array(MASK_WIDTH * MASK_HEIGHT * 4)
  const tex2 = new Uint8Array(MASK_WIDTH * MASK_HEIGHT * 4)

  for (let y = 0; y < MASK_HEIGHT; y += 1) {
    for (let x = 0; x < MASK_WIDTH; x += 1) {
      const nx = (x + 0.5) / MASK_WIDTH
      const ny = (y + 0.5) / MASK_HEIGHT
      const sampleX = nx - SCULPTURE_SHIFT_X
      const i = (y * MASK_WIDTH + x) * 4

      const leftHaze = clamp(
        (1 - smoothstep(0.42, 0.9, sampleX)) * 0.56 +
          gaussian(sampleX, 0.13, 0.25) * 0.5 +
          gaussian(sampleX, 0.22, 0.12) * gaussian(ny, 0.56, 0.42) * 0.22 +
          gaussian(ny, 0.5, 0.43) * 0.21,
        0,
        1,
      )
      const upperVeil = clamp(gaussian(sampleX, 0.48, 0.2) * gaussian(ny, 0.12, 0.16) + gaussian(sampleX, 0.52, 0.25) * gaussian(ny, 0.23, 0.14) * 0.7, 0, 1)
      const core = clamp(
        gaussian(sampleX, 0.51, 0.12) * gaussian(ny, 0.45, 0.29) +
          gaussian(sampleX, 0.53, 0.11) * gaussian(ny, 0.24, 0.11) * 0.85 +
          gaussian(sampleX, 0.52, 0.12) * gaussian(ny, 0.74, 0.16) * 0.62,
        0,
        1,
      )
      const cavity = cavityMask(nx, ny)
      const lowerMesh = clamp(
        gaussian(sampleX, 0.56, 0.16) * gaussian(ny, 0.84, 0.14) + gaussian(sampleX, 0.5, 0.2) * gaussian(ny, 0.74, 0.12) * 0.46,
        0,
        1,
      )
      const ambientDust = clamp(
        (1 - smoothstep(0.02, 0.95, Math.abs(sampleX - 0.52))) * 0.3 +
          gaussian(ny, 0.52, 0.42) * 0.75 +
          gaussian(sampleX, 0.22, 0.13) * gaussian(ny, 0.62, 0.32) * 0.34,
        0,
        1,
      )
      const ribbon = clamp(
        gaussian(ny - sampleX * 0.38, 0.04, 0.05) * gaussian(sampleX, 0.52, 0.19) * gaussian(ny, 0.2, 0.18) +
          gaussian(ny - sampleX * 0.4, -0.04, 0.07) * gaussian(sampleX, 0.49, 0.18) * 0.42,
        0,
        1,
      )

      const microLeft = sampleX > 0.08 && sampleX < 0.24 && ny > 0.33 && ny < 0.58 ? 0.68 : 0
      const microRight = sampleX > 0.76 && sampleX < 0.9 && ny > 0.32 && ny < 0.57 ? 0.58 : 0

      tex0[i] = Math.round(leftHaze * 255)
      tex0[i + 1] = Math.round(upperVeil * 255)
      tex0[i + 2] = Math.round(core * 255)
      tex0[i + 3] = Math.round(cavity * 255)

      tex1[i] = Math.round(lowerMesh * 255)
      tex1[i + 1] = Math.round(ambientDust * 255)
      tex1[i + 2] = Math.round(microLeft * 255)
      tex1[i + 3] = Math.round(microRight * 255)

      tex2[i] = Math.round(ribbon * 255)
      tex2[i + 1] = 0
      tex2[i + 2] = 0
      tex2[i + 3] = 255
    }
  }

  return {
    tex0: createMaskTexture(tex0),
    tex1: createMaskTexture(tex1),
    tex2: createMaskTexture(tex2),
  }
}

function createSharedUniforms(textures: MaskTextures, profile: QualityProfile, reducedMotion: boolean): SharedUniforms {
  return {
    uTime: { value: 0 },
    uDelta: { value: 0 },
    uViewport: { value: new THREE.Vector2(2, 2) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: Math.min(profile.dpr, MAX_RENDER_DPR) },
    uMaskTex0: { value: textures.tex0 },
    uMaskTex1: { value: textures.tex1 },
    uMaskTex2: { value: textures.tex2 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPointerSmooth: { value: new THREE.Vector2(0, 0) },
    uPointerVelocity: { value: new THREE.Vector2(0, 0) },
    uParallaxAmp: { value: new THREE.Vector2(0.035, 0.022) },
    uRepulseRadius: { value: reducedMotion ? 0.001 : 0.11 },
    uRepulseStrength: { value: reducedMotion ? 0 : 0.02 },
    uDistortGain: { value: reducedMotion ? 0.002 : 0.026 },
    uCursorGlow: { value: reducedMotion ? 0.02 : 0.06 },
    uHazeGain: { value: 0.82 },
    uLeftLightBias: { value: 0.29 },
    uVeilAlpha: { value: 0.19 },
    uVeilCurlAmp: { value: 0.014 },
    uVeilMotion: { value: reducedMotion ? 0.02 : 0.16 },
    uCoreAlpha: { value: 0.68 },
    uCoreContrast: { value: 1.34 },
    uAccentMix: { value: 0.08 },
    uRibbonBoost: { value: 0.24 },
    uRibbonWidth: { value: 0.036 },
    uCavityStrength: { value: 0.84 },
    uCavitySoftness: { value: 0.12 },
    uLowerMeshAlpha: { value: 0.21 },
    uNodeContrast: { value: 1.5 },
    uNodePulse: { value: reducedMotion ? 0.01 : 0.05 },
    uDustGain: { value: reducedMotion ? 0.14 : 0.34 },
    uDustMotion: { value: reducedMotion ? 0 : 0.06 },
    uMicroAlphaLeft: { value: 0.1 },
    uMicroAlphaRight: { value: 0.1 },
  }
}

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

function buildParticleGeometry(mode: AuthMode, profile: QualityProfile, spine: THREE.CatmullRomCurve3) {
  const random = createRandom(mode === 'login' ? 30497 : 97813)
  const total = profile.surfaceParticles + profile.coreParticles + profile.dustParticles + profile.highlightParticles

  const position = new Float32Array(total * 3)
  const base = new Float32Array(total * 3)
  const secondary = new Float32Array(total * 3)
  const params0 = new Float32Array(total * 4)
  const params1 = new Float32Array(total * 4)
  const color = new Float32Array(total * 4)

  let index = 0

  const pushParticle = (
    point: THREE.Vector3,
    pointSecondary: THREE.Vector3,
    size: number,
    alpha: number,
    group: number,
    depthBias: number,
    phase: number,
    speed: number,
    seed: number,
    density: number,
    rgb: THREE.Vector3,
    colorAlpha: number,
  ) => {
    if (index >= total) return
    const p3 = index * 3
    const p4 = index * 4
    position[p3] = point.x
    position[p3 + 1] = point.y
    position[p3 + 2] = point.z
    base[p3] = point.x
    base[p3 + 1] = point.y
    base[p3 + 2] = point.z
    secondary[p3] = pointSecondary.x
    secondary[p3 + 1] = pointSecondary.y
    secondary[p3 + 2] = pointSecondary.z
    params0[p4] = size
    params0[p4 + 1] = alpha
    params0[p4 + 2] = group
    params0[p4 + 3] = depthBias
    params1[p4] = phase
    params1[p4 + 1] = speed
    params1[p4 + 2] = seed
    params1[p4 + 3] = density
    color[p4] = rgb.x
    color[p4 + 1] = rgb.y
    color[p4 + 2] = rgb.z
    color[p4 + 3] = colorAlpha
    index += 1
  }

  const createGroup = (count: number, group: number) => {
    const target = index + count
    let guard = 0
    while (index < target && guard < count * 16) {
      guard += 1
      let t = random()
      let rho = 0.62 + random() * 0.48
      if (group === 1) {
        const bucket = random()
        if (bucket < 0.45) t = clamp(0.34 + (random() - 0.5) * 0.33, 0.02, 0.98)
        else if (bucket < 0.82) t = clamp(0.72 + (random() - 0.5) * 0.34, 0.02, 0.98)
        else t = clamp(0.18 + (random() - 0.5) * 0.21, 0.02, 0.98)
        rho = Math.pow(random(), 0.64)
      } else if (group === 2) {
        t = random()
        rho = 0.95 + random() * 0.75
      } else if (group === 3) {
        t = clamp(0.14 + random() * 0.72, 0.02, 0.98)
        rho = 0.4 + random() * 0.45
      }

      const phi = random() * Math.PI * 2
      const point = sampleShell(spine, t, phi, rho)
      if (group === 2) {
        point.x -= 0.06 + random() * 0.08
        point.y += (random() - 0.5) * 0.06
      }
      const screen = toScreen(point)
      const reserve = reserveWeight(screen.x)
      if (screen.x > RIGHT_RESERVE + 0.16 || random() < reserve * 0.985) continue

      const cavity = cavityMask(screen.x, screen.y)
      if (random() < cavity * 0.92) continue

      const shoulder = gaussian(t, 0.22, 0.16)
      const waist = gaussian(t, 0.53, 0.1)
      const lower = gaussian(t, 0.84, 0.12)
      const density = clamp(0.3 + shoulder * 0.5 + lower * 0.42 - waist * 0.18, 0.08, 1)

      const secondaryPoint = point.clone()
      secondaryPoint.x += (random() - 0.5) * (group === 2 ? 0.06 : 0.024)
      secondaryPoint.y += (random() - 0.5) * (group === 2 ? 0.05 : 0.022)
      secondaryPoint.z += (random() - 0.5) * (group === 2 ? 0.09 : 0.04)

      const phase = random() * Math.PI * 2
      const speed = 0.08 + random() * 0.9
      const seed = random()

      let size = 1
      let alpha = 0.3
      let depthBias = 0
      let rgb = new THREE.Vector3(0.78, 0.79, 0.8)
      let colorAlpha = 1

      if (group === 0) {
        size = 0.45 + random() * 0.65
        alpha = clamp((0.26 + density * 0.48 + random() * 0.2 - cavity * 0.38) * (1 - reserve * 0.72), 0.04, 0.86)
        depthBias = (random() - 0.5) * 0.035
        rgb = new THREE.Vector3(0.74, 0.74, 0.75)
      } else if (group === 1) {
        size = 0.6 + random() * 1.1
        alpha = clamp((0.34 + density * 0.58 + shoulder * 0.12 + random() * 0.14 - cavity * 0.48) * (1 - reserve * 0.78), 0.08, 0.96)
        depthBias = (random() - 0.5) * 0.055
        rgb = new THREE.Vector3(0.79, 0.8, 0.81)
      } else if (group === 2) {
        size = 0.35 + random() * 0.55
        alpha = clamp((0.03 + random() * 0.12) * (1 - reserve * 0.55), 0.01, 0.13)
        depthBias = (random() - 0.5) * 0.08
        rgb = new THREE.Vector3(0.8, 0.8, 0.81)
        colorAlpha = 0.85
      } else {
        size = 1.2 + random() * 1.6
        alpha = clamp((0.22 + random() * 0.48 + gaussian(t, 0.28, 0.11) * 0.2) * (1 - reserve * 0.82), 0.15, 0.9)
        depthBias = (random() - 0.5) * 0.02 + 0.03
        rgb = new THREE.Vector3(0.89, 0.89, 0.9)
      }

      pushParticle(point, secondaryPoint, size, alpha, group, depthBias, phase, speed, seed, density, rgb, colorAlpha)
    }
  }

  createGroup(profile.surfaceParticles, 0)
  createGroup(profile.coreParticles, 1)
  createGroup(profile.dustParticles, 2)
  createGroup(profile.highlightParticles, 3)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position.subarray(0, index * 3), 3))
  geometry.setAttribute('aBasePosition', new THREE.BufferAttribute(base.subarray(0, index * 3), 3))
  geometry.setAttribute('aSecondaryPosition', new THREE.BufferAttribute(secondary.subarray(0, index * 3), 3))
  geometry.setAttribute('aParams0', new THREE.BufferAttribute(params0.subarray(0, index * 4), 4))
  geometry.setAttribute('aParams1', new THREE.BufferAttribute(params1.subarray(0, index * 4), 4))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(color.subarray(0, index * 4), 4))
  geometry.computeBoundingSphere()
  return geometry
}

function buildLowerNodes(mode: AuthMode, profile: QualityProfile, spine: THREE.CatmullRomCurve3): LowerNodeBuild {
  const random = createRandom(mode === 'login' ? 44091 : 22513)
  const nodes: Array<{ position: THREE.Vector3; size: number; alpha: number; seed: number }> = []

  let attempts = profile.lowerNodes * 16
  while (nodes.length < profile.lowerNodes && attempts > 0) {
    attempts -= 1
    const t = clamp(0.72 + random() * 0.28, 0.02, 0.99)
    const phi = random() * Math.PI * 2
    const rho = 0.7 + random() * 1.1
    const p = sampleShell(spine, t, phi, rho)
    p.y -= (1 - t) * 0.08
    p.z += (random() - 0.5) * 0.06
    const screen = toScreen(p)
    const reserve = reserveWeight(screen.x)
    if (screen.x > RIGHT_RESERVE + 0.16 || random() < reserve * 0.985 || random() < cavityMask(screen.x, screen.y) * 0.86) continue

    const density = gaussian(screen.y, 0.85, 0.11)
    const minDist = 0.03 - density * 0.015
    let blocked = false
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].position.distanceTo(p) < minDist) {
        blocked = true
        break
      }
    }
    if (blocked) continue

    nodes.push({
      position: p,
      size: 0.009 + random() * 0.02,
      alpha: 0.2 + random() * 0.34,
      seed: random(),
    })
  }

  const positions = new Float32Array(nodes.length * 3)
  const sizes = new Float32Array(nodes.length)
  const alphas = new Float32Array(nodes.length)
  const seeds = new Float32Array(nodes.length)

  for (let i = 0; i < nodes.length; i += 1) {
    const p3 = i * 3
    positions[p3] = nodes[i].position.x
    positions[p3 + 1] = nodes[i].position.y
    positions[p3 + 2] = nodes[i].position.z
    sizes[i] = nodes[i].size
    alphas[i] = nodes[i].alpha
    seeds[i] = nodes[i].seed
  }

  const baseQuad = new THREE.PlaneGeometry(1, 1, 1, 1)
  const geometry = new THREE.InstancedBufferGeometry()
  geometry.index = baseQuad.index
  geometry.setAttribute('position', baseQuad.getAttribute('position'))
  geometry.setAttribute('uv', baseQuad.getAttribute('uv'))
  geometry.setAttribute('aInstancePosition', new THREE.InstancedBufferAttribute(positions, 3))
  geometry.setAttribute('aInstanceSize', new THREE.InstancedBufferAttribute(sizes, 1))
  geometry.setAttribute('aInstanceAlpha', new THREE.InstancedBufferAttribute(alphas, 1))
  geometry.setAttribute('aInstanceSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  geometry.instanceCount = nodes.length
  baseQuad.dispose()

  const links: number[] = []
  const edgeSet = new Set<string>()

  for (let i = 0; i < nodes.length; i += 1) {
    const distances: Array<{ idx: number; distance: number }> = []
    for (let j = 0; j < nodes.length; j += 1) {
      if (i === j) continue
      const distance = nodes[i].position.distanceTo(nodes[j].position)
      distances.push({ idx: j, distance })
    }
    distances.sort((a, b) => a.distance - b.distance)

    const maxConnections = clamp(2 + Math.floor(random() * 3), 2, 4)
    let local = 0
    for (let d = 0; d < distances.length; d += 1) {
      if (local >= maxConnections) break
      if (links.length / 6 >= profile.lowerMeshLinks) break
      const entry = distances[d]
      if (entry.distance > 0.14) break
      const a = Math.min(i, entry.idx)
      const b = Math.max(i, entry.idx)
      const key = `${a}:${b}`
      if (edgeSet.has(key)) continue
      const p1 = nodes[i].position
      const p2 = nodes[entry.idx].position
      const mid = p1.clone().add(p2).multiplyScalar(0.5)
      const midScreen = toScreen(mid)
      if (midScreen.x > RIGHT_RESERVE + 0.16 || random() < reserveWeight(midScreen.x) * 0.985 || random() < cavityMask(midScreen.x, midScreen.y) * 0.88) continue
      edgeSet.add(key)
      local += 1
      links.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
    }
  }

  return { geometry, links: new Float32Array(links) }
}

function pushSegment(array: number[], a: THREE.Vector3, b: THREE.Vector3) {
  array.push(a.x, a.y, a.z, b.x, b.y, b.z)
}

function buildCurves(mode: AuthMode, profile: QualityProfile, spine: THREE.CatmullRomCurve3, lowerLinks: Float32Array): CurveLayers {
  const random = createRandom(mode === 'login' ? 55783 : 44189)
  const vertical: number[] = []
  const ribbons: number[] = []
  const cavity: number[] = []
  const waist: number[] = []
  const atmosphere: number[] = []
  const terminals: number[] = []
  const crestPolylines: Float32Array[] = []

  const verticalSteps = profile.tier === 'high' ? 112 : profile.tier === 'mid' ? 94 : 82
  for (let i = 0; i < profile.verticalContourCurves; i += 1) {
    const lane = i / Math.max(1, profile.verticalContourCurves - 1)
    const phiBase = lane * Math.PI * 2 + (random() - 0.5) * 0.18
    const rhoBase = 0.7 + random() * 0.4
    let prev = sampleShell(spine, 0, phiBase, rhoBase)
    for (let s = 1; s <= verticalSteps; s += 1) {
      const t = s / verticalSteps
      const phi = phiBase + Math.sin(t * Math.PI * 2 + i * 0.08) * 0.11
      const rho = rhoBase * (0.94 + Math.sin(t * Math.PI * 8 + i * 0.15) * 0.04)
      const p = sampleShell(spine, t, phi, rho)
      const centerX = toWorld(shiftNormalizedX(0.46), 0.5).x
      const pinch = gaussian(t, 0.53, 0.09) * 0.38
      p.x = centerX + (p.x - centerX) * (1 - pinch)
      const screen = toScreen(p)
      const cav = cavityMask(screen.x, screen.y)
      p.x -= cav * 0.09
      const reserve = reserveWeight(screen.x)
      const drawChance = clamp(1 - cav * 0.56 - reserve * 1.02, 0, 1)
      if (screen.x < RIGHT_RESERVE + 0.14 && random() < drawChance) {
        pushSegment(vertical, prev, p)
      }
      prev = p
    }
  }

  const ribbonSteps = profile.tier === 'high' ? 68 : 58
  for (let i = 0; i < profile.upperRibbonCurves; i += 1) {
    const phase = random() * Math.PI * 2
    const tStart = 0.03 + random() * 0.14
    const points: number[] = []
    let prev: THREE.Vector3 | null = null
    for (let s = 0; s <= ribbonSteps; s += 1) {
      const u = s / ribbonSteps
      const t = clamp(tStart + u * 0.33, 0.01, 0.42)
      const phi = -1.4 + u * 2.5 + Math.sin(u * Math.PI * 3 + phase) * 0.2
      const rho = 1.03 + Math.sin(u * Math.PI * 2 + phase * 0.8) * 0.09
      const p = sampleShell(spine, t, phi, rho)
      p.x += (u - 0.45) * 0.19
      p.y += 0.04 + Math.sin(u * Math.PI * 2 + phase) * 0.015
      const screen = toScreen(p)
      const reserve = reserveWeight(screen.x)
      if (screen.x > RIGHT_RESERVE + 0.14 || random() < reserve * 0.94) continue
      const cav = cavityMask(screen.x, screen.y)
      p.x -= cav * 0.08
      points.push(p.x, p.y, p.z)
      if (prev && random() > cav * 0.6) {
        pushSegment(ribbons, prev, p)
      }
      prev = p
    }
    if (i < Math.min(12, profile.upperRibbonCurves) && points.length > 12) {
      crestPolylines.push(new Float32Array(points))
    }
  }

  const cavitySegments = 56
  for (let i = 0; i < profile.cavityContourCurves; i += 1) {
    const phase = random() * Math.PI * 2
    const ring = 0.72 + random() * 0.95
    let prev: THREE.Vector3 | null = null
    for (let s = 0; s <= cavitySegments; s += 1) {
      const a = (s / cavitySegments) * Math.PI * 2
      const nx = shiftNormalizedX(0.66 + Math.cos(a) * 0.07 * ring + Math.sin(a * 2 + phase) * 0.01)
      const ny = 0.31 + Math.sin(a) * 0.05 * ring + Math.cos(a * 3 + phase) * 0.01
      if (nx > RIGHT_RESERVE + 0.04) continue
      const p = toWorld(nx, ny, Math.sin(a + phase) * 0.1)
      p.x -= cavityMask(nx, ny) * 0.06
      if (prev && random() > cavityMask(nx, ny) * 0.42) {
        pushSegment(cavity, prev, p)
      }
      prev = p
    }
  }

  const waistSteps = profile.tier === 'high' ? 82 : 72
  for (let i = 0; i < profile.waistFlowCurves; i += 1) {
    const phase = random() * Math.PI * 2
    const lane = (i / Math.max(1, profile.waistFlowCurves - 1) - 0.5) * 1.6
    let prev: THREE.Vector3 | null = null
    for (let s = 0; s <= waistSteps; s += 1) {
      const u = s / waistSteps
      const t = clamp(0.36 + u * 0.33 + (random() - 0.5) * 0.01, 0.28, 0.75)
      const phi = lane + Math.sin(u * Math.PI * 4 + phase) * 0.13
      const p = sampleShell(spine, t, phi, 0.8 + Math.sin(phase + u * Math.PI * 3) * 0.1)
      const centerX = toWorld(shiftNormalizedX(0.46), 0.5).x
      p.x = centerX + (p.x - centerX) * 0.62
      const screen = toScreen(p)
      const reserve = reserveWeight(screen.x)
      if (screen.x > RIGHT_RESERVE + 0.14 || random() < reserve * 0.92) continue
      const cav = cavityMask(screen.x, screen.y)
      p.x -= cav * 0.1
      if (prev && random() > cav * 0.7) {
        pushSegment(waist, prev, p)
      }
      prev = p
    }
  }

  const arcSteps = 66
  for (let i = 0; i < profile.atmosphericArcs; i += 1) {
    const phase = random() * Math.PI * 2
    const yBias = random() * 0.84
    const scale = 0.78 + random() * 0.56
    let prev: THREE.Vector3 | null = null
    for (let s = 0; s <= arcSteps; s += 1) {
      const u = s / arcSteps
      const a = Math.PI * (0.1 + u * 0.95)
      const nx = shiftNormalizedX(0.34 + Math.cos(a + phase * 0.2) * 0.28 * scale)
      const ny = 0.08 + yBias + Math.sin(a) * 0.2
      if (nx > RIGHT_RESERVE + 0.1 || ny < -0.03 || ny > 1.03) continue
      const p = toWorld(nx, ny, Math.sin(a + phase) * 0.08)
      if (prev) {
        pushSegment(atmosphere, prev, p)
      }
      prev = p
    }
  }

  const terminalCount = Math.max(36, Math.floor(profile.verticalContourCurves * 0.24))
  for (let i = 0; i < terminalCount; i += 1) {
    const phase = random() * Math.PI * 2
    const isTop = i % 2 === 0
    const tAnchor = isTop ? clamp(0.03 + random() * 0.18, 0.01, 0.25) : clamp(0.78 + random() * 0.19, 0.74, 0.99)
    const phi = -1.1 + random() * 2.2
    const rho = 0.84 + random() * 0.32
    let prev = sampleShell(spine, tAnchor, phi, rho)

    const steps = 18
    for (let s = 1; s <= steps; s += 1) {
      const u = s / steps
      const bend = Math.sin(u * Math.PI * 2 + phase) * 0.018
      const p = prev.clone()
      p.x += (isTop ? -1 : 1) * (0.01 + u * 0.04) + bend
      p.y += isTop ? u * (0.52 + random() * 0.18) : -u * (0.52 + random() * 0.18)
      p.z += Math.sin(u * Math.PI + phase) * 0.02
      const screen = toScreen(p)
      if (screen.x < RIGHT_RESERVE + 0.08 || random() > reserveWeight(screen.x) * 1.1) {
        pushSegment(terminals, prev, p)
      }
      prev = p
    }
  }

  return {
    vertical: new Float32Array(vertical),
    ribbons: new Float32Array(ribbons),
    cavity: new Float32Array(cavity),
    waist: new Float32Array(waist),
    atmosphere: new Float32Array(atmosphere),
    terminals: new Float32Array(terminals),
    lowerLinks,
    crestPolylines,
  }
}

function useLineSegmentsObject(
  positions: Float32Array,
  color: string,
  linewidth: number,
  opacity: number,
  renderOrder: number,
  blending: THREE.Blending = THREE.NormalBlending,
) {
  const { size } = useThree()

  const object = useMemo(() => {
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(positions)
    const material = new LineMaterial({
      color,
      linewidth,
      transparent: true,
      opacity,
      depthTest: true,
      depthWrite: false,
      blending,
      alphaToCoverage: true,
      worldUnits: false,
    })
    const line = new LineSegments2(geometry, material)
    line.frustumCulled = false
    line.renderOrder = renderOrder
    return line
  }, [positions, color, linewidth, opacity, renderOrder, blending])

  useEffect(() => {
    const material = object.material as LineMaterial
    material.resolution.set(size.width, size.height)
  }, [object, size.height, size.width])

  useEffect(() => {
    return () => {
      ;(object.geometry as LineSegmentsGeometry).dispose()
      ;(object.material as LineMaterial).dispose()
    }
  }, [object])

  return object
}

function WideLineSegments({
  positions,
  color,
  linewidth,
  opacity,
  renderOrder,
  blending = THREE.NormalBlending,
}: {
  positions: Float32Array
  color: string
  linewidth: number
  opacity: number
  renderOrder: number
  blending?: THREE.Blending
}) {
  const object = useLineSegmentsObject(positions, color, linewidth, opacity, renderOrder, blending)
  return <primitive object={object} />
}

function CrestLine2Group({ polylines, color, linewidth, opacity, renderOrder }: { polylines: Float32Array[]; color: string; linewidth: number; opacity: number; renderOrder: number }) {
  const { size } = useThree()
  const group = useMemo(() => {
    const g = new THREE.Group()
    for (let i = 0; i < polylines.length; i += 1) {
      const lineGeometry = new LineGeometry()
      lineGeometry.setPositions(polylines[i])
      const lineMaterial = new LineMaterial({
        color,
        linewidth,
        transparent: true,
        opacity,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        alphaToCoverage: true,
        worldUnits: false,
      })
      const line = new Line2(lineGeometry, lineMaterial)
      line.frustumCulled = false
      line.renderOrder = renderOrder
      g.add(line)
    }
    return g
  }, [polylines, color, linewidth, opacity, renderOrder])

  useEffect(() => {
    group.traverse((object) => {
      if (object instanceof Line2) {
        const material = object.material as LineMaterial
        material.resolution.set(size.width, size.height)
      }
    })
  }, [group, size.height, size.width])

  useEffect(() => {
    return () => {
      group.traverse((object) => {
        if (object instanceof Line2) {
          ;(object.geometry as LineGeometry).dispose()
          ;(object.material as LineMaterial).dispose()
        }
      })
      group.clear()
    }
  }, [group])

  return <primitive object={group} />
}

function BackgroundPlane({ uniforms }: { uniforms: SharedUniforms }) {
  return (
    <mesh position={[0, 0, -0.6]} frustumCulled={false} renderOrder={0}>
      <planeGeometry args={[6, 4]} />
      <shaderMaterial uniforms={uniforms} vertexShader={FULLSCREEN_VERTEX} fragmentShader={BACKGROUND_FRAGMENT} depthWrite={false} depthTest={false} />
    </mesh>
  )
}

function ParticleCloud({ geometry, uniforms }: { geometry: THREE.BufferGeometry; uniforms: SharedUniforms }) {
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={POINT_VERTEX}
        fragmentShader={POINT_FRAGMENT}
        transparent
        depthWrite={false}
        depthTest={true}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}

function LowerNodeMesh({ geometry, uniforms }: { geometry: THREE.InstancedBufferGeometry; uniforms: SharedUniforms }) {
  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={6}>
      <shaderMaterial uniforms={uniforms} vertexShader={NODE_VERTEX} fragmentShader={NODE_FRAGMENT} transparent depthWrite={false} depthTest={true} blending={THREE.NormalBlending} />
    </mesh>
  )
}

function ComposerLayer({ profile, reducedMotion }: { profile: QualityProfile; reducedMotion: boolean }) {
  const { gl, scene, camera, size, viewport } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)
  const bloomRef = useRef<UnrealBloomPass | null>(null)
  const postPassRef = useRef<ShaderPass | null>(null)
  const fxaaRef = useRef<ShaderPass | null>(null)
  const postTimeRef = useRef(0)

  useEffect(() => {
    if (reducedMotion && !profile.bloom) return
    const composer = new EffectComposer(gl)
    composer.addPass(new RenderPass(scene, camera))

    if (profile.bloom) {
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(BLOOM_BUFFER_SIZE, BLOOM_BUFFER_SIZE),
        profile.tier === 'high' ? 0.52 : 0.38,
        0.28,
        0.79,
      )
      bloom.setSize(BLOOM_BUFFER_SIZE, BLOOM_BUFFER_SIZE)
      composer.addPass(bloom)
      bloomRef.current = bloom
    }

    const postPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uGrain: { value: reducedMotion ? 0.028 : 0.048 },
        uVignette: { value: 0.23 },
        uChromatic: { value: profile.chromatic ? 0.00075 : 0 },
      },
      vertexShader: POST_VERTEX,
      fragmentShader: POST_FRAGMENT,
    })
    composer.addPass(postPass)
    postPassRef.current = postPass

    composer.addPass(new OutputPass())
    const fxaa = new ShaderPass(FXAAShader)
    composer.addPass(fxaa)
    fxaaRef.current = fxaa

    composerRef.current = composer
    return () => {
      composer.dispose()
      composerRef.current = null
      bloomRef.current = null
      postPassRef.current = null
      fxaaRef.current = null
    }
  }, [camera, gl, profile.bloom, profile.chromatic, profile.tier, reducedMotion, scene, size.height, size.width])

  useEffect(() => {
    if (!composerRef.current) return
    const pixelRatio = Math.min(viewport.dpr, profile.dpr, MAX_RENDER_DPR)
    composerRef.current.setPixelRatio(pixelRatio)
    composerRef.current.setSize(size.width, size.height)
    bloomRef.current?.setSize(BLOOM_BUFFER_SIZE, BLOOM_BUFFER_SIZE)
    const fxaa = fxaaRef.current
    if (fxaa) {
      const resolutionUniform = fxaa.material.uniforms.resolution
      if (resolutionUniform?.value) {
        resolutionUniform.value.set(1 / (size.width * pixelRatio), 1 / (size.height * pixelRatio))
      }
    }
    const postPass = postPassRef.current
    if (postPass) {
      const resolution = postPass.material.uniforms.uResolution
      if (resolution?.value) {
        resolution.value.set(size.width, size.height)
      }
    }
  }, [profile.dpr, size.height, size.width, viewport.dpr])

  useFrame((_, delta) => {
    if (!composerRef.current) return
    const frameDelta = Math.min(delta, 0.05)
    const postPass = postPassRef.current
    if (postPass) {
      postTimeRef.current += frameDelta
      postPass.material.uniforms.uTime.value = postTimeRef.current
    }
    composerRef.current.render(frameDelta)
  }, 1)

  return null
}

function MotionController({
  uniforms,
  reducedMotion,
  groupRef,
  tick,
}: {
  uniforms: SharedUniforms
  reducedMotion: boolean
  groupRef: React.RefObject<THREE.Group | null>
  tick: number
}) {
  const { invalidate } = useThree()
  const pointer = useThree((state) => state.pointer)
  const viewport = useThree((state) => state.viewport)
  const size = useThree((state) => state.size)
  const previousSmooth = useRef(new THREE.Vector2(0, 0))
  const velocityTarget = useRef(new THREE.Vector2(0, 0))
  const elapsedTime = useRef(0)

  useEffect(() => {
    elapsedTime.current = 0
  }, [uniforms])

  useEffect(() => {
    invalidate()
  }, [invalidate, reducedMotion, tick])

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
    uniforms.uViewport.value.set(viewport.width, viewport.height)
    uniforms.uDpr.value = Math.min(viewport.dpr, MAX_RENDER_DPR)
  }, [size.height, size.width, uniforms, viewport.dpr, viewport.height, viewport.width])

  useFrame((_, delta) => {
    const frameDelta = Math.min(delta, 0.05)
    const decayA = 1 - Math.exp(-frameDelta * 12)
    const decayB = 1 - Math.exp(-frameDelta * 18)
    elapsedTime.current += frameDelta
    uniforms.uTime.value = elapsedTime.current
    uniforms.uDelta.value = frameDelta
    uniforms.uPointer.value.set(pointer.x, pointer.y)

    const smooth = uniforms.uPointerSmooth.value
    smooth.x += (pointer.x - smooth.x) * decayA
    smooth.y += (pointer.y - smooth.y) * decayA

    velocityTarget.current.copy(smooth).sub(previousSmooth.current).multiplyScalar(1 / Math.max(frameDelta, 1e-4))
    const velocity = uniforms.uPointerVelocity.value
    velocity.x += (velocityTarget.current.x - velocity.x) * decayB
    velocity.y += (velocityTarget.current.y - velocity.y) * decayB
    previousSmooth.current.copy(smooth)

    if (groupRef.current) {
      const amp = uniforms.uParallaxAmp.value
      groupRef.current.position.x = smooth.x * amp.x
      groupRef.current.position.y = smooth.y * amp.y
    }
  })

  return null
}

function OrthoLock() {
  const { camera, size, invalidate } = useThree()
  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera
    ortho.zoom = size.height * 0.38
    ortho.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate, size.height])
  return null
}

function AuthMeshScene({
  mode,
  profile,
  reducedMotion,
  tick,
}: {
  mode: AuthMode
  profile: QualityProfile
  reducedMotion: boolean
  tick: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const viewport = useThree((state) => state.viewport)

  const textures = useMemo(() => buildMaskTextures(), [])
  const uniforms = useMemo(() => createSharedUniforms(textures, profile, reducedMotion), [profile, reducedMotion, textures])
  const spine = useMemo(() => buildSpine(mode), [mode])
  const particles = useMemo(() => buildParticleGeometry(mode, profile, spine), [mode, profile, spine])
  const lowerNodes = useMemo(() => buildLowerNodes(mode, profile, spine), [mode, profile, spine])
  const curves = useMemo(() => buildCurves(mode, profile, spine, lowerNodes.links), [lowerNodes.links, mode, profile, spine])

  useEffect(() => {
    return () => {
      particles.dispose()
      lowerNodes.geometry.dispose()
      textures.tex0.dispose()
      textures.tex1.dispose()
      textures.tex2.dispose()
    }
  }, [lowerNodes.geometry, particles, textures.tex0, textures.tex1, textures.tex2])

  const xScale = viewport.aspect

  return (
    <>
      <OrthoLock />
      <MotionController uniforms={uniforms} reducedMotion={reducedMotion} groupRef={groupRef} tick={tick} />
      <group ref={groupRef} scale={[xScale, 1, 1]}>
        <BackgroundPlane uniforms={uniforms} />
        <WideLineSegments positions={curves.atmosphere} color="#9a9a9d" linewidth={0.78} opacity={0.22} renderOrder={1} />
        <WideLineSegments positions={curves.terminals} color="#dddddf" linewidth={1.08} opacity={0.34} renderOrder={1} />
        <WideLineSegments positions={curves.vertical} color="#d5d5d8" linewidth={1.02} opacity={0.34} renderOrder={1} />
        <WideLineSegments positions={curves.ribbons} color="#f0f0f2" linewidth={1.86} opacity={0.42} renderOrder={3} blending={THREE.AdditiveBlending} />
        <WideLineSegments positions={curves.waist} color="#c4c4c7" linewidth={0.92} opacity={0.2} renderOrder={4} />
        <WideLineSegments positions={curves.lowerLinks} color="#9a9a9d" linewidth={0.92} opacity={0.22} renderOrder={5} />
        <CrestLine2Group polylines={curves.crestPolylines} color="#fcfcfd" linewidth={1.9} opacity={0.38} renderOrder={3} />
        <ParticleCloud geometry={particles} uniforms={uniforms} />
        <LowerNodeMesh geometry={lowerNodes.geometry} uniforms={uniforms} />
      </group>
      <ComposerLayer profile={profile} reducedMotion={reducedMotion} />
    </>
  )
}

export function AuthGenerativeVisual({ mode }: AuthGenerativeVisualProps) {
  const reducedMotion = usePrefersReducedMotion()
  const profile = useMemo(() => selectQuality(reducedMotion), [reducedMotion])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => setTick((value) => value + 1), 1000 / TARGET_FPS)
    return () => clearInterval(id)
  }, [reducedMotion])

  const dprMax = Math.min(
    MAX_RENDER_DPR,
    profile.dpr,
    typeof window === 'undefined' ? profile.dpr : window.devicePixelRatio || profile.dpr,
  )

  return (
    <div className={`auth-generative-visual auth-generative-visual--${mode}`}>
      <Canvas
        className="auth-generative-canvas"
        orthographic
        dpr={[1, dprMax]}
        performance={{ min: 0.5, debounce: 200 }}
        frameloop="demand"
        gl={{ alpha: true, antialias: false, powerPreference: 'default' }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(gl.getPixelRatio(), MAX_RENDER_DPR))
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <AuthMeshScene mode={mode} profile={profile} reducedMotion={reducedMotion} tick={tick} />
      </Canvas>
      <div className="auth-generative-grain" />
      <div className="auth-generative-vignette" />
      <div className="auth-micro-type auth-micro-type--left">
        <span>CYBERLAB TRACKER</span>
        <span>LAYERED FIELD / AUTH MESH</span>
        <span>CAVITY MASK APPLIED</span>
        <span>CORE DENSITY LOCKED</span>
        <span>LOWER GRAPH NORMALIZED</span>
      </div>
      <div className="auth-micro-type auth-micro-type--right">
        <span>SCENE MODE: {mode.toUpperCase()}</span>
        <span>ORTHOGRAPHIC CANVAS</span>
        <span>LINE2 + SHADER POINTS</span>
        <span>RIGHT RESERVE ACTIVE</span>
        <span>WAIST PINCH / VEIL READY</span>
      </div>
      <div className="auth-micro-type auth-micro-type--bottom">NOCTURNE AUTH FIELD / STRUCTURE STUDY</div>
    </div>
  )
}
