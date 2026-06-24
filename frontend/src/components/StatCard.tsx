import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: ReactNode
  description?: string
  accent?: 'ivory' | 'success' | 'red' | 'amber'
  density?: 'compact' | 'comfortable'
}

const VALUE_COLOR: Record<string, string> = {
  ivory: 'var(--text-main)',
  success: 'var(--accent-ok)',
  red: 'var(--accent-debt)',
  amber: 'var(--accent-high)',
}

export function StatCard({ label, value, description, accent = 'ivory', density = 'comfortable' }: StatCardProps) {
  const isCompact = density === 'compact'

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--panel-border)',
        padding: isCompact ? '14px 16px' : '22px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        minHeight: isCompact ? '96px' : '130px',
        justifyContent: 'space-between',
        transition: 'box-shadow var(--transition)',
        backdropFilter: 'var(--surface-blur)',
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
            fontSize: isCompact ? '24px' : '32px',
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
      {description && !isCompact && (
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
