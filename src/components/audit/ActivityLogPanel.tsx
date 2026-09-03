import { useEffect, useState } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { Card, Badge } from '../ui/primitives'
import { listAudit, type AuditEntry } from '../../services/auditService'

const ACTION_TONE: Record<string, 'green' | 'red' | 'indigo' | 'slate'> = {
  create: 'green',
  delete: 'red',
  update: 'indigo',
  login: 'slate',
  approve: 'green',
  reject: 'red',
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString()
}

export default function ActivityLogPanel() {
  const config = useAppConfig()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [collection, setCollection] = useState('')
  const [actor, setActor] = useState('')
  const [limit, setLimit] = useState(50)

  const entityIds = (config?.entities ?? []).map((e) => e.id)
  const collections = ['users', 'auth', ...entityIds]

  useEffect(() => {
    let active = true
    void listAudit({ collection: collection || undefined, actor: actor || undefined, limit }).then((rows) => {
      if (active) setEntries(rows)
    })
    return () => {
      active = false
    }
  }, [collection, actor, limit])

  const field =
    'rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Activity log (audit trail)</h3>
          <p className="text-xs text-slate-400">Every create, update and delete across the system, who did it and when.</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select value={collection} onChange={(e) => setCollection(e.target.value)} className={field}>
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Filter by user" className={`${field} w-40`} />
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={field}>
          {[20, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-medium">{e.actor}</span>{' '}
                  <Badge tone={ACTION_TONE[e.action] ?? 'slate'}>{e.action}</Badge>
                  <span className="text-slate-400"> {e.collection}</span>
                  {e.summary && <span className="text-slate-500"> — {e.summary}</span>}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{fmt(e.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
