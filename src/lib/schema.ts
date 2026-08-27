import { z } from 'zod'
import type { FieldSchema } from '../types'

export function buildZodSchema(fields: FieldSchema[]): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {}
  fields.forEach((f) => {
    if (f.type === 'checkbox') {
      shape[f.key] = z.boolean().optional()
      return
    }
    if (f.type === 'number' || f.type === 'timer') {
      let s = z.coerce.number({ invalid_type_error: 'Must be a number' })
      shape[f.key] = f.required ? s.min(0, `${f.label} is required`) : s.optional()
      return
    }
    if (f.type === 'email') {
      const s = z.string()
      if (f.required) shape[f.key] = s.min(1, `${f.label} is required`).email('Enter a valid email')
      else shape[f.key] = s.email('Enter a valid email').optional().or(z.literal(''))
      return
    }
    if ((f.type === 'select' || f.type === 'status-badge') && f.options && f.options.length > 0) {
      const opts = f.options
      const valid = (v: string) => v === '' || opts.includes(v)
      const base = z.string().refine(valid, { message: `Select a valid ${f.label.toLowerCase()}` })
      if (f.required) shape[f.key] = base.refine((v) => v !== '', { message: `${f.label} is required` })
      else shape[f.key] = base.optional().or(z.literal(''))
      return
    }
    // text, textarea, select, date, datetime-local, time, variants, status-badge, file-upload, image-preview
    if (f.required) shape[f.key] = z.string().min(1, `${f.label} is required`)
    else shape[f.key] = z.string().optional().or(z.literal(''))
  })
  return z.object(shape)
}
