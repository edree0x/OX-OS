import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppConfig } from '../hooks/useAppConfig'
import { useConfigStore } from '../stores/configStore'
import { Card, Button, Modal, Badge, EmptyState } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { notify } from '../components/ui/Toast'
import FieldEditor from '../components/forms/FieldEditor'
import { customEntity } from '../config/presets'
import { slug } from '../lib/utils'
import type { EntitySchema } from '../types'

const SECTOR_OPTIONS = ['USD', 'EGP', 'SAR', 'AED', 'EUR', 'GBP']

export default function SettingsPage() {
  const config = useAppConfig()
  const updateConfig = useConfigStore((s) => s.updateConfig)
  const resetConfig = useConfigStore((s) => s.resetConfig)
  const addEntity = useConfigStore((s) => s.addEntity)
  const removeEntity = useConfigStore((s) => s.removeEntity)
  const updateEntity = useConfigStore((s) => s.updateEntity)
  const navigate = useNavigate()
  const [appName, setAppName] = useState(config?.appName || '')
  const [currency, setCurrency] = useState(config?.currency || 'USD')
  const [tableMap, setTableMap] = useState(!!config?.tableMap)
  const [calendar, setCalendar] = useState(!!config?.calendarEntityId)
  const [kanban, setKanban] = useState(!!config?.kanbanEntityId)
  const [auth, setAuth] = useState(!!config?.features.auth)
  const [entityName, setEntityName] = useState('')
  const [entityModal, setEntityModal] = useState(false)
  const [fieldEntity, setFieldEntity] = useState<EntitySchema | null>(null)

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

  const addCustom = () => {
    const name = entityName.trim()
    if (!name) return
    const existing = entities.some((e) => e.id === slug(name))
    if (existing) {
      notify('An entity with this name already exists', 'error')
      return
    }
    addEntity(customEntity(name))
    setEntityName('')
    setEntityModal(false)
    notify('Entity created — add fields to get started', 'success')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Settings</h2>

      <Card className="space-y-4 p-5">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">App name</label>
          <input
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {SECTOR_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Floor / Table map', v: tableMap, set: setTableMap },
            { label: 'Calendar / booking', v: calendar, set: setCalendar },
            { label: 'Kanban board', v: kanban, set: setKanban },
            { label: 'Require login (auth)', v: auth, set: setAuth },
          ].map((f) => (
            <label
              key={f.label}
              className="flex items-center gap-2 rounded border border-slate-200 p-3 dark:border-slate-700"
            >
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

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Entities & modules</h3>
            <p className="text-xs text-slate-400">Each entity appears as its own page in the sidebar.</p>
          </div>
          <Button size="sm" onClick={() => setEntityModal(true)}>
            <Icon name="plus" className="h-4 w-4" />
            New entity
          </Button>
        </div>
        {entities.length === 0 ? (
          <EmptyState title="No entities" description="Add your first custom entity to start managing data." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {entities.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    <Icon name={e.icon} className="h-4 w-4 text-indigo-500" />
                    {e.pluralName}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {e.fields.length} fields
                    {e.isPosCatalog && <Badge tone="indigo">POS</Badge>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFieldEntity(e)}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    aria-label={`Edit fields of ${e.name}`}
                    title="Edit fields"
                  >
                    <Icon name="settings" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeEntity(e.id)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15"
                    aria-label={`Remove ${e.name}`}
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={entityModal} onClose={() => setEntityModal(false)} title="New entity">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addCustom()
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Entity name</label>
            <input
              autoFocus
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g. Appointments"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEntityModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!entityName.trim()}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {fieldEntity && config && (
        <FieldEditor
          entity={fieldEntity}
          config={config}
          open={fieldEntity !== null}
          onClose={() => setFieldEntity(null)}
          onSave={(e) => {
            updateEntity(e)
            setFieldEntity(null)
          }}
        />
      )}
    </div>
  )
}