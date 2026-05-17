import { useEffect, useMemo, useState } from 'react'
import { getDashboardSummary } from '../api/dashboard'
import { getSubjects } from '../api/subjects'
import { getTasks } from '../api/tasks'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import type { DashboardSummary, Subject, Task } from '../types'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

const priorityWeight: Record<Task['priority'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function getDeadlineTime(value: string | null) {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardSummary(), getTasks(), getSubjects()])
      .then(([summaryData, taskData, subjectData]) => {
        setSummary(summaryData)
        setTasks(taskData)
        setSubjects(subjectData)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  const subjectById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]))
  }, [subjects])

  const priorityQueue = useMemo(() => {
    const now = Date.now()
    return [...tasks]
      .filter((task) => task.status !== 'accepted')
      .sort((left, right) => {
        const leftScore =
          priorityWeight[left.priority] * 10 +
          (left.status === 'debt' ? 18 : 0) +
          (getDeadlineTime(left.deadline) < now ? 12 : 0)
        const rightScore =
          priorityWeight[right.priority] * 10 +
          (right.status === 'debt' ? 18 : 0) +
          (getDeadlineTime(right.deadline) < now ? 12 : 0)

        if (rightScore !== leftScore) return rightScore - leftScore
        return getDeadlineTime(left.deadline) - getDeadlineTime(right.deadline)
      })
      .slice(0, 5)
  }, [tasks])

  const subjectProgress = useMemo(() => {
    return subjects
      .map((subject) => {
        const subjectTasks = tasks.filter((task) => task.subject_id === subject.id)
        const accepted = subjectTasks.filter((task) => task.status === 'accepted').length
        const total = subjectTasks.length
        const percent = total ? Math.round((accepted / total) * 100) : 0

        return {
          subject,
          accepted,
          total,
          percent,
        }
      })
      .sort((left, right) => right.total - left.total || left.subject.name.localeCompare(right.subject.name))
      .slice(0, 5)
  }, [subjects, tasks])

  const recentActivity = useMemo(() => {
    return [...tasks]
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
      .slice(0, 5)
  }, [tasks])

  return (
    <section>
      <PageHeader title="Dashboard" subtitle="Workload, progress, and near-term risk in one control surface." />

      {error ? <p className="app-error mb-4">{error}</p> : null}

      {isLoading ? (
        <div className="card app-muted p-6 text-sm">Loading dashboard...</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Subjects" value={summary.total_subjects} description="Active study lanes in this workspace." />
            <StatCard label="Tasks" value={summary.total_tasks} description="Total tracked deliverables and checkpoints." />
            <StatCard label="Accepted" value={summary.accepted_tasks} accent="success" description="Work already cleared from the queue." />
            <StatCard label="In progress" value={summary.in_progress_tasks} description="Current active execution surface." />
            <StatCard label="Debt" value={summary.debt_tasks} accent="red" description="Items that need recovery attention." />
            <StatCard label="Overdue" value={summary.overdue_tasks} accent="amber" description="Deadline pressure above baseline." />
            <StatCard label="Progress" value={`${summary.progress_percent}%`} accent="success" description="Accepted work against total tracked work." />
            <StatCard label="Nearest deadline" value={formatDate(summary.nearest_deadline)} description="Closest visible point on the timeline." />
          </div>

          <div className="card mt-6 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="app-section-title">Progress</p>
              <p className="app-soft text-sm">{summary.progress_percent}%</p>
            </div>
            <div className="progress-track">
              <div
                className="progress-bar"
                style={{ width: `${Math.min(summary.progress_percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="card dashboard-panel">
              <div className="dashboard-panel__header">
                <div>
                  <p className="dashboard-panel__title">Priority queue</p>
                  <p className="dashboard-panel__subtitle">Highest-friction tasks, weighted by priority, debt, and deadline pressure.</p>
                </div>
                <span className="badge badge--ivory">{priorityQueue.length} visible</span>
              </div>

              {priorityQueue.length ? (
                <div className="queue-list">
                  {priorityQueue.map((task, index) => (
                    <article key={task.id} className="queue-item">
                      <span className="queue-rank">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="item-title truncate">{task.title}</p>
                        <div className="item-meta">
                          <span className="meta-pill">{subjectById.get(task.subject_id)?.name || 'Unknown subject'}</span>
                          <span className="meta-pill">{formatDate(task.deadline)}</span>
                          <Badge value={task.priority} variant="priority" />
                          <Badge value={task.status} variant="status" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Queue clear" text="No active tasks are asking for priority attention right now." />
              )}
            </div>

            <div className="card dashboard-panel">
              <div className="dashboard-panel__header">
                <div>
                  <p className="dashboard-panel__title">Subject progress</p>
                  <p className="dashboard-panel__subtitle">Accepted work by subject, based on the current task set.</p>
                </div>
              </div>

              {subjectProgress.length ? (
                <div className="subject-progress-list">
                  {subjectProgress.map(({ subject, accepted, total, percent }) => (
                    <article key={subject.id} className="subject-progress-item">
                      <div className="subject-progress-row">
                        <div className="subject-progress-name">
                          <span className="subject-dot" style={{ backgroundColor: subject.color }} />
                          <p className="item-title truncate">{subject.name}</p>
                        </div>
                        <span className="meta-pill">{total ? `${accepted}/${total}` : 'No tasks'}</span>
                      </div>
                      <div className="subject-meter" aria-label={`${subject.name} progress`}>
                        <div className="subject-meter__bar" style={{ width: `${percent}%` }} />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No subjects yet" text="Create subjects and tasks to populate the progress map." />
              )}
            </div>

            <div className="card dashboard-panel xl:col-span-2">
              <div className="dashboard-panel__header">
                <div>
                  <p className="dashboard-panel__title">Recent activity</p>
                  <p className="dashboard-panel__subtitle">Latest task updates across the workspace.</p>
                </div>
              </div>

              {recentActivity.length ? (
                <div className="activity-list">
                  {recentActivity.map((task) => (
                    <article key={task.id} className="activity-item">
                      <span className="activity-dot" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="item-title truncate">{task.title}</p>
                          <Badge value={task.type} variant="type" />
                          <Badge value={task.status} variant="status" />
                        </div>
                        <p className="activity-copy">
                          {subjectById.get(task.subject_id)?.name || 'Unknown subject'} updated {formatDate(task.updated_at)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No activity yet" text="Task updates will appear here once the workspace starts moving." />
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
