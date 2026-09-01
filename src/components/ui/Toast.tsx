import { create } from 'zustand'
import { Icon } from './Icon'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, type: ToastType) => void
  remove: (id: number) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type) => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function notify(message: string, type: ToastType = 'success') {
  useToastStore.getState().push(message, type)
}

const ICONS: Record<ToastType, string> = { success: 'check', error: 'alert', info: 'sparkles' }
const TONES: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-md ${TONES[t.type]}`}>
          <Icon name={ICONS[t.type]} className="h-4 w-4" />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-current/70 hover:opacity-70" aria-label="Dismiss">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
