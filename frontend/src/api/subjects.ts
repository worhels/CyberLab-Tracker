import { api } from './client'
import type { Subject, SubjectPayload } from '../types'

export async function getSubjects(): Promise<Subject[]> {
  const response = await api.get<Subject[]>('/subjects')
  return response.data
}

export async function createSubject(payload: SubjectPayload): Promise<Subject> {
  const response = await api.post<Subject>('/subjects', payload)
  return response.data
}

export async function updateSubject(id: number, payload: SubjectPayload): Promise<Subject> {
  const response = await api.put<Subject>(`/subjects/${id}`, payload)
  return response.data
}

export async function deleteSubject(id: number): Promise<void> {
  await api.delete(`/subjects/${id}`)
}
