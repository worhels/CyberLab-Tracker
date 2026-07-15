import { useId, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Subject, Task } from '../../types'
import { formatDate } from '../../utils/format'
import { createWorkloadHotspots } from './workloadHotspotData'
import type { WorkloadHotspot } from './workloadHotspotData'

export type WorkloadFallbackReason =
  | 'preferences-pending'
  | 'reduced-motion'
  | 'limited-device'
  | 'interactive-loading'

interface WorkloadSummaryFallbackProps {
  tasks: Task[]
  subjects: Subject[]
  reason: WorkloadFallbackReason
}

const reasonCopy: Record<WorkloadFallbackReason, string> = {
  'preferences-pending': 'The lightweight view is shown until visual preferences are available.',
  'reduced-motion': 'Motion and 3D effects are disabled by your accessibility preferences.',
  'limited-device': 'A lightweight view is used on compact or resource-constrained devices.',
  'interactive-loading': 'Loading the interactive view. Your workload remains available below.',
}

function isActiveTask(task: Task) {
  return task.status !== 'accepted'
}

function isOverdueTask(task: Task) {
  if (!isActiveTask(task) || !task.deadline) return false

  const deadlineTime = new Date(task.deadline).getTime()
  return !Number.isNaN(deadlineTime) && deadlineTime < Date.now()
}

function getStatusLabel(status: WorkloadHotspot['status']) {
  switch (status) {
    case 'critical':
      return 'Critical'
    case 'warning':
      return 'Due soon'
    case 'done':
      return 'Complete'
    case 'empty':
      return 'No tasks'
    case 'active':
    default:
      return 'Active'
  }
}

export function WorkloadSummaryFallback({ tasks, subjects, reason }: WorkloadSummaryFallbackProps) {
  const titleId = useId()
  const summary = useMemo(() => {
    const activeTasks = tasks.filter(isActiveTask)

    return {
      active: activeTasks.length,
      completed: tasks.length - activeTasks.length,
      overdue: activeTasks.filter(isOverdueTask).length,
      critical: activeTasks.filter(
        (task) => task.priority === 'critical' || task.status === 'debt',
      ).length,
    }
  }, [tasks])
  const prioritySubjects = useMemo(
    () => createWorkloadHotspots(subjects, tasks).slice(0, 4),
    [subjects, tasks],
  )

  return (
    <div className="workload-summary" role="region" aria-labelledby={titleId}>
      <header className="workload-summary__header">
        <div>
          <p className="workload-summary__eyebrow">Workload summary</p>
          <h2 id={titleId} className="workload-summary__title">Static workload overview</h2>
          <p className="workload-summary__reason">{reasonCopy[reason]}</p>
        </div>
        <span className="workload-summary__mode">WebGL off</span>
      </header>

      <dl className="workload-summary__metrics">
        {[
          ['Active', summary.active],
          ['Completed', summary.completed],
          ['Overdue', summary.overdue],
          ['Critical', summary.critical],
        ].map(([label, value]) => (
          <div key={label} className="workload-summary__metric">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="workload-summary__subjects" aria-labelledby={`${titleId}-subjects`}>
        <div className="workload-summary__section-heading">
          <h3 id={`${titleId}-subjects`}>Priority subjects</h3>
          <p>Ranked by deadlines, priority, and debt.</p>
        </div>

        {prioritySubjects.length ? (
          <ul className="workload-summary__subject-list">
            {prioritySubjects.map((subject) => (
              <li
                key={subject.id}
                className="workload-summary__subject"
                style={{ '--workload-subject-color': subject.subjectColor } as CSSProperties}
              >
                <div className="workload-summary__subject-heading">
                  <span className="workload-summary__subject-dot" aria-hidden="true" />
                  <div>
                    <p className="workload-summary__subject-name">{subject.label}</p>
                    <p className="workload-summary__subject-detail">
                      {subject.activeTasksCount} active · {subject.completedTasksCount} completed
                    </p>
                  </div>
                  <span className={`workload-summary__status workload-summary__status--${subject.status}`}>
                    {getStatusLabel(subject.status)}
                  </span>
                </div>

                <div className="workload-summary__progress-row">
                  <progress
                    aria-label={`${subject.label} completion`}
                    max={100}
                    value={subject.progress}
                  >
                    {subject.progress}%
                  </progress>
                  <span>{subject.progress}%</span>
                </div>

                {subject.nearestDeadline ? (
                  <p className="workload-summary__deadline">
                    Nearest deadline: {formatDate(subject.nearestDeadline)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="workload-summary__empty">No subject workload yet.</p>
        )}
      </section>
    </div>
  )
}
