import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppConfig } from '../hooks/useAppConfig'
import { useEntityList, useEntityMutations } from '../hooks/useEntity'
import SearchBar from '../components/data/SearchBar'
import FilterBar from '../components/data/FilterBar'
import Pagination from '../components/data/Pagination'
import DataTable from '../components/data/DataTable'
import DynamicForm from '../components/forms/DynamicForm'
import { Button, Modal, Card, Spinner } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { notify } from '../components/ui/Toast'
import { toCSV, downloadCSV } from '../lib/utils'

export default function EntityPage() {
  const { entityId = '' } = useParams()
  const config = useAppConfig()
  const entity = config?.entities.find((e) => e.id === entityId)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<{ field: string; value: string } | null>(null)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [creating, setCreating] = useState(false)

  const pageSize = 10
  const { data, isLoading } = useEntityList(entityId, {
    search: q || undefined,
    filter: filter || undefined,
    sortBy: sortBy || undefined,
    sortDir,
    page,
    pageSize,
  })
  const { create, update, remove } = useEntityMutations(entityId)

  if (!entity) return <p className="text-sm text-slate-400">Unknown entity.</p>

  const onSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const submit = async (vals: Record<string, unknown>) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id as string, data: vals })
        setEditing(null)
        notify('Record updated', 'success')
      } else {
        await create.mutateAsync(vals)
        setCreating(false)
        notify('Record created', 'success')
      }
    } catch {
      notify('Could not save record', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{entity.name}</h2>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Icon name="plus" className="h-4 w-4" />
          New {entity.name.replace(/s$/, '')}
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadCSV(`${entity.id}.csv`, toCSV(data?.rows || [], entity.fields))}
        >
          <Icon name="file" className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={q} onChange={setQ} />
        <FilterBar fields={entity.fields} value={filter} onChange={setFilter} />
      </div>

      <Card className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (data?.rows.length ?? 0) === 0 ? (
          <p className="p-4 text-sm text-slate-400">No records yet.</p>
        ) : (
          <DataTable
            entity={entity}
            rows={data?.rows || []}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            onEdit={(r) => setEditing(r)}
            onDelete={async (r) => {
              if (confirm('Delete this record?')) {
                try {
                  await remove.mutateAsync(r.id as string)
                  notify('Record deleted', 'success')
                } catch {
                  notify('Could not delete record', 'error')
                }
              }
            }}
          />
        )}
      </Card>

      <Pagination page={page} pageSize={pageSize} total={data?.total || 0} onChange={setPage} />

      <Modal open={creating} onClose={() => setCreating(false)} title={`New ${entity.name}`}>
        <DynamicForm entity={entity} submitLabel="Create" onSubmit={submit} />
      </Modal>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`Edit ${entity.name}`}>
        {editing && <DynamicForm entity={entity} defaultValues={editing} submitLabel="Update" onSubmit={submit} />}
      </Modal>
    </div>
  )
}
