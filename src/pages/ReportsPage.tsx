import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAll } from '../services/entityService'
import { useAppConfig } from '../hooks/useAppConfig'
import { Card } from '../components/ui/primitives'
import { BarChart } from '../components/dashboard/Widget'
import { formatMoney } from '../lib/utils'

export default function ReportsPage() {
  const config = useAppConfig()
  const sales = config?.entities.find((e) => e.id === 'sales' || e.id === 'orders')
  const { data = [] } = useQuery({
    queryKey: ['reports', sales?.id],
    queryFn: () => (sales ? listAll(sales.id) : Promise.resolve([])),
    enabled: !!sales,
  })

  const total = useMemo(() => data.reduce((s: number, r) => s + Number(r.total || 0), 0), [data])
  const count = data.length
  const byMethod = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach((r) => {
      const m = String(r.payment || 'Cash')
      map[m] = (map[m] || 0) + Number(r.total || 0)
    })
    return Object.entries(map).map(([label, value]) => ({ label, value }))
  }, [data])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Reports</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{formatMoney(total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{count}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Avg / sale</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{formatMoney(count ? total / count : 0)}</p>
        </Card>
      </div>
      <Card className="p-5">
        <p className="mb-3 text-sm font-medium text-slate-700">Revenue by payment method</p>
        <BarChart data={byMethod} height={160} />
      </Card>
    </div>
  )
}
