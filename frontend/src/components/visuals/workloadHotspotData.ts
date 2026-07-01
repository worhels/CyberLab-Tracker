import type { Subject, Task } from '../../types'
import { stableHash } from './workloadMath'

export type WorkloadHotspotStatus = 'empty' | 'active' | 'warning' | 'critical' | 'done'

export interface WorkloadHotspot {
  id: number
  subjectId: number
  label: string
  position: [number, number, number]
  status: WorkloadHotspotStatus
  tasksCount: number
  activeTasksCount: number
  completedTasksCount: number
  overdueTasksCount: number
  criticalTasksCount: number
  deadlineTasksCount: number
  progress: number
  nearestDeadline: string | null
  subjectColor: string
}

const HOTSPOT_LIMIT = 8
const HOTSPOT_RADIUS = 2.72

function isActiveTask(task: Task) {
  return task.status !== 'accepted'
}

function daysUntil(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY

  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY

  return (time - Date.now()) / (1000 * 60 * 60 * 24)
}

function isNearDeadline(task: Task) {
  const days = daysUntil(task.deadline)
  return days >= 0 && days <= 3
}

function getHotspotStatus(tasks: Task[], activeTasks: Task[]): WorkloadHotspotStatus {
  if (!tasks.length) return 'empty'
  if (!activeTasks.length) return 'done'
  if (activeTasks.some((task) => task.status === 'debt' || task.priority === 'critical' || daysUntil(task.deadline) < 0)) return 'critical'
  if (activeTasks.some((task) => task.priority === 'high' || daysUntil(task.deadline) <= 3)) return 'warning'
  return 'active'
}

function getHotspotScore(tasks: Task[], activeTasks: Task[]) {
  if (!tasks.length) return 0.02

  return activeTasks.reduce((score, task) => {
    const deadlineDays = daysUntil(task.deadline)
    const deadlineScore = deadlineDays < 0 ? 8 : deadlineDays <= 3 ? 5 : deadlineDays <= 7 ? 3 : 0
    const priorityScore = task.priority === 'critical' ? 8 : task.priority === 'high' ? 5 : task.priority === 'medium' ? 2 : 1
    const debtScore = task.status === 'debt' ? 7 : 0

    return score + deadlineScore + priorityScore + debtScore
  }, tasks.length ? 0.1 : 0)
}

function getSurfacePosition(seed: number, index: number): [number, number, number] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const normalized = (index + 0.5) / HOTSPOT_LIMIT
  const y = 1 - normalized * 2
  const radius = Math.sqrt(1 - y * y)
  const angle = (seed % 997) * 0.011 + index * goldenAngle

  return [
    Math.cos(angle) * radius * HOTSPOT_RADIUS,
    y * HOTSPOT_RADIUS,
    Math.sin(angle) * radius * HOTSPOT_RADIUS,
  ]
}

export function createWorkloadHotspots(subjects: Subject[], tasks: Task[]): WorkloadHotspot[] {
  const candidates = subjects.map((subject, index) => {
    const subjectTasks = tasks.filter((task) => task.subject_id === subject.id)
    const activeTasks = subjectTasks.filter(isActiveTask)
    const acceptedTasksCount = subjectTasks.length - activeTasks.length
    const nearestDeadline =
      activeTasks
        .map((task) => task.deadline)
        .filter(Boolean)
        .sort((left, right) => new Date(left ?? '').getTime() - new Date(right ?? '').getTime())[0] ?? null

    const status = getHotspotStatus(subjectTasks, activeTasks)
    const seed = stableHash(`${subject.id}-${subject.name}-${index}`)

    return {
      hotspot: {
        id: subject.id,
        subjectId: subject.id,
        label: subject.name,
        position: getSurfacePosition(seed, index),
        status,
        tasksCount: subjectTasks.length,
        activeTasksCount: activeTasks.length,
        completedTasksCount: acceptedTasksCount,
        overdueTasksCount: activeTasks.filter((task) => daysUntil(task.deadline) < 0).length,
        criticalTasksCount: activeTasks.filter((task) => task.priority === 'critical' || task.status === 'debt').length,
        deadlineTasksCount: activeTasks.filter(isNearDeadline).length,
        progress: subjectTasks.length ? Math.round((acceptedTasksCount / subjectTasks.length) * 100) : 0,
        nearestDeadline,
        subjectColor: subject.color || '#ffffff',
      } satisfies WorkloadHotspot,
      score: getHotspotScore(subjectTasks, activeTasks),
    }
  })

  const activeCandidates = candidates.filter(({ hotspot }) => hotspot.status !== 'empty' && hotspot.status !== 'done')
  const source = activeCandidates.length ? activeCandidates : candidates

  return source
    .sort((left, right) => right.score - left.score || left.hotspot.label.localeCompare(right.hotspot.label))
    .slice(0, HOTSPOT_LIMIT)
    .map(({ hotspot }, index) => ({
      ...hotspot,
      position: getSurfacePosition(stableHash(`${hotspot.subjectId}-${hotspot.label}`), index),
    }))
}
