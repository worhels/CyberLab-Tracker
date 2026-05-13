interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-slate-50">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  )
}
