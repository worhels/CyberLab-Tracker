import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  accent?: 'blue' | 'green' | 'red' | 'amber'
}

const accents = {
  blue: 'text-cyan-300',
  green: 'text-emerald-300',
  red: 'text-red-300',
  amber: 'text-amber-300',
}

export function StatCard({ label, value, accent = 'blue' }: StatCardProps) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className={`mt-3 text-3xl font-semibold ${accents[accent]}`}>{value}</div>
    </div>
  )
}
