interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <p className="app-brand-kicker">Workspace</p>
      <h1 className="app-title">{title}</h1>
      {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
    </div>
  )
}
