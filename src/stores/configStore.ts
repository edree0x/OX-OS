import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppConfig, EntitySchema } from '../types'
import { wipeDatabase } from '../lib/db'

interface ConfigState {
  config: AppConfig | null
  setConfig: (config: AppConfig) => void
  updateConfig: (patch: Partial<AppConfig>) => void
  addEntity: (entity: EntitySchema) => void
  removeEntity: (id: string) => void
  resetConfig: () => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: null,
      setConfig: (config) => set({ config }),
      updateConfig: (patch) => set((s) => (s.config ? { config: { ...s.config, ...patch } } : {})),
      addEntity: (entity) =>
        set((s) =>
          s.config
            ? { config: { ...s.config, entities: [...s.config.entities, entity] } }
            : {},
        ),
      removeEntity: (id) =>
        set((s) =>
          s.config
            ? { config: { ...s.config, entities: s.config.entities.filter((e) => e.id !== id) } }
            : {},
        ),
      resetConfig: () => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('seeded:') || k === 'multi-sector-erp-auth')
          .forEach((k) => localStorage.removeItem(k))
        void wipeDatabase()
        set({ config: null })
      },
    }),
    { name: 'multi-sector-erp-config' },
  ),
)
