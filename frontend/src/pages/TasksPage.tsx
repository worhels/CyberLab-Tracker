import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createTask, deleteTask, getTasks, updateTaskStatus } from '../api/tasks'
import { getSubjects } from '../api/subjects'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import type { Subject, Task, TaskPayload, TaskPriority, TaskStatus, TaskType } from '../types'
import { getErrorMessage } from '../utils/errors'
import { formatDate, humanize, toApiDateTime, toInputDateTime } from '../utils/format'
import { taskPriorities, taskStatuses, taskTypes } from '../utils/options'

interface TaskFormState {
  title: string
  description: string
  deadline: string
  subject_id: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  github_url: string
  moodle_url: string
  report_file: string
  estimated_hours: string
}

const initialTaskForm: TaskFormState = {
  title: '',
  description: '',
  deadline: toInputDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  subject_id: '',
  type: 'lab',
  priority: 'medium',
  status: 'not_started',
  github_url: '',
  moodle_url: '',
  report_file: '',
  estimated_hours: '',
}

const TASKS_PER_PAGE = 8
const taskRowEase = [0.22, 1, 0.36, 1] as const

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState<TaskFormState>(initialTaskForm)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('')
  const [page, setPage] = useState(1)
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string
    priority: TaskPriority | ''
    type: TaskType | ''
  }>({ search: '', priority: '', type: '' })

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
        }),
      ])
      setSubjects(subjectsData)
      setTasks(tasksData)
      setForm((current) => ({
        ...current,
        subject_id: current.subject_id || String(subjectsData[0]?.id || ''),
      }))
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

  const updateField = <Key extends keyof TaskFormState>(field: Key, value: TaskFormState[Key]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const buildPayload = (): TaskPayload => ({
    title: form.title,
    description: form.description || null,
    deadline: toApiDateTime(form.deadline),
    subject_id: Number(form.subject_id),
    type: form.type,
    priority: form.priority,
    status: form.status,
    github_url: form.github_url || null,
    moodle_url: form.moodle_url || null,
    report_file: form.report_file || null,
    estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
  })

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.subject_id) {
      setError('Create a subject before creating tasks')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await createTask(buildPayload())
      setForm((current) => ({
        ...initialTaskForm,
        subject_id: current.subject_id,
      }))
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onStatusChange = async (taskId: number, status: TaskStatus) => {
    const updated = await updateTaskStatus(taskId, status)
    setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)))
  }

  const onDelete = async (taskId: number) => {
    await deleteTask(taskId)
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  return (
    <section className="tasks-page">
      <PageHeader title="Tasks" subtitle="Labs, coursework, reports, and deadlines." />

      {error ? <p className="app-error mb-4">{error}</p> : null}

      <div className="tasks-workspace">
        <form onSubmit={onSubmit} className="task-create-panel">
          <h2 className="app-section-title">Create task</h2>
          <div className="task-form-grid">
            <label className="task-form-field">
              <span className="label">Title</span>
              <input className="field mt-1" value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
            </label>
            <label className="task-form-field">
              <span className="label">Subject</span>
              <select className="field mt-1" value={form.subject_id} onChange={(event) => updateField('subject_id', event.target.value)} required>
                <option value="" disabled>
                  Select subject
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="task-form-field">
              <span className="label">Deadline</span>
              <input className="field mt-1" type="datetime-local" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
            </label>
            <label className="task-form-field">
              <span className="label">Type</span>
              <select className="field mt-1" value={form.type} onChange={(event) => updateField('type', event.target.value as TaskType)}>
                {taskTypes.map((type) => (
                  <option key={type} value={type}>
                    {humanize(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="task-form-field">
              <span className="label">Priority</span>
              <select className="field mt-1" value={form.priority} onChange={(event) => updateField('priority', event.target.value as TaskPriority)}>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanize(priority)}
                  </option>
                ))}
              </select>
            </label>
            <label className="task-form-field">
              <span className="label">Status</span>
              <select className="field mt-1" value={form.status} onChange={(event) => updateField('status', event.target.value as TaskStatus)}>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {humanize(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="task-form-field">
              <span className="label">Estimated hours</span>
              <input className="field mt-1" min="0" type="number" value={form.estimated_hours} onChange={(event) => updateField('estimated_hours', event.target.value)} />
            </label>
            <label className="task-form-field">
              <span className="label">Description</span>
              <textarea className="field task-form-textarea mt-1" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>
            <label className="task-form-field">
              <span className="label">GitHub URL</span>
              <input className="field mt-1" value={form.github_url} onChange={(event) => updateField('github_url', event.target.value)} />
            </label>
            <label className="task-form-field">
              <span className="label">Moodle URL</span>
              <input className="field mt-1" value={form.moodle_url} onChange={(event) => updateField('moodle_url', event.target.value)} />
            </label>
            <label className="task-form-field">
              <span className="label">Report file</span>
              <input className="field mt-1" value={form.report_file} onChange={(event) => updateField('report_file', event.target.value)} />
            </label>
          </div>
          <button className="btn-primary mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create task'}
          </button>
        </form>

        <section className="tasks-panel">
          <div className="tasks-panel__toolbar">
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
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setPage(1)
                setAppliedFilters({
                  search,
                  priority: priorityFilter,
                  type: typeFilter,
                })
              }}
            >
              Apply
            </button>

          </div>
          <div className="tasks-panel__body">
            {isLoading ? (
              <div className="app-muted p-6 text-sm">Loading tasks...</div>
            ) : tasks.length ? (
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
                        <td className="tasks-table__task-cell">
                          <p className="tasks-table__title">{task.title}</p>
                          {task.description ? <p className="app-muted mt-1 max-w-md text-xs">{task.description}</p> : null}
                          <div className="app-muted mt-2 flex flex-wrap gap-2 text-xs">
                            {task.estimated_hours ? <span>{task.estimated_hours}h</span> : null}
                            {task.github_url ? <a className="app-link" href={task.github_url} target="_blank">GitHub</a> : null}
                            {task.moodle_url ? <a className="app-link" href={task.moodle_url} target="_blank">Moodle</a> : null}
                          </div>
                        </td>
                        <td className="tasks-table__subject-cell">{subjectById.get(task.subject_id)?.name || 'Unknown'}</td>
                        <td className="app-muted">{formatDate(task.deadline)}</td>
                        <td><Badge value={task.type} variant="type" /></td>
                        <td><Badge value={task.priority} variant="priority" /></td>
                        <td>
                          <select className="field task-status-select" value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}>
                            {taskStatuses.map((status) => (
                              <option key={status} value={status}>
                                {humanize(status)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="tasks-table__action-cell">
                          <button className="btn-secondary task-delete-button" type="button" onClick={() => onDelete(task.id)}>
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
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
