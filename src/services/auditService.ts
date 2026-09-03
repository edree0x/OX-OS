import { indexDbDataSource as db } from '../lib/db'
import { uid } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'

export const AUDIT_COLLECTION = '__audit__'

export interface AuditEntry {
  id: string
  at: number
  actor: string
  action: 'create' | 'update' | 'delete' | 'login' | 'approve' | 'reject'
  collection: string
  recordId?: string
  summary?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

function currentActor(): string {
  try {
    return useAuthStore.getState().user?.name || useAuthStore.getState().user?.username || 'system'
  } catch {
    return 'system'
  }
}

export async function logAudit(
  entry: Omit<AuditEntry, 'id' | 'at' | 'actor'> & { actor?: string },
): Promise<AuditEntry> {
  const full: AuditEntry = {
    id: uid(),
    at: Date.now(),
    actor: entry.actor ?? currentActor(),
    ...entry,
  }
  await db.put(AUDIT_COLLECTION, full as unknown as Record<string, unknown>)
  return full
}

export async function listAudit(params: {
  collection?: string
  actor?: string
  action?: string
  from?: number
  to?: number
  limit?: number
} = {}): Promise<AuditEntry[]> {
  let rows = (await db.getAll(AUDIT_COLLECTION)) as unknown as AuditEntry[]
  if (params.collection) rows = rows.filter((e) => e.collection === params.collection)
  if (params.actor) rows = rows.filter((e) => e.actor === params.actor)
  if (params.action) rows = rows.filter((e) => e.action === params.action)
  if (params.from) rows = rows.filter((e) => e.at >= (params.from as number))
  if (params.to) rows = rows.filter((e) => e.at <= (params.to as number))
  rows.sort((a, b) => b.at - a.at)
  return params.limit ? rows.slice(0, params.limit) : rows
}

export async function logLogin(actor: string): Promise<void> {
  await logAudit({ actor, action: 'login', collection: 'auth', summary: 'Signed in' })
}
