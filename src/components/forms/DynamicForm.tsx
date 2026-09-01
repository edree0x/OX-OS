import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buildZodSchema } from '../../lib/schema'
import { FieldRenderer } from './FieldRenderer'
import { Button } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import { notify } from '../ui/Toast'
import { useConfigStore } from '../../stores/configStore'
import { usePermissions } from '../../hooks/usePermissions'
import { CUSTOM_FIELD_TYPES, FIELD_TYPE_LABELS, fieldKey, isDuplicateKey } from '../../lib/field-editor'
import type { EntitySchema, FieldSchema, FieldType } from '../../types'

function VariantsField({ field, value, onChange }: { field: FieldSchema; value: string; onChange: (v: string) => void }) {
  const keys = field.variantKeys || ['Size', 'Color']
  const current = (() => {
    try {
      return JSON.parse(value || '{}')
    } catch {
      return {}
    }
  })()
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Variants</p>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((k) => (
          <input
            key={k}
            placeholder={k}
            defaultValue={current[k] || ''}
            onChange={(e) => onChange(JSON.stringify({ ...current, [k]: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        ))}
      </div>
    </div>
  )
}

function FileField({ field, value, onChange }: { field: FieldSchema; value: string; onChange: (v: string) => void }) {
  const isImage = field.type === 'image-preview'
  const [preview, setPreview] = useState(value || '')

  const handle = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept={isImage ? 'image/*' : '*'}
        onChange={(e) => handle(e.target.files?.[0])}
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-600"
      />
      {isImage && preview && <img src={preview} alt="preview" className="h-24 w-24 rounded-lg border object-cover" />}
      {!isImage && preview && <p className="text-xs text-slate-500">Attachment saved ({preview.slice(0, 24)}…)</p>}
    </div>
  )
}

export default function DynamicForm({
  entity,
  defaultValues = {},
  onSubmit,
  submitLabel = 'Save',
}: {
  entity: EntitySchema
  defaultValues?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void
  submitLabel?: string
}) {
  const schema = useMemo(() => buildZodSchema(entity.fields), [entity])
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema as never), defaultValues })

  const { can } = usePermissions()
  const updateEntity = useConfigStore((s) => s.updateEntity)
  const [addingField, setAddingField] = useState(false)
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('text')

  const addField = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const label = fieldLabel.trim()
    if (!label) return
    const key = fieldKey(label)
    if (isDuplicateKey(entity.fields, key)) {
      notify('A field with this name already exists', 'error')
      return
    }
    const field: FieldSchema = { key, label, type: fieldType }
    updateEntity({ ...entity, fields: [...entity.fields, field] })
    setAddingField(false)
    setFieldLabel('')
    setFieldType('text')
    notify(`Field "${label}" added — fill it below`, 'success')
  }

  const onValid = async (data: Record<string, unknown>) => {
    const cleaned = { ...data }
    entity.fields.forEach((f) => {
      if (f.type === 'checkbox') cleaned[f.key] = !!cleaned[f.key]
    })
    await onSubmit(cleaned)
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      {entity.fields.map((f) => {
        if (f.type === 'variants') {
          return (
            <div key={f.key} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{f.label}</label>
              <VariantsField field={f} value={(defaultValues[f.key] as string) || ''} onChange={(v) => setValue(f.key, v)} />
            </div>
          )
        }
        if (f.type === 'file-upload' || f.type === 'image-preview') {
          return (
            <div key={f.key} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{f.label}</label>
              <FileField field={f} value={(watch(f.key) as string) || (defaultValues[f.key] as string) || ''} onChange={(v) => setValue(f.key, v)} />
            </div>
          )
        }
        return (
          <div key={f.key} className={f.type === 'checkbox' ? 'flex items-center gap-2' : 'space-y-1'}>
            {f.type !== 'checkbox' && (
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
            )}
            <FieldRenderer field={f} error={errors[f.key] as { message?: string }} {...register(f.key)} />
            {f.type === 'checkbox' && <label className="text-sm text-slate-700 dark:text-slate-200">{f.label}</label>}
            {errors[f.key] && <p className="text-xs text-red-500">{(errors[f.key] as { message?: string }).message}</p>}
          </div>
        )
      })}

      {can('manageFields') &&
        (addingField ? (
          <div className="space-y-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/40 p-3 dark:border-indigo-700 dark:bg-indigo-950/30">
            <div className="flex gap-2">
              <input
                autoFocus
                value={fieldLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void addField()
                  }
                }}
                onChange={(e) => setFieldLabel(e.target.value)}
                placeholder="Field name, e.g. Phone number"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as FieldType)}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {CUSTOM_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddingField(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" disabled={!fieldLabel.trim()} onClick={() => void addField()}>
                Add
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingField(true)}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add field
          </button>
        ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            'Saving…'
          ) : (
            <>
              <Icon name="check" className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
