export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function slug(value: string): string {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function pluralize(value: string): string {
  const s = String(value).trim()
  if (/[^aeiou]y$/i.test(s)) return s.slice(0, -1) + 'ies'
  if (/(s|x|z|ch|sh)$/i.test(s)) return s + 'es'
  return s + 's'
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: getCurrency() }).format(n || 0)
}

let _currency = 'USD'
export function setCurrency(c: string) {
  _currency = c || 'USD'
}
export function getCurrency() {
  return _currency
}

export function formatDate(value?: string | number): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString()
}

export function formatDateTime(value?: string | number): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

export function variantMatrix(keys: string[], record: Record<string, unknown>): Record<string, unknown> {
  return record
}

export function toCSV(rows: Record<string, unknown>[], fields: { key: string; label: string }[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const header = fields.map((f) => esc(f.label)).join(',')
  const body = rows.map((r) => fields.map((f) => esc(r[f.key])).join(',')).join('\n')
  return header + '\n' + body
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
