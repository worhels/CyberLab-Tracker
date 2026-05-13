import { api } from './client'
import type { Token, User } from '../types'

export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const response = await api.post<Token>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return response.data
}

export async function register(email: string, password: string, fullName?: string): Promise<User> {
  const response = await api.post<User>('/auth/register', {
    email,
    password,
    full_name: fullName || null,
  })
  return response.data
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me')
  return response.data
}
