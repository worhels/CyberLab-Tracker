import type { ReactNode } from 'react'

interface SoftButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

export function SoftButton({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
}: SoftButtonProps) {
  const padding = size === 'sm' ? '7px 16px' : '10px 22px'
  const fontSize = size === 'sm' ? '12px' : '13px'

  const variantStyle = {
    primary: {
      background: 'var(--active)',
      color: 'var(--active-text)',
      boxShadow: 'var(--shadow-active)',
      border: 'none',
    },
    secondary: {
      background: 'var(--surface-soft)',
      color: 'var(--text-muted)',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid rgba(255,255,255,0.05)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      boxShadow: 'none',
      border: '1px solid rgba(255,255,255,0.06)',
    },
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: 'var(--r-full)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition)',
        opacity: disabled ? 0.45 : 1,
        ...variantStyle,
      }}
    >
      {children}
    </button>
  )
}
