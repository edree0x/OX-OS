import { useAuthStore } from '../stores/authStore'
import type { Role, PermissionKey } from '../types'

const ROLE_RANK: Record<Role, number> = { staff: 0, cashier: 1, manager: 2, admin: 3 }

export type PermissionGate = 'admin' | 'manager' | PermissionKey

export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  const can = (permission: string | PermissionGate | null): boolean => {
    if (!permission) return true
    if (!user) return false
    if (permission === 'admin') return user.role === 'admin'
    if (permission === 'manager') return ROLE_RANK[user.role] >= ROLE_RANK.manager
    // additive capability grants: admins always; otherwise granted via the user record
    return user.role === 'admin' || (user.permissions ?? []).includes(permission as PermissionKey)
  }

  return { user, can }
}