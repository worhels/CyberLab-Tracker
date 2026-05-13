import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
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
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string
    priority: TaskPriority | ''
    type: TaskType | ''
  }>({ search: '', priority: '', type: '' })

  const subjectById = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject]))
  }, [subjects])

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
    <section>
      <PageHeader title="Tasks" subtitle="Labs, coursework, reports, and deadlines." />

      {error ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="grid gap-6 2xl:grid-cols-[420px_1fr]">
        <form onSubmit={onSubmit} className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-50">Create task</h2>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
            <label className="block sm:col-span-2 2xl:col-span-1">
              <span className="label">Title</span>
              <input className="field mt-1" value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
            </label>
            <label className="block">
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
            <label className="block">
              <span className="label">Deadline</span>
              <input className="field mt-1" type="datetime-local" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Type</span>
              <select className="field mt-1" value={form.type} onChange={(event) => updateField('type', event.target.value as TaskType)}>
                {taskTypes.map((type) => (
                  <option key={type} value={type}>
                    {humanize(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Priority</span>
              <select className="field mt-1" value={form.priority} onChange={(event) => updateField('priority', event.target.value as TaskPriority)}>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {humanize(priority)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Status</span>
              <select className="field mt-1" value={form.status} onChange={(event) => updateField('status', event.target.value as TaskStatus)}>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {humanize(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Estimated hours</span>
              <input className="field mt-1" min="0" type="number" value={form.estimated_hours} onChange={(event) => updateField('estimated_hours', event.target.value)} />
            </label>
            <label className="block sm:col-span-2 2xl:col-span-1">
              <span className="label">Description</span>
              <textarea className="field mt-1 min-h-24" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>
            <label className="block">
              <span className="label">GitHub URL</span>
              <input className="field mt-1" value={form.github_url} onChange={(event) => updateField('github_url', event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Moodle URL</span>
              <input className="field mt-1" value={form.moodle_url} onChange={(event) => updateField('moodle_url', event.target.value)} />
            </label>
            <label className="block sm:col-span-2 2xl:col-span-1">
              <span className="label">Report file</span>
              <input className="field mt-1" value={form.report_file} onChange={(event) => updateField('report_file', event.target.value)} />
            </label>
          </div>
          <button className="btn-primary mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create task'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="card grid gap-3 p-4 md:grid-cols-[1fr_160px_160px_auto]">
            <input className="field" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="field" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | '')}>
              <option value="">All priorities</option>
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {humanize(priority)}
                </option>
              ))}
            </select>
            <select className="field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TaskType | '')}>
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
              onClick={() =>
                setAppliedFilters({
                  search,
                  priority: priorityFilter,
                  type: typeFilter,
                })
              }
            >
              Apply
            </button>
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-sm text-slate-400">Loading tasks...</div>
            ) : tasks.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tasks.map((task) => (
                      <tr key={task.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-100">{task.title}</p>
                          {task.description ? <p className="mt-1 max-w-md text-xs text-slate-500">{task.description}</p> : null}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {task.estimated_hours ? <span>{task.estimated_hours}h</span> : null}
                            {task.github_url ? <a className="text-cyan-300 hover:text-cyan-200" href={task.github_url} target="_blank">GitHub</a> : null}
                            {task.moodle_url ? <a className="text-cyan-300 hover:text-cyan-200" href={task.moodle_url} target="_blank">Moodle</a> : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{subjectById.get(task.subject_id)?.name || 'Unknown'}</td>
                        <td className="px-4 py-4 text-slate-400">{formatDate(task.deadline)}</td>
                        <td className="px-4 py-4"><Badge value={task.type} variant="type" /></td>
                        <td className="px-4 py-4"><Badge value={task.priority} variant="priority" /></td>
                        <td className="px-4 py-4">
                          <select className="field min-w-36" value={task.status} onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}>
                            {taskStatuses.map((status) => (
                              <option key={status} value={status}>
                                {humanize(status)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="btn-secondary" type="button" onClick={() => onDelete(task.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState text="No tasks found." />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
