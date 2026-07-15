import { describe, expect, it } from 'vitest'
import { formatDate, toApiDateTime, toInputDateTime } from '../utils/format'

describe('date formatting', () => {
  it('keeps a local date-time stable when converting to and from the API format', () => {
    const localInput = '2026-07-15T14:30'
    const apiValue = toApiDateTime(localInput)

    expect(apiValue).toBe(new Date(2026, 6, 15, 14, 30).toISOString())
    expect(toInputDateTime(new Date(apiValue as string))).toBe(localInput)
  })

  it('uses null-safe fallbacks for optional deadlines', () => {
    expect(toApiDateTime('')).toBeNull()
    expect(formatDate(null)).toBe('No date')
  })

  it('formats offset timestamps as the same instant in the current timezone', () => {
    const value = '2026-07-15T12:30:00+03:00'
    const expected = new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))

    expect(formatDate(value)).toBe(expected)
  })
})
