import type { User } from '../types'
import { verifyCredentials } from './userService'

export interface AuthUser extends User {}

export async function mockLogin(username: string, password: string): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 300))
  const found = await verifyCredentials(username, password)
  if (!found) throw new Error('Invalid credentials')
  const { passwordHash: _pw, ...safe } = found as { passwordHash?: string } & AuthUser
  return safe
}