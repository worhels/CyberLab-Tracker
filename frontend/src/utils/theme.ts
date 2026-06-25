import type { AccentColor, Theme } from '../types'

export function resolveTheme(theme: Theme): 'light' | 'dark' | 'zerkalo' {
  if (theme === 'zerkalo') return 'zerkalo'
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolvedTheme = resolveTheme(theme)

  root.classList.remove('light', 'dark', 'zerkalo')
  root.classList.add(resolvedTheme)
  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = theme
}

export function applyAccentColor(accentColor: AccentColor) {
  document.documentElement.dataset.accent = accentColor
}

export function applyMotionPreference(reducedMotion: boolean) {
  document.documentElement.classList.toggle('reduced-motion', reducedMotion)
}
