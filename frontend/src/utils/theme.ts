import type { AccentColor, Theme } from '../types'

const accentColors: Record<AccentColor, string> = {
  blue: '#4b8ec8',
  purple: '#8b5cf6',
  green: '#4fc87a',
  orange: '#f97316',
  red: '#c85050',
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  const int = Number.parseInt(value, 16)
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`
}

function readableTextOn(hex: string) {
  const value = hex.replace('#', '')
  const int = Number.parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#111111' : '#ffffff'
}

export function resolveTheme(theme: Theme): 'light' | 'dark' | 'zerkalo' {
  if (theme === 'zerkalo') return 'zerkalo'
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark', 'zerkalo')
  root.classList.add(resolveTheme(theme))
  root.dataset.themePreference = theme
}

export function applyAccentColor(accentColor: AccentColor) {
  const color = accentColors[accentColor]
  const root = document.documentElement
  root.dataset.accent = accentColor
  root.style.setProperty('--accent-info', color)
  root.style.setProperty('--accent-primary', color)
  root.style.setProperty('--accent-primary-rgb', hexToRgb(color))
  root.style.setProperty('--active', color)
  root.style.setProperty('--active-text', readableTextOn(color))
}

export function applyMotionPreference(reducedMotion: boolean) {
  document.documentElement.classList.toggle('reduced-motion', reducedMotion)
}
