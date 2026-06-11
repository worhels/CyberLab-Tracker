import { useEffect, useMemo, useState } from 'react'
import { getDashboardSummary } from '../api/dashboard'
import { getSubjects } from '../api/subjects'
import { getTasks } from '../api/tasks'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
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
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <div style={{ marginBottom: '32px' }}>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            marginBottom: '8px',
          }}
        >
          WORKSPACE
        </p>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '8px',
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Workload, progress, and near-term risk in one control surface.
        </p>
      </div>

      {error ? (
        <p style={{ color: 'var(--accent-debt)', marginBottom: '16px', fontSize: '13px' }}>{error}</p>
      ) : null}

      {isLoading ? (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          Loading dashboard...
        </div>
      ) : summary ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <StatCard label="Subjects" value={summary.total_subjects} description="Active study lanes in this workspace." />
            <StatCard label="Tasks" value={summary.total_tasks} description="Total tracked deliverables and checkpoints." />
            <StatCard label="Accepted" value={summary.accepted_tasks} accent="success" description="Work already cleared from the queue." />
            <StatCard label="In Progress" value={summary.in_progress_tasks} description="Current active execution surface." />
            <StatCard label="Debt" value={summary.debt_tasks} accent="red" description="Items that need recovery attention." />
            <StatCard label="Overdue" value={summary.overdue_tasks} accent="amber" description="Deadline pressure above baseline." />
            <StatCard
              label="Progress"
              value={`${summary.progress_percent}%`}
              accent="success"
              description="Accepted work against total tracked work."
            />
            <StatCard
              label="Nearest Deadline"
              value={formatDate(summary.nearest_deadline)}
              description="Closest visible point on the timeline."
            />
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255,255,255,0.045)',
              padding: '22px 26px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '14px',
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                Overall Progress
              </p>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {summary.progress_percent}%
              </p>
            </div>
            <div
              style={{
                width: '100%',
                height: '12px',
                borderRadius: 'var(--r-full)',
                background: 'var(--surface-soft)',
                boxShadow: 'var(--shadow-inset)',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${Math.min(summary.progress_percent, 100)}%`,
                  borderRadius: 'var(--r-full)',
                  background: 'var(--active)',
                  boxShadow: '0 0 10px rgba(240,237,228,0.2)',
                  transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
              {summary.progress_percent > 2 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `calc(${Math.min(summary.progress_percent, 100)}% - 8px)`,
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--active)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'left 0.5s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 0.85fr',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.045)',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '4px',
                    }}
                  >
                    Priority Queue
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-faint)', lineHeight: 1.4 }}>
                    Highest-friction tasks, weighted by priority, debt, and deadline pressure.
                  </p>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    borderRadius: 'var(--r-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'var(--surface-soft)',
                    boxShadow: 'var(--shadow-inset-sm)',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                >
                  {priorityQueue.length} visible
                </span>
              </div>

              {priorityQueue.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {priorityQueue.map((task, index) => (
                    <article
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        background: 'var(--surface-soft)',
                        borderRadius: 'var(--r-md)',
                        boxShadow: 'var(--shadow-inset-sm)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        padding: '14px 16px',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--r-xs)',
                          background: 'var(--active)',
                          color: 'var(--active-text)',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {index + 1}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            marginBottom: '8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.title}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 'var(--r-full)',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {subjectById.get(task.subject_id)?.name || 'Unknown'}
                          </span>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 'var(--r-full)',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {formatDate(task.deadline)}
                          </span>
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

            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.045)',
                padding: '24px',
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '4px',
                  }}
                >
                  Subject Progress
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-faint)', lineHeight: 1.4 }}>
                  Accepted work by subject, based on the current task set.
                </p>
              </div>

              {subjectProgress.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {subjectProgress.map(({ subject, accepted, total, percent }) => (
                    <article key={subject.id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: subject.color,
                              flexShrink: 0,
                              boxShadow: `0 0 6px ${subject.color}88`,
                            }}
                          />
                          <p
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {subject.name}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 'var(--r-full)',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'var(--surface-soft)',
                            boxShadow: 'var(--shadow-inset-sm)',
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                            marginLeft: '8px',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {total ? `${accepted}/${total}` : 'No tasks'}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: 'var(--r-full)',
                          background: 'var(--surface-soft)',
                          boxShadow: 'var(--shadow-inset-sm)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            borderRadius: 'var(--r-full)',
                            backgroundColor: subject.color,
                            boxShadow: `0 0 6px ${subject.color}66`,
                            transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                          }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No subjects yet" text="Create subjects and tasks to populate the progress map." />
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255,255,255,0.045)',
              padding: '24px',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '4px',
                }}
              >
                Recent Activity
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', lineHeight: 1.4 }}>
                Latest task updates across the workspace.
              </p>
            </div>

            {recentActivity.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentActivity.map((task) => (
                  <article
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      background: 'var(--surface-soft)',
                      borderRadius: 'var(--r-md)',
                      boxShadow: 'var(--shadow-inset-sm)',
                      border: '1px solid rgba(0,0,0,0.2)',
                      padding: '14px 16px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--active)',
                        flexShrink: 0,
                        marginTop: '5px',
                        boxShadow: '0 0 6px rgba(240,237,228,0.3)',
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '5px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.title}
                        </p>
                        <Badge value={task.type} variant="type" />
                        <Badge value={task.status} variant="status" />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {subjectById.get(task.subject_id)?.name || 'Unknown subject'} - updated {formatDate(task.updated_at)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No activity yet" text="Task updates will appear here once the workspace starts moving." />
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
