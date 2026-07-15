import { useEffect, useState } from 'react'

export type VisualPerformanceTier = 'low' | 'high'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const COMPACT_VISUAL_QUERY = '(max-width: 767px)'

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number
}

function getSystemReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function getPerformanceTier(): VisualPerformanceTier {
  if (typeof window === 'undefined') return 'low'

  const navigatorWithMemory = window.navigator as NavigatorWithDeviceMemory
  const hasLimitedCpu = typeof navigator.hardwareConcurrency === 'number'
    && navigator.hardwareConcurrency <= 4
  const hasLimitedMemory = typeof navigatorWithMemory.deviceMemory === 'number'
    && navigatorWithMemory.deviceMemory <= 4
  const compactViewport = window.matchMedia(COMPACT_VISUAL_QUERY).matches

  return compactViewport || hasLimitedCpu || hasLimitedMemory ? 'low' : 'high'
}

export function useSystemReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(getSystemReducedMotion)

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export function useVisualPerformanceTier(): VisualPerformanceTier {
  const [tier, setTier] = useState(getPerformanceTier)

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_VISUAL_QUERY)
    const update = () => setTier(getPerformanceTier())
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return tier
}
