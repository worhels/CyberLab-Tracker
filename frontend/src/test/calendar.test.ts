import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import { groupTasksByLocalDeadline, toLocalDateKey } from '../utils/calendar'

function createTask(id: number, deadline: string | null, status: Task['status'] = 'not_started'): Task {
  return {
    id,
    title: `Task ${id}`,
    description: null,
    deadline,
    subject_id: 1,
    type: 'lab',
    status,
    priority: 'medium',
    github_url: null,
    moodle_url: null,
    report_file: null,
    estimated_hours: null,
    submitted_at: null,
    accepted_at: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
  }
}

function localIso(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month, day, hour).toISOString()
}

describe('calendar task grouping', () => {
  it('groups deadlines by local day and sorts tasks within each day', () => {
    const now = new Date(2026, 6, 15, 12)
    const groups = groupTasksByLocalDeadline([
      createTask(3, localIso(2026, 6, 16, 18)),
      createTask(2, localIso(2026, 6, 15, 16)),
      createTask(1, localIso(2026, 6, 15, 9)),
    ], now)

    expect(groups.today?.dateKey).toBe('2026-07-15')
    expect(groups.today?.tasks.map((task) => task.id)).toEqual([1, 2])
    expect(groups.upcoming.map((group) => group.dateKey)).toEqual(['2026-07-16'])
  })

  it('keeps completed past tasks visible without changing their status', () => {
    const task = createTask(1, localIso(2026, 6, 14), 'accepted')
    const groups = groupTasksByLocalDeadline([task], new Date(2026, 6, 15, 12))

    expect(groups.overdue[0]?.tasks).toEqual([task])
    expect(groups.overdue[0]?.tasks[0]?.status).toBe('accepted')
  })

  it('places null and invalid deadlines in the no-deadline bucket', () => {
    const noDeadline = createTask(1, null)
    const invalidDeadline = createTask(2, 'not-a-date')
    const groups = groupTasksByLocalDeadline([noDeadline, invalidDeadline])

    expect(groups.noDeadline).toEqual([noDeadline, invalidDeadline])
    expect(groups.today).toBeNull()
  })

  it('creates date keys from local calendar fields', () => {
    expect(toLocalDateKey(new Date(2026, 0, 2, 23, 59))).toBe('2026-01-02')
  })
})
