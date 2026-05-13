import {
  Activity,
  BookOpen,
  Gauge,
  ListChecks,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/crisis', label: 'Crisis Mode', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur xl:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
              <Shield size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-50">CyberLab</p>
              <p className="text-xs text-slate-500">Tracker</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-cyan-400/10 text-cyan-200'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                    ].join(' ')
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <p className="truncate text-sm font-medium text-slate-200">{user?.email}</p>
            <button type="button" onClick={logout} className="mt-3 w-full btn-secondary">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="xl:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-300">CyberLab Tracker</p>
              <p className="text-sm text-slate-400">Study control center</p>
            </div>
            <nav className="flex gap-2 overflow-x-auto xl:hidden">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm',
                        isActive
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                          : 'border-slate-800 text-slate-400',
                      ].join(' ')
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
