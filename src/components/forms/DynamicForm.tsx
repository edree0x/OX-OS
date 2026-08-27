import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buildZodSchema } from '../../lib/schema'
import { FieldRenderer } from './FieldRenderer'
import { Button } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import type { EntitySchema, FieldSchema } from '../../types'

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
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-500">Variants</p>
      <div className="grid grid-cols-2 gap-2">
        {keys.map((k) => (
          <input
            key={k}
            placeholder={k}
            defaultValue={current[k] || ''}
            onChange={(e) => onChange(JSON.stringify({ ...current, [k]: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              <label className="block text-sm font-medium text-slate-700">{f.label}</label>
              <VariantsField field={f} value={(defaultValues[f.key] as string) || ''} onChange={(v) => setValue(f.key, v)} />
            </div>
          )
        }
        if (f.type === 'file-upload' || f.type === 'image-preview') {
          return (
            <div key={f.key} className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">{f.label}</label>
              <FileField field={f} value={(watch(f.key) as string) || (defaultValues[f.key] as string) || ''} onChange={(v) => setValue(f.key, v)} />
            </div>
          )
        }
        return (
          <div key={f.key} className={f.type === 'checkbox' ? 'flex items-center gap-2' : 'space-y-1'}>
            {f.type !== 'checkbox' && (
              <label className="block text-sm font-medium text-slate-700">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
            )}
            <FieldRenderer field={f} error={errors[f.key] as { message?: string }} {...register(f.key)} />
            {f.type === 'checkbox' && <label className="text-sm text-slate-700">{f.label}</label>}
            {errors[f.key] && <p className="text-xs text-red-500">{(errors[f.key] as { message?: string }).message}</p>}
          </div>
        )
      })}

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
