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

      {error ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="space-y-3">
        {isLoading ? (
          <div className="card p-6 text-sm text-slate-400">Loading crisis mode...</div>
        ) : tasks.length ? (
          tasks.map((task, index) => (
            <article key={task.id} className="card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                      {index + 1}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-50">{task.title}</h2>
                    <span className="rounded-md border border-red-400/40 bg-red-400/10 px-2 py-1 text-xs font-semibold text-red-200">
                      {task.crisis_score}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{subjectById.get(task.subject_id)?.name || 'Unknown subject'}</p>
                  {task.description ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{task.description}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge value={task.status} variant="status" />
                  <Badge value={task.priority} variant="priority" />
                  <Badge value={task.type} variant="type" />
                  <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">
                    {formatDate(task.deadline)}
                  </span>
                  {task.estimated_hours ? (
                    <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">
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
