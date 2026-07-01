import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  pendingLabel?: string
  isPending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Deleting...',
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null
      if (!dialog.open) dialog.showModal()
      const frame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus())
      return () => window.cancelAnimationFrame(frame)
    }

    if (dialog.open) dialog.close()
    previouslyFocusedElement.current?.focus()
    previouslyFocusedElement.current = null
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={isPending}
      onCancel={(event) => {
        event.preventDefault()
        if (!isPending) onCancel()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        if (!isPending) onCancel()
      }}
    >
      <div className="confirm-dialog__body">
        <div className="confirm-dialog__icon" aria-hidden="true">
          <TriangleAlert size={22} strokeWidth={1.8} />
        </div>
        <div>
          <p className="confirm-dialog__eyebrow">Destructive action</p>
          <h2 className="confirm-dialog__title" id={titleId}>
            {title}
          </h2>
          <div className="confirm-dialog__description" id={descriptionId}>
            {description}
          </div>
        </div>
      </div>

      <div className="confirm-dialog__footer">
        <p className="confirm-dialog__warning">This action cannot be undone.</p>
        <div className="confirm-dialog__actions">
          <button
            ref={cancelButtonRef}
            className="btn-secondary"
            type="button"
            disabled={isPending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn-danger"
            type="button"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <LoaderCircle className="confirm-dialog__spinner" size={16} /> : null}
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
