import * as THREE from 'three'
import type { Subject, Task, TaskPriority, TaskStatus } from '../../types'

export interface TaskLoadMetrics {
  load: number
  subjectColor: string
  subjectId: number
}

export interface ParticleGeometryData {
  positions: Float32Array
  sizes: Float32Array
  alphas: Float32Array
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const priorityWeight = (priority: TaskPriority): number => {
  switch (priority) {
    case 'critical':
      return 1
    case 'high':
      return 0.75
    case 'medium':
      return 0.45
    case 'low':
    default:
      return 0.25
  }
}

const statusWeight = (status: TaskStatus): number => {
  switch (status) {
    case 'debt':
      return 1
    case 'in_progress':
      return 0.8
    case 'not_started':
      return 0.65
    case 'submitted':
      return 0.25
    case 'accepted':
    default:
      return 0.1
  }
}

const deadlineWeight = (deadline: string | null): number => {
  if (!deadline) return 0.25

  const deadlineTime = new Date(deadline).getTime()
  if (Number.isNaN(deadlineTime)) return 0.25

  const daysLeft = (deadlineTime - Date.now()) / (1000 * 60 * 60 * 24)

  if (daysLeft < 0) return 1
  if (daysLeft <= 3) return 0.85
  if (daysLeft <= 7) return 0.65
  if (daysLeft <= 14) return 0.45

  return 0.25
}

const estimatedHoursWeight = (hours: number | null): number => {
  if (hours === null || hours === undefined) return 0.25

  if (hours <= 2) return 0.2
  if (hours <= 5) return 0.45
  if (hours <= 10) return 0.7

  return 1
}

const normalizeColor = (color: string | null | undefined): string => {
  if (!color) return '#ffffff'

  try {
    return new THREE.Color(color).getStyle()
  } catch {
    return '#ffffff'
  }
}

export function calculateTaskLoad(task: Task, subjectsMap: Map<string, Subject>): TaskLoadMetrics {
  const priority = priorityWeight(task.priority)
  const status = statusWeight(task.status)
  const deadline = deadlineWeight(task.deadline)
  const hours = estimatedHoursWeight(task.estimated_hours)

  const rawLoad = priority * 0.35 + status * 0.3 + deadline * 0.25 + hours * 0.1

  const subject = subjectsMap.get(String(task.subject_id))

  return {
    load: clamp(rawLoad, 0.05, 1),
    subjectColor: normalizeColor(subject?.color),
    subjectId: task.subject_id,
  }
}

export function stableHash(input: string): number {
  let hash = 2166136261

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5

    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomUnitVector(random: () => number): THREE.Vector3 {
  const z = random() * 2 - 1
  const angle = random() * Math.PI * 2
  const radius = Math.sqrt(1 - z * z)

  return new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), z)
}

export function generateInteriorCloud(count: number, radius: number, seed: number): ParticleGeometryData {
  const random = createSeededRandom(seed)

  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const direction = randomUnitVector(random)
    const edgeBiased = random() < 0.42
    const r = edgeBiased ? radius * (0.72 + random() * 0.28) : radius * Math.cbrt(random())

    positions[i * 3] = direction.x * r
    positions[i * 3 + 1] = direction.y * r
    positions[i * 3 + 2] = direction.z * r

    const edgeFactor = r / radius

    sizes[i] = 0.65 + random() * 0.9
    alphas[i] = (0.18 + random() * 0.42) * (0.45 + edgeFactor * 0.55)
  }

  return { positions, sizes, alphas }
}

export function generateOuterShell(count: number, radius: number, seed: number): ParticleGeometryData {
  const random = createSeededRandom(seed)

  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const direction = randomUnitVector(random)
    const r = radius * (0.965 + random() * 0.055)

    positions[i * 3] = direction.x * r
    positions[i * 3 + 1] = direction.y * r
    positions[i * 3 + 2] = direction.z * r

    sizes[i] = 0.8 + random() * 1.15
    alphas[i] = 0.45 + random() * 0.75
  }

  return { positions, sizes, alphas }
}

export interface OrbitBandOptions {
  radius: number
  particleCount: number
  load: number
  seed: number
  noiseAmount: number
  lineSpread: number
}

export function generateOrbitBand({
  radius,
  particleCount,
  load,
  seed,
  noiseAmount,
  lineSpread,
}: OrbitBandOptions): ParticleGeometryData {
  const random = createSeededRandom(seed)

  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const alphas = new Float32Array(particleCount)

  const axis = randomUnitVector(random).normalize()

  const reference = Math.abs(axis.y) > 0.86 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)

  const basisA = new THREE.Vector3().crossVectors(axis, reference).normalize()
  const basisB = new THREE.Vector3().crossVectors(axis, basisA).normalize()

  const wraps = 1.2 + random() * 2.1
  const phase = random() * Math.PI * 2
  const clumpFrequency = 2 + Math.floor(random() * 5)

  const baseSpread = lineSpread * (0.25 + load * 1.25)
  const turbulence = noiseAmount * (0.4 + load * 1.4)

  const point = new THREE.Vector3()
  const dustDirection = new THREE.Vector3()

  for (let i = 0; i < particleCount; i += 1) {
    const t = i / particleCount

    const jitter = (random() - 0.5) * turbulence
    const angle = t * Math.PI * 2 + jitter

    const ribbon = Math.sin(angle * wraps + phase) * 0.18 + Math.sin(angle * (wraps * 0.47) + phase * 1.7) * 0.075

    point
      .copy(basisA)
      .multiplyScalar(Math.cos(angle))
      .addScaledVector(basisB, Math.sin(angle))
      .addScaledVector(axis, ribbon)
      .normalize()

    dustDirection.copy(randomUnitVector(random))
    dustDirection.addScaledVector(point, -dustDirection.dot(point)).normalize()

    const lateralOffset = (random() - 0.5) * baseSpread
    const radialOffset = (random() - 0.5) * baseSpread * 0.85

    point.addScaledVector(dustDirection, lateralOffset).normalize().multiplyScalar(radius + radialOffset)

    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z

    const clump = 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(angle * clumpFrequency + phase), 2)

    const hotSpot = random() > 0.975 - load * 0.018 ? 1.9 : 1

    sizes[i] = 0.7 + random() * 0.9 + load * 0.65
    alphas[i] = (0.22 + random() * 0.95) * (0.5 + load * 1.1) * clump * hotSpot
  }

  return { positions, sizes, alphas }
}
