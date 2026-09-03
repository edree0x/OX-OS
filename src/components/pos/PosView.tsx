import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listAll, createEntity, updateEntity } from '../../services/entityService'
import { nextInvoiceNumber, formatInvoiceNo } from '../../services/invoiceService'
import { useAppConfig } from '../../hooks/useAppConfig'
import { useCartStore } from '../../stores/cartStore'
import { Button, Modal, Spinner } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import { formatMoney } from '../../lib/utils'
import { exportA4, type ReceiptData } from '../../lib/invoices'
import { notify } from '../ui/Toast'

type TenderItem = { method: string; amount: number }

type PriceBreakdown = { subtotal: number; discount: number; tax: number; total: number }

type PaidResult = { tenders: TenderItem[]; discount: number; tax: number; total: number }

function PaymentDialog({
  open,
  totals,
  onClose,
  onPaid,
  processing,
}: {
  open: boolean
  totals: PriceBreakdown
  onClose: () => void
  onPaid: (r: PaidResult) => void
  processing: boolean
}) {
  const [tenders, setTenders] = useState<TenderItem[]>([])
  const [method, setMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const [discountMode, setDiscountMode] = useState<'percent' | 'fixed'>('percent')
  const [discountInput, setDiscountInput] = useState('')
  const [taxRate, setTaxRate] = useState('')
  const paid = tenders.reduce((s, t) => s + t.amount, 0)
  const remaining = Math.max(0, totals.total - paid)

  const discount =
    discountMode === 'percent'
      ? (totals.subtotal * Math.min(100, parseFloat(discountInput) || 0)) / 100
      : Math.min(totals.subtotal, Math.max(0, parseFloat(discountInput) || 0))
  const tax = (parseFloat(taxRate) || 0) > 0 ? (totals.subtotal - discount) * ((parseFloat(taxRate) || 0) / 100) : 0
  const grandTotal = Math.max(0, totals.subtotal - discount + tax)

  const add = () => {
    const amt = parseFloat(amount || '0')
    if (amt <= 0) return
    setTenders([...tenders, { method, amount: amt }])
    setAmount('')
  }
  const quickFull = () => setTenders([...tenders, { method, amount: remaining }])
  const removeAt = (i: number) => setTenders(tenders.filter((_, idx) => idx !== i))

  return (
    <Modal open={open} onClose={onClose} title={`Charge ${formatMoney(grandTotal)}`} size="sm">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium uppercase text-slate-400">Discount</label>
            <div className="flex items-center gap-1">
              <select
                value={discountMode}
                onChange={(e) => setDiscountMode(e.target.value as 'percent' | 'fixed')}
                className="rounded-lg border border-slate-300 px-1 py-2 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="percent">%</option>
                <option value="fixed">{'$'}</option>
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium uppercase text-slate-400">Tax rate %</label>
            <input
              type="number"
              min="0"
              step="any"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
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
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
          <Button type="button" variant="outline" onClick={add}>
            Add
          </Button>
        </div>
        <button className="text-xs text-indigo-600 hover:underline dark:text-indigo-400" onClick={quickFull} disabled={remaining <= 0}>
          Apply full remaining {formatMoney(remaining)}
        </button>

        <ul className="space-y-1 text-sm">
          {tenders.map((t, i) => (
            <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
              <span className="dark:text-slate-200">{t.method}</span>
              <span className="flex items-center gap-2 dark:text-slate-200">
                {formatMoney(t.amount)}
                <button onClick={() => removeAt(i)} className="text-red-500">
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-1 border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">{formatMoney(totals.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>-{formatMoney(discount)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-medium">{formatMoney(tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span className="font-medium">{formatMoney(paid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining</span>
            <span className="font-medium text-red-600">{formatMoney(remaining)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={remaining > 0.001 || processing}
            onClick={() => onPaid({ tenders, discount, tax, total: grandTotal })}
          >
            {processing ? <Spinner className="h-4 w-4" /> : 'Complete Sale'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Receipt({ data, configName, onClose }: { data: ReceiptData; configName: string; onClose: () => void }) {
  const paid = data.tenders.reduce((s, t) => s + t.amount, 0)
  const change = Math.max(0, paid - data.total)
  const config = useAppConfig()
  const company = config?.company
  const title = company?.name || company?.legalName || configName
  const content = (
    <div className="p-3 text-xs leading-relaxed">
      <div className="text-center">
        {company?.logo && (
          <img src={company.logo} alt="" className="mx-auto mb-1 h-12 w-12 rounded object-contain" />
        )}
        <p className="text-[13px] font-bold uppercase tracking-wide">{title}</p>
        {(company?.address || company?.phone) && <p className="mt-0.5">{company?.phone}</p>}
        {company?.receiptHeader && <p className="mt-0.5">{company.receiptHeader}</p>}
        <p className="mt-0.5">{new Date(data.date).toLocaleString()}</p>
        {data.table && <p>Table: {data.table}</p>}
        <p className="mt-1 font-mono text-[11px]">#{data.invoiceNo}</p>
      </div>
      <div className="my-2 border-t border-dashed border-slate-300" />
      <div className="space-y-1">
        {data.lines.map((l) => (
          <div key={l.refId} className="flex justify-between gap-2">
            <span className="min-w-0 flex-1">
              {l.name} <span className="text-slate-400">×{l.qty}</span>
            </span>
            <span className="whitespace-nowrap">{formatMoney(l.price * l.qty)}</span>
          </div>
        ))}
      </div>
      {data.lines.some((l) => (l.modifiers || []).length > 0) && (
        <div className="mt-1 text-[10px] text-slate-400">
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
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatMoney(data.discount)}</span>
          </div>
        )}
        {data.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatMoney(data.tax)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-slate-300 pt-1 text-[13px] font-bold">
          <span>TOTAL</span>
          <span>{formatMoney(data.total)}</span>
        </div>
      </div>
      <div className="my-2 border-t border-dashed border-slate-300" />
      <div className="space-y-0.5">
        {data.tenders.map((t, i) => (
          <div key={i} className="flex justify-between">
            <span>{t.method}</span>
            <span>{formatMoney(t.amount)}</span>
          </div>
        ))}
        {change > 0 && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{formatMoney(change)}</span>
          </div>
        )}
      </div>
      <div className="my-2 border-t border-dashed border-slate-300" />
      <p className="text-center">{company?.name || company?.legalName || configName}</p>
      <p className="text-center text-[10px] text-slate-400">{company?.receiptFooter || 'Thank you!'}</p>
    </div>
  )

  return (
    <Modal open onClose={onClose} title="Receipt" size="sm">
      <div className="space-y-3">
        <div className="rounded border border-slate-100 dark:border-slate-700">{content}</div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Icon name="receipt" className="h-4 w-4" />
            Print (80mm)
          </Button>
          <Button
            onClick={async () => {
              try {
                await exportA4(data, configName, config?.company)
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

      {/* Print copy at body root for window.print(); hidden on screen */}
      {createPortal(
        <div className="print-receipt" aria-hidden="true">
          {content}
        </div>,
        document.body,
      )}
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

  const onPaid = async ({
    tenders,
    discount,
    tax,
    total: paidTotal,
  }: {
    tenders: TenderItem[]
    discount: number
    tax: number
    total: number
  }) => {
    setProcessing(true)
    try {
      const invoiceNo = formatInvoiceNo(await nextInvoiceNumber())
      const data: ReceiptData = {
        lines: lines.map((l) => ({ refId: l.refId, name: l.name, price: l.price, qty: l.qty, modifiers: l.modifiers || [] })),
        subtotal: total,
        discount,
        tax,
        total: paidTotal,
        tenders,
        table: table ?? undefined,
        date: Date.now(),
        invoiceNo,
      }
      if (salesId) {
        await createEntity(salesId, {
          date: data.date,
          invoiceNo,
          total: paidTotal,
          discount,
          tax,
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
            <span className="text-slate-500 dark:text-slate-400">Table:</span>
            <input
              value={table || ''}
              onChange={(e) => setTable(e.target.value)}
              placeholder="Walk-in"
              className="rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((it) => (
            <button
              key={it.id as string}
              onClick={() => addLine({ refId: it.id as string, name: String(it.name ?? it.sku ?? 'Item'), price: Number(it.price ?? 0), qty: 1 })}
              className="flex h-24 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-center shadow-sm hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-indigo-500"
            >
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{String(it.name ?? it.sku ?? 'Item')}</span>
              <span className="text-xs text-slate-400 dark:text-slate-400">{formatMoney(Number(it.price ?? 0))}</span>
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

      <div className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80">
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Cart</h3>
          {table && <p className="text-xs text-slate-400">Table {table}</p>}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {lines.map((l) => (
            <div key={l.refId} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{l.name}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">{formatMoney(l.price * l.qty)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <button className="rounded bg-slate-100 px-2 dark:bg-slate-700 dark:text-slate-200" onClick={() => updateQty(l.refId, l.qty - 1)}>
                  −
                </button>
                <span className="w-6 text-center text-sm dark:text-slate-200">{l.qty}</span>
                <button className="rounded bg-slate-100 px-2 dark:bg-slate-700 dark:text-slate-200" onClick={() => updateQty(l.refId, l.qty + 1)}>
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
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
          ))}
          {lines.length === 0 && <p className="text-sm text-slate-400">Cart is empty.</p>}
        </div>
        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 flex justify-between text-sm">
            <span className="dark:text-slate-300">Subtotal</span>
            <span className="font-semibold dark:text-slate-100">{formatMoney(subtotal)}</span>
          </div>
          <Button className="w-full" disabled={lines.length === 0} onClick={() => setPayOpen(true)}>
            <Icon name="cart" className="h-4 w-4" />
            Charge {formatMoney(total)}
          </Button>
        </div>
      </div>

      <PaymentDialog
        open={payOpen}
        totals={{ subtotal: total, discount: 0, tax: 0, total }}
        onClose={() => setPayOpen(false)}
        onPaid={onPaid}
        processing={processing}
      />
      {receipt && <Receipt data={receipt} configName={config?.appName || 'ERP'} onClose={() => setReceipt(null)} />}
    </div>
  )
}
