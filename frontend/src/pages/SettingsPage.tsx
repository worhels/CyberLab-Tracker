import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <section>
      <PageHeader title="Settings" subtitle="Workspace settings placeholder." />
      <div className="card max-w-2xl p-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="label">Email</dt>
            <dd className="mt-1 text-slate-200">{user?.email}</dd>
          </div>
          <div>
            <dt className="label">Name</dt>
            <dd className="mt-1 text-slate-200">{user?.full_name || 'Not set'}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
