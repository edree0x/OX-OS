import type { WidgetConfig } from '../types'

export function collectEntityIds(widgets: WidgetConfig[] = []): string[] {
  const ids = new Set<string>()
  widgets.forEach((w) => {
    const ent = (w.metric.split(':')[1] || '').split('.')[0]
    if (ent) ids.add(ent)
  })
  return [...ids]
}

function compare(val: unknown, op: string, target: string): boolean {
  const n = Number(val)
  const t = Number(target)
  if (!isNaN(n) && !isNaN(t) && val !== '' && target !== '') {
    if (op === 'lt') return n < t
    if (op === 'gt') return n > t
    if (op === 'eq') return n === t
    if (op === 'ne') return n !== t
  }
  const s = String(val ?? '').toLowerCase()
  const tt = String(target ?? '').toLowerCase()
  if (op === 'eq') return s === tt
  if (op === 'ne') return s !== tt
  if (op === 'lt') return s < tt
  if (op === 'gt') return s > tt
  return false
}

function buildSeries7(records: Record<string, unknown>[], field: string) {
  const days: Date[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10)
    const value = records.filter((r) => String(r[field] || '').slice(0, 10) === key).length
    return { label: key.slice(5), value }
  })
}

function buildSeriesBy(records: Record<string, unknown>[], field: string) {
  const map: Record<string, number> = {}
  records.forEach((r) => {
    const k = String(r[field] ?? '—')
    map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }))
}

export function resolveWidget(
  widget: WidgetConfig,
  recordsByEntity: Record<string, Record<string, unknown>[]> = {},
): number | Record<string, unknown>[] {
  const parts = widget.metric.split(':')
  const cmd = parts[0]
  const isList = widget.kind === 'list' || widget.kind === 'table'
  const isAlert = widget.kind === 'alert'

  switch (cmd) {
    case 'count': {
      const ent = parts[1]
      const records = recordsByEntity[ent] || []
      return isList ? records : records.length
    }
    case 'sum': {
      const [ent, field] = parts[1].split('.')
      const total = (recordsByEntity[ent] || []).reduce(
        (sum, r) => sum + (Number(r[field]) || 0),
        0,
      )
      return isList ? recordsByEntity[ent] || [] : total
    }
    case 'countWhere': {
      const [ent, field, op, val] = parts[1].split('.')
      const records = (recordsByEntity[ent] || []).filter((r) => compare(r[field], op, val))
      return isList ? records : records.length
    }
    case 'series7': {
      const [ent, field] = parts[1].split('.')
      return buildSeries7(recordsByEntity[ent] || [], field)
    }
    case 'seriesBy': {
      const [ent, field] = parts[1].split('.')
      return buildSeriesBy(recordsByEntity[ent] || [], field)
    }
    case 'recent': {
      const [ent, n] = parts[1].split('.')
      const count = Number(n) || 5
      return (recordsByEntity[ent] || [])
        .slice()
        .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))
        .slice(0, count)
    }
    case 'all':
      return recordsByEntity[parts[1]] || []
    default:
      return isList ? [] : 0
  }
}

export function defaultFor(widget: WidgetConfig): number | Record<string, unknown>[] {
  return widget.kind === 'stats' || widget.kind === 'alert' ? 0 : []
}
