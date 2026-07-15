import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MentorPanel } from '../components/mentor/MentorPanel'
import type { MentorArtifact } from '../types/mentor'

const {
  createArtifact,
  getArtifactDownload,
  saveArtifactDownload,
  streamChat,
} = vi.hoisted(() => ({
  createArtifact: vi.fn(),
  getArtifactDownload: vi.fn(),
  saveArtifactDownload: vi.fn(),
  streamChat: vi.fn(),
}))

vi.mock('../services/mentorApi', () => ({
  createMentorArtifact: createArtifact,
  getMentorArtifactDownload: getArtifactDownload,
  saveMentorArtifactDownload: saveArtifactDownload,
  streamMentorChat: streamChat,
  MentorApiError: class MentorApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

const artifact: MentorArtifact = {
  id: '00000000-0000-4000-8000-000000000042',
  template: 'bcrypt-timing-web-v1',
  title: 'Bcrypt timing lab',
  description: 'Безпечна локальна лабораторна для порівняння work factor.',
  default_rounds: 12,
  language: 'uk',
  created_at: '2026-07-15T12:00:00Z',
  files: [
    {
      id: 'readme-file',
      path: 'README.md',
      size_bytes: 2_048,
      sha256: 'a'.repeat(64),
    },
  ],
}

const defaultProps = {
  isOpen: true,
  page: '/tasks',
  subjectId: undefined,
  taskId: undefined,
  onClose: vi.fn(),
  onModeChange: vi.fn(),
}

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

describe('MentorPanel', () => {
  beforeEach(() => {
    createArtifact.mockReset()
    getArtifactDownload.mockReset()
    saveArtifactDownload.mockReset()
    streamChat.mockReset()
  })

  it('builds an artifact without sending the build mode to SSE and downloads its ZIP', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' })
    createArtifact.mockResolvedValue(artifact)
    getArtifactDownload.mockResolvedValue(blob)

    render(
      <MentorPanel
        {...defaultProps}
        language="uk"
        mode="build"
        taskId={17}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Опиши мету для bcrypt timing web-проєкту...'),
      { target: { value: 'Порівняти безпечні bcrypt work factors' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Зібрати' }))

    await waitFor(() => {
      expect(createArtifact).toHaveBeenCalledWith(
        {
          template: 'bcrypt-timing-web-v1',
          goal: 'Порівняти безпечні bcrypt work factors',
          language: 'uk',
          task_id: 17,
        },
        expect.any(AbortSignal),
      )
    })
    expect(streamChat).not.toHaveBeenCalled()
    expect(await screen.findByText('Bcrypt timing lab')).toBeInTheDocument()
    expect(screen.getByText('README.md')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Завантажити ZIP' }))
    await waitFor(() => {
      expect(getArtifactDownload).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000042')
      expect(saveArtifactDownload).toHaveBeenCalledWith(
        blob,
        '00000000-0000-4000-8000-000000000042',
      )
    })
  })

  it('passes the interface language to normal chat requests', async () => {
    streamChat.mockResolvedValue({ answer: 'Готово', session_id: 'session-1' })

    render(
      <MentorPanel
        {...defaultProps}
        language="ru"
        mode="chat"
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Спроси про задачи, код, отчёт, дедлайны или проект...'),
      { target: { value: 'Проверь план' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Отправить сообщение' }))

    await waitFor(() => {
      expect(streamChat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Проверь план',
          mode: 'chat',
          language: 'ru',
        }),
        expect.any(Function),
        expect.any(AbortSignal),
      )
    })
    expect(createArtifact).not.toHaveBeenCalled()
  })
})
