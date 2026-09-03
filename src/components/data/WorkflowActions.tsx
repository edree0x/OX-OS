import { useState } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { useEntityMutations } from '../../hooks/useEntity'
import { APPROVAL_FLOW, nextTransitions } from '../../lib/workflow'
import { logAudit } from '../../services/auditService'
import { Icon } from '../ui/Icon'

export default function WorkflowActions({
  entityId,
  record,
  onDone,
}: {
  entityId: string
  record: Record<string, unknown>
  onDone?: () => void
}) {
  const { user, can } = usePermissions()
  const { update } = useEntityMutations(entityId)
  const [busy, setBusy] = useState(false)
  const current = (record.status as string) || 'draft'

  if (!user) return null

  const transitions = nextTransitions(APPROVAL_FLOW, current, (role) => user.role === role || can('admin'))

  const apply = async (to: string, kind?: 'approve' | 'reject') => {
    setBusy(true)
    try {
      await update.mutateAsync({ id: record.id as string, data: { ...record, status: to } })
      if (kind) {
        await logAudit({
          action: kind,
          collection: entityId,
          recordId: record.id as string,
          summary: `Status → ${to}`,
        })
      }
      onDone?.()
    } finally {
      setBusy(false)
    }
  }

  if (transitions.length === 0) return null

  return (
    <span className="inline-flex items-center gap-1">
      {transitions.map((t) => (
        <button
          key={t.from + t.to}
          onClick={() => void apply(t.to, t.kind === 'approve' || t.kind === 'reject' ? t.kind : undefined)}
          disabled={busy}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
            t.kind === 'reject'
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : t.kind === 'approve'
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Icon name="check" className="h-3 w-3" />
          {t.label}
        </button>
      ))}
    </span>
  )
}
