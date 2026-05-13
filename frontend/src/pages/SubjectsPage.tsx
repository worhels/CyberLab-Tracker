import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createSubject, deleteSubject, getSubjects } from '../api/subjects'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import type { Subject, SubjectPayload } from '../types'
import { getErrorMessage } from '../utils/errors'

const initialForm: SubjectPayload = {
  name: '',
  color: '#38bdf8',
  teacher: '',
  semester: '',
  description: '',
}

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState<SubjectPayload>(initialForm)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadSubjects = async () => {
    setIsLoading(true)
    try {
      setSubjects(await getSubjects())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const updateField = (field: keyof SubjectPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await createSubject({
        ...form,
        teacher: form.teacher || null,
        semester: form.semester || null,
        description: form.description || null,
      })
      setForm(initialForm)
      await loadSubjects()
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
      <PageHeader title="Subjects" subtitle="Courses, teachers, semesters, and notes." />

      {error ? <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-50">Create subject</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="label">Name</span>
              <input className="field mt-1" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
            </label>
            <label className="block">
              <span className="label">Color</span>
              <input className="field mt-1 h-11" type="color" value={form.color} onChange={(event) => updateField('color', event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Teacher</span>
              <input className="field mt-1" value={form.teacher || ''} onChange={(event) => updateField('teacher', event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Semester</span>
              <input className="field mt-1" value={form.semester || ''} onChange={(event) => updateField('semester', event.target.value)} />
            </label>
            <label className="block">
              <span className="label">Description</span>
              <textarea className="field mt-1 min-h-24" value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} />
            </label>
          </div>
          <button className="btn-primary mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create subject'}
          </button>
        </form>

        <div className="space-y-3">
          {isLoading ? (
            <div className="card p-6 text-sm text-slate-400">Loading subjects...</div>
          ) : subjects.length ? (
            subjects.map((subject) => (
              <article key={subject.id} className="card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: subject.color }} />
                      <h2 className="truncate text-lg font-semibold text-slate-50">{subject.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {subject.teacher ? <span>{subject.teacher}</span> : null}
                      {subject.semester ? <span>{subject.semester}</span> : null}
                    </div>
                    {subject.description ? <p className="mt-3 text-sm text-slate-400">{subject.description}</p> : null}
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
