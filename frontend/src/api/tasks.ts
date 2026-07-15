import { api } from './client'
import type {
  Task,
  TaskCreatePayload,
  TaskPriority,
  TaskStatus,
  TaskType,
  TaskUpdatePayload,
} from '../types'

export interface TaskFilters {
  status?: TaskStatus
  active_only?: boolean
  subject_id?: number
  priority?: TaskPriority
  type?: TaskType
  deadline_before?: string
  deadline_after?: string
  search?: string
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const response = await api.get<Task[]>('/tasks', { params: filters })
  return response.data
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  const response = await api.post<Task>('/tasks', payload)
  return response.data
}

export async function updateTask(id: number, payload: TaskUpdatePayload): Promise<Task> {
  const response = await api.put<Task>(`/tasks/${id}`, payload)
  return response.data
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${id}/status`, { status })
  return response.data
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`)
}
