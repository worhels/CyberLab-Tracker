type BadgeVariant = 'high' | 'debt' | 'ok' | 'info' | 'neutral' | 'active'

interface SoftBadgeProps {
  label: string
  variant?: BadgeVariant
}

const STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  high:    { bg: 'rgba(200,168,75,0.14)',  color: '#c8a84b' },
  debt:    { bg: 'rgba(200,80,80,0.14)',   color: '#c85050' },
  ok:      { bg: 'rgba(79,200,122,0.14)',  color: '#4fc87a' },
  info:    { bg: 'rgba(75,142,200,0.14)',  color: '#4b8ec8' },
  neutral: { bg: 'rgba(255,255,255,0.07)', color: '#9a9690' },
  active:  { bg: 'var(--active)',          color: 'var(--active-text)' },
}

export function SoftBadge({ label, variant = 'neutral' }: SoftBadgeProps) {
  const s = STYLES[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 11px',
        borderRadius: 'var(--r-full)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.045em',
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
