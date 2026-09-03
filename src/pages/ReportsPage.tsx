import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAll } from '../services/entityService'
import { useAppConfig } from '../hooks/useAppConfig'
import { Card, Button } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { BarChart } from '../components/dashboard/Widget'
import { formatMoney, toCSV, downloadCSV } from '../lib/utils'

const RANGES = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: 'all', label: 'All time' },
]

export default function ReportsPage() {
  const config = useAppConfig()
  const currency = config?.currency || 'USD'
  const sales = config?.entities.find((e) => e.id === 'sales' || e.id === 'orders')
  const [range, setRange] = useState('30')

  const { data = [] } = useQuery({
    queryKey: ['reports', sales?.id],
    queryFn: () => (sales ? listAll(sales.id) : Promise.resolve([])),
    enabled: !!sales,
  })

  const filtered = useMemo(() => {
    if (range === 'all') return data
    const days = Number(range)
    const cutoff = Date.now() - days * 86400000
    return data.filter((r) => {
      const ts = Number(r.createdAt || r.date || 0)
      return !ts || ts >= cutoff
    })
  }, [data, range])

  const total = useMemo(() => filtered.reduce((s: number, r) => s + Number(r.total || 0), 0), [filtered])
  const count = filtered.length

  const byMethod = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach((r) => {
      const m = String(r.payment || 'Cash')
      map[m] = (map[m] || 0) + Number(r.total || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  }, [filtered])

  const byDay = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach((r) => {
      const ts = Number(r.createdAt || r.date || 0)
      if (!ts) return
      const day = new Date(ts).toLocaleDateString()
      map[day] = (map[day] || 0) + Number(r.total || 0)
    })
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [filtered])

  const exportCSV = () => {
    const rows = filtered.map((r) => ({
      Date: r.createdAt ? new Date(Number(r.createdAt)).toLocaleString() : '',
      Payment: r.payment || 'Cash',
      Total: r.total || 0,
    }))
    downloadCSV('reports.csv', toCSV(rows, [{ key: 'Date', label: 'Date' }, { key: 'Payment', label: 'Payment' }, { key: 'Total', label: 'Total' }]))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Reports</h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-600">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  range === r.key ? 'bg-[var(--brand-primary)] text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Icon name="file" className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{formatMoney(total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{count}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Avg / sale</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{formatMoney(count ? total / count : 0)}</p>
        </Card>
      </div>

      {filtered.length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Revenue over time</p>
          <BarChart data={byDay} height={180} />
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Revenue by payment method ({currency})</p>
        {byMethod.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No transactions yet.</p>
        ) : (
          <BarChart data={byMethod} height={160} />
        )}
      </Card>
    </div>
  )
}
