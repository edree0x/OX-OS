import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAppConfig } from '../../hooks/useAppConfig'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/primitives'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const config = useAppConfig()
  const navigate = useNavigate()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-800">{config?.appName}</h1>
        <p className="text-xs text-slate-400">Multi-Sector Dynamic ERP</p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search…"
          className="hidden w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 md:block"
        />
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
              {user.name?.[0] || 'U'}
            </div>
            <div className="hidden text-sm sm:block">
              <p className="font-medium text-slate-700">{user.name}</p>
              <p className="text-xs capitalize text-slate-400">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              aria-label="Logout"
            >
              <Icon name="logout" className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
