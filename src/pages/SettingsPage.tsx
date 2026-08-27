import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppConfig } from '../hooks/useAppConfig'
import { useConfigStore } from '../stores/configStore'
import { Card, Button } from '../components/ui/primitives'
import { notify } from '../components/ui/Toast'

export default function SettingsPage() {
  const config = useAppConfig()
  const updateConfig = useConfigStore((s) => s.updateConfig)
  const resetConfig = useConfigStore((s) => s.resetConfig)
  const navigate = useNavigate()
  const [appName, setAppName] = useState(config?.appName || '')
  const [currency, setCurrency] = useState(config?.currency || 'USD')
  const [tableMap, setTableMap] = useState(!!config?.tableMap)
  const [calendar, setCalendar] = useState(!!config?.calendarEntityId)
  const [kanban, setKanban] = useState(!!config?.kanbanEntityId)
  const [auth, setAuth] = useState(!!config?.features.auth)

  const entities = config?.entities ?? []
  const firstWithDate = entities.find((e) => e.fields.some((f) => f.type === 'date' || f.type === 'datetime-local'))?.id
  const firstEntity = entities[0]?.id

  const save = () => {
    if (!config) return
    updateConfig({
      appName,
      currency,
      tableMap: tableMap ? config.tableMap ?? { count: 12, label: 'Table' } : undefined,
      calendarEntityId: calendar ? config.calendarEntityId ?? firstWithDate : undefined,
      kanbanEntityId: kanban ? config.kanbanEntityId ?? firstEntity : undefined,
      features: { ...config.features, auth },
    })
    notify('Settings saved', 'success')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Settings</h2>
      <Card className="space-y-4 p-5">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">App name</label>
          <input value={appName} onChange={(e) => setAppName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Currency</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Floor / Table map', v: tableMap, set: setTableMap },
            { label: 'Calendar / booking', v: calendar, set: setCalendar },
            { label: 'Kanban board', v: kanban, set: setKanban },
            { label: 'Require login (auth)', v: auth, set: setAuth },
          ].map((f) => (
            <label key={f.label} className="flex items-center gap-2 rounded border border-slate-200 p-3">
              <input type="checkbox" checked={f.v} onChange={(e) => f.set(e.target.checked)} className="h-4 w-4" />
              {f.label}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>Save</Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Reset all data and re-run setup?')) {
                resetConfig()
                navigate('/setup')
              }
            }}
          >
            Reset everything
          </Button>
        </div>
      </Card>
    </div>
  )
}
