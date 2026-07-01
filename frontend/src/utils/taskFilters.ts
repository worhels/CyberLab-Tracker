import type { TaskStatus } from '../types'

export type TaskQuickFilter = '' | 'due_today' | 'this_week' | 'overdue' | 'completed' | 'active'

export interface QuickTaskFilterParams {
  status?: TaskStatus
  active_only?: boolean
  deadline_before?: string
  deadline_after?: string
}

function toLocalDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addLocalDays(value: Date, days: number): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + days)
}

export function getQuickTaskFilterParams(
  filter: TaskQuickFilter,
  now = new Date(),
): QuickTaskFilterParams {
  const today = toLocalDateKey(now)

  switch (filter) {
    case 'due_today':
      return {
        active_only: true,
        deadline_after: today,
        deadline_before: today,
      }
    case 'this_week': {
      const daysUntilSunday = (7 - now.getDay()) % 7
      return {
        active_only: true,
        deadline_after: today,
        deadline_before: toLocalDateKey(addLocalDays(now, daysUntilSunday)),
      }
    }
    case 'overdue':
      return {
        active_only: true,
        deadline_before: toLocalDateKey(addLocalDays(now, -1)),
      }
    case 'completed':
      return { status: 'accepted' }
    case 'active':
      return { active_only: true }
    default:
      return {}
  }
}
