import { lazy, Suspense } from 'react'
import type { Subject, Task } from '../../types'
import type { VisualPerformanceTier } from '../../hooks/useVisualPreferences'
import { WorkloadSummaryFallback } from './WorkloadSummaryFallback'
import type { WorkloadFallbackReason } from './WorkloadSummaryFallback'

const LazyWorkloadSphereCanvas = lazy(async () => {
  const module = await import('./WorkloadSphereCanvas')
  return { default: module.WorkloadSphereCanvas }
})

interface WorkloadVisualizationProps {
  tasks: Task[]
  subjects: Subject[]
  preferencesReady: boolean
  userReducedMotion: boolean
  systemReducedMotion: boolean
  performanceTier: VisualPerformanceTier
}

function getFallbackReason({
  preferencesReady,
  userReducedMotion,
  systemReducedMotion,
  performanceTier,
}: Pick<
  WorkloadVisualizationProps,
  'preferencesReady' | 'userReducedMotion' | 'systemReducedMotion' | 'performanceTier'
>): WorkloadFallbackReason | null {
  if (userReducedMotion || systemReducedMotion) return 'reduced-motion'
  if (!preferencesReady) return 'preferences-pending'
  if (performanceTier === 'low') return 'limited-device'
  return null
}

export function WorkloadVisualization(props: WorkloadVisualizationProps) {
  const fallbackReason = getFallbackReason(props)

  if (fallbackReason) {
    return (
      <WorkloadSummaryFallback
        tasks={props.tasks}
        subjects={props.subjects}
        reason={fallbackReason}
      />
    )
  }

  return (
    <Suspense
      fallback={(
        <WorkloadSummaryFallback
          tasks={props.tasks}
          subjects={props.subjects}
          reason="interactive-loading"
        />
      )}
    >
      <LazyWorkloadSphereCanvas tasks={props.tasks} subjects={props.subjects} />
    </Suspense>
  )
}
