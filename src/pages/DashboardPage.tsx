import { useDashboardWidgets } from '../hooks/useDashboard'
import { useAppConfig } from '../hooks/useAppConfig'
import { useModules } from '../hooks/useModules'
import { usePermissions } from '../hooks/usePermissions'
import Widget from '../components/dashboard/Widget'
import { Icon } from '../components/ui/Icon'
import { Card, Spinner } from '../components/ui/primitives'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { widgets, isLoading } = useDashboardWidgets()
  const config = useAppConfig()
  const modules = useModules()
  const { can } = usePermissions()

  const quick = modules.filter((m) => can(m.permission) && m.path.startsWith('/entity')).slice(0, 6)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Welcome back</h2>
        <p className="text-sm text-slate-400">{config?.appName} · {config?.sector}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <Widget key={w.id} widget={w as never} />
          ))}
        </div>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-medium text-slate-700">Quick access</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {quick.map((m) => (
            <Link key={m.id} to={m.path} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <Icon name={m.icon} className="h-4 w-4 text-indigo-500" />
              {m.name}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
