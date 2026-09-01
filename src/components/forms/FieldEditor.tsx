import { useState } from 'react'
import { Modal, Button, Badge } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import { notify } from '../ui/Toast'
import type { AppConfig, EntitySchema, FieldSchema, FieldType } from '../../types'
import {
  CUSTOM_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  fieldKey,
  isDuplicateKey,
  migrateFieldData,
  protectedKeysFor,
  purgeFieldData,
} from '../../lib/field-editor'

/** id = original key ('' for a brand-new field); key may change on save to trigger a data migration */
type Draft = { id: string; label: string; key: string; type: FieldType; required: boolean; options: string }

const emptyDraft = (): Draft => ({ id: '', label: '', key: '', type: 'text', required: false, options: '' })
const draftFor = (f: FieldSchema): Draft => ({
  id: f.key,
  label: f.label,
  key: f.key,
  type: f.type,
  required: !!f.required,
  options: (f.options ?? []).join(', '),
})

const TYPE_TONES: Record<string, 'slate' | 'green' | 'red' | 'indigo' | 'amber'> = {
  text: 'slate',
  textarea: 'slate',
  number: 'indigo',
  email: 'indigo',
  date: 'green',
  time: 'green',
  select: 'amber',
  checkbox: 'slate',
}

function draftToField(d: Draft): FieldSchema {
  return {
    key: d.key.trim(),
    label: d.label.trim() || d.key.trim(),
    type: d.type,
    required: d.required,
    ...(d.type === 'select' ? { options: d.options.split(',').map((o) => o.trim()).filter(Boolean) } : {}),
  }
}

export default function FieldEditor({
  entity,
  config,
  open,
  onClose,
  onSave,
}: {
  entity: EntitySchema
  config: AppConfig | null
  open: boolean
  onClose: () => void
  onSave: (e: EntitySchema) => void
}) {
  const protectedKeys = protectedKeysFor(config, entity.id)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const commit = async (next: FieldSchema[]) => {
    setSaving(true)
    try {
      await onSave({ ...entity, fields: next })
      setDraft(null)
    } finally {
      setSaving(false)
    }
  }

  const upsertField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft) return
    const field = draftToField(draft)
    const isEdit = !!draft.id
    if (!isEdit && isDuplicateKey(entity.fields, field.key)) {
      notify('A field with this key already exists', 'error')
      return
    }
    if (isEdit) {
      if (isDuplicateKey(entity.fields, field.key, draft.id)) {
        notify('A field with this key already exists', 'error')
        return
      }
      if (protectedKeys.includes(draft.id) && field.key !== draft.id) {
        notify('This field is locked — its key cannot change', 'error')
        return
      }
    }

    let moved = 0
    if (isEdit && field.key !== draft.id) {
      moved = await migrateFieldData(entity.id, draft.id, field.key)
    }

    const next = isEdit
      ? entity.fields.map((f) => (f.key === draft.id ? field : f))
      : [...entity.fields, field]
    await commit(next)
    notify(
      isEdit
        ? moved > 0
          ? `Renamed field — values moved on ${moved} records`
          : 'Field updated'
        : `Field "${field.label}" added`,
      'success',
    )
  }

  const removeField = async (f: FieldSchema) => {
    if (protectedKeys.includes(f.key)) {
      notify('This field is used by a special view and cannot be deleted here', 'error')
      return
    }
    if (entity.fields.length <= 1) {
      notify('An entity needs at least one field', 'error')
      return
    }
    if (!confirm(`Delete "${f.label}"? This also removes its saved values from all records.`)) return
    const cleaned = await purgeFieldData(entity.id, f.key)
    await commit(entity.fields.filter((x) => x.key !== f.key))
    notify(`Field deleted${cleaned > 0 ? ` (removed from ${cleaned} records)` : ''}`, 'success')
  }

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= entity.fields.length) return
    const next = [...entity.fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    await commit(next)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Fields · ${entity.name}`} size="lg">
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex border-b border-slate-200 px-3 py-2 text-xs font-medium uppercase text-slate-400 dark:border-slate-700">
            <span className="flex-1">Field</span>
            <span className="w-24">Type</span>
            <span className="w-16">Required</span>
            <span className="w-28 text-right">Actions</span>
          </div>
          {entity.fields.map((f, i) => (
            <div key={f.key} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0 dark:border-slate-700/60">
              <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
                {f.label}
                {protectedKeys.includes(f.key) && <Badge tone="indigo">locked</Badge>}
              </span>
              <Badge tone={TYPE_TONES[f.type] ?? 'slate'}>{FIELD_TYPE_LABELS[f.type] ?? f.type}</Badge>
              <span className="w-16">{f.required ? <Icon name="check" className="h-4 w-4 text-green-600" /> : '—'}</span>
              <div className="flex w-28 justify-end gap-0.5">
                <button onClick={() => move(i, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30" aria-label="Move up" disabled={i === 0}>
                  <Icon name="up" className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30" aria-label="Move down" disabled={i === entity.fields.length - 1}>
                  <Icon name="down" className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDraft(draftFor(f))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label={`Edit ${f.label}`}
                  disabled={protectedKeys.includes(f.key)}
                >
                  <Icon name="edit" className="h-4 w-4" />
                </button>
                <button onClick={() => removeField(f)} className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-40" aria-label={`Delete ${f.label}`} disabled={protectedKeys.includes(f.key)}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {draft ? (
          <form onSubmit={upsertField} className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{draft.id ? 'Edit field' : 'Add field'}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Label</label>
                <input
                  autoFocus
                  value={draft.label}
                  onChange={(e) => {
                    const label = e.target.value
                    setDraft({ ...draft, label, key: draft.id || fieldKey(label) })
                  }}
                  placeholder="e.g. Phone number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Type</label>
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value as FieldType })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {CUSTOM_FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Key {draft.id && '(rename moves existing values)'}</label>
              <input
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            {draft.type === 'select' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Options (comma separated)</label>
                <input
                  value={draft.options}
                  onChange={(e) => setDraft({ ...draft, options: e.target.value })}
                  placeholder="e.g. Prepaid, Postpaid"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} className="h-4 w-4" />
              Required (enforced on new/edit forms)
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDraft(null)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !draft.label.trim() || !draft.key.trim()}>
                {saving ? 'Saving…' : draft.id ? 'Save field' : 'Add field'}
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setDraft(emptyDraft())}>
            <Icon name="plus" className="h-4 w-4" />
            Add field
          </Button>
        )}
      </div>
    </Modal>
  )
}