import * as db from '../lib/db'

export interface TableState {
  id: string
  number: number
  label: string
  status: 'free' | 'occupied' | 'reserved'
  sessionId: string | null
}

export async function listTables(): Promise<TableState[]> {
  const rows = (await db.dbGetAll('pos_tables')) as unknown as TableState[]
  return rows.sort((a, b) => a.number - b.number)
}

export async function updateTable(id: string, patch: Partial<TableState>): Promise<TableState> {
  const existing = (await db.dbGet('pos_tables', id)) as unknown as TableState | null
  const next: TableState = { ...(existing ?? ({} as TableState)), ...patch, id }
  await db.dbPut('pos_tables', next as unknown as Record<string, unknown>)
  return next
}

export async function resetTables(): Promise<void> {
  const rows = await listTables()
  for (const t of rows) {
    await updateTable(t.id, { status: 'free', sessionId: null })
  }
}
