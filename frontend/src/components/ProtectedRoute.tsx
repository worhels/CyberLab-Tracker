import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from '../router'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-[var(--text-main)]">
        Loading workspace...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
