import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  description?: string
  accent?: 'ivory' | 'success' | 'red' | 'amber'
}

const accents = {
  ivory: 'stat-card-value--ivory',
  success: 'stat-card-value--success',
  red: 'stat-card-value--red',
  amber: 'stat-card-value--amber',
}

export function StatCard({ label, value, description, accent = 'ivory' }: StatCardProps) {
  return (
    <div className="card stat-card p-4">
      <div>
        <p className="label">{label}</p>
        <div className={`stat-card-value mt-3 text-3xl font-semibold ${accents[accent]}`}>{value}</div>
      </div>
      {description ? <p className="stat-card-description mt-4">{description}</p> : null}
    </div>
  )
}
