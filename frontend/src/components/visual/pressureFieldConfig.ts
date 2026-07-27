export type PressureFieldVariant =
  | 'tasks'
  | 'dashboard'
  | 'subjects'
  | 'crisis'
  | 'stats'
  | 'settings'

export interface PressureFieldVariantSettings {
  seed: number
  speed: number
  dpr: number
  shaderBias: number
  lineCount: number
  dustCount: number
}

export const PRESSURE_FIELD_VARIANTS = {
  tasks: {
    seed: 1409,
    speed: 0.58,
    dpr: 0.75,
    shaderBias: 0.1,
    lineCount: 28,
    dustCount: 70,
  },
  dashboard: {
    seed: 2617,
    speed: 0.48,
    dpr: 0.75,
    shaderBias: -0.08,
    lineCount: 26,
    dustCount: 64,
  },
  subjects: {
    seed: 3167,
    speed: 0.52,
    dpr: 0.75,
    shaderBias: -0.02,
    lineCount: 26,
    dustCount: 66,
  },
  crisis: {
    seed: 3821,
    speed: 0.68,
    dpr: 0.75,
    shaderBias: 0.24,
    lineCount: 34,
    dustCount: 84,
  },
  stats: {
    seed: 4721,
    speed: 0.42,
    dpr: 0.75,
    shaderBias: -0.12,
    lineCount: 24,
    dustCount: 56,
  },
  settings: {
    seed: 5923,
    speed: 0.32,
    dpr: 0.75,
    shaderBias: -0.18,
    lineCount: 18,
    dustCount: 44,
  },
} satisfies Record<PressureFieldVariant, PressureFieldVariantSettings>

export const PRESSURE_FIELD_Y_BIAS = 0.38
export const PRESSURE_FIELD_MAX_DPR = 0.75
export const PRESSURE_FIELD_TARGET_FPS = 60
