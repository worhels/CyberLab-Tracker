import { api } from './client'
import type { CrisisTask, DashboardSummary } from '../types'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary')
  return response.data
}

export async function getCrisisTasks(): Promise<CrisisTask[]> {
  const response = await api.get<CrisisTask[]>('/dashboard/crisis')
  return response.data
}
