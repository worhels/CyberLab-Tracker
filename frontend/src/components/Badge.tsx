import type { TaskPriority, TaskStatus, TaskType } from '../types'
import { humanize } from '../utils/format'

const statusClasses: Record<TaskStatus, string> = {
  not_started: 'badge--quiet',
  in_progress: 'badge--ivory',
  submitted: 'badge--ivory',
  accepted: 'badge--ivory',
  debt: 'badge--red',
}

const priorityClasses: Record<TaskPriority, string> = {
  low: 'badge--quiet',
  medium: 'badge--ivory',
  high: 'badge--amber',
  critical: 'badge--red',
}

const typeClasses: Record<TaskType, string> = {
  lab: 'badge--quiet',
  practice: 'badge--quiet',
  coursework: 'badge--ivory',
  exam: 'badge--amber',
  other: 'badge--quiet',
}

interface BadgeProps {
  value: TaskStatus | TaskPriority | TaskType
  variant: 'status' | 'priority' | 'type'
}

export function Badge({ value, variant }: BadgeProps) {
  const classes =
    variant === 'status'
      ? statusClasses[value as TaskStatus]
      : variant === 'priority'
        ? priorityClasses[value as TaskPriority]
        : typeClasses[value as TaskType]

  return (
    <span className={`badge ${classes}`}>
      {humanize(value)}
    </span>
  )
}
