import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gauge,
  ListChecks,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PageTransition } from '../components/PageTransition'
import { PressureFieldBackground } from '../components/visual/PressureFieldBackground'
import type { PressureFieldVariant } from '../components/visual/PressureFieldBackground'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/crisis', label: 'Crisis Mode', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const routeBackgrounds: Record<string, { variant: PressureFieldVariant; intensity: number; opacity: number; speed: number }> = {
  '/dashboard': { variant: 'dashboard', intensity: 0.72, opacity: 0.24, speed: 0.44 },
  '/subjects': { variant: 'subjects', intensity: 0.58, opacity: 0.18, speed: 0.42 },
  '/tasks': { variant: 'tasks', intensity: 0.42, opacity: 0.15, speed: 0.34 },
  '/crisis': { variant: 'crisis', intensity: 0.72, opacity: 0.22, speed: 0.48 },
  '/settings': { variant: 'settings', intensity: 0.34, opacity: 0.1, speed: 0.24 },
}

function getBackgroundConfig(pathname: string) {
  const route = Object.keys(routeBackgrounds).find((key) => pathname.startsWith(key))
  return route ? routeBackgrounds[route] : routeBackgrounds['/dashboard']
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const background = getBackgroundConfig(location.pathname)
  const SidebarToggleIcon = isSidebarCollapsed ? ChevronRight : ChevronLeft
  const sidebarToggleLabel = isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'

  return (
    <div className="app-shell">
      <aside className={['app-sidebar fixed inset-y-0 left-0 z-20 hidden xl:block', isSidebarCollapsed ? 'app-sidebar--collapsed' : ''].join(' ')}>
        <button
          type="button"
          className="app-sidebar-toggle"
          aria-label={sidebarToggleLabel}
          aria-pressed={isSidebarCollapsed}
          data-tooltip={sidebarToggleLabel}
          title={sidebarToggleLabel}
          onClick={() => setIsSidebarCollapsed((current) => !current)}
        >
          <SidebarToggleIcon size={14} />
        </button>

        <div className="flex h-full flex-col">
          <div className="app-sidebar-brand flex items-center gap-3 border-b border-white/[0.08] px-5 py-5">
            <div className="app-brand-mark">
              <Shield size={21} />
            </div>
            <div className="app-sidebar__brand-copy">
              <p className="app-brand-kicker">CyberLab</p>
              <p className="app-brand-subtitle">Tracker</p>
            </div>
          </div>

          <nav className="app-sidebar-nav flex-1 space-y-1 px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'app-nav-link flex items-center gap-3 text-sm font-medium',
                      isActive ? 'app-nav-link--active' : '',
                    ].join(' ')
                  }
                >
                  <Icon size={18} />
                  <span className="app-nav-link__label">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="app-sidebar-footer border-t border-white/[0.08] p-4">
            <p className="app-sidebar__footer-copy truncate text-sm font-medium text-[#F2F0EA]">{user?.email}</p>
            <button type="button" onClick={logout} className="mt-3 w-full btn-secondary">
              <LogOut size={16} />
              <span className="app-sidebar__logout-label">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className={['app-frame', isSidebarCollapsed ? 'app-frame--sidebar-collapsed' : ''].join(' ')}>
        <PressureFieldBackground {...background} />
        <div className="app-readability-overlay" aria-hidden="true" />

        <header className="app-header sticky top-0 z-10 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="app-brand-kicker">CyberLab Tracker</p>
              <p className="app-brand-subtitle">Study control center</p>
            </div>
            <div className="system-status">
              <span className="system-status__label">API Connected</span>
              <span className="system-status__meta">
                <span className="system-status__light" aria-hidden="true" />
                System online
              </span>
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
                        'app-mobile-nav-link inline-flex shrink-0 items-center gap-2 text-sm',
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

        <main className="app-main relative z-10">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
