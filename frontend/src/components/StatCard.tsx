import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  accent?: 'ivory' | 'success' | 'red' | 'amber'
}

const accents = {
  ivory: 'stat-card-value--ivory',
  success: 'stat-card-value--success',
  red: 'stat-card-value--red',
  amber: 'stat-card-value--amber',
}

export function StatCard({ label, value, accent = 'ivory' }: StatCardProps) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <div className={`stat-card-value mt-3 text-3xl font-semibold ${accents[accent]}`}>{value}</div>
    </div>
  )
}
