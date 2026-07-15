import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCrisisData } from '../api/dashboard'
import { getSubjects } from '../api/subjects'
import { CrisisVolumeCube } from '../components/CrisisVolumeCube'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { CrisisTaskCard } from '../components/crisis/CrisisTaskCard'
import { CrisisVolumeFallback } from '../components/crisis/CrisisVolumeFallback'
import { useSettings } from '../context/SettingsContext'
import { useSystemReducedMotion, useVisualPerformanceTier } from '../hooks/useVisualPreferences'
import type { CrisisDashboard, Subject } from '../types'
import { getErrorMessage } from '../utils/errors'
import { translate } from '../utils/i18n'

export function CrisisPage() {
  const { settings } = useSettings()
  const systemReducedMotion = useSystemReducedMotion()
  const performanceTier = useVisualPerformanceTier()
  const [crisisData, setCrisisData] = useState<CrisisDashboard | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const tasks = crisisData?.tasks ?? []
  const showCrisisCube = settings?.show_crisis_cube === true
  const reduceMotion = settings?.reduced_motion === true || systemReducedMotion
  const language = settings?.language ?? 'en'

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  )

  const loadCrisis = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [dashboardData, subjectData] = await Promise.all([getCrisisData(), getSubjects()])
      setCrisisData(dashboardData)
      setSubjects(subjectData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCrisis()
  }, [loadCrisis])

  return (
    <section className="crisis-page">
      <PageHeader
        title={translate(language, 'crisisMode')}
        subtitle={translate(language, 'crisisModeSubtitle')}
      />

      {error ? (
        <div className="app-error-panel mb-4" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" type="button" onClick={() => void loadCrisis()}>
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && crisisData && showCrisisCube ? (
        <section className="crisis-volume-panel" aria-labelledby="crisis-volume-title">
          <div className="crisis-volume-panel__header">
            <p id="crisis-volume-title">
              Crisis Volume · {crisisData.active_tasks} active / {crisisData.total_tasks} total
            </p>
            <span>
              {crisisData.accepted_tasks} accepted · {Math.round(crisisData.completion_ratio * 100)}% assembled
              {!reduceMotion && performanceTier === 'low' ? ' · reduced rendering' : ''}
            </span>
          </div>

          {reduceMotion ? (
            <CrisisVolumeFallback
              completionRatio={crisisData.completion_ratio}
              severityCounts={crisisData.severity_counts}
            />
          ) : (
            <CrisisVolumeCube
              totalTasks={crisisData.total_tasks}
              activeTasks={crisisData.active_tasks}
              acceptedTasks={crisisData.accepted_tasks}
              completionRatio={crisisData.completion_ratio}
              pressureScore={crisisData.pressure_score}
              cohesionScore={crisisData.cohesion_score}
              instabilityScore={crisisData.instability_score}
              severityCounts={crisisData.severity_counts}
              performanceTier={performanceTier}
            />
          )}
        </section>
      ) : null}

      {isLoading ? (
        <div className="card app-muted p-6 text-sm" role="status">Loading crisis mode...</div>
      ) : tasks.length ? (
        <div className="crisis-task-list">
          {tasks.map((task, index) => (
            <CrisisTaskCard
              key={task.id}
              task={task}
              subject={subjectById.get(task.subject_id)}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <EmptyState text={crisisData?.total_tasks ? 'No active crisis tasks found.' : 'No crisis tasks found.'} />
      )}
    </section>
  )
}
