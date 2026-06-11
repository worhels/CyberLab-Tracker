import {
  Activity,
  BookOpen,
  Gauge,
  ListChecks,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react'
import { type CSSProperties, useState } from 'react'
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

const SIDEBAR_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const SIDEBAR_TRANSITION = `width 0.34s ${SIDEBAR_EASE}, margin-left 0.34s ${SIDEBAR_EASE}`

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const background = getBackgroundConfig(location.pathname)
  const sidebarToggleLabel = isSidebarCollapsed ? 'Открыть боковую панель' : 'Свернуть боковую панель'
  const sidebarTextStyle: CSSProperties = {
    maxWidth: isSidebarCollapsed ? 0 : '150px',
    opacity: isSidebarCollapsed ? 0 : 1,
    transform: isSidebarCollapsed ? 'translate3d(-6px, 0, 0)' : 'translate3d(0, 0, 0)',
    transition: `max-width 0.3s ${SIDEBAR_EASE}, opacity 0.18s ease, transform 0.3s ${SIDEBAR_EASE}`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    pointerEvents: isSidebarCollapsed ? 'none' : 'auto',
  }

  return (
    <div className="app-shell">
      <aside
        style={{
          position: 'fixed',
          top: '12px',
          bottom: '12px',
          left: '12px',
          width: isSidebarCollapsed ? '68px' : '224px',
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          transition: SIDEBAR_TRANSITION,
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          overflow: 'visible',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column', overflow: 'visible', borderRadius: 'inherit' }}>
          <div
            style={{
              padding: isSidebarCollapsed ? '18px 0' : '18px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: isSidebarCollapsed ? '0px' : '12px',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              transition: `gap 0.3s ${SIDEBAR_EASE}, padding 0.34s ${SIDEBAR_EASE}`,
              flexShrink: 0,
            }}
          >
            <div
              className="app-sidebar-brand-toggle"
              style={
                {
                  '--sidebar-toggle-tooltip-left': isSidebarCollapsed ? 'calc(100% + 16px)' : 'calc(100% + 104px)',
                } as CSSProperties
              }
            >
              <button
                type="button"
                className="app-sidebar-brand-button"
                aria-label={sidebarToggleLabel}
                aria-pressed={isSidebarCollapsed}
                data-tooltip={sidebarToggleLabel}
                onClick={() => setIsSidebarCollapsed((current) => !current)}
              >
                <Shield size={21} />
              </button>
              <span className="app-sidebar-brand-tooltip" aria-hidden="true">
                {sidebarToggleLabel}
              </span>
            </div>
            <div style={sidebarTextStyle}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>CyberLab</p>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Tracker</p>
            </div>
          </div>

          <nav
            style={{
              flex: 1,
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }: { isActive: boolean }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '0px' : '10px',
                    padding: isSidebarCollapsed ? '11px 0' : '10px 14px',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--r-md)',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    color: isActive ? 'var(--active-text)' : 'var(--text-muted)',
                    background: isActive ? 'var(--active)' : 'transparent',
                    boxShadow: isActive ? 'var(--shadow-active)' : 'none',
                    textDecoration: 'none',
                    transition: 'all var(--transition)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  })}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <Icon size={18} />
                  </span>
                  <span style={{ ...sidebarTextStyle, textOverflow: 'ellipsis' }}>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div
            style={{
              padding: isSidebarCollapsed ? '14px 0' : '14px 14px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isSidebarCollapsed ? 'center' : 'stretch',
              gap: '10px',
            }}
          >
            {!isSidebarCollapsed && (
              <p style={{
                fontSize: '12px',
                color: 'var(--text-faint)',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.email}
              </p>
            )}
            <button
              type="button"
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isSidebarCollapsed ? 'center' : 'center',
                gap: isSidebarCollapsed ? '0px' : '8px',
                padding: isSidebarCollapsed ? '9px' : '9px 16px',
                borderRadius: 'var(--r-full)',
                background: 'var(--surface-soft)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid rgba(255,255,255,0.04)',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition)',
                width: isSidebarCollapsed ? '36px' : '100%',
              }}
            >
              <LogOut size={16} />
              <span style={{ ...sidebarTextStyle, maxWidth: isSidebarCollapsed ? 0 : '70px' }}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div
        className="app-frame"
        style={{
          marginLeft: isSidebarCollapsed ? '92px' : '248px',
          transition: SIDEBAR_TRANSITION,
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
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
