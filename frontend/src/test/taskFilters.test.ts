import { describe, expect, it } from 'vitest'
import { getQuickTaskFilterParams } from '../utils/taskFilters'

describe('quick task date filters', () => {
  it('uses the local calendar date even late in the day', () => {
    const now = new Date(2026, 6, 15, 23, 45)

    expect(getQuickTaskFilterParams('due_today', now)).toEqual({
      active_only: true,
      deadline_after: '2026-07-15',
      deadline_before: '2026-07-15',
    })
  })

  it('keeps this-week boundaries on local dates across a month boundary', () => {
    const saturday = new Date(2026, 9, 31, 23, 30)

    expect(getQuickTaskFilterParams('this_week', saturday)).toEqual({
      active_only: true,
      deadline_after: '2026-10-31',
      deadline_before: '2026-11-01',
    })
  })

  it('uses the previous local date as the inclusive overdue boundary', () => {
    const now = new Date(2026, 0, 1, 0, 15)

    expect(getQuickTaskFilterParams('overdue', now)).toEqual({
      active_only: true,
      deadline_before: '2025-12-31',
    })
  })
})
