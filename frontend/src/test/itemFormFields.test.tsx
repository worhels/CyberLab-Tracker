import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import {
  createSubjectFormValues,
  createTaskFormValues,
  SubjectFormFields,
  subjectFormToUpdatePayload,
  taskFormToUpdatePayload,
} from '../components/forms/ItemFormFields'
import type { SubjectFormValues } from '../components/forms/ItemFormFields'
import type { Subject, Task } from '../types'

function editableSubject(): Subject {
  return {
    id: 11,
    name: 'Original subject',
    color: '#123456',
    teacher: 'Original teacher',
    semester: 'Original semester',
    description: 'Original description',
    user_id: 1,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
  }
}

function SubjectFormHarness() {
  const [values, setValues] = useState(() => createSubjectFormValues(editableSubject()))

  return (
    <>
      <SubjectFormFields
        idPrefix="subject-test"
        values={values}
        onChange={setValues}
      />
      <output data-testid="subject-values">{JSON.stringify(values)}</output>
    </>
  )
}

function taskWithNullableMetadata(): Task {
  return {
    id: 7,
    title: 'Editable task',
    description: null,
    deadline: null,
    subject_id: 3,
    type: 'lab',
    status: 'in_progress',
    priority: 'high',
    github_url: null,
    moodle_url: null,
    report_file: null,
    estimated_hours: null,
    submitted_at: null,
    accepted_at: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
  }
}

describe('workspace item form contracts', () => {
  it('keeps nullable task metadata empty when editing', () => {
    const values = createTaskFormValues(taskWithNullableMetadata())

    expect(values.deadline).toBe('')
    expect(values.description).toBe('')
    expect(values.estimatedHours).toBe('')
    expect(values.subjectId).toBe('3')
  })

  it('serializes cleared task fields as explicit null values', () => {
    const payload = taskFormToUpdatePayload({
      ...createTaskFormValues(taskWithNullableMetadata()),
      title: '  Updated task  ',
      deadline: '',
      estimatedHours: '',
    })

    expect(payload).toMatchObject({
      title: 'Updated task',
      description: null,
      deadline: null,
      github_url: null,
      moodle_url: null,
      report_file: null,
      estimated_hours: null,
    })
  })

  it('serializes cleared subject metadata as explicit null values', () => {
    expect(subjectFormToUpdatePayload({
      name: '  Security  ',
      color: '#123456',
      teacher: '  ',
      semester: '',
      description: '',
    })).toEqual({
      name: 'Security',
      color: '#123456',
      teacher: null,
      semester: null,
      description: null,
    })
  })

  it('preserves every field change when React batches form updates', () => {
    render(<SubjectFormHarness />)

    act(() => {
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated subject' } })
      fireEvent.change(screen.getByLabelText('Teacher'), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText('Semester'), { target: { value: '' } })
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: '' } })
    })

    const values = JSON.parse(screen.getByTestId('subject-values').textContent ?? '{}') as SubjectFormValues
    expect(values).toEqual({
      name: 'Updated subject',
      color: '#123456',
      teacher: '',
      semester: '',
      description: '',
    })
  })
})
