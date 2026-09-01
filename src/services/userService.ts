import * as db from '../lib/db'
import { uid } from '../lib/utils'
import type { Role, PermissionKey } from '../types'

export interface StoredUser {
  id: string
  username: string
  name: string
  role: Role
  passwordHash: string
  /** disabled accounts cannot log in */
  active: boolean
  /** per-user capability grants (additive over role defaults) */
  permissions?: PermissionKey[]
  createdAt: number
  updatedAt?: number
}

export type UserInput = {
  username: string
  name: string
  role: Role
  password?: string
  active?: boolean
  permissions?: PermissionKey[]
}

const USERS_COLLECTION = 'users'

const ROLES: Role[] = ['admin', 'manager', 'cashier', 'staff']

/** Baseline capabilities granted by role. ADMINS always pass every check (see usePermissions). */
const ROLE_BASELINE: Record<Role, PermissionKey[]> = {
  admin: ['manageFields'],
  manager: ['manageFields'],
  cashier: [],
  staff: [],
}

export function rolePermissions(role: Role): PermissionKey[] {
  return [...ROLE_BASELINE[role]]
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function toPublic(u: StoredUser) {
  const { passwordHash: _pw, ...safe } = u
  return safe
}

export function listRoles(): Role[] {
  return ROLES
}

function toRecord(u: StoredUser): Record<string, unknown> {
  return u as unknown as Record<string, unknown>
}

export async function listUsers(): Promise<StoredUser[]> {
  const rows = await db.dbGetAll(USERS_COLLECTION)
  return (rows as unknown as StoredUser[]).sort((a, b) => String(a.username).localeCompare(String(b.username)))
}

export async function getUser(id: string): Promise<StoredUser | null> {
  const r = await db.dbGet(USERS_COLLECTION, id)
  return (r as unknown as StoredUser | null) ?? null
}

export async function findByUsername(username: string): Promise<StoredUser | null> {
  const rows = await listUsers()
  return rows.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) ?? null
}

/** Combined effective set = role baseline + per-user grants (admin bypasses all checks in can()). */
function effectivePermissions(role: Role, granted: PermissionKey[] = []): PermissionKey[] {
  return Array.from(new Set([...rolePermissions(role), ...granted]))
}

export async function createUser(input: UserInput): Promise<StoredUser> {
  const existing = await findByUsername(input.username)
  if (existing) throw new Error('Username already taken')
  const passwordHash = await hashPassword(input.password || input.username)
  const user: StoredUser = {
    id: uid(),
    username: input.username.trim(),
    name: input.name.trim(),
    role: input.role,
    passwordHash,
    active: input.active ?? true,
    permissions: effectivePermissions(input.role, input.permissions ?? []),
    createdAt: Date.now(),
  }
  await db.dbPut(USERS_COLLECTION, toRecord(user))
  return user
}

export async function updateUser(id: string, patch: Partial<UserInput>): Promise<StoredUser> {
  const current = await getUser(id)
  if (!current) throw new Error('User not found')
  const next: StoredUser = {
    ...current,
    ...(patch.username !== undefined ? { username: patch.username.trim() } : {}),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.role !== undefined ? { role: patch.role } : {}),
    ...(patch.active !== undefined ? { active: patch.active } : {}),
    ...(patch.permissions !== undefined ? { permissions: effectivePermissions(patch.role ?? current.role, patch.permissions) } : {}),
  }
  if (patch.password) next.passwordHash = await hashPassword(patch.password)
  next.updatedAt = Date.now()
  await db.dbPut(USERS_COLLECTION, toRecord(next))
  return next
}

export async function deleteUser(id: string): Promise<void> {
  const target = await getUser(id)
  if (target && target.role === 'admin') {
    const admins = (await listUsers()).filter((u) => u.role === 'admin' && u.id !== id)
    if (admins.length === 0) throw new Error('Cannot delete the last admin')
  }
  await db.dbDelete(USERS_COLLECTION, id)
}

export async function verifyCredentials(username: string, password: string): Promise<Omit<StoredUser, 'passwordHash'> | null> {
  const user = await findByUsername(username)
  if (!user || !user.active) return null
  const hash = await hashPassword(password)
  if (user.passwordHash !== hash) return null
  return toPublic(user)
}

export async function ensureDefaultUsers(): Promise<void> {
  const rows = await listUsers()
  if (rows.length > 0) return
  const defaults: { username: string; name: string; role: Role }[] = [
    { username: 'admin', name: 'Administrator', role: 'admin' },
    { username: 'manager', name: 'Store Manager', role: 'manager' },
    { username: 'cashier', name: 'Front Cashier', role: 'cashier' },
    { username: 'staff', name: 'Team Member', role: 'staff' },
  ]
  for (const d of defaults) {
    await createUser({ ...d, active: true })
  }
}