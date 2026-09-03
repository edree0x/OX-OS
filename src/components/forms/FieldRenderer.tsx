import { useQuery } from '@tanstack/react-query'
import { listAll } from '../../services/entityService'
import { type FieldSchema } from '../../types'
import { Spinner } from '../ui/primitives'

function EntitySelect({ field, ...rest }: { field: FieldSchema } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { data, isLoading } = useQuery({
    queryKey: ['entity-options', field.entityRef],
    queryFn: () => (field.entityRef ? listAll(field.entityRef) : Promise.resolve([])),
    enabled: !!field.entityRef,
  })
  const options = (data || [])
    .filter((r) => r.active !== false)
    .map((r) => String(r.name ?? r.label ?? valueOf(r)))
    .filter(Boolean)

  const base = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-[var(--brand-primary)] dark:focus:ring-[var(--brand-primary-soft)]'

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
        <Spinner className="h-4 w-4" />
        Loading…
      </div>
    )
  }
  return (
    <select className={base} {...rest}>
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function valueOf(r: Record<string, unknown>) {
  return Object.values(r).find((v) => typeof v === 'string' && v.trim() !== '') ?? ''
}

export function FieldRenderer({
  field,
  error,
  ...rest
}: {
  field: FieldSchema
  error?: { message?: string }
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.SelectHTMLAttributes<HTMLSelectElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-[var(--brand-primary)] dark:focus:ring-[var(--brand-primary-soft)]'
  const tone = error ? 'border-red-400' : ''

  switch (field.type) {
    case 'textarea':
      return <textarea className={`${base} ${tone}`} rows={3} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
    case 'select':
    case 'status-badge':
      if (field.type === 'select' && field.entityRef) {
        return <EntitySelect field={field} {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)} />
      }
      if (!field.options || field.options.length === 0) {
        // no known choices yet — fall back to free text so the record can still be saved
        return <input type="text" placeholder={field.placeholder ?? 'Type any value'} className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      }
      return (
        <select className={`${base} ${tone}`} {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          <option value="">Select…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )
    case 'checkbox':
      return <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    case 'number':
    case 'timer':
      return <input type="number" step="any" className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    case 'date':
      return <input type="date" className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    case 'datetime-local':
      return <input type="datetime-local" className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    case 'time':
      return <input type="time" className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    case 'email':
      return <input type="email" className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    default:
      return <input type="text" className={`${base} ${tone}`} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
  }
}