export interface DataSource {
  getAll(collection: string): Promise<Record<string, unknown>[]>
  get(collection: string, id: string): Promise<Record<string, unknown> | null>
  put(collection: string, record: Record<string, unknown>): Promise<Record<string, unknown>>
  delete(collection: string, id: string): Promise<boolean>
  /** All unique collection names currently stored. */
  listCollections(): Promise<string[]>
  /** Every stored record (all collections) — used by the backup bundle. */
  allRecords(): Promise<Record<string, unknown>[]>
  /** Bulk import all records (single transaction). Replaces nothing by default. */
  importRecords(records: Record<string, unknown>[]): Promise<void>
  /** Clear the entire database. */
  wipe(): Promise<void>
}
