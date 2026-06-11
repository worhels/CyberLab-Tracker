import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  description?: string
  accent?: 'ivory' | 'success' | 'red' | 'amber'
}

const VALUE_COLOR: Record<string, string> = {
  ivory: 'var(--text-main)',
  success: 'var(--accent-ok)',
  red: 'var(--accent-debt)',
  amber: 'var(--accent-high)',
}

export function StatCard({ label, value, description, accent = 'ivory' }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255,255,255,0.045)',
        padding: '22px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        minHeight: '130px',
        justifyContent: 'space-between',
        transition: 'box-shadow var(--transition)',
      }}
    >
      <div>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            marginBottom: '10px',
          }}
        >
          {label}
        </p>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: 1,
            color: VALUE_COLOR[accent],
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
      </div>
      {description && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-faint)',
            lineHeight: 1.5,
            marginTop: '14px',
          }}
        >
          {description}
        </p>
      )}
    </div>
  )
}
