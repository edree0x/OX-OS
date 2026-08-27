import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTables, updateTable } from '../../services/tableService'
import { Icon } from '../ui/Icon'
import { Card, Spinner } from '../ui/primitives'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'

const TONE: Record<string, string> = {
  free: 'bg-green-100 text-green-700 border-green-300',
  occupied: 'bg-red-100 text-red-700 border-red-300',
  reserved: 'bg-amber-100 text-amber-700 border-amber-300',
}

export default function TableMap() {
  const { data = [], refetch, isLoading } = useQuery({ queryKey: ['tables'], queryFn: listTables })
  const qc = useQueryClient()
  const navigate = useNavigate()
  const setTable = useCartStore((s) => s.setTable)

  const mutate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'free' | 'occupied' | 'reserved' }) => updateTable(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  })

  const open = (t: { id: string; number: number; label: string }) => {
    setTable(t.label)
    navigate('/pos')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Floor Map</h2>
          <p className="text-sm text-slate-400">Tap a table to start a session.</p>
        </div>
        <button
          className="text-sm text-indigo-600 hover:underline"
          onClick={() => {
            data.forEach((t) => mutate.mutate({ id: t.id, status: 'free' }))
            refetch()
          }}
        >
          Reset all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {isLoading && (
          <div className="col-span-full flex justify-center py-10">
            <Spinner className="h-8 w-8" />
          </div>
        )}
        {data.map((t) => (
          <button
            key={t.id}
            onClick={() => open(t)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-4 transition hover:scale-105 ${TONE[t.status]}`}
          >
            <Icon name="layout" className="h-6 w-6" />
            <span className="font-semibold">{t.label}</span>
            <span className="text-xs capitalize">{t.status}</span>
          </button>
        ))}
      </div>
      <Card className="p-4 text-sm text-slate-500">
        Legend: <span className="text-green-700">Free</span> · <span className="text-red-700">Occupied</span> ·{' '}
        <span className="text-amber-700">Reserved</span>
      </Card>
    </div>
  )
}
