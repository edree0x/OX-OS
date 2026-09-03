import { indexDbDataSource as db } from '../lib/db'
import { uid } from '../lib/utils'
import { logAudit } from './auditService'

export interface ListParams {
  search?: string
  sortBy?: string | null
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  filter?: { field: string; value: string } | null
}

export async function listEntities(entityId: string, params: ListParams = {}) {
  const { search = '', sortBy, sortDir = 'asc', page = 1, pageSize = 10, filter } = params
  let rows = await db.getAll(entityId)

  if (filter && filter.field) {
    rows = rows.filter((r) => String(r[filter.field] ?? '') === String(filter.value))
  }

  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)))
  }

  if (sortBy) {
    rows = rows.slice().sort((a, b) => {
      const av = a[sortBy] ?? ''
      const bv = b[sortBy] ?? ''
      const an = Number(av)
      const bn = Number(bv)
      let cmp: number
      if (!isNaN(an) && !isNaN(bn) && av !== '' && bv !== '') cmp = an - bn
      else cmp = String(av).localeCompare(String(bv))
      return sortDir === 'desc' ? -cmp : cmp
    })
  }

  const total = rows.length
  const start = (page - 1) * pageSize
  const paged = rows.slice(start, start + pageSize)
  return { rows, total, page, pageSize }
}

export async function getEntity(entityId: string, id: string) {
  return db.get(entityId, id)
}

export async function createEntity(entityId: string, data: Record<string, unknown>) {
  const record = { ...data, id: uid(), createdAt: Date.now() }
  await db.put(entityId, record)
  await logAudit({ action: 'create', collection: entityId, recordId: record.id, after: record })
  return record
}

export async function updateEntity(entityId: string, id: string, data: Record<string, unknown>) {
  const before = await db.get(entityId, id)
  const record = { ...data, id, updatedAt: Date.now() }
  await db.put(entityId, record)
  await logAudit({
    action: 'update',
    collection: entityId,
    recordId: id,
    before: (before ?? undefined) as Record<string, unknown> | undefined,
    after: record,
  })
  return record
}

export async function deleteEntity(entityId: string, id: string) {
  await db.delete(entityId, id)
  await logAudit({ action: 'delete', collection: entityId, recordId: id })
}

export async function listAll(entityId: string): Promise<Record<string, unknown>[]> {
  return db.getAll(entityId)
}
