interface SegmentItem {
  label: string
  value: string
}

interface SoftSegmentProps {
  items: SegmentItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SoftSegment({ items, value, onChange, className = '' }: SoftSegmentProps) {
  return (
    <div
      className={`nm-inset ${className}`}
      style={{
        display: 'inline-flex',
        padding: '4px',
        gap: '2px',
      }}
    >
      {items.map((item) => {
        const isActive = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={isActive ? 'nm-pill-active' : 'nm-pill-inactive'}
            style={{
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
