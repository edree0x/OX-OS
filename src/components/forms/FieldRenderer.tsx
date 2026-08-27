import type { FieldSchema } from '../../types'

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
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  const tone = error ? 'border-red-400' : ''

  switch (field.type) {
    case 'textarea':
      return <textarea className={`${base} ${tone}`} rows={3} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
    case 'select':
    case 'status-badge':
      return (
        <select className={`${base} ${tone}`} {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
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
