export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'variants'
  | 'status-badge'
  | 'timer'
  | 'file-upload'
  | 'image-preview'

/** Extra capabilities that can be granted per user (beyond the role baseline). */
export type PermissionKey = 'manageFields'

export interface FieldSchema {
  key: string
  label: string
  type: FieldType
  required?: boolean
  /** Static options for select/status-badge fields */
  options?: string[]
  /** When set, options are loaded live from another entity (e.g. categories) */
  entityRef?: string
  placeholder?: string
  /** For status-badge: maps value -> tone */
  statuses?: { value: string; label: string; tone: 'slate' | 'green' | 'red' | 'indigo' | 'amber' }[]
  /** For variants: sub-field keys, e.g. Size, Color */
  variantKeys?: string[]
  /** For timer/billing: rate per hour */
  ratePerHour?: number
}

export interface EntitySchema {
  id: string
  name: string
  pluralName: string
  icon: string
  fields: FieldSchema[]
  /** mark one entity as the POS catalog (menu/products/devices) */
  isPosCatalog?: boolean
}

export type WidgetKind = 'stats' | 'chart' | 'list' | 'table' | 'alert'
export type MetricOp = 'count' | 'sum' | 'countWhere' | 'series7' | 'seriesBy' | 'recent'

export interface WidgetConfig {
  id: string
  kind: WidgetKind
  title: string
  metric: string
}

export type ModuleKind =
  | 'dashboard'
  | 'entity'
  | 'pos'
  | 'calendar'
  | 'kanban'
  | 'tablemap'
  | 'reports'
  | 'settings'
  | 'rbac'

export interface ModuleDef {
  id: string
  kind: ModuleKind
  name: string
  icon: string
  path: string
  permission: string | null
  entityId?: string
  title?: string
}

export interface SectorPreset {
  id: string
  label: string
  icon: string
  description: string
  features: { auth: boolean; reports: boolean; pos: boolean; rbac: boolean }
  /** specialized views this sector activates */
  views: ModuleKind[]
  entities: EntitySchema[]
  dashboard: WidgetConfig[]
  /** POS catalog entity id */
  posEntityId?: string
  /** tablemap config (restaurants/cafes/hotels/gaming) */
  tableMap?: { count: number; label: string }
  /** calendar/booking source entity */
  calendarEntityId?: string
  /** kanban (ticket) source entity */
  kanbanEntityId?: string
}

export interface AppConfig {
  appName: string
  sector: string
  currency?: string
  entities: EntitySchema[]
  features: { auth: boolean; reports: boolean; pos: boolean; rbac: boolean }
  views: ModuleKind[]
  dashboard: WidgetConfig[]
  posEntityId?: string
  tableMap?: { count: number; label: string }
  calendarEntityId?: string
  kanbanEntityId?: string
  createdAt: string
}

export type Role = 'admin' | 'manager' | 'cashier' | 'staff'
export interface User {
  id: string
  username: string
  name: string
  role: Role
  /** per-user capability grants (additive, defaults applied per role) */
  permissions?: PermissionKey[]
}

export interface CartLine {
  refId: string
  name: string
  price: number
  qty: number
  modifiers?: string[]
}

export interface Tender {
  method: 'cash' | 'card' | 'credit'
  amount: number
}
