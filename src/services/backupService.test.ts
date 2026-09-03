import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  bundleToJson,
  bundleFromJson,
  validateBundleShape,
  suggestBackupFileName,
  BACKUP_VERSION,
} from '../services/backupService'
import type { BackupBundle } from '../services/backupService'

function sampleBundle(): BackupBundle {
  return {
    app: 'OX OS',
    format: 'ox-os-backup',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    sector: 'restaurant',
    appName: 'My Cafe',
    config: { state: { appName: 'My Cafe', sector: 'restaurant' } },
    theme: '"dark"',
    records: [
      { record: { id: 'a', __collection: 'products', name: 'Coffee', price: 5 } },
      { record: { id: 'b', __collection: 'users', username: 'admin' } },
    ],
  }
}

describe('backupService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // backupService reads localStorage at runtime; stub it out for pure tests.
    vi.stubGlobal('localStorage', undefined)
  })

  it('round-trips a bundle through JSON without data loss', () => {
    const bundle = sampleBundle()
    const json = bundleToJson(bundle)
    const restored = bundleFromJson(json)
    expect(restored.format).toBe('ox-os-backup')
    expect(restored.appName).toBe('My Cafe')
    expect(restored.sector).toBe('restaurant')
    expect(restored.records).toHaveLength(2)
    expect(restored.records[0].record.__collection).toBe('products')
    expect(restored.records[0].record.name).toBe('Coffee')
  })

  it('rejects a non-backup payload', () => {
    expect(() => validateBundleShape({ format: 'nope' } as unknown as BackupBundle)).toThrow(/Not a valid OX OS backup/)
  })

  it('rejects a newer unsupported version', () => {
    const bundle = { ...sampleBundle(), version: BACKUP_VERSION + 1 }
    expect(() => validateBundleShape(bundle)).toThrow(/Unsupported backup version/)
  })

  it('rejects a bundle missing records', () => {
    expect(() =>
      validateBundleShape({ format: 'ox-os-backup', version: BACKUP_VERSION } as unknown as BackupBundle),
    ).toThrow(/missing its records/)
  })

  it('suggests a dated, slugified file name', () => {
    const bundle = sampleBundle()
    const name = suggestBackupFileName(bundle)
    expect(name).toMatch(/^my-cafe-\d{8}\.oxbackup$/)
  })
})
