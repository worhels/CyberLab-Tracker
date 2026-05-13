import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
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
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Create account</h1>
            <p className="text-sm text-slate-400">CyberLab Tracker</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="label">Full name</span>
            <input className="field mt-1" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
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
          {isSubmitting ? 'Creating...' : 'Register'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link className="font-semibold text-cyan-300 hover:text-cyan-200" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
