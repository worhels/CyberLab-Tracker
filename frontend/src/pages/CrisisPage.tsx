import { useEffect, useMemo, useState } from 'react'
import { getCrisisData } from '../api/dashboard'
import { getSubjects } from '../api/subjects'
import { Badge } from '../components/Badge'
import { CrisisVolumeCube } from '../components/CrisisVolumeCube'
import { EmptyState } from '../components/EmptyState'
import type { CrisisDashboard, Subject } from '../types'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

export function CrisisPage() {
  const [crisisData, setCrisisData] = useState<CrisisDashboard | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const tasks = crisisData?.tasks ?? []

  const subjectById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]))
  }, [subjects])

  useEffect(() => {
    Promise.all([getCrisisData(), getSubjects()])
      .then(([dashboardData, subjectData]) => {
        setCrisisData(dashboardData)
        setSubjects(subjectData)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <div style={{ marginBottom: '28px' }}>
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
          Crisis Mode
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Highest-risk tasks sorted by crisis score.
        </p>
      </div>

      {error ? (
        <p style={{ color: 'var(--accent-debt)', marginBottom: '16px', fontSize: '13px' }}>{error}</p>
      ) : null}

      {!isLoading && crisisData ? (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.045)',
            padding: '20px 24px 0',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '12px',
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
              Crisis Volume - {crisisData.active_tasks} active / {crisisData.total_tasks} total
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              {crisisData.accepted_tasks} accepted - {Math.round(crisisData.completion_ratio * 100)}% assembled
            </p>
          </div>
          <CrisisVolumeCube
            totalTasks={crisisData.total_tasks}
            activeTasks={crisisData.active_tasks}
            acceptedTasks={crisisData.accepted_tasks}
            completionRatio={crisisData.completion_ratio}
            pressureScore={crisisData.pressure_score}
            cohesionScore={crisisData.cohesion_score}
            instabilityScore={crisisData.instability_score}
            severityCounts={crisisData.severity_counts}
          />
        </div>
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
          Loading crisis mode...
        </div>
      ) : tasks.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task, index) => (
            <article
              key={task.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.045)',
                padding: '18px 22px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '28px',
                      height: '28px',
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
                  <h2
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {task.title}
                  </h2>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--r-full)',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: 'rgba(200,80,80,0.15)',
                      color: 'var(--accent-debt)',
                      border: '1px solid rgba(200,80,80,0.25)',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}
                  >
                    {task.crisis_score}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-faint)',
                      marginBottom: '4px',
                    }}
                  >
                    {subjectById.get(task.subject_id)?.name || 'Unknown subject'}
                  </p>
                  {task.description ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {task.description}
                    </p>
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <Badge value={task.status} variant="status" />
                  <Badge value={task.priority} variant="priority" />
                  <Badge value={task.type} variant="type" />
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--r-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'var(--surface-soft)',
                      boxShadow: 'var(--shadow-inset-sm)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatDate(task.deadline)}
                  </span>
                  {task.estimated_hours ? (
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--r-full)',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'var(--surface-soft)',
                        boxShadow: 'var(--shadow-inset-sm)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {task.estimated_hours}h
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState text={crisisData?.total_tasks ? 'No active crisis tasks found.' : 'No crisis tasks found.'} />
      )}
    </div>
  )
}
