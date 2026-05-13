import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getMe, login as loginRequest, register as registerRequest } from '../api/auth'
import { AUTH_LOGOUT_EVENT, TOKEN_KEY } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const onLogout = () => logout()
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout)
  }, [logout])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)
    getMe()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser)
      })
      .catch(() => {
        if (isMounted) logout()
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token, logout])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password)
    localStorage.setItem(TOKEN_KEY, response.access_token)
    setToken(response.access_token)
  }, [])

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    await registerRequest(email, password, fullName)
    await login(email, password)
  }, [login])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
