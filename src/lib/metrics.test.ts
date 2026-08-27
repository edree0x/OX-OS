import { describe, it, expect } from 'vitest'
import { collectEntityIds, resolveWidget, defaultFor } from '../lib/metrics'
import type { WidgetConfig } from '../types'

describe('collectEntityIds', () => {
  it('extracts unique entity ids from metric strings', () => {
    const widgets: WidgetConfig[] = [
      { id: 'w1', kind: 'stats', title: 'C', metric: 'count:products' },
      { id: 'w2', kind: 'chart', title: 'S', metric: 'seriesBy:products.category' },
      { id: 'w3', kind: 'list', title: 'R', metric: 'recent:sales.5' },
    ]
    expect(collectEntityIds(widgets)).toEqual(['products', 'sales'])
  })
})

describe('resolveWidget', () => {
  const data = {
    products: [
      { id: '1', name: 'A', stock: 5, category: 'X' },
      { id: '2', name: 'B', stock: 20, category: 'X' },
      { id: '3', name: 'C', stock: 3, category: 'Y' },
    ],
    sales: [
      { id: '1', total: 10, date: Date.now() - 86400000 * 2 },
      { id: '2', total: 30, date: Date.now() },
    ],
  }

  it('count', () => {
    expect(resolveWidget({ id: 'w', kind: 'stats', title: 't', metric: 'count:products' }, data)).toBe(3)
  })
  it('sum', () => {
    expect(resolveWidget({ id: 'w', kind: 'stats', title: 't', metric: 'sum:sales.total' }, data)).toBe(40)
  })
  it('countWhere lt', () => {
    expect(resolveWidget({ id: 'w', kind: 'alert', title: 't', metric: 'countWhere:products.stock.lt.10' }, data)).toBe(2)
  })
  it('seriesBy', () => {
    const out = resolveWidget({ id: 'w', kind: 'chart', title: 't', metric: 'seriesBy:products.category' }, data) as { label: string; value: number }[]
    expect(out).toEqual([
      { label: 'X', value: 2 },
      { label: 'Y', value: 1 },
    ])
  })
  it('recent', () => {
    const out = resolveWidget({ id: 'w', kind: 'list', title: 't', metric: 'recent:products.5' }, data) as unknown[]
    expect(out.length).toBe(3)
  })
  it('series7 fills to 7 buckets', () => {
    const out = resolveWidget({ id: 'w', kind: 'chart', title: 't', metric: 'series7:sales.date' }, data) as unknown[]
    expect(out.length).toBe(7)
  })
})

describe('defaultFor', () => {
  it('returns 0 for scalar widgets', () => {
    expect(defaultFor({ id: 'w', kind: 'stats', title: 't', metric: 'count:products' })).toBe(0)
    expect(defaultFor({ id: 'w', kind: 'alert', title: 't', metric: 'count:products' })).toBe(0)
  })
  it('returns array for list widgets', () => {
    expect(defaultFor({ id: 'w', kind: 'list', title: 't', metric: 'recent:products.5' })).toEqual([])
  })
})
