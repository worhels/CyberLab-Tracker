import { useEffect, useState } from 'react'
import { getDashboardSummary } from '../api/dashboard'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import type { DashboardSummary } from '../types'
import { getErrorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section>
      <PageHeader title="Dashboard" subtitle="Subjects, tasks, progress, and deadlines." />

      {error ? <p className="app-error mb-4">{error}</p> : null}

      {isLoading ? (
        <div className="card app-muted p-6 text-sm">Loading dashboard...</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Subjects" value={summary.total_subjects} />
            <StatCard label="Tasks" value={summary.total_tasks} />
            <StatCard label="Accepted" value={summary.accepted_tasks} accent="success" />
            <StatCard label="In progress" value={summary.in_progress_tasks} />
            <StatCard label="Debt" value={summary.debt_tasks} accent="red" />
            <StatCard label="Overdue" value={summary.overdue_tasks} accent="amber" />
            <StatCard label="Progress" value={`${summary.progress_percent}%`} accent="success" />
            <StatCard label="Nearest deadline" value={formatDate(summary.nearest_deadline)} />
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
        </>
      ) : null}
    </section>
  )
}
