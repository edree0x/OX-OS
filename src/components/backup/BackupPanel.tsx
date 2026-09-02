import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  exportBundle,
  downloadBundle,
  bundleFromJson,
  importBundle,
  listSnapshots,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  type SnapshotMeta,
  type BackupBundle,
} from '../../services/backupService'
import { useThemeStore } from '../../stores/themeStore'
import { Card, Button, Spinner, EmptyState } from '../ui/primitives'
import { Icon } from '../ui/Icon'
import { notify } from '../ui/Toast'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString()
}

export default function BackupPanel() {
  const navigate = useNavigate()
  const setTheme = useThemeStore((s) => s.setTheme)
  const fileRef = useRef<HTMLInputElement>(null)

  const [busy, setBusy] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([])
  const [picked, setPicked] = useState<BackupBundle | null>(null)

  const refresh = async () => {
    const list = await listSnapshots()
    setSnapshots(list)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleDownload = async () => {
    setBusy('download')
    try {
      const bundle = await exportBundle()
      downloadBundle(bundle)
      notify('Backup downloaded', 'success')
    } catch (e) {
      notify('Failed to create backup: ' + String((e as Error).message), 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleSaveLocal = async () => {
    setBusy('local')
    try {
      await saveSnapshot('manual')
      await refresh()
      notify('Backup saved on this device', 'success')
    } catch (e) {
      notify('Failed to save backup: ' + String((e as Error).message), 'error')
    } finally {
      setBusy(null)
    }
  }

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      setPicked(bundleFromJson(text))
      notify('Backup file loaded — review then restore', 'info')
    } catch (err) {
      notify('Invalid backup file: ' + String((err as Error).message), 'error')
    }
  }

  const doRestore = async (bundle: BackupBundle, restoreAuth = false) => {
    setBusy('restore')
    try {
      await importBundle(bundle, { restoreAuth })

      // Re-apply theme and force the config store to reload from localStorage.
      if (bundle.theme) {
        const isDark = bundle.theme.includes('"dark"')
        setTheme(isDark ? 'dark' : 'light')
      }
      // Re-init the config store so routing/content pick up the restored config.
      const { useConfigStore } = await import('../../stores/configStore')
      const restored = await readConfigFromStorage()
      useConfigStore.setState({ config: restored })

      notify('Backup restored successfully', 'success')
      setTimeout(() => navigate('/'), 600)
    } catch (e) {
      notify('Restore failed: ' + String((e as Error).message), 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleRestoreConfirmed = async () => {
    if (!picked) return
    const ok = confirm(
      'Restoring will replace ALL current data on this device with the backup. This cannot be undone. Continue?',
    )
    if (!ok) return
    await doRestore(picked, false)
    setPicked(null)
  }

  const handleSnapshotRestore = async (snap: SnapshotMeta) => {
    const ok = confirm(`Restore local snapshot from ${formatTime(snap.at)}? Current data will be replaced.`)
    if (!ok) return
    setBusy('restore')
    try {
      await restoreSnapshot(snap.id)
      notify('Local snapshot restored', 'success')
      setTimeout(() => navigate('/'), 600)
    } catch (e) {
      notify('Restore failed: ' + String((e as Error).message), 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleSnapshotDelete = async (snap: SnapshotMeta) => {
    if (!confirm(`Delete snapshot from ${formatTime(snap.at)}?`)) return
    try {
      await deleteSnapshot(snap.id)
      await refresh()
      notify('Snapshot deleted', 'success')
    } catch (e) {
      notify('Delete failed: ' + String((e as Error).message), 'error')
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="download" className="h-5 w-5 text-indigo-500" />
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Backup &amp; restore</h3>
          <p className="text-xs text-slate-400">
            A complete snapshot of your data and settings. Download a file, or keep local device snapshots.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDownload} disabled={busy !== null}>
          {busy === 'download' ? <Spinner className="h-4 w-4" /> : <Icon name="download" className="h-4 w-4" />}
          Download backup (.oxbackup)
        </Button>
        <Button variant="outline" onClick={handleSaveLocal} disabled={busy !== null}>
          {busy === 'local' ? <Spinner className="h-4 w-4" /> : <Icon name="save" className="h-4 w-4" />}
          Save snapshot on this device
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
          <Icon name="upload" className="h-4 w-4" />
          Restore from file…
        </Button>
        <input ref={fileRef} type="file" accept=".oxbackup,.json,application/json" className="hidden" onChange={onPickFile} />
      </div>

      {picked && (
        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-800 dark:bg-indigo-950">
          <p className="font-medium text-indigo-700 dark:text-indigo-300">Ready to restore</p>
          <p className="mt-1 text-indigo-600 dark:text-indigo-400">
            {picked.appName || 'App'} · {picked.sector || 'unknown sector'} ·{' '}
            {picked.records.length} records · exported {formatTime(picked.exportedAt)}
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="danger" onClick={handleRestoreConfirmed} disabled={busy !== null}>
              Restore this backup
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPicked(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Device snapshots
        </h4>
        {snapshots.length === 0 ? (
          <EmptyState title="No snapshots yet" description="Save a snapshot to protect against accidental data loss." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {snapshots.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                    {formatTime(s.at)}{' '}
                    <span className="text-xs text-slate-400">· {s.recordCount} records</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {s.kind === 'auto' ? 'Automatic (daily)' : 'Manual'} · {s.appName || 'App'} · {s.sector || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSnapshotRestore(s)}
                    className="rounded p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/15"
                    title="Restore this snapshot"
                    aria-label="Restore snapshot"
                  >
                    <Icon name="rotate" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSnapshotDelete(s)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15"
                    title="Delete snapshot"
                    aria-label="Delete snapshot"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

async function readConfigFromStorage(): Promise<import('../../types').AppConfig | null> {
  const { readAppConfig } = await import('../../services/backupService')
  const cfg = readAppConfig()
  return (cfg?.state as import('../../types').AppConfig | undefined) ?? null
}
