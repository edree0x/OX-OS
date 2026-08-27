import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listAll, updateEntity } from '../../services/entityService'
import { useAppConfig } from '../../hooks/useAppConfig'
import { Icon } from '../ui/Icon'
import DynamicForm from '../forms/DynamicForm'
import { Modal, Button, Spinner } from '../ui/primitives'
import { notify } from '../ui/Toast'

export default function KanbanBoard() {
  const config = useAppConfig()
  const entityId = config?.kanbanEntityId
  const entity = config?.entities.find((e) => e.id === entityId)
  const statusField = entity?.fields.find((f) => f.type === 'status-badge' || f.options)
  const statuses = statusField?.options || statusField?.statuses?.map((s) => s.value) || []
  const qc = useQueryClient()

  const { data = [], isLoading } = useQuery({
    queryKey: ['kanban', entityId],
    queryFn: () => (entityId ? listAll(entityId) : Promise.resolve([])),
    enabled: !!entityId,
  })

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateEntity(entityId!, id, { [statusField?.key || 'status']: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban', entityId] }),
  })

  const [adding, setAdding] = useState(false)
  const cols = useMemo(() => {
    const map: Record<string, Record<string, unknown>[]> = {}
    statuses.forEach((s) => (map[s] = data.filter((r) => r[statusField?.key || 'status'] === s)))
    return map
  }, [data, statuses, statusField])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">{entity?.name || 'Board'}</h2>
        {entity && (
          <Button onClick={() => setAdding(true)}>
            <Icon name="plus" className="h-4 w-4" />
            New
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {isLoading && (
          <div className="col-span-full flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        )}
        {statuses.map((s) => (
          <div
            key={s}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (id) move.mutate({ id, status: s })
            }}
            className="rounded-xl bg-slate-100 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{s}</span>
              <span className="text-xs text-slate-400">{cols[s]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(cols[s] || []).map((r) => (
                <div
                  key={r.id as string}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', r.id as string)}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm hover:border-indigo-400"
                >
                  <p className="font-medium text-slate-700">{String(r[entity?.fields[0]?.key || 'name'] ?? 'Item')}</p>
                  {entity?.fields[1] && <p className="text-xs text-slate-400">{String(r[entity.fields[1].key] ?? '')}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title={`New ${entity?.name || ''}`}>
        {entity && (
          <DynamicForm
            entity={entity}
            defaultValues={{ [statusField?.key || 'status']: statuses[0] }}
            submitLabel="Create"
            onSubmit={async (d) => {
              try {
                const { createEntity } = await import('../../services/entityService')
                await createEntity(entityId!, d)
                qc.invalidateQueries({ queryKey: ['kanban', entityId] })
                setAdding(false)
                notify('Card created', 'success')
              } catch {
                notify('Could not create card', 'error')
              }
            }}
          />
        )}
      </Modal>
    </div>
  )
}
