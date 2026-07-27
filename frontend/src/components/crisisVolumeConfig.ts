import type { VisualPerformanceTier } from '../hooks/useVisualPreferences'

const TARGET_FPS = 60
export const CRISIS_MAX_DPR = 1.5
const COUNT_EDGE = 16000
const COUNT_MID = 12000
const COUNT_CORE = 22000

export const CRISIS_BLOOM_SIZE = 256
export const CRISIS_CUBE_SCALE = 1.35
export const CRISIS_MIN_CORE = 300

export const CRISIS_PERFORMANCE_PROFILES = {
  high: {
    targetFps: TARGET_FPS,
    dpr: CRISIS_MAX_DPR,
    edgeCount: COUNT_EDGE,
    midCount: COUNT_MID,
    coreCount: COUNT_CORE,
    bloom: true,
  },
  low: {
    targetFps: 24,
    dpr: 1,
    edgeCount: 5000,
    midCount: 3500,
    coreCount: 7000,
    bloom: false,
  },
} as const satisfies Record<
  VisualPerformanceTier,
  {
    targetFps: number
    dpr: number
    edgeCount: number
    midCount: number
    coreCount: number
    bloom: boolean
  }
>

export const CRISIS_START_ROTATION_X = -0.18
export const CRISIS_START_ROTATION_Y = 0.62
export const CRISIS_START_ROTATION_Z = 0.03
export const CRISIS_AUTO_ROTATION_SPEED = 0.08
export const CRISIS_DRAG_YAW_SPEED = 0.006
export const CRISIS_DRAG_PITCH_SPEED = 0.004
