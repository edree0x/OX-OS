import { Icon } from '../ui/Icon'
import { Badge } from '../ui/primitives'
import type { EntitySchema, FieldSchema } from '../../types'

function Cell({ field, value }: { field: FieldSchema; value: unknown }) {
  if (field.type === 'checkbox') {
    return <Icon name={value ? 'check' : 'x'} className={`h-4 w-4 ${value ? 'text-green-600' : 'text-slate-300 dark:text-slate-600'}`} />
  }
  if (field.type === 'status-badge') {
    const tone = field.statuses?.find((s) => s.value === value)?.tone || 'slate'
    const label = field.statuses?.find((s) => s.value === value)?.label || String(value || '')
    return <Badge tone={tone as 'slate' | 'green' | 'red' | 'indigo' | 'amber'}>{label}</Badge>
  }
  if (field.type === 'select') return <Badge>{String(value ?? '')}</Badge>
  if (field.type === 'variants') {
    try {
      const obj = JSON.parse(String(value || '{}'))
      return <span className="text-slate-600 dark:text-slate-300">{Object.values(obj).join(' / ') || '—'}</span>
    } catch {
      return <span className="text-slate-600 dark:text-slate-300">{String(value || '')}</span>
    }
  }
  if (field.type === 'image-preview' && value) {
    return <img src={String(value)} alt="" className="h-8 w-8 rounded border object-cover" />
  }
  if (field.type === 'file-upload' && value) return <span className="text-xs text-indigo-600">attached</span>
  return <span className="text-slate-600 dark:text-slate-300">{String(value ?? '')}</span>
}

export default function DataTable({
  entity,
  rows,
  onEdit,
  onDelete,
  sortBy,
  sortDir,
  onSort,
  workflow,
}: {
  entity: EntitySchema
  rows: Record<string, unknown>[]
  onEdit: (r: Record<string, unknown>) => void
  onDelete: (r: Record<string, unknown>) => void
  sortBy: string | null
  sortDir: 'asc' | 'desc'
  onSort: (key: string) => void
  workflow?: (r: Record<string, unknown>) => React.ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-700 dark:text-slate-500">
            {entity.fields.map((f) => (
              <th key={f.key} className="px-3 py-2">
                <button className="inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => onSort(f.key)}>
                  {f.label}
                  {sortBy === f.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </button>
              </th>
            ))}
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as string} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/30">
              {entity.fields.map((f) => (
                <td key={f.key} className="px-3 py-2">
                  <Cell field={f} value={r[f.key]} />
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  {workflow && workflow(r)}
                  <button onClick={() => onEdit(r)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700" aria-label="Edit">
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(r)} className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15" aria-label="Delete">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
