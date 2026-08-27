import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppConfig } from '../hooks/useAppConfig'
import { RequireAuth, RequireRole } from '../components/auth/RequireAuth'
import Layout from '../components/layout/Layout'
import { Spinner } from '../components/ui/primitives'
import { getActiveModules } from '../modules/registry'
import type { ModuleDef } from '../types'

const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const EntityPage = lazy(() => import('../pages/EntityPage'))
const PosPage = lazy(() => import('../pages/PosPage'))
const TableMapPage = lazy(() => import('../pages/TableMapPage'))
const CalendarPage = lazy(() => import('../pages/CalendarPage'))
const KanbanPage = lazy(() => import('../pages/KanbanPage'))
const ReportsPage = lazy(() => import('../pages/ReportsPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const UsersPage = lazy(() => import('../pages/UsersPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const SetupWizard = lazy(() => import('../pages/SetupWizard'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

function elementFor(m: ModuleDef) {
  switch (m.id) {
    case 'dashboard':
      return <DashboardPage />
    case 'pos':
      return <PosPage />
    case 'tablemap':
      return <TableMapPage />
    case 'calendar':
      return <CalendarPage />
    case 'kanban':
      return <KanbanPage />
    case 'reports':
      return <ReportsPage />
    case 'rbac':
      return <UsersPage />
    case 'settings':
      return <SettingsPage />
    default:
      if (m.kind === 'entity') return <EntityPage />
      return <NotFoundPage />
  }
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export default function AppRoutes() {
  const config = useAppConfig()
  if (!config) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </Suspense>
    )
  }

  const modules = getActiveModules(config)
  const entityRoutes = modules.filter((m) => m.kind === 'entity')
  const otherRoutes = modules.filter((m) => m.kind !== 'entity' && m.path.replace(/^\//, '') !== '')

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          {entityRoutes.length > 0 && (
            <Route
              path="entity/:entityId"
              element={<EntityPage />}
            />
          )}
          {otherRoutes.map((m) => (
            <Route
              key={m.id}
              path={m.path.replace(/^\//, '')}
              element={m.id === 'settings' || m.id === 'rbac' ? <RequireRole role="admin">{elementFor(m)}</RequireRole> : elementFor(m)}
            />
          ))}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
