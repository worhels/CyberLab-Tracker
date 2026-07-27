import { lazy, Suspense, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from './components/PageTransition'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Navigate, useLocation } from './router'

const AppLayout = lazy(() => import('./layouts/AppLayout').then((module) => ({ default: module.AppLayout })))
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })))
const CrisisPage = lazy(() => import('./pages/CrisisPage').then((module) => ({ default: module.CrisisPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then((module) => ({ default: module.SubjectsPage })))
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })))

function RouteFallback() {
  return (
    <div className="app-shell route-fallback flex min-h-screen items-center justify-center text-[var(--text-main)]">
      Loading workspace...
    </div>
  )
}

export function App() {
  const location = useLocation()
  let route: ReactNode

  if (location.pathname === '/login') {
    route = <PageTransition key="/login"><LoginPage /></PageTransition>
  } else if (location.pathname === '/register') {
    route = <PageTransition key="/register"><RegisterPage /></PageTransition>
  } else {
    let page: ReactNode
    switch (location.pathname) {
      case '/dashboard':
        page = <DashboardPage />
        break
      case '/subjects':
        page = <SubjectsPage />
        break
      case '/tasks':
        page = <TasksPage />
        break
      case '/calendar':
        page = <CalendarPage />
        break
      case '/crisis':
        page = <CrisisPage />
        break
      case '/settings':
        page = <SettingsPage />
        break
      default:
        page = <Navigate to="/dashboard" replace />
    }

    route = (
      <ProtectedRoute key="app">
        <SettingsProvider>
          <AppLayout>{page}</AppLayout>
        </SettingsProvider>
      </ProtectedRoute>
    )
  }

  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          {route}
        </AnimatePresence>
      </Suspense>
    </AuthProvider>
  )
}
