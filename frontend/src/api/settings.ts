import { api } from './client'
import type { UserSettings, UserSettingsPayload } from '../types'

export async function getMySettings(): Promise<UserSettings> {
  const response = await api.get<UserSettings>('/settings/me')
  return response.data
}

export async function updateMySettings(payload: UserSettingsPayload): Promise<UserSettings> {
  const response = await api.patch<UserSettings>('/settings/me', payload)
  return response.data
}

export const settingsApi = {
  getMySettings,
  updateMySettings,
}
