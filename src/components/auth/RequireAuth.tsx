import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAppConfig } from '../../hooks/useAppConfig'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const config = useAppConfig()
  if (config?.features.auth && !user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
