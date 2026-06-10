interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__rule" aria-hidden="true" />
      <p className="page-header__label">Workspace</p>
      <h1 className="app-title">{title}</h1>
      {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
    </div>
  )
}
