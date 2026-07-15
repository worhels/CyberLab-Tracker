import { useEffect, useState } from 'react'
import { updateSubject } from '../../api/subjects'
import type { Subject } from '../../types'
import { getErrorMessage } from '../../utils/errors'
import { FormDialog } from './FormDialog'
import {
  createSubjectFormValues,
  SubjectFormFields,
  subjectFormToUpdatePayload,
} from './ItemFormFields'

interface SubjectEditDialogProps {
  subject: Subject | null
  onClose: () => void
  onSaved: (subject: Subject) => void
}

export function SubjectEditDialog({ subject, onClose, onSaved }: SubjectEditDialogProps) {
  const [values, setValues] = useState(createSubjectFormValues)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!subject) return
    setValues(createSubjectFormValues(subject))
    setError('')
  }, [subject])

  const save = async () => {
    if (!subject || isSaving) return
    if (!values.name.trim()) {
      setError('Subject name cannot be empty.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      const updated = await updateSubject(subject.id, subjectFormToUpdatePayload(values))
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
      open={subject !== null}
      title={subject ? `Edit ${subject.name}` : 'Edit subject'}
      description="Empty optional fields are saved as cleared values."
      submitLabel="Save subject"
      pendingLabel="Saving..."
      isPending={isSaving}
      error={error}
      onCancel={onClose}
      onSubmit={save}
    >
      <SubjectFormFields
        idPrefix="edit-subject"
        values={values}
        disabled={isSaving}
        onChange={setValues}
      />
    </FormDialog>
  )
}
