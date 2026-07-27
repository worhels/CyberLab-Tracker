import axios from 'axios'

interface ApiErrorObject {
  message?: unknown
}

interface ApiErrorEnvelope {
  detail?: unknown
  error?: ApiErrorObject
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return typeof value === 'object' && value !== null
}

function getValidationMessage(detail: unknown): string | null {
  if (!Array.isArray(detail)) return null

  const messages = detail
    .map((item) => {
      if (typeof item !== 'object' || item === null || !('msg' in item)) return null
      return typeof item.msg === 'string' ? item.msg : null
    })
    .filter((message): message is string => message !== null)

  return messages.length ? messages.join(', ') : null
}

export function getApiErrorMessage(payload: unknown): string | null {
  if (!isApiErrorEnvelope(payload)) return null

  const validationMessage = getValidationMessage(payload.detail)
  if (validationMessage) return validationMessage
  if (
    typeof payload.error === 'object'
    && payload.error !== null
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }
  if (typeof payload.detail === 'string') return payload.detail
  return null
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = getApiErrorMessage(error.response?.data)
    if (apiMessage) return apiMessage
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
