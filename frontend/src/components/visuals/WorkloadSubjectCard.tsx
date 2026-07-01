import { AnimatePresence, motion } from 'framer-motion'
import { formatDate } from '../../utils/format'
import type { WorkloadHotspot } from './workloadHotspotData'

interface WorkloadSubjectCardProps {
  hoveredHotspot: WorkloadHotspot | null
  selectedHotspot: WorkloadHotspot | null
}

function getStatusLabel(status: WorkloadHotspot['status']) {
  switch (status) {
    case 'critical':
      return 'critical'
    case 'warning':
      return 'deadline'
    case 'active':
      return 'active'
    case 'done':
      return 'done'
    case 'empty':
    default:
      return 'empty'
  }
}

export function WorkloadSubjectCard({ hoveredHotspot, selectedHotspot }: WorkloadSubjectCardProps) {
  const previewHotspot = hoveredHotspot && hoveredHotspot.id !== selectedHotspot?.id ? hoveredHotspot : null

  return (
    <>
      <AnimatePresence>
        {previewHotspot ? (
          <motion.div
            key={previewHotspot.id}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute',
              left: 22,
              bottom: 22,
              zIndex: 4,
              minWidth: 168,
              borderRadius: 10,
              border: '1px solid var(--panel-border)',
              background: 'var(--workload-card-bg)',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'var(--surface-blur)',
              padding: '10px 12px',
              pointerEvents: 'none',
            }}
          >
            <p style={{ margin: 0, color: 'var(--text-main)', fontSize: 12, fontWeight: 760 }}>{previewHotspot.label}</p>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 11 }}>
              {previewHotspot.activeTasksCount} active · {previewHotspot.completedTasksCount} completed
              {previewHotspot.overdueTasksCount ? ` · ${previewHotspot.overdueTasksCount} overdue` : ''}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedHotspot ? (
          <motion.aside
            key={selectedHotspot.id}
            initial={{ opacity: 0, x: 34, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 22, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 22,
              right: 22,
              zIndex: 4,
              width: 'min(286px, calc(100% - 44px))',
              borderRadius: 12,
              border: '1px solid var(--panel-border)',
              background: 'var(--workload-card-bg)',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'var(--surface-blur)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: 3,
                background:
                  selectedHotspot.status === 'critical'
                    ? 'var(--workload-hotspot-critical)'
                    : selectedHotspot.status === 'warning'
                      ? 'var(--workload-hotspot-warning)'
                      : 'var(--workload-hotspot-selected)',
              }}
            />
            <div style={{ padding: '15px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    selected subject
                  </p>
                  <h2 style={{ margin: '6px 0 0', color: 'var(--text-main)', fontSize: 16, fontWeight: 780, lineHeight: 1.14 }}>
                    {selectedHotspot.label}
                  </h2>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: 999,
                    border: '1px solid var(--panel-border)',
                    background: 'var(--workload-card-soft)',
                    color: 'var(--text-main)',
                    padding: '4px 8px',
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {getStatusLabel(selectedHotspot.status)}
                </span>
              </div>

              <div className="workload-subject-stats">
                {[
                  ['Tasks', selectedHotspot.tasksCount],
                  ['Active', selectedHotspot.activeTasksCount],
                  ['Completed', selectedHotspot.completedTasksCount],
                  ['Overdue', selectedHotspot.overdueTasksCount],
                  ['Critical', selectedHotspot.criticalTasksCount],
                  ['Due ≤3d', selectedHotspot.deadlineTasksCount],
                ].map(([label, value]) => (
                  <div key={label} className="workload-subject-stat">
                    <p className="workload-subject-stat__label">{label}</p>
                    <p className="workload-subject-stat__value">{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: 'var(--text-muted)', fontSize: 11, fontWeight: 750 }}>
                  <span>Completed</span>
                  <span>
                    {selectedHotspot.completedTasksCount}/{selectedHotspot.tasksCount} · {selectedHotspot.progress}%
                  </span>
                </div>
                <div style={{ height: 5, marginTop: 8, borderRadius: 999, background: 'var(--workload-card-soft)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${selectedHotspot.progress}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: 'var(--workload-hotspot-selected)',
                      boxShadow: '0 0 18px rgba(var(--accent-primary-rgb), 0.18)',
                    }}
                  />
                </div>
              </div>

              <p style={{ margin: '12px 0 0', color: 'var(--text-muted)', fontSize: 10 }}>
                Nearest: {formatDate(selectedHotspot.nearestDeadline)}
              </p>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  )
}
