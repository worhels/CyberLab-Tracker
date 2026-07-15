import type { CrisisSeverityCounts } from '../../types'
import type { CSSProperties } from 'react'

interface CrisisVolumeFallbackProps {
  completionRatio: number
  severityCounts: CrisisSeverityCounts
}

const severityItems = [
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
] as const

export function CrisisVolumeFallback({ completionRatio, severityCounts }: CrisisVolumeFallbackProps) {
  const completionPercent = Math.round(Math.min(1, Math.max(0, completionRatio)) * 100)

  return (
    <div className="crisis-volume-fallback" role="img" aria-label={`Crisis volume ${completionPercent}% assembled`}>
      <div className="crisis-volume-fallback__graphic" aria-hidden="true">
        <div style={{ '--crisis-progress': `${completionPercent}%` } as CSSProperties} />
        <strong>{completionPercent}%</strong>
        <span>assembled</span>
      </div>
      <p>Heavy animation is paused because reduced motion is enabled.</p>
      <div className="crisis-volume-fallback__severity">
        {severityItems.map(({ key, label }) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{severityCounts[key]}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
