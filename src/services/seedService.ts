import type { AppConfig, EntitySchema, FieldSchema } from '../types'
import { listAll, createEntity } from './entityService'
import * as db from '../lib/db'

/** Default categories per sector id, used to seed the categories entity. */
const SECTOR_CATEGORIES: Record<string, string[]> = {
  supermarket: ['Grocery', 'Produce', 'Electronics', 'Beverages', 'Frozen', 'Dairy'],
  pharmacy: ['OTC', 'Prescription', 'Wellness', 'Baby Care'],
  restaurant: ['Starter', 'Main', 'Dessert', 'Drink', 'Combo'],
  salon: ['Hair', 'Skin', 'Nails', 'Massage', 'Grooming'],
  barbershop: ['Haircut', 'Shave', 'Coloring', 'Treatment'],
  grocery: ['Produce', 'Fresh', 'Packaged', 'Household', 'Bakery'],
  apparel: ['Tops', 'Bottoms', 'Footwear', 'Accessories'],
}

async function seedCategories(entity: EntitySchema, sectorId: string) {
  const existing = await listAll(entity.id)
  if (existing.length > 0) return
  const names = SECTOR_CATEGORIES[sectorId] || ['General']
  const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e']
  for (let i = 0; i < names.length; i++) {
    await createEntity(entity.id, {
      name: names[i],
      description: `${names[i]} category`,
      color: palette[i % palette.length],
      active: true,
    })
  }
}

function sampleValue(f: FieldSchema, i: number): unknown {
  switch (f.type) {
    case 'number':
    case 'timer':
      return Math.floor(Math.random() * 100) + 1
    case 'email':
      return `user${i}@example.com`
    case 'date':
    case 'datetime-local': {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return f.type === 'date' ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 16)
    }
    case 'time':
      return '12:00'
    case 'select':
      return f.options ? f.options[i % f.options.length] : 'Option'
    case 'checkbox':
      return i % 2 === 0
    case 'file-upload':
    case 'image-preview':
      return ''
    case 'variants':
      return JSON.stringify({ Size: 'M', Color: 'Red' })
    case 'status-badge':
      return f.options ? f.options[0] : 'Open'
    default:
      if (f.key === 'name') return `${f.label} ${i}`
      if (['customer', 'product', 'device', 'player', 'student', 'guest', 'patient'].includes(f.key))
        return `${f.label} ${i}`
      return `${f.label} ${i}`
  }
}

async function seedEntity(entity: EntitySchema) {
  const existing = await listAll(entity.id)
  if (existing.length > 0) return
  // Resolve referenced-entity options once (e.g. product -> category)
  const refCache = new Map<string, string[]>()
  for (const f of entity.fields) {
    if (f.type === 'select' && f.entityRef) {
      const rows = await listAll(f.entityRef)
      refCache.set(f.entityRef, rows.filter((r) => r.active !== false).map((r) => String(r.name ?? '')))
    }
  }
  for (let i = 1; i <= 8; i++) {
    const data: Record<string, unknown> = {}
    entity.fields.forEach((f) => {
      if (f.type === 'select' && f.entityRef) {
        const names = refCache.get(f.entityRef) || []
        data[f.key] = names.length ? names[i % names.length] : 'General'
        return
      }
      data[f.key] = sampleValue(f, i)
    })
    // ensure a price-like field for POS catalog
    if (entity.isPosCatalog && !entity.fields.find((f) => f.key === 'price')) {
      data.price = Math.floor(Math.random() * 20) + 2
    }
    await createEntity(entity.id, data)
  }
}

async function seedTables(count: number, label: string) {
  const existing = await db.dbGetAll('pos_tables')
  if (existing.length > 0) return
  for (let i = 1; i <= count; i++) {
    await db.dbPut('pos_tables', {
      id: `table-${i}`,
      number: i,
      label: `${label} ${i}`,
      status: 'free',
      sessionId: null,
    })
  }
}

export async function seedForConfig(config: AppConfig) {
  for (const e of config.entities) {
    if (e.id === 'categories') {
      await seedCategories(e, config.sector)
      continue
    }
    await seedEntity(e)
  }
  if (config.tableMap) {
    await seedTables(config.tableMap.count, config.tableMap.label)
  }
}
