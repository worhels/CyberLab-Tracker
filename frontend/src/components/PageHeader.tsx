interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      <p className="app-brand-kicker">Workspace</p>
      <h1 className="app-title">{title}</h1>
      {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
    </div>
  )
}
