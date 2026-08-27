import { describe, it, expect } from 'vitest'
import { getActiveModules } from '../modules/registry'
import { SECTOR_LIST, buildConfig } from '../config/presets'
import type { AppConfig } from '../types'

function pharmacyConfig(): AppConfig {
  const p = SECTOR_LIST.find((s) => s.id === 'pharmacy')!
  return buildConfig({
    appName: 'Test Pharmacy',
    sector: 'pharmacy',
    entityIds: p.entities.map((e) => e.id),
    customEntities: [],
    features: { auth: true, reports: true, pos: true, rbac: true },
  })
}

describe('getActiveModules', () => {
  it('dashboard module always uses a non-root path', () => {
    const cfg = pharmacyConfig()
    const dashboard = getActiveModules(cfg).find((m) => m.id === 'dashboard')!
    expect(dashboard).toBeDefined()
    expect(dashboard.path).toBe('/dashboard')
    expect(dashboard.path).not.toBe('/')
  })

  it('exposes the POS module for a POS-enabled sector', () => {
    const modules = getActiveModules(pharmacyConfig())
    expect(modules.some((m) => m.id === 'pos')).toBe(true)
  })

  it('exposes entity modules with /entity/<id> paths and kind=entity', () => {
    const modules = getActiveModules(pharmacyConfig())
    const productModule = modules.find((m) => m.id === 'products')
    expect(productModule?.path).toBe('/entity/products')
    expect(productModule?.kind).toBe('entity')
  })
})
