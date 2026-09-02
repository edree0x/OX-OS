import { indexDbDataSource } from '../lib/db'
import type { DataSource } from '../lib/dataSource'

export const BACKUP_VERSION = 1
export const BACKUP_FILE_EXT = 'oxbackup'

const CONFIG_KEY = 'multi-sector-erp-config'
const THEME_KEY = 'multi-sector-erp-theme'
const AUTH_KEY = 'multi-sector-erp-auth'

export interface BackupRecord {
  /** Original record INCLUDING the __collection tag (as persisted in IDB). */
  record: Record<string, unknown>
}

export interface BackupBundle {
  app: string
  format: 'ox-os-backup'
  version: number
  exportedAt: number
  sector?: string
  appName?: string
  config?: unknown
  theme?: string
  /** AUTH IS OPTIONAL — excluded by default for privacy; included only for local recovery. */
  auth?: unknown
  /** Every stored record across all collections. */
  records: BackupRecord[]
}

export type BackupSink = Pick<
  DataSource,
  'put' | 'allRecords' | 'listCollections' | 'get' | 'delete'
>

function readJson(key: string): unknown {
  if (typeof localStorage === 'undefined') return undefined
  const raw = localStorage.getItem(key)
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

/** Read the stored AppConfig (Zustand persist wraps it under { state: ... }). */
export function readAppConfig(): { state?: unknown } & Record<string, unknown> | undefined {
  const v = readJson(CONFIG_KEY)
  return (v as { state?: unknown } & Record<string, unknown>) || undefined
}

export function readTheme(): string | undefined {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) ?? undefined : undefined
}

export function readAuth(): unknown {
  return readJson(AUTH_KEY)
}

/** Build a complete, versioned backup bundle of the entire system state. */
export async function exportBundle(opts: { includeAuth?: boolean } = {}): Promise<BackupBundle> {
  const all = await indexDbDataSource.allRecords()
  // Exclude local backup snapshots so bundles never embed other snapshots.
  const records = all.filter((r) => r.__collection !== SNAP_COLLECTION)
  const config = readAppConfig()

  const bundle: BackupBundle = {
    app: 'OX OS',
    format: 'ox-os-backup',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    sector: config?.state && typeof config.state === 'object'
      ? ((config.state as { sector?: string }).sector ?? undefined)
      : undefined,
    appName: config?.state && typeof config.state === 'object'
      ? ((config.state as { appName?: string }).appName ?? undefined)
      : undefined,
    config,
    theme: readTheme(),
    records: records.map((record) => ({ record })),
  }
  if (opts.includeAuth) bundle.auth = readAuth()
  return bundle
}

export function bundleToJson(bundle: BackupBundle): string {
  return JSON.stringify(bundle, null, 2)
}

export function bundleFromJson(json: string): BackupBundle {
  const parsed = JSON.parse(json) as BackupBundle
  validateBundleShape(parsed)
  return parsed
}

export function validateBundleShape(bundle: BackupBundle): void {
  if (!bundle || bundle.format !== 'ox-os-backup') {
    throw new Error('Not a valid OX OS backup file')
  }
  if (typeof bundle.version !== 'number' || bundle.version > BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (${String(bundle?.version)}). This build supports up to ${BACKUP_VERSION}.`)
  }
  if (!Array.isArray(bundle.records)) {
    throw new Error('Backup file is missing its records.')
  }
}

/** Slug used for downloaded file naming: <appName or what>-<sector-YYMMDD>.oxbackup */
export function suggestBackupFileName(bundle: BackupBundle): string {
  const base = (bundle.appName || 'ox-os').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const when = new Date(bundle.exportedAt)
  const stamp = `${when.getFullYear()}${String(when.getMonth() + 1).padStart(2, '0')}${String(when.getDate()).padStart(2, '0')}`
  return `${base}-${stamp}.${BACKUP_FILE_EXT}`
}

/** Download a bundle as a file attachment from the browser. */
export function downloadBundle(bundle: BackupBundle) {
  const blob = new Blob([bundleToJson(bundle)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestBackupFileName(bundle)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Restore the entire system from a backup bundle.
 * - Replaces ALL IndexedDB records (wipe + import in one transaction).
 * - Restores config + theme in localStorage.
 * - Does NOT restore the auth session by default (the current user stays logged
 *   in); pass `restoreAuth` to restore a saved session too.
 */
export async function importBundle(bundle: BackupBundle, opts: { restoreAuth?: boolean } = {}): Promise<void> {
  validateBundleShape(bundle)

  // 1. Wipe existing records at the record key path (safely).
  await indexDbDataSource.wipe()

  // 2. Bulk-import the backed-up records.
  const records = bundle.records
    .map((r) => r.record)
    .filter((r) => r && typeof r === 'object' && typeof (r as Record<string, unknown>).id !== 'undefined')
  if (records.length > 0) {
    await indexDbDataSource.importRecords(records)
  }

  // 3. Restore the app config (needed for seeding/routing).
  if (bundle.config !== undefined) {
    writeJson(CONFIG_KEY, bundle.config)
  }

  // 4. Restore theme and (optionally) auth.
  if (bundle.theme !== undefined) {
    localStorage.setItem(THEME_KEY, bundle.theme)
  }
  if (opts.restoreAuth && bundle.auth !== undefined) {
    writeJson(AUTH_KEY, bundle.auth)
  }
}

// ---- Local auto-backup snapshots -------------------------------------------
// Kept inside IndexedDB under a reserved collection so they survive page reloads
// and provide protection against accidental data loss even without a manual file.

const SNAP_COLLECTION = '__snapshots__'
const SNAP_KEY_PREFIX = 'snap:'

export interface SnapshotMeta {
  id: string
  at: number
  kind: 'auto' | 'manual'
  recordCount: number
  appName?: string
  sector?: string
}

export async function listSnapshots(): Promise<SnapshotMeta[]> {
  const all = await indexDbDataSource.getAll(SNAP_COLLECTION)
  return (all as unknown as SnapshotMeta[]).sort((a, b) => b.at - a.at)
}

export async function snapshotRecordCount(): Promise<number> {
  const all = await indexDbDataSource.allRecords()
  return all.filter((r) => r.__collection !== SNAP_COLLECTION).length
}

/**
 * Save a snapshot bundle into IndexedDB (reserved collection). `kind` marks
 * whether it was created automatically or manually.
 */
export async function saveSnapshot(kind: 'auto' | 'manual'): Promise<SnapshotMeta> {
  const bundle = await exportBundle({ includeAuth: false })
  const id = SNAP_KEY_PREFIX + Date.now()
  const all = await indexDbDataSource.allRecords()
  const liveRecords = all.filter((r) => r.__collection !== SNAP_COLLECTION)
  const meta: SnapshotMeta = {
    id,
    at: bundle.exportedAt,
    kind,
    recordCount: liveRecords.length,
    appName: bundle.appName,
    sector: bundle.sector,
  }
  await indexDbDataSource.put(SNAP_COLLECTION, { ...bundle, id } as unknown as Record<string, unknown>)
  return meta
}

/** Restore a previously saved snapshot (local recovery). */
export async function restoreSnapshot(id: string): Promise<void> {
  const stored = (await indexDbDataSource.get(SNAP_COLLECTION, id)) as unknown as
    | (BackupBundle & { id: string })
    | null
  if (!stored) throw new Error('Snapshot not found')
  const { id: _id, ...bundle } = stored
  await importBundle(bundle as BackupBundle)
}

/** Delete a saved snapshot. */
export async function deleteSnapshot(id: string): Promise<void> {
  await indexDbDataSource.delete(SNAP_COLLECTION, id)
}

/** UTC day-of-year helper for daily-dedup scheduling (0-365). */
export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}
