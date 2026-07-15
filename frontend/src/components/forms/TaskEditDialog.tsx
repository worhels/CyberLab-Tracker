import { useEffect, useState } from 'react'
import { updateTask } from '../../api/tasks'
import type { Subject, Task } from '../../types'
import { getErrorMessage } from '../../utils/errors'
import { FormDialog } from './FormDialog'
import {
  createTaskFormValues,
  TaskFormFields,
  taskFormToUpdatePayload,
} from './ItemFormFields'

interface TaskEditDialogProps {
  task: Task | null
  subjects: readonly Subject[]
  onClose: () => void
  onSaved: (task: Task) => void
}

export function TaskEditDialog({ task, subjects, onClose, onSaved }: TaskEditDialogProps) {
  const [values, setValues] = useState(() => createTaskFormValues())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!task) return
    setValues(createTaskFormValues(task))
    setError('')
  }, [task])

  const save = async () => {
    if (!task || isSaving) return
    if (!values.title.trim() || !values.subjectId) {
      setError('Task title and subject are required.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      const updated = await updateTask(task.id, taskFormToUpdatePayload(values))
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <FormDialog
      open={task !== null}
      title={task ? `Edit ${task.title}` : 'Edit task'}
      description="Clear a deadline, link, description, report, or estimate to store a null value."
      submitLabel="Save task"
      pendingLabel="Saving..."
      isPending={isSaving}
      error={error}
      onCancel={onClose}
      onSubmit={save}
    >
      <TaskFormFields
        idPrefix="edit-task"
        values={values}
        subjects={subjects}
        disabled={isSaving}
        onChange={setValues}
      />
    </FormDialog>
  )
}
