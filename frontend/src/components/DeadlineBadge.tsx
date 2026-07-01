import type { TaskStatus } from '../types'

type DeadlineSignal = {
  label: string
  tone: 'overdue' | 'today' | 'soon'
}

interface DeadlineBadgeProps {
  deadline: string | null
  status: TaskStatus
}

function localDayIndex(value: Date): number {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000
}

export function getDeadlineSignal(
  deadline: string | null,
  status: TaskStatus,
  now = new Date(),
): DeadlineSignal | null {
  if (!deadline || status === 'accepted') return null

  const due = new Date(deadline)
  if (Number.isNaN(due.getTime())) return null

  const daysUntilDue = localDayIndex(due) - localDayIndex(now)
  if (daysUntilDue < 0) return { label: 'Overdue', tone: 'overdue' }
  if (daysUntilDue === 0) return { label: 'Due today', tone: 'today' }
  if (daysUntilDue <= 3) return { label: `Due in ${daysUntilDue}d`, tone: 'soon' }
  return null
}

export function DeadlineBadge({ deadline, status }: DeadlineBadgeProps) {
  const signal = getDeadlineSignal(deadline, status)
  if (!signal) return null

  return (
    <span className={`deadline-badge deadline-badge--${signal.tone}`}>
      {signal.label}
    </span>
  )
}
