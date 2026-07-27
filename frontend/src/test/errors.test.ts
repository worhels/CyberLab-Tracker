import { describe, expect, it } from 'vitest'
import { getApiErrorMessage, getErrorMessage } from '../utils/errors'

describe('API error parsing', () => {
  it('reads the standardized error message', () => {
    expect(getApiErrorMessage({
      detail: 'Legacy detail',
      error: {
        code: 'not_found',
        message: 'Task not found',
      },
    })).toBe('Task not found')
  })

  it('keeps field-level validation messages for old and new envelopes', () => {
    expect(getApiErrorMessage({
      detail: [
        { loc: ['body', 'title'], msg: 'Field required', type: 'missing' },
        { loc: ['body', 'deadline'], msg: 'Invalid datetime', type: 'value_error' },
      ],
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
      },
    })).toBe('Field required, Invalid datetime')
  })

  it('extracts the standardized envelope from an Axios-compatible error', () => {
    const error = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        data: {
          detail: 'Subject not found',
          error: {
            code: 'not_found',
            message: 'Subject not found',
          },
        },
      },
    }

    expect(getErrorMessage(error)).toBe('Subject not found')
  })
})
