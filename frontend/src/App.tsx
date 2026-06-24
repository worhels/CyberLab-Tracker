import { lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageTransition } from './components/PageTransition'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

const AppLayout = lazy(() => import('./layouts/AppLayout').then((module) => ({ default: module.AppLayout })))
const CrisisPage = lazy(() => import('./pages/CrisisPage').then((module) => ({ default: module.CrisisPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then((module) => ({ default: module.SubjectsPage })))
const TasksPage = lazy(() => import('./pages/TasksPage').then((module) => ({ default: module.TasksPage })))

function RouteFallback() {
  return (
    <div className="app-shell route-fallback flex min-h-screen items-center justify-center text-[#F2F0EA]">
      Loading workspace...
    </div>
  )
}

export function App() {
  const location = useLocation()
  const routeKey = location.pathname === '/login' || location.pathname === '/register' ? location.pathname : 'app'

  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={routeKey}>
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route element={<ProtectedRoute />}>
              <Route element={<SettingsProvider><AppLayout /></SettingsProvider>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/crisis" element={<CrisisPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AuthProvider>
  )
}
