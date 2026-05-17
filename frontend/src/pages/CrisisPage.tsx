import { useEffect, useMemo, useState } from 'react'
import { getCrisisTasks } from '../api/dashboard'
import { getSubjects } from '../api/subjects'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import type { CrisisTask, Subject } from '../types'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

export function CrisisPage() {
  const [tasks, setTasks] = useState<CrisisTask[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const subjectById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]))
  }, [subjects])

  useEffect(() => {
    Promise.all([getCrisisTasks(), getSubjects()])
      .then(([taskData, subjectData]) => {
        setTasks(taskData)
        setSubjects(subjectData)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section>
      <PageHeader title="Crisis Mode" subtitle="Highest-risk tasks sorted by crisis score." />

      {error ? <p className="app-error mb-4">{error}</p> : null}

      <div className="space-y-3">
        {isLoading ? (
          <div className="card app-muted p-6 text-sm">Loading crisis mode...</div>
        ) : tasks.length ? (
          tasks.map((task, index) => (
            <article key={task.id} className="card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-white/[0.06] text-sm font-semibold text-[#F2F0EA]">
                      {index + 1}
                    </span>
                    <h2 className="text-lg font-semibold text-[#F2F0EA]">{task.title}</h2>
                    <span className="badge badge--red">
                      {task.crisis_score}
                    </span>
                  </div>
                  <p className="app-muted text-sm">{subjectById.get(task.subject_id)?.name || 'Unknown subject'}</p>
                  {task.description ? <p className="app-muted mt-2 max-w-3xl text-sm">{task.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge value={task.status} variant="status" />
                  <Badge value={task.priority} variant="priority" />
                  <Badge value={task.type} variant="type" />
                  <span className="badge badge--quiet">
                    {formatDate(task.deadline)}
                  </span>
                  {task.estimated_hours ? (
                    <span className="badge badge--quiet">
                      {task.estimated_hours}h
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState text="No crisis tasks found." />
        )}
      </div>
    </section>
  )
}
