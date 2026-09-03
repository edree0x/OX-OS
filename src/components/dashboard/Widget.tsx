import { Card, Badge } from '../ui/primitives'
import type { WidgetConfig, EntitySchema } from '../../types'

export function BarChart({ data, height = 128 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (data.length === 0) return <p className="text-xs text-slate-400">No data</p>
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded bg-[var(--brand-primary)]"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="w-full truncate text-center text-[10px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function display(r: Record<string, unknown>, fields: EntitySchema['fields']) {
  if (!fields || fields.length === 0) return String(r.id)
  const primary = fields[0]
  const secondary = fields[1]
  return (
    <span className="text-slate-700 dark:text-slate-200">
      {String(r[primary.key] ?? '—')}
      {secondary && <span className="ml-2 text-xs text-slate-400">{String(r[secondary.key] ?? '')}</span>}
    </span>
  )
}

function StatsWidget({ widget }: { widget: WidgetConfig & { data: number | Record<string, unknown>[] } }) {
  const v = widget.data as number
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{widget.title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-800 dark:text-slate-100">{typeof v === 'number' ? v.toLocaleString() : v}</p>
    </Card>
  )
}

function AlertWidget({ widget }: { widget: WidgetConfig & { data: number } }) {
  const v = widget.data as number
  const tone = v > 0 ? 'red' : 'green'
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{widget.title}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${tone === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' : 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300'}`}>
          {v}
        </span>
      </div>
    </Card>
  )
}

function ChartWidget({ widget }: { widget: WidgetConfig & { data: { label: string; value: number }[] } }) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">{widget.title}</p>
      <BarChart data={widget.data || []} />
    </Card>
  )
}

function ListWidget({ widget }: { widget: WidgetConfig & { data: Record<string, unknown>[]; fields?: EntitySchema['fields'] } }) {
  const rows = widget.data || []
  const fields = widget.fields || []
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">{widget.title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">No records</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id as string} className="flex items-center justify-between text-sm">
              {display(r, fields)}
              <span className="text-xs text-slate-400">
                {r.createdAt ? new Date(Number(r.createdAt)).toLocaleDateString() : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function TableWidget({ widget }: { widget: WidgetConfig & { data: Record<string, unknown>[]; fields?: EntitySchema['fields'] } }) {
  const rows = widget.data || []
  const fields = widget.fields || []
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">{widget.title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">No records</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 dark:border-slate-700 dark:text-slate-500">
              {fields.slice(0, 3).map((f) => (
                <th key={f.key} className="px-2 py-1">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id as string} className="border-b border-slate-100 dark:border-slate-700/60">
                {fields.slice(0, 3).map((f) => (
                  <td key={f.key} className="px-2 py-1 text-slate-600 dark:text-slate-300">
                    {f.type === 'select' ? <Badge>{String(r[f.key] ?? '')}</Badge> : String(r[f.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

export default function Widget({ widget }: { widget: WidgetConfig & { data: unknown; fields?: EntitySchema['fields'] } }) {
  switch (widget.kind) {
    case 'stats':
      return <StatsWidget widget={widget as WidgetConfig & { data: number }} />
    case 'alert':
      return <AlertWidget widget={widget as WidgetConfig & { data: number }} />
    case 'chart':
      return <ChartWidget widget={widget as WidgetConfig & { data: { label: string; value: number }[] }} />
    case 'list':
      return <ListWidget widget={widget as WidgetConfig & { data: Record<string, unknown>[]; fields?: EntitySchema['fields'] }} />
    case 'table':
      return <TableWidget widget={widget as WidgetConfig & { data: Record<string, unknown>[]; fields?: EntitySchema['fields'] }} />
    default:
      return null
  }
}

