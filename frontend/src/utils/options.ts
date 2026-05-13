import type { TaskPriority, TaskStatus, TaskType } from '../types'

export const taskTypes: TaskType[] = ['lab', 'practice', 'coursework', 'exam', 'other']
export const taskStatuses: TaskStatus[] = [
  'not_started',
  'in_progress',
  'submitted',
  'accepted',
  'debt',
]
export const taskPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical']
