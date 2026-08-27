import type { User } from '../types'
import { uid } from '../lib/utils'

export interface AuthUser extends User {}

export const USERS: (AuthUser & { password: string })[] = [
  { id: uid(), username: 'admin', password: 'admin', name: 'Administrator', role: 'admin' },
  { id: uid(), username: 'manager', password: 'manager', name: 'Store Manager', role: 'manager' },
  { id: uid(), username: 'cashier', password: 'cashier', name: 'Front Cashier', role: 'cashier' },
  { id: uid(), username: 'staff', password: 'staff', name: 'Team Member', role: 'staff' },
]

export async function mockLogin(username: string, password: string): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 300))
  const found = USERS.find((u) => u.username === username && u.password === password)
  if (!found) throw new Error('Invalid credentials')
  const { password: _pw, ...safe } = found
  return safe
}
