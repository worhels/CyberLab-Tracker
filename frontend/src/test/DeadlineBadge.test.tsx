import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeadlineBadge } from '../components/DeadlineBadge'

describe('DeadlineBadge', () => {
  it('renders an overdue signal for an unfinished past task', () => {
    render(<DeadlineBadge deadline="2000-01-01T00:00:00Z" status="in_progress" />)

    expect(screen.getByText('Overdue')).toHaveClass('deadline-badge--overdue')
  })

  it('does not render a signal for nullable or accepted deadlines', () => {
    const { rerender } = render(<DeadlineBadge deadline={null} status="not_started" />)
    expect(screen.queryByText(/Due|Overdue/)).not.toBeInTheDocument()

    rerender(<DeadlineBadge deadline="2000-01-01T00:00:00Z" status="accepted" />)
    expect(screen.queryByText(/Due|Overdue/)).not.toBeInTheDocument()
  })
})
