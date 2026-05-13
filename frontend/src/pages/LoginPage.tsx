import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
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

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">CyberLab Tracker</h1>
            <p className="text-sm text-slate-400">Sign in</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input className="field mt-1" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              className="field mt-1"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

        <button className="btn-primary mt-6 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-400">
          No account?{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
