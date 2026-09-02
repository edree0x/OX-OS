import { indexDbDataSource as db } from '../lib/db'
import { slug } from '../lib/utils'
import type { AppConfig, EntitySchema, FieldSchema, FieldType } from '../types'

/** Field types a user may add/adjust at runtime. */
export const CUSTOM_FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'email',
  'date',
  'time',
  'select',
  'checkbox',
]

export const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  textarea: 'Paragraph',
  number: 'Number',
  email: 'Email',
  date: 'Date',
  time: 'Time',
  select: 'Dropdown',
  checkbox: 'Yes / No',
}

/** keys that drive special views — never deletable/renamable once bound to that purpose */
export function protectedKeysFor(config: AppConfig | null, entityId: string): string[] {
  const keys = new Set<string>()
  if (config?.posEntityId === entityId) {
    keys.add('name')
    keys.add('price')
    keys.add('stock')
    keys.add('sku')
  }
  if (config?.calendarEntityId === entityId) {
    const dateField = config.entities
      .find((e) => e.id === entityId)
      ?.fields.find((f) => f.type === 'date' || f.type === 'datetime-local')
    if (dateField) keys.add(dateField.key)
  }
  if (config?.kanbanEntityId === entityId) {
    const statusField = config.entities
      .find((e) => e.id === entityId)
      ?.fields.find((f) => f.type === 'status-badge' || f.options || f.statuses || f.entityRef)
    if (statusField) keys.add(statusField.key)
  }
  return [...keys]
}

export function fieldKey(label: string): string {
  return slug(label) || 'field-' + Date.now()
}

export function isDuplicateKey(fields: FieldSchema[], key: string, ignore?: string): boolean {
  return fields.some((f) => f.key === key && f.key !== ignore)
}

/** Reads every record of an entity and rewrites the given key while saving. */
export async function migrateFieldData(entityId: string, oldKey: string, newKey: string): Promise<number> {
  const rows = await db.getAll(entityId)
  let moved = 0
  await Promise.all(
    rows.map(async (r) => {
      if (newKey in r) return
      const next = { ...r }
      if (oldKey in next) {
        next[newKey] = next[oldKey]
        delete next[oldKey]
        moved += 1
      }
      await db.put(entityId, next)
    }),
  )
  return moved
}

/** Removes a field's value from every record of the entity. Returns count of touched rows. */
export async function purgeFieldData(entityId: string, key: string): Promise<number> {
  const rows = await db.getAll(entityId)
  let cleaned = 0
  await Promise.all(
    rows.map(async (r) => {
      if (!(key in r)) return
      const next = { ...r }
      delete next[key]
      cleaned += 1
      await db.put(entityId, next)
    }),
  )
  return cleaned
}