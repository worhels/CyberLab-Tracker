import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkloadVisualization } from '../components/visuals/WorkloadVisualization'
import type { Subject, Task } from '../types'

const { canvasMount } = vi.hoisted(() => ({ canvasMount: vi.fn() }))

vi.mock('../components/visuals/WorkloadSphereCanvas', () => ({
  WorkloadSphereCanvas: () => {
    canvasMount()
    return <canvas data-testid="workload-webgl" />
  },
}))

const subject: Subject = {
  id: 1,
  name: 'Application Security',
  color: '#5577aa',
  teacher: null,
  semester: null,
  description: null,
  user_id: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const tasks: Task[] = [
  {
    id: 1,
    title: 'Threat model',
    description: null,
    deadline: '2000-01-01T00:00:00Z',
    subject_id: subject.id,
    type: 'coursework',
    status: 'debt',
    priority: 'critical',
    github_url: null,
    moodle_url: null,
    report_file: null,
    estimated_hours: null,
    submitted_at: null,
    accepted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Security review',
    description: null,
    deadline: null,
    subject_id: subject.id,
    type: 'practice',
    status: 'accepted',
    priority: 'medium',
    github_url: null,
    moodle_url: null,
    report_file: null,
    estimated_hours: null,
    submitted_at: null,
    accepted_at: '2026-01-02T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
]

const defaultProps = {
  tasks,
  subjects: [subject],
  preferencesReady: true,
  userReducedMotion: false,
  systemReducedMotion: false,
  performanceTier: 'high' as const,
}

describe('WorkloadVisualization', () => {
  beforeEach(() => {
    canvasMount.mockClear()
  })

  it.each([
    ['user reduced-motion', { userReducedMotion: true }],
    ['system reduced-motion', { systemReducedMotion: true }],
    ['low performance tier', { performanceTier: 'low' as const }],
  ])('keeps WebGL unmounted for %s', (_label, override) => {
    render(<WorkloadVisualization {...defaultProps} {...override} />)

    expect(screen.getByRole('heading', { name: 'Static workload overview' })).toBeInTheDocument()
    expect(screen.getByText('Application Security')).toBeInTheDocument()
    expect(screen.getByText('Active', { selector: 'dt' }).parentElement).toHaveTextContent('1')
    expect(screen.queryByTestId('workload-webgl')).not.toBeInTheDocument()
    expect(canvasMount).not.toHaveBeenCalled()
  })

  it('mounts the interactive visualization only for a ready high-tier client', async () => {
    render(<WorkloadVisualization {...defaultProps} />)

    expect(await screen.findByTestId('workload-webgl')).toBeInTheDocument()
    expect(canvasMount).toHaveBeenCalledOnce()
  })
})
