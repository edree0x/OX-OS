import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useThemeStore } from '../../stores/themeStore'
import { Icon } from '../ui/Icon'
import { Button, Badge } from '../ui/primitives'

const ROLE_TONES: Record<string, 'slate' | 'green' | 'red' | 'indigo' | 'amber'> = {
  admin: 'red',
  manager: 'amber',
  cashier: 'indigo',
  staff: 'slate',
}

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const config = useAppConfig()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const navigate = useNavigate()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-800">
      <div>
        <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">{config?.company?.name || config?.appName}</h1>
        <p className="text-xs text-slate-400 dark:text-slate-400">{config?.sector ? config.sector.replace(/^\w/, (c) => c.toUpperCase()) : 'ERP'}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4" />
        </button>

        {user && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 py-1.5 pl-1.5 pr-2 dark:border-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-semibold text-white">
              {user.name?.[0] || 'U'}
            </div>
            <div className="hidden text-sm sm:block">
              <p className="font-medium leading-none text-slate-700 dark:text-slate-100">{user.name}</p>
              <div className="mt-1">
                <Badge tone={ROLE_TONES[user.role] || 'slate'}>{user.role}</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              aria-label="Logout"
              className="ml-1"
            >
              <Icon name="logout" className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}