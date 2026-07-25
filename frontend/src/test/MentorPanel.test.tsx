import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MentorPanel } from '../components/mentor/MentorPanel'

const { streamChat } = vi.hoisted(() => ({
  streamChat: vi.fn(),
}))

vi.mock('../services/mentorApi', () => ({
  streamMentorChat: streamChat,
  MentorApiError: class MentorApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
}))

const defaultProps = {
  isOpen: true,
  page: '/tasks',
  subjectId: undefined,
  taskId: undefined,
  onClose: vi.fn(),
}

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

describe('MentorPanel', () => {
  beforeEach(() => {
    streamChat.mockReset()
  })

  it('uses one automatic chat and exposes generated code as a downloadable file', async () => {
    const answer = 'FILE: calculator.py\n```python\nprint(2 + 2)\n```'
    streamChat.mockImplementation(async (
      _payload: unknown,
      onToken: (token: string) => void,
    ) => {
      onToken(answer)
      return { answer, session_id: 'session-1' }
    })

    render(<MentorPanel {...defaultProps} language="en" taskId={17} />)

    fireEvent.change(
      screen.getByLabelText('Ask about tasks, code, reports, deadlines, or the project...'),
      { target: { value: 'Create a file with calculator code' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(streamChat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Create a file with calculator code',
          language: 'en',
          task_id: 17,
        }),
        expect.any(Function),
        expect.any(AbortSignal),
      )
    })
    expect(await screen.findByText('calculator.py')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download calculator.py' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Build' })).not.toBeInTheDocument()
  })

  it('streams ordinary text through the same chat endpoint', async () => {
    streamChat.mockImplementation(async (
      _payload: unknown,
      onToken: (token: string) => void,
    ) => {
      onToken('Ready')
      return { answer: 'Ready', session_id: 'session-2' }
    })

    render(<MentorPanel {...defaultProps} language="en" />)

    fireEvent.change(
      screen.getByLabelText('Ask about tasks, code, reports, deadlines, or the project...'),
      { target: { value: 'Review the plan' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByText('Ready')).toBeInTheDocument()
    expect(screen.queryByText('mentor-response.txt')).not.toBeInTheDocument()
  })
})
