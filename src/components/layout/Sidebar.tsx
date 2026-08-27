import { NavLink } from 'react-router-dom'
import { useModules } from '../../hooks/useModules'
import { usePermissions } from '../../hooks/usePermissions'
import { useAppConfig } from '../../hooks/useAppConfig'
import { Icon } from '../ui/Icon'

export default function Sidebar() {
  const modules = useModules()
  const { can } = usePermissions()
  const config = useAppConfig()
  const visible = modules.filter((m) => can(m.permission))

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          ERP
        </div>
        <span className="truncate text-lg font-semibold text-slate-800">{config?.appName}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visible.map((m) => (
          <NavLink
            key={m.id}
            to={m.path}
            end={m.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon name={m.icon} className="h-5 w-5" />
            {m.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 text-xs text-slate-400">Sector: {config?.sector}</div>
    </aside>
  )
}
