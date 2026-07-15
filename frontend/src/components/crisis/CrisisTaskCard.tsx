import { Badge } from '../Badge'
import { DeadlineBadge } from '../DeadlineBadge'
import type { CrisisTask, Subject } from '../../types'
import { formatDate } from '../../utils/format'

interface CrisisTaskCardProps {
  task: CrisisTask
  subject?: Subject
  rank: number
}

export function CrisisTaskCard({ task, subject, rank }: CrisisTaskCardProps) {
  return (
    <article className="crisis-task-card">
      <div className="crisis-task-card__heading">
        <span className="crisis-task-card__rank" aria-label={`Risk rank ${rank}`}>{rank}</span>
        <h2>{task.title}</h2>
        <span className="crisis-task-card__score" aria-label={`Crisis score ${task.crisis_score}`}>
          {task.crisis_score}
        </span>
      </div>
      <div>
        <p className="crisis-task-card__subject">{subject?.name ?? 'Unknown subject'}</p>
        {task.description ? <p className="crisis-task-card__description">{task.description}</p> : null}
      </div>
      <div className="crisis-task-card__meta">
        <Badge value={task.status} variant="status" />
        <Badge value={task.priority} variant="priority" />
        <Badge value={task.type} variant="type" />
        <span className="meta-pill">{formatDate(task.deadline)}</span>
        <DeadlineBadge deadline={task.deadline} status={task.status} />
        {task.estimated_hours !== null ? <span className="meta-pill">{task.estimated_hours}h</span> : null}
      </div>
    </article>
  )
}
