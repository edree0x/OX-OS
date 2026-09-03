import type { EntitySchema, FieldSchema } from '../types'

export interface Transition {
  from: string
  to: string
  label: string
  /** 'approve'/'reject' get logged to the audit trail as approvals. */
  kind?: 'advance' | 'approve' | 'reject'
  /** Roles allowed to make this transition (empty = anyone restricted). */
  roles?: string[]
}

export interface WorkflowDef {
  states: string[]
  transitions: Transition[]
}

/** The default field key used to hold workflow state. */
export const STATUS_KEY = 'status'

/** A generic approve-style workflow (draft → pending → approved / rejected). */
export const APPROVAL_FLOW: WorkflowDef = {
  states: ['draft', 'pending', 'approved', 'rejected'],
  transitions: [
    { from: 'draft', to: 'pending', label: 'Submit' },
    { from: 'pending', to: 'approved', label: 'Approve', kind: 'approve', roles: ['admin', 'manager'] },
    { from: 'pending', to: 'rejected', label: 'Reject', kind: 'reject', roles: ['admin', 'manager'] },
    { from: 'rejected', to: 'pending', label: 'Resubmit' },
  ],
}

export function statusField(def: WorkflowDef): FieldSchema {
  return {
    key: STATUS_KEY,
    label: 'Status',
    type: 'status-badge',
    required: true,
    options: def.states,
    statuses: def.states.map((s) => ({
      value: s,
      label: s.charAt(0).toUpperCase() + s.slice(1),
      tone:
        s === 'approved'
          ? 'green'
          : s === 'rejected'
            ? 'red'
            : s === 'pending'
              ? 'amber'
              : 'slate',
    })),
  }
}

/** Ensure an entity carries the workflow status field (if not already present). */
export function ensureWorkflowField(entity: EntitySchema): EntitySchema {
  if (entity.fields.some((f) => f.key === STATUS_KEY)) return entity
  return { ...entity, fields: [...entity.fields, statusField(APPROVAL_FLOW)] }
}

export function nextTransitions(def: WorkflowDef, from: string, allowed: (r: string) => boolean): Transition[] {
  return def.transitions.filter((t) => t.from === from && (t.roles?.length ? t.roles.some(allowed) : true))
}
