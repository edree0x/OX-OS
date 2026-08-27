import { useAuthStore } from '../stores/authStore'
import type { Role } from '../types'

const ROLE_RANK: Record<Role, number> = { staff: 0, cashier: 1, manager: 2, admin: 3 }

export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  const can = (permission: string | null): boolean => {
    if (!permission) return true
    if (!user) return false
    if (permission === 'admin') return user.role === 'admin'
    // any authenticated user with rank >= cashier can access manager-gated areas
    if (permission === 'manager') return ROLE_RANK[user.role] >= ROLE_RANK.manager
    return true
  }

  return { user, can }
}
