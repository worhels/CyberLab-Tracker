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
})
