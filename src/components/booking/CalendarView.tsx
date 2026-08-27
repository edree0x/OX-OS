import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listAll, createEntity, updateEntity } from '../../services/entityService'
import { useAppConfig } from '../../hooks/useAppConfig'
import { Icon } from '../ui/Icon'
import DynamicForm from '../forms/DynamicForm'
import { Modal, Button, Spinner } from '../ui/primitives'
import { notify } from '../ui/Toast'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7
  const out = new Date(d)
  out.setDate(d.getDate() - day)
  out.setHours(0, 0, 0, 0)
  return out
}

export default function CalendarView() {
  const config = useAppConfig()
  const entityId = config?.calendarEntityId
  const entity = config?.entities.find((e) => e.id === entityId)
  const dateField = entity?.fields.find((f) => f.type === 'date' || f.type === 'datetime-local')?.key || 'date'
  const qc = useQueryClient()
  const weekStart = startOfWeek(new Date())

  const { data = [], isLoading } = useQuery({
    queryKey: ['calendar', entityId],
    queryFn: () => (entityId ? listAll(entityId) : Promise.resolve([])),
    enabled: !!entityId,
  })

  const [day, setDay] = useState<number | null>(null)
  const create = useMutation({
    mutationFn: (d: Record<string, unknown>) => createEntity(entityId!, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar', entityId] }),
  })

  const byDay = (offset: number) => {
    const target = new Date(weekStart)
    target.setDate(weekStart.getDate() + offset)
    const key = target.toISOString().slice(0, 10)
    return data.filter((r) => String(r[dateField] || '').startsWith(key))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">{entity?.name || 'Schedule'}</h2>
        <p className="text-sm text-slate-400">Week of {weekStart.toLocaleDateString()}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-7">
        {isLoading && (
          <div className="col-span-full flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        )}
        {DAYS.map((d, i) => (
          <div key={d} className="min-h-40 rounded-xl border border-slate-200 bg-white p-2">
            <div className="mb-2 text-center text-sm font-semibold text-slate-600">{d}</div>
            <div className="space-y-1">
              {byDay(i).map((r) => (
                <div key={r.id as string} className="flex items-center justify-between rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                  <span className="truncate">{String(r[entity?.fields[0]?.key || 'name'] ?? 'Booking')}</span>
                  <span>{String(r[dateField] || '').slice(11, 16)}</span>
                </div>
              ))}
            </div>
            <button
              className="mt-1 w-full rounded text-xs text-slate-400 hover:bg-slate-50"
              onClick={() => setDay(i)}
            >
              <Icon name="plus" className="mx-auto h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={day !== null} onClose={() => setDay(null)} title={`New ${entity?.name || ''}`}>
        {entity && day !== null && (
          <DynamicForm
            entity={entity}
            defaultValues={{ [dateField]: new Date(weekStart.getTime() + day * 86400000).toISOString().slice(0, 10) }}
            submitLabel="Book"
            onSubmit={async (vals) => {
              try {
                await create.mutateAsync(vals)
                setDay(null)
                notify('Booking created', 'success')
              } catch {
                notify('Could not create booking', 'error')
              }
            }}
          />
        )}
      </Modal>
    </div>
  )
}
