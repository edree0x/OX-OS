import { useEffect, useRef } from 'react'
import { listSnapshots, saveSnapshot, dayOfYear } from '../services/backupService'

const LAST_AUTO_KEY = 'multi-sector-erp-last-auto-backup'

/**
 * Runs once per app load. If no auto-backup was recorded for the current day
 * and there is data to protect, writes a daily snapshot into IndexedDB.
 */
export function useAutoBackup(enabled = true) {
  const ran = useRef(false)

  useEffect(() => {
    if (!enabled || ran.current || typeof localStorage === 'undefined') return
    ran.current = true

    let cancelled = false
    ;(async () => {
      try {
        const today = dayOfYear(new Date())
        const last = Number(localStorage.getItem(LAST_AUTO_KEY) ?? '0')
        if (last === today) return

        // Only snapshot once there is something to protect (config + records).
        const snapshots = await listSnapshots()
        const hasData = snapshots.length > 0
          ? true
          : (await hasLiveRecords())

        if (cancelled) return
        if (hasData) {
          await saveSnapshot('auto')
        }
        localStorage.setItem(LAST_AUTO_KEY, String(today))
      } catch {
        // Non-fatal: scheduling should never crash the app shell.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])
}

async function hasLiveRecords(): Promise<boolean> {
  const { indexDbDataSource } = await import('../lib/db')
  const all = await indexDbDataSource.allRecords()
  return all.filter((r) => r.__collection !== '__snapshots__').length > 0
}
