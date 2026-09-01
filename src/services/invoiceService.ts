import * as db from '../lib/db'

const COUNTER_COLLECTION = 'counters'
const INVOICE_KEY = 'invoiceNo'

export interface InvoiceCounter {
  id: string
  value: number
}

export async function nextInvoiceNumber(): Promise<number> {
  const existing = await db.dbGet(COUNTER_COLLECTION, INVOICE_KEY)
  const next = ((existing?.value as number | undefined) ?? 999) + 1
  await db.dbPut(COUNTER_COLLECTION, { id: INVOICE_KEY, value: next })
  return next
}

export async function currentInvoiceNumber(): Promise<number> {
  const existing = await db.dbGet(COUNTER_COLLECTION, INVOICE_KEY)
  return ((existing?.value as number | undefined) ?? 1000)
}

export function formatInvoiceNo(n: number): string {
  return `INV-${String(n).padStart(5, '0')}`
}