import { useState } from 'react'
import { Icon } from '../ui/Icon'
import type { FieldSchema } from '../../types'

export default function FilterBar({
  fields,
  value,
  onChange,
}: {
  fields: FieldSchema[]
  value: { field: string; value: string } | null
  onChange: (v: { field: string; value: string } | null) => void
}) {
  const selectFields = fields.filter((f) => f.type === 'select' || f.type === 'status-badge')
  const [field, setField] = useState(value?.field || '')

  if (selectFields.length === 0) return null
  const active = selectFields.find((f) => f.key === field)

  return (
    <div className="flex items-center gap-2">
      <Icon name="filter" className="h-4 w-4 text-slate-400" />
      <select
        value={field}
        onChange={(e) => {
          const next = e.target.value
          setField(next)
          onChange(next ? { field: next, value: '' } : null)
        }}
        className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">All fields</option>
        {selectFields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
      {active && (
        <select
          value={value?.value || ''}
          onChange={(e) => onChange({ field, value: e.target.value })}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">Any</option>
          {active.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
