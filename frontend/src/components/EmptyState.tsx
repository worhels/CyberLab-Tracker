interface EmptyStateProps {
  title?: string
  text: string
}

export function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="app-empty p-6 text-center text-sm">
      {title ? <p className="app-empty-title">{title}</p> : null}
      <p className={title ? 'app-empty-text' : 'm-0'}>{text}</p>
    </div>
  )
}
