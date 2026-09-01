import { NavLink } from 'react-router-dom'
import { useModules } from '../../hooks/useModules'
import { usePermissions } from '../../hooks/usePermissions'
import { useAppConfig } from '../../hooks/useAppConfig'
import { Icon } from '../ui/Icon'
import type { ModuleDef } from '../../types'

function groupOf(m: ModuleDef): 'main' | 'management' | 'system' {
  if (m.id === 'dashboard' || m.id === 'pos' || m.id === 'tablemap' || m.id === 'calendar' || m.id === 'kanban') return 'main'
  if (m.kind === 'entity' || m.id === 'reports') return 'management'
  return 'system'
}

const GROUP_LABELS: Record<string, string> = {
  main: 'Main',
  management: 'Data & Reports',
  system: 'System',
}

export default function Sidebar() {
  const modules = useModules()
  const { can } = usePermissions()
  const config = useAppConfig()
  const visible = modules.filter((m) => can(m.permission))
  const groups: { label: string; items: ModuleDef[] }[] = (['main', 'management', 'system'] as const)
    .map((g) => ({ label: GROUP_LABELS[g], items: visible.filter((m) => groupOf(m) === g) }))
    .filter((g) => g.items.length > 0)

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6 dark:border-slate-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">E</div>
        <span className="truncate text-lg font-semibold text-slate-800 dark:text-slate-100">{config?.appName}</span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{g.label}</p>
            <div className="space-y-1">
              {g.items.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.path}
                  end={m.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <Icon name={m.icon} className="h-5 w-5" />
                  <span className="truncate">{m.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 text-xs text-slate-400 capitalize dark:border-slate-700 dark:text-slate-500">Sector: {config?.sector}</div>
    </aside>
  )
}