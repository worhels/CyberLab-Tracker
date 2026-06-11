interface SoftProgressProps {
  value: number
  label?: string
  showPercent?: boolean
  className?: string
}

export function SoftProgress({ value, label, showPercent = true, className = '' }: SoftProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={className} style={{ width: '100%' }}>
      {(label || showPercent) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '10px',
        }}>
          {label && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
              {clamped.toFixed(2)}%
            </span>
          )}
        </div>
      )}
      <div
        className="nm-inset"
        style={{
          width: '100%',
          height: '12px',
          borderRadius: 'var(--r-full)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 'var(--r-full)',
          background: 'var(--active)',
          boxShadow: '0 0 10px rgba(240,237,228,0.22)',
          transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        {clamped > 2 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `calc(${clamped}% - 8px)`,
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--active)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'left 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        )}
      </div>
    </div>
  )
}
