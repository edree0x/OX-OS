import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useReactToPrint } from 'react-to-print'
import { listAll, createEntity, updateEntity } from '../../services/entityService'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useCartStore } from '../../stores/cartStore'
import { Button, Modal, Spinner } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import { formatMoney } from '../../lib/utils'
import { exportA4, type ReceiptData } from '../../lib/invoices'
import { notify } from '../ui/Toast'

type TenderItem = { method: string; amount: number }

function PaymentDialog({ open, total, onClose, onPaid, processing }: { open: boolean; total: number; onClose: () => void; onPaid: (t: TenderItem[]) => void; processing: boolean }) {
  const [tenders, setTenders] = useState<TenderItem[]>([])
  const [method, setMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const paid = tenders.reduce((s, t) => s + t.amount, 0)
  const remaining = Math.max(0, total - paid)

  const add = () => {
    const amt = parseFloat(amount || '0')
    if (amt <= 0) return
    setTenders([...tenders, { method, amount: amt }])
    setAmount('')
  }
  const quickFull = () => setTenders([...tenders, { method, amount: remaining }])
  const removeAt = (i: number) => setTenders(tenders.filter((_, idx) => idx !== i))

  return (
    <Modal open={open} onClose={onClose} title={`Charge ${formatMoney(total)}`}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option>Cash</option>
            <option>Card</option>
            <option>Wallet</option>
            <option>Transfer</option>
          </select>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" onClick={add}>
            Add
          </Button>
        </div>
        <button className="text-xs text-indigo-600 hover:underline" onClick={quickFull} disabled={remaining <= 0}>
          Apply full remaining {formatMoney(remaining)}
        </button>

        <ul className="space-y-1 text-sm">
          {tenders.map((t, i) => (
            <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
              <span>{t.method}</span>
              <span className="flex items-center gap-2">
                {formatMoney(t.amount)}
                <button onClick={() => removeAt(i)} className="text-red-500">
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
          <span>Paid</span>
          <span className="font-medium">{formatMoney(paid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Remaining</span>
          <span className="font-medium text-red-600">{formatMoney(remaining)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
           <Button disabled={remaining > 0.001 || processing} onClick={() => onPaid(tenders)}>
             {processing ? <Spinner className="h-4 w-4" /> : 'Complete Sale'}
           </Button>
        </div>
      </div>
    </Modal>
  )
}

function Receipt({ data, configName, onClose }: { data: ReceiptData; configName: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const print = useReactToPrint({ contentRef: ref })

  return (
    <Modal open onClose={onClose} title="Receipt">
      <div className="space-y-3">
        <div ref={ref} className="rounded bg-white p-4 text-xs">
          <div className="text-center">
            <p className="font-bold">{configName}</p>
            <p>{new Date(data.date).toLocaleString()}</p>
            {data.table && <p>Table: {data.table}</p>}
            <p>Invoice: {data.invoiceNo}</p>
          </div>
          <div className="my-2 border-t border-dashed border-slate-300" />
          {data.lines.map((l) => (
            <div key={l.refId} className="flex justify-between">
              <span>
                {l.name} × {l.qty}
              </span>
              <span>{formatMoney(l.price * l.qty)}</span>
            </div>
          ))}
          {data.lines.some((l) => (l.modifiers || []).length > 0) && (
            <div className="text-slate-400">
              {data.lines
                .filter((l) => (l.modifiers || []).length)
                .map((l) => (
                  <p key={l.refId}>
                    - {l.name}: {(l.modifiers || []).join(', ')}
                  </p>
                ))}
            </div>
          )}
          <div className="my-2 border-t border-dashed border-slate-300" />
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatMoney(data.total)}</span>
          </div>
          {data.tenders.map((t, i) => (
            <div key={i} className="flex justify-between">
              <span>{t.method}</span>
              <span>{formatMoney(t.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatMoney(Math.max(0, data.tenders.reduce((s, t) => s + t.amount, 0) - data.total))}</span>
          </div>
          <p className="mt-2 text-center text-slate-400">Thank you!</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={print}>
            <Icon name="receipt" className="h-4 w-4" />
            Print (80mm)
          </Button>
           <Button
             onClick={async () => {
               try {
                 await exportA4(data, configName)
                 notify('A4 invoice downloaded', 'success')
               } catch {
                 notify('Could not generate invoice', 'error')
               }
             }}
           >
             <Icon name="file" className="h-4 w-4" />
             Download A4
           </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PosView() {
  const config = useAppConfig()
  const posEntityId = config?.posEntityId
  const lines = useCartStore((s) => s.lines)
  const table = useCartStore((s) => s.table)
  const setTable = useCartStore((s) => s.setTable)
  const addLine = useCartStore((s) => s.addLine)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeLine = useCartStore((s) => s.removeLine)
  const setCartNote = useCartStore((s) => s.setNote)
  const clear = useCartStore((s) => s.clear)
  const subtotal = useCartStore((s) => s.subtotal())

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['pos-catalog', posEntityId],
    queryFn: () => (posEntityId ? listAll(posEntityId) : Promise.resolve([])),
    enabled: !!posEntityId,
  })

  const [payOpen, setPayOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines])
  const qc = useQueryClient()
  const [processing, setProcessing] = useState(false)
  const salesId = config?.entities.find((e) => e.id === 'sales' || e.id === 'orders' || e.id === 'payments')?.id
  const catalogEntity = config?.entities.find((e) => e.id === posEntityId)
  const hasStock = !!catalogEntity?.fields.find((f) => f.key === 'stock')

  const onPaid = async (tenders: TenderItem[]) => {
    setProcessing(true)
    try {
      const data: ReceiptData = {
        lines: lines.map((l) => ({ refId: l.refId, name: l.name, price: l.price, qty: l.qty, modifiers: l.modifiers || [] })),
        total,
        tenders,
        table: table ?? undefined,
        date: Date.now(),
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      }
      if (salesId) {
        await createEntity(salesId, {
          date: data.date,
          total,
          table: table || '',
          payment: tenders.map((t) => t.method).join(','),
        } as Record<string, unknown>)
        qc.invalidateQueries({ queryKey: ['entity', salesId] })
      }
      if (hasStock && posEntityId) {
        for (const l of lines) {
          const item = items.find((it) => it.id === l.refId)
          if (item && typeof item.stock === 'number') {
            const next = Math.max(0, (item.stock as number) - l.qty)
            await updateEntity(posEntityId, l.refId, { stock: next })
          }
        }
        qc.invalidateQueries({ queryKey: ['pos-catalog', posEntityId] })
      }
      setPayOpen(false)
      setReceipt(data)
      clear()
      notify('Sale completed', 'success')
    } catch {
      notify('Could not complete sale', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3 overflow-y-auto">
        {config?.tableMap && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Table:</span>
            <input
              value={table || ''}
              onChange={(e) => setTable(e.target.value)}
              placeholder="Walk-in"
              className="rounded-lg border border-slate-300 px-3 py-1.5"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it) => (
            <button
              key={it.id as string}
              onClick={() => addLine({ refId: it.id as string, name: String(it.name ?? it.sku ?? 'Item'), price: Number(it.price ?? 0), qty: 1 })}
              className="flex h-24 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-center shadow-sm hover:border-indigo-400"
            >
              <span className="truncate text-sm font-medium text-slate-700">{String(it.name ?? it.sku ?? 'Item')}</span>
              <span className="text-xs text-slate-400">{formatMoney(Number(it.price ?? 0))}</span>
            </button>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-400">No catalog items.</p>}
        </div>
        {isLoading && (
          <div className="flex justify-center py-4">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800">Cart</h3>
          {table && <p className="text-xs text-slate-400">Table {table}</p>}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {lines.map((l) => (
            <div key={l.refId} className="rounded-lg border border-slate-100 p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{l.name}</span>
                <span className="text-sm text-slate-600">{formatMoney(l.price * l.qty)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <button className="rounded bg-slate-100 px-2" onClick={() => updateQty(l.refId, l.qty - 1)}>
                  −
                </button>
                <span className="w-6 text-center text-sm">{l.qty}</span>
                <button className="rounded bg-slate-100 px-2" onClick={() => updateQty(l.refId, l.qty + 1)}>
                  +
                </button>
                <button className="ml-auto text-red-500" onClick={() => removeLine(l.refId)}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
              <input
                value={l.modifiers?.[0] || ''}
                onChange={(e) => setCartNote(l.refId, e.target.value)}
                placeholder="Note / modifiers"
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
              />
            </div>
          ))}
          {lines.length === 0 && <p className="text-sm text-slate-400">Cart is empty.</p>}
        </div>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          <Button className="w-full" disabled={lines.length === 0} onClick={() => setPayOpen(true)}>
            <Icon name="cart" className="h-4 w-4" />
            Charge {formatMoney(total)}
          </Button>
        </div>
      </div>

      <PaymentDialog open={payOpen} total={total} onClose={() => setPayOpen(false)} onPaid={onPaid} processing={processing} />
      {receipt && <Receipt data={receipt} configName={config?.appName || 'ERP'} onClose={() => setReceipt(null)} />}
    </div>
  )
}
