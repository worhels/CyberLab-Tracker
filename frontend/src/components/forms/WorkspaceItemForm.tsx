import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createSubject } from '../../api/subjects'
import { createTask } from '../../api/tasks'
import type { Subject, Task } from '../../types'
import { getErrorMessage } from '../../utils/errors'
import {
  createSubjectFormValues,
  createTaskFormValues,
  SubjectFormFields,
  subjectFormToCreatePayload,
  TaskFormFields,
  taskFormToCreatePayload,
} from './ItemFormFields'

type CreateMode = 'subject' | 'task'

interface WorkspaceItemFormProps {
  subjects: readonly Subject[]
  onSubjectCreated: (subject: Subject) => void
  onTaskCreated?: (task: Task) => void
}

export function WorkspaceItemForm({
  subjects,
  onSubjectCreated,
  onTaskCreated,
}: WorkspaceItemFormProps) {
  const [createMode, setCreateMode] = useState<CreateMode>('subject')
  const [subjectValues, setSubjectValues] = useState(createSubjectFormValues)
  const [taskValues, setTaskValues] = useState(() => createTaskFormValues(undefined, subjects[0]?.id))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    setTaskValues((current) => {
      const selectedSubjectExists = subjects.some((subject) => String(subject.id) === current.subjectId)
      if (selectedSubjectExists || !subjects.length) return current
      return { ...current, subjectId: String(subjects[0].id) }
    })
  }, [subjects])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFeedback('')

    if (createMode === 'subject' && !subjectValues.name.trim()) {
      setError('Subject name cannot be empty.')
      return
    }
    if (createMode === 'task' && (!taskValues.title.trim() || !taskValues.subjectId)) {
      setError('Task title and subject are required.')
      return
    }

    setIsSubmitting(true)
    try {
      if (createMode === 'subject') {
        const created = await createSubject(subjectFormToCreatePayload(subjectValues))
        onSubjectCreated(created)
        setSubjectValues(createSubjectFormValues())
        setFeedback(`Subject “${created.name}” created.`)
      } else {
        const created = await createTask(taskFormToCreatePayload(taskValues))
        onTaskCreated?.(created)
        setTaskValues(createTaskFormValues(undefined, created.subject_id))
        setFeedback(`Task “${created.title}” created.`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card task-create-panel h-fit">
      <h2 className="app-section-title">Create item</h2>
      <div className="create-mode-switch" role="group" aria-label="Create item type">
        {(['subject', 'task'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`create-mode-button${createMode === mode ? ' create-mode-button--active' : ''}`}
            aria-pressed={createMode === mode}
            onClick={() => {
              setCreateMode(mode)
              setError('')
              setFeedback('')
            }}
          >
            {mode === 'subject' ? 'Subject' : 'Task'}
          </button>
        ))}
      </div>

      {error ? <p className="app-error mb-4" role="alert">{error}</p> : null}
      {feedback ? <p className="app-success mb-4" role="status">{feedback}</p> : null}

      {createMode === 'subject' ? (
        <SubjectFormFields
          idPrefix="create-subject"
          values={subjectValues}
          disabled={isSubmitting}
          onChange={setSubjectValues}
        />
      ) : (
        <TaskFormFields
          idPrefix="create-task"
          values={taskValues}
          subjects={subjects}
          disabled={isSubmitting}
          onChange={setTaskValues}
        />
      )}

      <button
        className="btn-primary mt-5 w-full"
        disabled={isSubmitting || (createMode === 'task' && !subjects.length)}
      >
        {isSubmitting ? 'Creating...' : createMode === 'subject' ? 'Create subject' : 'Create task'}
      </button>
    </form>
  )
}
