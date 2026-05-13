import type { TaskPriority, TaskStatus, TaskType } from '../types'
import { humanize } from '../utils/format'

const statusClasses: Record<TaskStatus, string> = {
  not_started: 'border-slate-600 bg-slate-800/70 text-slate-200',
  in_progress: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  submitted: 'border-blue-400/40 bg-blue-400/10 text-blue-200',
  accepted: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  debt: 'border-red-400/40 bg-red-400/10 text-red-200',
}

const priorityClasses: Record<TaskPriority, string> = {
  low: 'border-slate-600 bg-slate-800/60 text-slate-300',
  medium: 'border-blue-400/40 bg-blue-400/10 text-blue-200',
  high: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
  critical: 'border-red-400/50 bg-red-400/10 text-red-200',
}

const typeClasses: Record<TaskType, string> = {
  lab: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  practice: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  coursework: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
  exam: 'border-rose-400/40 bg-rose-400/10 text-rose-200',
  other: 'border-slate-600 bg-slate-800/60 text-slate-300',
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
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${classes}`}>
      {humanize(value)}
    </span>
  )
}
