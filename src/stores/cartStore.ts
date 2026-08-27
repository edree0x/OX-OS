import { create } from 'zustand'
import type { CartLine, Tender } from '../types'

interface CartState {
  lines: CartLine[]
  table: string | null
  addLine: (line: CartLine) => void
  updateQty: (refId: string, qty: number) => void
  removeLine: (refId: string) => void
  setNote: (refId: string, note: string) => void
  setTable: (table: string | null) => void
  clear: () => void
  subtotal: () => number
  tenderBreakdown: (tenders: Tender[]) => { total: number; change: number }
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  table: null,
  addLine: (line) =>
    set((s) => {
      const existing = s.lines.find((l) => l.refId === line.refId)
      if (existing) {
        return {
          lines: s.lines.map((l) =>
            l.refId === line.refId ? { ...l, qty: l.qty + line.qty } : l,
          ),
        }
      }
      return { lines: [...s.lines, line] }
    }),
  updateQty: (refId, qty) =>
    set((s) => ({
      lines: s.lines
        .map((l) => (l.refId === refId ? { ...l, qty: Math.max(1, qty) } : l))
        .filter((l) => l.qty > 0),
    })),
  removeLine: (refId) => set((s) => ({ lines: s.lines.filter((l) => l.refId !== refId) })),
  setNote: (refId, note) =>
    set((s) => ({
      lines: s.lines.map((l) => (l.refId === refId ? { ...l, modifiers: note ? [note] : [] } : l)),
    })),
  setTable: (table) => set({ table }),
  clear: () => set({ lines: [], table: null }),
  subtotal: () => get().lines.reduce((sum, l) => sum + l.price * l.qty, 0),
  tenderBreakdown: (tenders) => {
    const total = get().subtotal()
    const paid = tenders.reduce((s, t) => s + t.amount, 0)
    return { total, change: Math.max(0, paid - total) }
  },
}))

