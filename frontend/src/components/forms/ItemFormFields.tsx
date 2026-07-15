import type { Dispatch, SetStateAction } from 'react'
import type {
  Subject,
  SubjectCreatePayload,
  SubjectUpdatePayload,
  Task,
  TaskCreatePayload,
  TaskPriority,
  TaskStatus,
  TaskType,
  TaskUpdatePayload,
} from '../../types'
import { humanize, toApiDateTime, toInputDateTime } from '../../utils/format'
import { taskPriorities, taskStatuses, taskTypes } from '../../utils/options'

export interface SubjectFormValues {
  name: string
  color: string
  teacher: string
  semester: string
  description: string
}

export interface TaskFormValues {
  title: string
  description: string
  deadline: string
  subjectId: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  githubUrl: string
  moodleUrl: string
  reportFile: string
  estimatedHours: string
}

interface SubjectFormFieldsProps {
  values: SubjectFormValues
  disabled?: boolean
  idPrefix: string
  onChange: Dispatch<SetStateAction<SubjectFormValues>>
}

interface TaskFormFieldsProps {
  values: TaskFormValues
  subjects: readonly Subject[]
  disabled?: boolean
  idPrefix: string
  onChange: Dispatch<SetStateAction<TaskFormValues>>
}

const DEFAULT_SUBJECT_COLOR = '#bcb8ae'

function nullableText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function createSubjectFormValues(subject?: Subject): SubjectFormValues {
  return {
    name: subject?.name ?? '',
    color: subject?.color ?? DEFAULT_SUBJECT_COLOR,
    teacher: subject?.teacher ?? '',
    semester: subject?.semester ?? '',
    description: subject?.description ?? '',
  }
}

export function createTaskFormValues(task?: Task, defaultSubjectId?: number): TaskFormValues {
  const deadline = task?.deadline ? new Date(task.deadline) : null
  const hasValidDeadline = deadline !== null && !Number.isNaN(deadline.getTime())

  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    deadline: hasValidDeadline
      ? toInputDateTime(deadline)
      : task
        ? ''
        : toInputDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    subjectId: String(task?.subject_id ?? defaultSubjectId ?? ''),
    type: task?.type ?? 'lab',
    priority: task?.priority ?? 'medium',
    status: task?.status ?? 'not_started',
    githubUrl: task?.github_url ?? '',
    moodleUrl: task?.moodle_url ?? '',
    reportFile: task?.report_file ?? '',
    estimatedHours: task?.estimated_hours === null || task?.estimated_hours === undefined
      ? ''
      : String(task.estimated_hours),
  }
}

function serializeSubjectForm(values: SubjectFormValues) {
  return {
    name: values.name.trim(),
    color: values.color,
    teacher: nullableText(values.teacher),
    semester: nullableText(values.semester),
    description: nullableText(values.description),
  }
}

export function subjectFormToCreatePayload(values: SubjectFormValues): SubjectCreatePayload {
  return serializeSubjectForm(values)
}

export function subjectFormToUpdatePayload(values: SubjectFormValues): SubjectUpdatePayload {
  return serializeSubjectForm(values)
}

function serializeTaskForm(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: nullableText(values.description),
    deadline: toApiDateTime(values.deadline),
    subject_id: Number(values.subjectId),
    type: values.type,
    priority: values.priority,
    status: values.status,
    github_url: nullableText(values.githubUrl),
    moodle_url: nullableText(values.moodleUrl),
    report_file: nullableText(values.reportFile),
    estimated_hours: values.estimatedHours === '' ? null : Number(values.estimatedHours),
  }
}

export function taskFormToCreatePayload(values: TaskFormValues): TaskCreatePayload {
  return serializeTaskForm(values)
}

export function taskFormToUpdatePayload(values: TaskFormValues): TaskUpdatePayload {
  return serializeTaskForm(values)
}

export function SubjectFormFields({
  values,
  disabled = false,
  idPrefix,
  onChange,
}: SubjectFormFieldsProps) {
  const update = <Key extends keyof SubjectFormValues>(key: Key, value: SubjectFormValues[Key]) => {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <label className="block" htmlFor={`${idPrefix}-name`}>
        <span className="label">Name</span>
        <input
          id={`${idPrefix}-name`}
          className="field mt-1"
          value={values.name}
          maxLength={120}
          disabled={disabled}
          data-autofocus
          required
          onChange={(event) => update('name', event.target.value)}
        />
      </label>
      <label className="block" htmlFor={`${idPrefix}-color`}>
        <span className="label">Color</span>
        <input
          id={`${idPrefix}-color`}
          className="field mt-1 h-11"
          type="color"
          value={values.color}
          disabled={disabled}
          onChange={(event) => update('color', event.target.value)}
        />
      </label>
      <label className="block" htmlFor={`${idPrefix}-teacher`}>
        <span className="label">Teacher</span>
        <input
          id={`${idPrefix}-teacher`}
          className="field mt-1"
          value={values.teacher}
          maxLength={255}
          disabled={disabled}
          onChange={(event) => update('teacher', event.target.value)}
        />
      </label>
      <label className="block" htmlFor={`${idPrefix}-semester`}>
        <span className="label">Semester</span>
        <input
          id={`${idPrefix}-semester`}
          className="field mt-1"
          value={values.semester}
          maxLength={80}
          disabled={disabled}
          onChange={(event) => update('semester', event.target.value)}
        />
      </label>
      <label className="block" htmlFor={`${idPrefix}-description`}>
        <span className="label">Description</span>
        <textarea
          id={`${idPrefix}-description`}
          className="field mt-1 min-h-24"
          value={values.description}
          disabled={disabled}
          onChange={(event) => update('description', event.target.value)}
        />
      </label>
    </div>
  )
}

export function TaskFormFields({
  values,
  subjects,
  disabled = false,
  idPrefix,
  onChange,
}: TaskFormFieldsProps) {
  const update = <Key extends keyof TaskFormValues>(key: Key, value: TaskFormValues[Key]) => {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="task-form-grid">
      <label className="task-form-field" htmlFor={`${idPrefix}-title`}>
        <span className="label">Title</span>
        <input
          id={`${idPrefix}-title`}
          className="field mt-1"
          value={values.title}
          maxLength={255}
          disabled={disabled}
          data-autofocus
          required
          onChange={(event) => update('title', event.target.value)}
        />
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-subject`}>
        <span className="label">Subject</span>
        <select
          id={`${idPrefix}-subject`}
          className="field mt-1"
          value={values.subjectId}
          disabled={disabled}
          required
          onChange={(event) => update('subjectId', event.target.value)}
        >
          <option value="" disabled>Select subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-deadline`}>
        <span className="label">Deadline</span>
        <input
          id={`${idPrefix}-deadline`}
          className="field mt-1"
          type="datetime-local"
          value={values.deadline}
          disabled={disabled}
          onChange={(event) => update('deadline', event.target.value)}
        />
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-type`}>
        <span className="label">Type</span>
        <select
          id={`${idPrefix}-type`}
          className="field mt-1"
          value={values.type}
          disabled={disabled}
          onChange={(event) => update('type', event.target.value as TaskType)}
        >
          {taskTypes.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
        </select>
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-priority`}>
        <span className="label">Priority</span>
        <select
          id={`${idPrefix}-priority`}
          className="field mt-1"
          value={values.priority}
          disabled={disabled}
          onChange={(event) => update('priority', event.target.value as TaskPriority)}
        >
          {taskPriorities.map((priority) => (
            <option key={priority} value={priority}>{humanize(priority)}</option>
          ))}
        </select>
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-status`}>
        <span className="label">Status</span>
        <select
          id={`${idPrefix}-status`}
          className="field mt-1"
          value={values.status}
          disabled={disabled}
          onChange={(event) => update('status', event.target.value as TaskStatus)}
        >
          {taskStatuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
        </select>
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-hours`}>
        <span className="label">Estimated hours</span>
        <input
          id={`${idPrefix}-hours`}
          className="field mt-1"
          min="0"
          step="1"
          type="number"
          value={values.estimatedHours}
          disabled={disabled}
          onChange={(event) => update('estimatedHours', event.target.value)}
        />
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-description`}>
        <span className="label">Description</span>
        <textarea
          id={`${idPrefix}-description`}
          className="field task-form-textarea mt-1"
          value={values.description}
          disabled={disabled}
          onChange={(event) => update('description', event.target.value)}
        />
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-github`}>
        <span className="label">GitHub URL</span>
        <input
          id={`${idPrefix}-github`}
          className="field mt-1"
          type="url"
          value={values.githubUrl}
          maxLength={500}
          disabled={disabled}
          onChange={(event) => update('githubUrl', event.target.value)}
        />
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-moodle`}>
        <span className="label">Moodle URL</span>
        <input
          id={`${idPrefix}-moodle`}
          className="field mt-1"
          type="url"
          value={values.moodleUrl}
          maxLength={500}
          disabled={disabled}
          onChange={(event) => update('moodleUrl', event.target.value)}
        />
      </label>
      <label className="task-form-field" htmlFor={`${idPrefix}-report`}>
        <span className="label">Report file</span>
        <input
          id={`${idPrefix}-report`}
          className="field mt-1"
          value={values.reportFile}
          maxLength={500}
          disabled={disabled}
          onChange={(event) => update('reportFile', event.target.value)}
        />
      </label>
    </div>
  )
}
