import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },
      setTheme: (t) => {
        applyTheme(t)
        set({ theme: t })
      },
    }),
    { name: 'multi-sector-erp-theme' },
  ),
)

// apply on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('multi-sector-erp-theme')
  const initial: Theme = stored && stored.includes('"dark"') ? 'dark' : 'light'
  applyTheme(initial)
}