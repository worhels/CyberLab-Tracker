import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { AuthVisualBackground } from '../components/auth/AuthVisualBackground'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errors'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('demo@cyberlab.dev')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const useDemoAccount = () => {
    setEmail('demo@cyberlab.dev')
    setPassword('password123')
    setError('')
  }

  return (
    <AuthShell mode="login" visual={<AuthVisualBackground mode="login" />}>
      <form onSubmit={onSubmit} className="auth-card">
        <div className="auth-card-heading">
          <p className="auth-brand">CyberLab Tracker</p>
          <h1>Welcome back</h1>
          <p>Sign in to continue.</p>
        </div>

        <div className="auth-fields">
          <label className="block">
            <span className="auth-label">Email</span>
            <input
              autoComplete="email"
              className="auth-field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="auth-label">Password</span>
            <input
              autoComplete="current-password"
              className="auth-field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <button className="auth-secondary-action" type="button" onClick={useDemoAccount}>
          Demo account
        </button>

        <Link className="auth-inline-link" to="/register">
          Create account
        </Link>
      </form>
    </AuthShell>
  )
}
