import { describe, it, expect } from 'vitest'
import { buildZodSchema } from '../lib/schema'
import type { FieldSchema } from '../types'

describe('buildZodSchema', () => {
  it('validates a required text field', () => {
    const fields: FieldSchema[] = [{ key: 'name', label: 'Name', type: 'text', required: true }]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ name: 'A' }).success).toBe(true)
    expect(schema.safeParse({ name: '' }).success).toBe(false)
  })

  it('validates number and email', () => {
    const fields: FieldSchema[] = [
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ age: 5, email: 'a@b.com' }).success).toBe(true)
    expect(schema.safeParse({ age: 'x', email: 'bad' }).success).toBe(false)
  })

  it('validates select options', () => {
    const fields: FieldSchema[] = [{ key: 'status', label: 'Status', type: 'select', options: ['new', 'done'], required: true }]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ status: 'new' }).success).toBe(true)
    expect(schema.safeParse({ status: 'nope' }).success).toBe(false)
  })

  it('treats variants as object passthrough', () => {
    const fields: FieldSchema[] = [{ key: 'variants', label: 'Variants', type: 'variants', variantKeys: ['Size'] }]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ variants: '{"Size":"L"}' }).success).toBe(true)
  })

  it('allows optional fields to be missing', () => {
    const fields: FieldSchema[] = [{ key: 'note', label: 'Note', type: 'textarea' }]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({}).success).toBe(true)
  })
})
