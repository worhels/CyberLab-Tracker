import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { deleteTask, getTasks, updateTaskStatus } from '../api/tasks'
import { deleteSubject, getSubjects } from '../api/subjects'
import { Badge } from '../components/Badge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DeadlineBadge } from '../components/DeadlineBadge'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { WorkloadSphereCanvas } from '../components/visuals/WorkloadSphereCanvas'
import type { Subject, Task, TaskPriority, TaskStatus, TaskType } from '../types'
import { getErrorMessage } from '../utils/errors'
import { formatDate, humanize } from '../utils/format'
import { taskPriorities, taskStatuses, taskTypes } from '../utils/options'
import { getQuickTaskFilterParams } from '../utils/taskFilters'
import type { TaskQuickFilter } from '../utils/taskFilters'

const TASKS_PER_PAGE = 8
const taskRowEase = [0.22, 1, 0.36, 1] as const
const quickFilters: Array<{ value: Exclude<TaskQuickFilter, ''>; label: string }> = [
  { value: 'due_today', label: 'Due today' },
  { value: 'this_week', label: 'This week' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'active', label: 'Active' },
]
type ListMode = 'all' | 'tasks' | 'subjects'
type DeleteTarget =
  | { kind: 'task'; id: number; name: string }
  | { kind: 'subject'; id: number; name: string }
interface AppliedTaskFilters {
  search: string
  priority: TaskPriority | ''
  type: TaskType | ''
  quick: TaskQuickFilter
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('')
  const [quickFilter, setQuickFilter] = useState<TaskQuickFilter>('')
  const [listMode, setListMode] = useState<ListMode>('all')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<AppliedTaskFilters>({
    search: '',
    priority: '',
    type: '',
    quick: '',
  })

  const subjectById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]))
  }, [subjects])

  const pageCount = useMemo(() => Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE)), [tasks.length])
  const visibleTasks = useMemo(() => {
    const start = (page - 1) * TASKS_PER_PAGE
    return tasks.slice(start, start + TASKS_PER_PAGE)
  }, [page, tasks])
  const pageStart = tasks.length ? (page - 1) * TASKS_PER_PAGE + 1 : 0
  const pageEnd = Math.min(page * TASKS_PER_PAGE, tasks.length)
  const showTasks = listMode !== 'subjects'
  const showSubjects = listMode !== 'tasks'

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [subjectsData, tasksData] = await Promise.all([
        getSubjects(),
        getTasks({
          search: appliedFilters.search || undefined,
          priority: appliedFilters.priority || undefined,
          type: appliedFilters.type || undefined,
          ...getQuickTaskFilterParams(appliedFilters.quick),
        }),
      ])
      setSubjects(subjectsData)
      setTasks(tasksData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  const onStatusChange = async (taskId: number, status: TaskStatus) => {
    const updated = await updateTaskStatus(taskId, status)
    const activeQuickFilter =
      appliedFilters.quick !== '' && appliedFilters.quick !== 'completed'
    const noLongerMatches =
      (appliedFilters.quick === 'completed' && updated.status !== 'accepted') ||
      (activeQuickFilter && updated.status === 'accepted')

    setTasks((current) =>
      noLongerMatches
        ? current.filter((task) => task.id !== taskId)
        : current.map((task) => (task.id === taskId ? updated : task)),
    )
  }

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters({
      search,
      priority: priorityFilter,
      type: typeFilter,
      quick: quickFilter,
    })
  }

  const selectQuickFilter = (value: Exclude<TaskQuickFilter, ''>) => {
    const nextFilter = quickFilter === value ? '' : value
    setQuickFilter(nextFilter)
    setPage(1)
    setAppliedFilters((current) => ({ ...current, quick: nextFilter }))
  }

  const resetFilters = () => {
    setSearch('')
    setPriorityFilter('')
    setTypeFilter('')
    setQuickFilter('')
    setPage(1)
    setAppliedFilters({ search: '', priority: '', type: '', quick: '' })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    setError('')
    try {
      if (deleteTarget.kind === 'task') {
        await deleteTask(deleteTarget.id)
        setTasks((current) => current.filter((task) => task.id !== deleteTarget.id))
      } else {
        await deleteSubject(deleteTarget.id)
        setSubjects((current) => current.filter((subject) => subject.id !== deleteTarget.id))
        setTasks((current) => current.filter((task) => task.subject_id !== deleteTarget.id))
      }
      setDeleteTarget(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="tasks-page">
      <PageHeader title="Tasks" subtitle="Labs, coursework, reports, and deadlines." />

      {error ? <p className="app-error mb-4">{error}</p> : null}

      {!isLoading ? (
        <section className="tasks-visual-section">
          <WorkloadSphereCanvas tasks={tasks} subjects={subjects} />
        </section>
      ) : null}

      <div className="tasks-workspace">
        <section className="tasks-panel">
          <div className="tasks-panel__toolbar">
            <div className="tasks-view-switch" role="tablist" aria-label="List view">
              {(['all', 'tasks', 'subjects'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`tasks-view-button${listMode === mode ? ' tasks-view-button--active' : ''}`}
                  aria-pressed={listMode === mode}
                  onClick={() => setListMode(mode)}
                >
                  {humanize(mode)}
                </button>
              ))}
            </div>
            <input className="field tasks-filter-search" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="field tasks-filter-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | '')}>
              <option value="">All priorities</option>
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {humanize(priority)}
                </option>
              ))}
            </select>
            <select className="field tasks-filter-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TaskType | '')}>
              <option value="">All types</option>
              {taskTypes.map((type) => (
                <option key={type} value={type}>
                  {humanize(type)}
                </option>
              ))}
            </select>
            <div className="tasks-filter-actions">
              <button className="btn-secondary" type="button" onClick={applyFilters}>
                Apply
              </button>
              <button className="tasks-filter-reset" type="button" onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
          <div className="tasks-quick-filter-bar" aria-label="Quick task filters">
            <span className="tasks-quick-filter-label">Quick filters</span>
            <div className="tasks-quick-filter-list">
              {quickFilters.map((filter) => (
                <button
                  key={filter.value}
                  className={`tasks-quick-filter${quickFilter === filter.value ? ' tasks-quick-filter--active' : ''}`}
                  type="button"
                  aria-pressed={quickFilter === filter.value}
                  onClick={() => selectQuickFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="tasks-panel__body">
            {isLoading ? (
              <div className="app-muted p-6 text-sm">Loading tasks...</div>
            ) : (
              <div className="tasks-list-stack">
                {showTasks ? (
                  tasks.length ? (
                    <div className="tasks-table-scroll">
                      <table className="app-table tasks-table">
                        <thead>
                          <tr>
                            <th>Task</th>
                            <th>Subject</th>
                            <th>Deadline</th>
                            <th>Type</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence initial={false}>
                            {visibleTasks.map((task, index) => (
                              <motion.tr
                                key={task.id}
                                className="align-top"
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: { duration: 0.22, delay: index * 0.035, ease: taskRowEase },
                                }}
                                exit={{ opacity: 0, y: -6, transition: { duration: 0.14, ease: taskRowEase } }}
                              >
                                <td className="tasks-table__task-cell" data-label="Task">
                                  <p className="tasks-table__title">{task.title}</p>
                                  {task.description ? <p className="app-muted mt-1 max-w-md text-xs">{task.description}</p> : null}
                                  <div className="app-muted mt-2 flex flex-wrap gap-2 text-xs">
                                    {task.estimated_hours ? <span>{task.estimated_hours}h</span> : null}
                                    {task.github_url ? <a className="app-link" href={task.github_url} target="_blank">GitHub</a> : null}
                                    {task.moodle_url ? <a className="app-link" href={task.moodle_url} target="_blank">Moodle</a> : null}
                                  </div>
                                </td>
                                <td className="tasks-table__subject-cell" data-label="Subject">{subjectById.get(task.subject_id)?.name || 'Unknown'}</td>
                                <td className="tasks-table__deadline-cell" data-label="Deadline">
                                  <span className="app-muted">{formatDate(task.deadline)}</span>
                                  <DeadlineBadge deadline={task.deadline} status={task.status} />
                                </td>
                                <td data-label="Type"><Badge value={task.type} variant="type" /></td>
                                <td data-label="Priority"><Badge value={task.priority} variant="priority" /></td>
                                <td className="tasks-table__status-cell" data-label="Status">
                                  <select className="field task-status-select" value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}>
                                    {taskStatuses.map((status) => (
                                      <option key={status} value={status}>
                                        {humanize(status)}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="tasks-table__action-cell" data-label="Actions">
                                  <button
                                    className="btn-secondary task-delete-button"
                                    type="button"
                                    aria-label={`Delete task ${task.title}`}
                                    onClick={() => setDeleteTarget({ kind: 'task', id: task.id, name: task.title })}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                      <div className="tasks-panel__footer">
                        <p className="tasks-pagination-summary">
                          Showing {pageStart}-{pageEnd} of {tasks.length} tasks
                        </p>
                        <div className="tasks-pagination-controls">
                          <button
                            className="btn-secondary tasks-pagination-button"
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                          >
                            Previous
                          </button>
                          <span className="tasks-pagination-page">Page {page} / {pageCount}</span>
                          <button
                            className="btn-secondary tasks-pagination-button"
                            type="button"
                            disabled={page === pageCount}
                            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState text="No tasks found." />
                    </div>
                  )
                ) : null}

                {showSubjects ? (
                  subjects.length ? (
                    <div className="tasks-subject-list">
                      {subjects.map((subject) => (
                        <article key={subject.id} className="tasks-subject-card">
                          <div className="min-w-0">
                            <div className="mb-2 flex items-center gap-3">
                              <span className="h-3 w-3 rounded-sm border border-[var(--panel-border)]" style={{ backgroundColor: subject.color }} />
                              <h2 className="tasks-subject-card__title">{subject.name}</h2>
                            </div>
                            <div className="app-muted flex flex-wrap gap-2 text-xs">
                              {subject.teacher ? <span>{subject.teacher}</span> : null}
                              {subject.semester ? <span>{subject.semester}</span> : null}
                            </div>
                            {subject.description ? <p className="app-muted mt-3 text-sm">{subject.description}</p> : null}
                          </div>
                          <button
                            className="btn-secondary task-delete-button"
                            type="button"
                            aria-label={`Delete subject ${subject.name}`}
                            onClick={() => setDeleteTarget({ kind: 'subject', id: subject.id, name: subject.name })}
                          >
                            Delete
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState text="No subjects found." />
                    </div>
                  )
                ) : null}

                {!showTasks && !showSubjects ? (
                  <div className="p-4">
                    <EmptyState text="No items found." />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.kind ?? 'item'}?`}
        description={
          deleteTarget ? (
            <p>
              <strong>{deleteTarget.name}</strong>
              {deleteTarget.kind === 'subject'
                ? ' and all tasks assigned to it will be permanently deleted.'
                : ' will be permanently deleted.'}
            </p>
          ) : null
        }
        confirmLabel={`Delete ${deleteTarget?.kind ?? 'item'}`}
        isPending={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
