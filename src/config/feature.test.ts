import { describe, it, expect } from 'vitest'
import { featureEntities, mergeFeatureEntities } from './presets'
import { APPROVAL_FLOW, ensureWorkflowField, nextTransitions } from '../lib/workflow'
import type { EntitySchema } from '../types'

describe('featureEntities', () => {
  it('adds branches, purchasing and advanced inventory when enabled', () => {
    const entities = featureEntities({ branches: 'basic', purchasing: 'basic', inventory: 'advanced' })
    const ids = entities.map((e) => e.id)
    expect(ids).toContain('branches')
    expect(ids).toContain('purchaseOrders')
    expect(ids).toContain('warehouses')
    expect(ids).toContain('stockMovements')
  })

  it('does not add entities when flags are none', () => {
    const entities = featureEntities({ branches: 'none', purchasing: 'none', inventory: 'basic' })
    const ids = entities.map((e) => e.id)
    expect(ids).not.toContain('branches')
    expect(ids).not.toContain('purchaseOrders')
    expect(ids).not.toContain('stockMovements')
  })

  it('mergeFeatureEntities avoids duplicates', () => {
    const base: EntitySchema[] = [{ id: 'branches', name: 'Branch', pluralName: 'Branches', icon: 'warehouse', fields: [] }]
    const merged = mergeFeatureEntities(base, { branches: 'basic' })
    expect(merged.filter((e) => e.id === 'branches')).toHaveLength(1)
  })
})

describe('workflow', () => {
  it('provides an approval transition set', () => {
    const transitions = nextTransitions(APPROVAL_FLOW, 'pending', (r) => r === 'admin' || r === 'manager')
    expect(transitions.some((t) => t.to === 'approved')).toBe(true)
    expect(transitions.some((t) => t.to === 'rejected')).toBe(true)
  })

  it('restricts manager-only transitions', () => {
    const transitions = nextTransitions(APPROVAL_FLOW, 'pending', (r) => r === 'cashier')
    expect(transitions).toHaveLength(0)
  })

  it('adds a status field when missing', () => {
    const entity: EntitySchema = { id: 'x', name: 'X', pluralName: 'Xs', icon: 'tag', fields: [] }
    const withStatus = ensureWorkflowField(entity)
    expect(withStatus.fields.some((f) => f.key === 'status')).toBe(true)
  })
})
