import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/errors'

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await register(email, password, fullName)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell mode="register">
      <form onSubmit={onSubmit} className="auth-card">
        <div className="auth-card-heading">
          <p className="auth-brand">CyberLab Tracker</p>
          <h1>Create account</h1>
          <p>Start tracking your academic workload.</p>
        </div>

        <div className="auth-fields">
          <label className="block">
            <span className="auth-label">Username</span>
            <input
              autoComplete="name"
              className="auth-field"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
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
              autoComplete="new-password"
              className="auth-field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <button className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link className="auth-text-link" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
