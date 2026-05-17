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
    <div className="app-shell">
      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden w-64 xl:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-5">
            <div className="app-brand-mark">
              <Shield size={21} />
            </div>
            <div>
              <p className="app-brand-kicker">CyberLab</p>
              <p className="app-brand-subtitle">Tracker</p>
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
                      'app-nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium',
                      isActive ? 'app-nav-link--active' : '',
                    ].join(' ')
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="border-t border-white/[0.08] p-4">
            <p className="truncate text-sm font-medium text-[#F2F0EA]">{user?.email}</p>
            <button type="button" onClick={logout} className="mt-3 w-full btn-secondary">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="app-frame xl:pl-64">
        <header className="app-header sticky top-0 z-10 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="app-brand-kicker">CyberLab Tracker</p>
              <p className="app-brand-subtitle">Study control center</p>
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
                        'app-mobile-nav-link inline-flex shrink-0 items-center gap-2 px-3 py-2 text-sm',
                        isActive ? 'app-mobile-nav-link--active' : '',
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

        <main className="app-main px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
