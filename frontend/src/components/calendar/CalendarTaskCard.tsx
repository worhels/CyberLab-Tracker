import { Badge } from '../Badge'
import { DeadlineBadge } from '../DeadlineBadge'
import type { Subject, Task } from '../../types'

interface CalendarTaskCardProps {
  task: Task
  subject?: Subject
  isPastDate?: boolean
  locale: string
}

export function CalendarTaskCard({
  task,
  subject,
  isPastDate = false,
  locale,
}: CalendarTaskCardProps) {
  const deadline = task.deadline ? new Date(task.deadline) : null
  const validDeadline = deadline && !Number.isNaN(deadline.getTime()) ? deadline : null
  const isOverdue = isPastDate && task.status !== 'accepted'

  return (
    <article className={`calendar-task${isOverdue ? ' calendar-task--overdue' : ''}`}>
      <div className="calendar-task__heading">
        <span
          className="calendar-task__subject-dot"
          style={{ backgroundColor: subject?.color ?? 'var(--text-faint)' }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3 className="calendar-task__title">{task.title}</h3>
          <p className="calendar-task__subject">{subject?.name ?? 'Unknown subject'}</p>
        </div>
        {validDeadline ? (
          <time className="calendar-task__time" dateTime={task.deadline ?? undefined}>
            {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(validDeadline)}
          </time>
        ) : null}
      </div>

      {task.description ? <p className="calendar-task__description">{task.description}</p> : null}

      <div className="calendar-task__meta">
        <Badge value={task.status} variant="status" />
        <Badge value={task.priority} variant="priority" />
        <Badge value={task.type} variant="type" />
        <DeadlineBadge deadline={task.deadline} status={task.status} />
        {task.estimated_hours !== null ? <span className="meta-pill">{task.estimated_hours}h</span> : null}
      </div>
    </article>
  )
}
