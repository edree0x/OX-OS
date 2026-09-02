import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppConfig, EntitySchema } from '../types'
import { indexDbDataSource as db } from '../lib/db'

interface ConfigState {
  config: AppConfig | null
  setConfig: (config: AppConfig) => void
  updateConfig: (patch: Partial<AppConfig>) => void
  addEntity: (entity: EntitySchema) => void
  updateEntity: (entity: EntitySchema) => void
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
      updateEntity: (entity) =>
        set((s) =>
          s.config
            ? {
                config: {
                  ...s.config,
                  entities: s.config.entities.map((e) => (e.id === entity.id ? entity : e)),
                },
              }
            : {},
        ),
      removeEntity: (id) =>
        set((s) => {
          if (!s.config) return {}
          const cfg = s.config
          return {
            config: {
              ...cfg,
              entities: cfg.entities.filter((e) => e.id !== id),
              posEntityId: cfg.posEntityId === id ? undefined : cfg.posEntityId,
              calendarEntityId: cfg.calendarEntityId === id ? undefined : cfg.calendarEntityId,
              kanbanEntityId: cfg.kanbanEntityId === id ? undefined : cfg.kanbanEntityId,
            },
          }
        }),
      resetConfig: () => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('seeded:') || k === 'multi-sector-erp-auth')
          .forEach((k) => localStorage.removeItem(k))
        void db.wipe()
        set({ config: null })
      },
    }),
    { name: 'multi-sector-erp-config' },
  ),
)
