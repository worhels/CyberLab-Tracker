import { LoaderCircle, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface FormDialogProps {
  open: boolean
  title: string
  description: string
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  error: string
  children: ReactNode
  onCancel: () => void
  onSubmit: () => void
}

export function FormDialog({
  open,
  title,
  description,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  children,
  onCancel,
  onSubmit,
}: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null
      if (!dialog.open) dialog.showModal()
      const frame = window.requestAnimationFrame(() => {
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      })
      return () => window.cancelAnimationFrame(frame)
    }

    if (dialog.open) dialog.close()
    previouslyFocusedElement.current?.focus()
    previouslyFocusedElement.current = null
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isPending}
      onCancel={(event) => {
        event.preventDefault()
        if (!isPending) onCancel()
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <header className="form-dialog__header">
          <div>
            <p className="form-dialog__eyebrow">Edit item</p>
            <h2 className="form-dialog__title" id={titleId}>{title}</h2>
            <p className="form-dialog__description" id={descriptionId}>{description}</p>
          </div>
          <button
            className="form-dialog__close"
            type="button"
            aria-label="Close editor"
            disabled={isPending}
            onClick={onCancel}
          >
            <X size={18} />
          </button>
        </header>

        <div className="form-dialog__content">
          {error ? <p className="app-error" role="alert">{error}</p> : null}
          {children}
        </div>

        <footer className="form-dialog__footer">
          <button className="btn-secondary" type="button" disabled={isPending} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" disabled={isPending}>
            {isPending ? <LoaderCircle className="confirm-dialog__spinner" size={16} /> : null}
            {isPending ? pendingLabel : submitLabel}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
