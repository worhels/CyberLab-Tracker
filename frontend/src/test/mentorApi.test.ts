import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MentorArtifact, MentorArtifactCreateRequest } from '../types/mentor'

const { apiGet, apiPost } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('../api/client', () => ({
  API_BASE_URL: 'http://localhost:8000/api/v1',
  AUTH_LOGOUT_EVENT: 'cyberlab:logout',
  TOKEN_KEY: 'cyberlab_token',
  api: {
    get: apiGet,
    post: apiPost,
  },
}))

import {
  createMentorArtifact,
  getMentorArtifactDownload,
  streamMentorChat,
} from '../services/mentorApi'

const payload: MentorArtifactCreateRequest = {
  template: 'bcrypt-timing-web-v1',
  goal: 'Build a timing comparison lab',
  language: 'en',
  task_id: 17,
}

const artifact: MentorArtifact = {
  id: '00000000-0000-4000-8000-000000000042',
  template: 'bcrypt-timing-web-v1',
  title: 'Bcrypt timing lab',
  description: 'A safe local bcrypt work-factor comparison.',
  default_rounds: 12,
  language: 'en',
  created_at: '2026-07-15T12:00:00Z',
  files: [],
}

describe('mentor artifact API', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
  })

  it('creates an artifact through the authenticated API client', async () => {
    const controller = new AbortController()
    apiPost.mockResolvedValue({ data: artifact })

    await expect(createMentorArtifact(payload, controller.signal)).resolves.toEqual(artifact)
    expect(apiPost).toHaveBeenCalledWith('/mentor/artifacts', payload, {
      signal: controller.signal,
    })
  })

  it('requests the artifact ZIP as a blob', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' })
    apiGet.mockResolvedValue({ data: blob })

    await expect(getMentorArtifactDownload(artifact.id)).resolves.toBe(blob)
    expect(apiGet).toHaveBeenCalledWith(
      '/mentor/artifacts/00000000-0000-4000-8000-000000000042/download',
      {
      responseType: 'blob',
      },
    )
  })

  it('reads the standardized message from a Mentor SSE error event', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      [
        'event: error',
        'data: {"detail":"Mentor is unavailable","error":{"code":"service_unavailable","message":"Mentor is unavailable"}}',
        '',
        '',
      ].join('\n'),
      {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      },
    ))

    try {
      await expect(streamMentorChat(
        {
          message: 'Help with this task',
          page: '/tasks',
          language: 'en',
        },
        vi.fn(),
      )).rejects.toMatchObject({
        message: 'Mentor is unavailable',
        status: 502,
      })
    } finally {
      fetchMock.mockRestore()
    }
  })
})
