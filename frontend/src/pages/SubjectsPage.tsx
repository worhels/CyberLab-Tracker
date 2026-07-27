import { useCallback, useEffect, useState } from 'react'
import { deleteSubject, getSubjects } from '../api/subjects'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { SubjectEditDialog } from '../components/forms/SubjectEditDialog'
import { WorkspaceItemForm } from '../components/forms/WorkspaceItemForm'
import type { Subject } from '../types'
import { useSearchParams } from '../router'
import { getErrorMessage } from '../utils/errors'
import {
  buildMentorContextSearchParams,
  getMentorPageContext,
} from '../utils/mentorContext'

function sortSubjects(subjects: Subject[]): Subject[] {
  return [...subjects].sort((left, right) => left.name.localeCompare(right.name))
}

export function SubjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const mentorContext = getMentorPageContext(searchParams.toString())

  const loadSubjects = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setSubjects(await getSubjects())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubjects()
  }, [loadSubjects])

  const confirmDelete = async () => {
    if (!subjectToDelete) return

    setIsDeleting(true)
    setError('')
    try {
      await deleteSubject(subjectToDelete.id)
      setSubjects((current) => current.filter((subject) => subject.id !== subjectToDelete.id))
      if (mentorContext.subjectId === subjectToDelete.id) {
        setSearchParams(buildMentorContextSearchParams(searchParams, {}), { replace: true })
      }
      setSubjectToDelete(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleMentorSubject = (subjectId: number) => {
    const isSelected = mentorContext.subjectId === subjectId && mentorContext.taskId === undefined
    setSearchParams(
      buildMentorContextSearchParams(searchParams, isSelected ? {} : { subjectId }),
      { replace: true },
    )
  }

  const mergeSubject = (nextSubject: Subject) => {
    setSubjects((current) => sortSubjects([
      ...current.filter((subject) => subject.id !== nextSubject.id),
      nextSubject,
    ]))
  }

  return (
    <section>
      <PageHeader title="Subjects" subtitle="Create, edit, and organize subjects and their tasks." />

      {error ? (
        <div className="app-error-panel mb-4" role="alert">
          <p>{error}</p>
          <button className="btn-secondary" type="button" onClick={() => void loadSubjects()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <WorkspaceItemForm subjects={subjects} onSubjectCreated={mergeSubject} />

        <div className="space-y-3" aria-busy={isLoading}>
          {isLoading ? (
            <div className="card app-muted p-6 text-sm" role="status">Loading subjects...</div>
          ) : subjects.length ? (
            subjects.map((subject) => {
              const isMentorContext = mentorContext.subjectId === subject.id
                && mentorContext.taskId === undefined

              return (
                <article
                  key={subject.id}
                  className="card p-4"
                  style={isMentorContext ? {
                    borderColor: 'rgba(var(--accent-primary-rgb), 0.48)',
                    boxShadow: 'var(--shadow-active)',
                  } : undefined}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-sm border border-[var(--panel-border)]"
                          style={{ backgroundColor: subject.color }}
                        />
                        <h2 className="truncate text-lg font-semibold text-[var(--text-main)]">
                          {subject.name}
                        </h2>
                      </div>
                      <div className="app-muted flex flex-wrap gap-2 text-xs">
                        {subject.teacher ? <span>{subject.teacher}</span> : null}
                        {subject.semester ? <span>{subject.semester}</span> : null}
                      </div>
                      {subject.description ? (
                        <p className="app-muted mt-3 text-sm">{subject.description}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        type="button"
                        aria-pressed={isMentorContext}
                        onClick={() => toggleMentorSubject(subject.id)}
                      >
                        {isMentorContext ? 'Mentor selected' : 'Use in Mentor'}
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        aria-label={`Edit subject ${subject.name}`}
                        onClick={() => setSubjectToEdit(subject)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        aria-label={`Delete subject ${subject.name}`}
                        onClick={() => setSubjectToDelete(subject)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })
          ) : (
            <EmptyState text="No subjects yet." />
          )}
        </div>
      </div>

      <SubjectEditDialog
        subject={subjectToEdit}
        onClose={() => setSubjectToEdit(null)}
        onSaved={mergeSubject}
      />

      <ConfirmDialog
        open={subjectToDelete !== null}
        title="Delete subject?"
        description={subjectToDelete ? (
          <p>
            <strong>{subjectToDelete.name}</strong> and all tasks assigned to it will be permanently deleted.
          </p>
        ) : null}
        confirmLabel="Delete subject"
        isPending={isDeleting}
        onCancel={() => setSubjectToDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
