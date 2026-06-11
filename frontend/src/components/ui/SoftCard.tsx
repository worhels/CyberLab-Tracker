import type { CSSProperties, ReactNode } from 'react'

interface SoftCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const PADDING: Record<string, string> = {
  sm: '16px 20px',
  md: '22px 26px',
  lg: '28px 32px',
}

export function SoftCard({ children, className = '', style, onClick, size = 'md' }: SoftCardProps) {
  return (
    <div
      className={`nm-card ${className}`}
      onClick={onClick}
      style={{
        padding: PADDING[size],
        cursor: onClick ? 'pointer' : undefined,
        transition: 'box-shadow var(--transition)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
