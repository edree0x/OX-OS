import { describe, it, expect } from 'vitest'
import { SECTOR_LIST, buildConfig, customEntity, APP_SECTORS } from '../config/presets'

describe('presets', () => {
  it('has 13 sectors plus custom', () => {
    expect(SECTOR_LIST.length).toBe(14)
    expect(SECTOR_LIST.some((s) => s.id === 'custom')).toBe(true)
  })

  it('every sector defines at least one entity', () => {
    SECTOR_LIST.filter((s) => s.id !== 'custom').forEach((s) => expect(s.entities.length).toBeGreaterThan(0))
  })

  it('buildConfig wires posEntityId for restaurant', () => {
    const cfg = buildConfig({ appName: 'Cafe', sector: 'restaurant', entityIds: APP_SECTORS.restaurant.entities.map((e) => e.id), customEntities: [], features: { auth: true, reports: true, pos: true, rbac: true } })
    expect(cfg.posEntityId).toBe('menu')
    expect(cfg.views.includes('tablemap')).toBe(true)
    expect(cfg.dashboard.length).toBeGreaterThan(0)
  })

  it('buildConfig exposes kanban for repair sector', () => {
    const cfg = buildConfig({ appName: 'Fixit', sector: 'repair', entityIds: APP_SECTORS.repair.entities.map((e) => e.id), customEntities: [], features: { auth: true, reports: true, pos: false, rbac: true } })
    expect(cfg.kanbanEntityId).toBe('repairTickets')
    expect(cfg.views.includes('kanban')).toBe(true)
  })

  it('custom sector builds a custom entity config', () => {
    const ent = customEntity('Members')
    const cfg = buildConfig({ appName: 'MyApp', sector: 'custom', entityIds: [], customEntities: [ent], features: { auth: true, reports: true, pos: false, rbac: false } })
    expect(cfg.entities.some((e) => e.id === ent.id)).toBe(true)
    expect(cfg.posEntityId).toBeUndefined()
  })
})
