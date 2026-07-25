import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getMySettings, updateMySettings } from '../api/settings'
import type { UserSettings, UserSettingsPayload } from '../types'
import { getErrorMessage } from '../utils/errors'
import { applyDocumentLanguage } from '../utils/languages'
import { applyAccentColor, applyMotionPreference, applyTheme } from '../utils/theme'
import { useAuth } from './AuthContext'

interface SettingsContextValue {
  settings: UserSettings | null
  isLoading: boolean
  error: string
  refreshSettings: () => Promise<void>
  updateSettings: (payload: UserSettingsPayload) => Promise<UserSettings>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const applySettings = useCallback((nextSettings: UserSettings) => {
    applyDocumentLanguage(nextSettings.language)
    applyTheme(nextSettings.theme)
    applyAccentColor(nextSettings.accent_color)
    applyMotionPreference(nextSettings.reduced_motion)
  }, [])

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(null)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const nextSettings = await getMySettings()
      setSettings(nextSettings)
      applySettings(nextSettings)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [applySettings, isAuthenticated])

  const updateSettings = useCallback(
    async (payload: UserSettingsPayload) => {
      const nextSettings = await updateMySettings(payload)
      setSettings(nextSettings)
      applySettings(nextSettings)
      return nextSettings
    },
    [applySettings],
  )

  useEffect(() => {
    if (isAuthLoading) return
    void refreshSettings()
  }, [isAuthLoading, refreshSettings])

  useEffect(() => {
    if (settings?.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemThemeChange = () => applyTheme('system')

    mediaQuery.addEventListener('change', onSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', onSystemThemeChange)
  }, [settings?.theme])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      error,
      refreshSettings,
      updateSettings,
    }),
    [error, isLoading, refreshSettings, settings, updateSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider')
  }
  return context
}
