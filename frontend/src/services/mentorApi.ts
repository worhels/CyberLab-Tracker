import {
  API_BASE_URL,
  AUTH_LOGOUT_EVENT,
  TOKEN_KEY,
  api,
} from '../api/client'
import type { MentorChatRequest, MentorChatResponse } from '../types/mentor'

interface MentorStreamEvent {
  event: 'token' | 'done' | 'error' | string
  data: unknown
}

interface MentorStreamPayload {
  token?: string
  session_id?: string
  detail?: string
}

export class MentorApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MentorApiError'
    this.status = status
  }
}

function isMentorStreamPayload(value: unknown): value is MentorStreamPayload {
  return typeof value === 'object' && value !== null
}

function parseStreamEvent(block: string): MentorStreamEvent | null {
  const lines = block.split('\n')
  const eventLine = lines.find((line) => line.startsWith('event:'))
  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())

  if (!eventLine || dataLines.length === 0) return null

  const event = eventLine.slice(6).trim()
  const rawData = dataLines.join('\n')
  try {
    return { event, data: JSON.parse(rawData) as unknown }
  } catch {
    throw new MentorApiError('Mentor returned an invalid stream event.', 502)
  }
}

async function getResponseError(response: Response): Promise<MentorApiError> {
  let detail = `Mentor request failed with status ${response.status}.`
  try {
    const body = await response.json() as unknown
    if (
      typeof body === 'object'
      && body !== null
      && 'detail' in body
      && typeof body.detail === 'string'
    ) {
      detail = body.detail
    }
  } catch {
    // Keep the status-based fallback when the body is not JSON.
  }
  return new MentorApiError(detail, response.status)
}

export async function sendMentorMessage(payload: MentorChatRequest): Promise<MentorChatResponse> {
  const response = await api.post<MentorChatResponse>('/mentor/chat', payload)
  return response.data
}

export async function streamMentorChat(
  payload: MentorChatRequest,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<MentorChatResponse> {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}/mentor/chat/stream`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }
    throw await getResponseError(response)
  }
  if (!response.body) {
    throw new MentorApiError('Mentor returned an empty response stream.', 502)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let sessionId = ''

  const processEvent = (block: string) => {
    const streamEvent = parseStreamEvent(block)
    if (!streamEvent || !isMentorStreamPayload(streamEvent.data)) return

    if (streamEvent.event === 'token' && typeof streamEvent.data.token === 'string') {
      answer += streamEvent.data.token
      onToken(streamEvent.data.token)
      return
    }
    if (streamEvent.event === 'done' && typeof streamEvent.data.session_id === 'string') {
      sessionId = streamEvent.data.session_id
      return
    }
    if (streamEvent.event === 'error') {
      const detail = typeof streamEvent.data.detail === 'string'
        ? streamEvent.data.detail
        : 'Mentor could not complete the response.'
      throw new MentorApiError(detail, 502)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      let boundaryIndex = buffer.indexOf('\n\n')
      while (boundaryIndex >= 0) {
        processEvent(buffer.slice(0, boundaryIndex))
        buffer = buffer.slice(boundaryIndex + 2)
        boundaryIndex = buffer.indexOf('\n\n')
      }
    }
  } catch (error) {
    await reader.cancel()
    throw error
  } finally {
    reader.releaseLock()
  }

  buffer += decoder.decode()
  if (buffer.trim()) processEvent(buffer)
  if (!sessionId) {
    throw new MentorApiError('Mentor stream ended before completion.', 502)
  }

  return {
    answer: answer.trim(),
    session_id: sessionId,
  }
}
