import { api } from './client'
import type { CrisisDashboard, DashboardSummary } from '../types'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary')
  return response.data
}

export async function getCrisisData(): Promise<CrisisDashboard> {
  const response = await api.get<CrisisDashboard>('/dashboard/crisis')
  return response.data
}
