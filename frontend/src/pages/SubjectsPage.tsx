import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createSubject, deleteSubject, getSubjects } from '../api/subjects'
import { createTask } from '../api/tasks'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import type { Subject, SubjectPayload, TaskPayload, TaskPriority, TaskStatus, TaskType } from '../types'
import { getErrorMessage } from '../utils/errors'
import { humanize, toApiDateTime, toInputDateTime } from '../utils/format'
import { taskPriorities, taskStatuses, taskTypes } from '../utils/options'

type CreateMode = 'subject' | 'task'

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

const initialSubjectForm: SubjectPayload = {
  name: '',
  color: '#bcb8ae',
  teacher: '',
  semester: '',
  description: '',
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

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectForm, setSubjectForm] = useState<SubjectPayload>(initialSubjectForm)
  const [taskForm, setTaskForm] = useState<TaskFormState>(initialTaskForm)
  const [createMode, setCreateMode] = useState<CreateMode>('subject')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadSubjects = async () => {
    setIsLoading(true)
    try {
      const subjectsData = await getSubjects()
      setSubjects(subjectsData)
      setTaskForm((current) => ({
        ...current,
        subject_id: current.subject_id || String(subjectsData[0]?.id || ''),
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const updateSubjectField = (field: keyof SubjectPayload, value: string) => {
    setSubjectForm((current) => ({ ...current, [field]: value }))
  }

  const updateTaskField = <Key extends keyof TaskFormState>(field: Key, value: TaskFormState[Key]) => {
    setTaskForm((current) => ({ ...current, [field]: value }))
  }

  const buildTaskPayload = (): TaskPayload => ({
    title: taskForm.title,
    description: taskForm.description || null,
    deadline: toApiDateTime(taskForm.deadline),
    subject_id: Number(taskForm.subject_id),
    type: taskForm.type,
    priority: taskForm.priority,
    status: taskForm.status,
    github_url: taskForm.github_url || null,
    moodle_url: taskForm.moodle_url || null,
    report_file: taskForm.report_file || null,
    estimated_hours: taskForm.estimated_hours ? Number(taskForm.estimated_hours) : null,
  })

  const onSubjectSubmit = async () => {
    await createSubject({
      ...subjectForm,
      teacher: subjectForm.teacher || null,
      semester: subjectForm.semester || null,
      description: subjectForm.description || null,
    })
    setSubjectForm(initialSubjectForm)
    await loadSubjects()
  }

  const onTaskSubmit = async () => {
    if (!taskForm.subject_id) {
      setError('Create a subject before creating tasks')
      return
    }

    await createTask(buildTaskPayload())
    setTaskForm((current) => ({
      ...initialTaskForm,
      subject_id: current.subject_id,
    }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (createMode === 'subject') {
        await onSubjectSubmit()
      } else {
        await onTaskSubmit()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDelete = async (id: number) => {
    await deleteSubject(id)
    setSubjects((current) => current.filter((subject) => subject.id !== id))
  }

  return (
    <section>
      <PageHeader title="Subjects" subtitle="Create subjects and tasks from one intake surface." />

      {error ? <p className="app-error mb-4">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={onSubmit} className="card task-create-panel h-fit">
          <h2 className="app-section-title">Create item</h2>

          <div className="create-mode-switch" role="tablist" aria-label="Create item type">
            <button
              type="button"
              className={`create-mode-button${createMode === 'subject' ? ' create-mode-button--active' : ''}`}
              aria-pressed={createMode === 'subject'}
              onClick={() => setCreateMode('subject')}
            >
              Subject
            </button>
            <button
              type="button"
              className={`create-mode-button${createMode === 'task' ? ' create-mode-button--active' : ''}`}
              aria-pressed={createMode === 'task'}
              onClick={() => setCreateMode('task')}
            >
              Task
            </button>
          </div>

          {createMode === 'subject' ? (
            <div className="space-y-4">
              <label className="block">
                <span className="label">Name</span>
                <input
                  className="field mt-1"
                  value={subjectForm.name}
                  onChange={(event) => updateSubjectField('name', event.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="label">Color</span>
                <input
                  className="field mt-1 h-11"
                  type="color"
                  value={subjectForm.color}
                  onChange={(event) => updateSubjectField('color', event.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Teacher</span>
                <input
                  className="field mt-1"
                  value={subjectForm.teacher || ''}
                  onChange={(event) => updateSubjectField('teacher', event.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Semester</span>
                <input
                  className="field mt-1"
                  value={subjectForm.semester || ''}
                  onChange={(event) => updateSubjectField('semester', event.target.value)}
                />
              </label>
              <label className="block">
                <span className="label">Description</span>
                <textarea
                  className="field mt-1 min-h-24"
                  value={subjectForm.description || ''}
                  onChange={(event) => updateSubjectField('description', event.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="task-form-grid">
              <label className="task-form-field">
                <span className="label">Title</span>
                <input
                  className="field mt-1"
                  value={taskForm.title}
                  onChange={(event) => updateTaskField('title', event.target.value)}
                  required
                />
              </label>
              <label className="task-form-field">
                <span className="label">Subject</span>
                <select
                  className="field mt-1"
                  value={taskForm.subject_id}
                  onChange={(event) => updateTaskField('subject_id', event.target.value)}
                  required
                >
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
                <input
                  className="field mt-1"
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={(event) => updateTaskField('deadline', event.target.value)}
                />
              </label>
              <label className="task-form-field">
                <span className="label">Type</span>
                <select
                  className="field mt-1"
                  value={taskForm.type}
                  onChange={(event) => updateTaskField('type', event.target.value as TaskType)}
                >
                  {taskTypes.map((type) => (
                    <option key={type} value={type}>
                      {humanize(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="task-form-field">
                <span className="label">Priority</span>
                <select
                  className="field mt-1"
                  value={taskForm.priority}
                  onChange={(event) => updateTaskField('priority', event.target.value as TaskPriority)}
                >
                  {taskPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {humanize(priority)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="task-form-field">
                <span className="label">Status</span>
                <select
                  className="field mt-1"
                  value={taskForm.status}
                  onChange={(event) => updateTaskField('status', event.target.value as TaskStatus)}
                >
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>
                      {humanize(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="task-form-field">
                <span className="label">Estimated hours</span>
                <input
                  className="field mt-1"
                  min="0"
                  type="number"
                  value={taskForm.estimated_hours}
                  onChange={(event) => updateTaskField('estimated_hours', event.target.value)}
                />
              </label>
              <label className="task-form-field">
                <span className="label">Description</span>
                <textarea
                  className="field task-form-textarea mt-1"
                  value={taskForm.description}
                  onChange={(event) => updateTaskField('description', event.target.value)}
                />
              </label>
              <label className="task-form-field">
                <span className="label">GitHub URL</span>
                <input
                  className="field mt-1"
                  value={taskForm.github_url}
                  onChange={(event) => updateTaskField('github_url', event.target.value)}
                />
              </label>
              <label className="task-form-field">
                <span className="label">Moodle URL</span>
                <input
                  className="field mt-1"
                  value={taskForm.moodle_url}
                  onChange={(event) => updateTaskField('moodle_url', event.target.value)}
                />
              </label>
              <label className="task-form-field">
                <span className="label">Report file</span>
                <input
                  className="field mt-1"
                  value={taskForm.report_file}
                  onChange={(event) => updateTaskField('report_file', event.target.value)}
                />
              </label>
            </div>
          )}

          <button className="btn-primary mt-5 w-full" disabled={isSubmitting || (createMode === 'task' && !subjects.length)}>
            {isSubmitting ? 'Creating...' : createMode === 'subject' ? 'Create subject' : 'Create task'}
          </button>
        </form>

        <div className="space-y-3">
          {isLoading ? (
            <div className="card app-muted p-6 text-sm">Loading subjects...</div>
          ) : subjects.length ? (
            subjects.map((subject) => (
              <article key={subject.id} className="card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="h-3 w-3 rounded-sm border border-[var(--panel-border)]" style={{ backgroundColor: subject.color }} />
                      <h2 className="truncate text-lg font-semibold text-[var(--text-main)]">{subject.name}</h2>
                    </div>
                    <div className="app-muted flex flex-wrap gap-2 text-xs">
                      {subject.teacher ? <span>{subject.teacher}</span> : null}
                      {subject.semester ? <span>{subject.semester}</span> : null}
                    </div>
                    {subject.description ? <p className="app-muted mt-3 text-sm">{subject.description}</p> : null}
                  </div>
                  <button className="btn-secondary" type="button" onClick={() => onDelete(subject.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState text="No subjects yet." />
          )}
        </div>
      </div>
    </section>
  )
}
